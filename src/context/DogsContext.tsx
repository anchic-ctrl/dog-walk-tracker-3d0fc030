import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dog, ActivityType, ActivityRecord, PoopStatus, PeeStatus, DogSize, RoomColor, IndoorSpace, WalkingNotes, FoodInfo, MedicationInfo } from '@/types/dog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface DogsContextType {
  dogs: Dog[];
  isLoading: boolean;
  refreshDogs: () => Promise<void>;
  getDog: (id: string) => Dog | undefined;
  startActivity: (id: string, type: ActivityType) => void;
  endActivity: (id: string, type: ActivityType) => string | null;
  updateRecord: (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null, poopStatus?: PoopStatus | null, peeStatus?: PeeStatus | null, notes?: string | null) => void;
  deleteRecord: (dogId: string, type: ActivityType, recordId: string) => void;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const mapDbDogToDog = (dbDog: any, currentDog?: Dog): Dog => {
    // Type guards/casting for JSON fields
    const walkingNotes = (dbDog.walking_notes as unknown as WalkingNotes) || {
      pullsOnLeash: false,
      reactiveToOtherDogs: false,
      singleLeash: false,
      notes: '',
    };

    const food = (dbDog.food_info as unknown as FoodInfo) || {
      foodType: '',
      feedingTime: '',
      specialInstructions: '',
      forbiddenFood: '',
    };

    const medication = (dbDog.medication_info as unknown as MedicationInfo) || {
      medicationName: '',
      frequency: '',
      howToGive: '',
      notes: '',
    };

    return {
      id: dbDog.id,
      name: dbDog.name,
      breed: dbDog.breed,
      photo: dbDog.photo_url || '', // Map photo_url to photo for compatibility
      roomColor: dbDog.room_color as RoomColor,
      roomNumber: dbDog.room_number as 1 | 2 | 3,
      indoorSpace: dbDog.indoor_space as IndoorSpace,
      size: dbDog.size as DogSize,
      // Preserve local state if exists, otherwise initialize empty
      walkRecords: currentDog?.walkRecords || [],
      indoorRecords: currentDog?.indoorRecords || [],
      currentWalkId: currentDog?.currentWalkId || null,
      currentIndoorId: currentDog?.currentIndoorId || null,
      walkingNotes,
      food,
      medication,
      additionalNotes: dbDog.additional_notes || '',
    };
  };

  const refreshDogs = useCallback(async () => {
    try {
      // Don't set loading to true here to avoid UI flickering during background refresh
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('room_color')
        .order('room_number')
        .order('name');

      if (error) throw error;

      setDogs(currentDogs => {
        // Create a map of current dogs for easy lookup
        const currentDogsMap = new Map(currentDogs.map(d => [d.id, d]));

        // Map DB dogs, preserving local state from currentDogsMap
        const newDogs = (data || []).map(dbDog => {
          const currentDog = currentDogsMap.get(dbDog.id);
          return mapDbDogToDog(dbDog, currentDog);
        });

        return newDogs;
      });
    } catch (error) {
      console.error('Failed to fetch dogs:', error);
      toast({
        title: '載入失敗',
        description: '無法同步狗狗資料',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    refreshDogs();
  }, [refreshDogs]);

  const getDog = (id: string) => dogs.find(dog => dog.id === id);

  const startActivity = (id: string, type: ActivityType) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        const currentIdKey = type === 'walk' ? 'currentWalkId' : 'currentIndoorId';

        // Check if already active
        if (dog[currentIdKey]) return dog;

        const newRecordId = `${type}-${dog.id}-${Date.now()}`;
        const newRecord: ActivityRecord = {
          id: newRecordId,
          startTime: new Date(),
          endTime: null,
        };

        return {
          ...dog,
          [recordKey]: [...(dog[recordKey] || []), newRecord],
          [currentIdKey]: newRecordId,
        };
      }
      return dog;
    }));
  };

  const endActivity = (id: string, type: ActivityType): string | null => {
    let endedRecordId: string | null = null;
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        const currentIdKey = type === 'walk' ? 'currentWalkId' : 'currentIndoorId';
        const currentRecordId = dog[currentIdKey];

        if (!currentRecordId) return dog;

        endedRecordId = currentRecordId;

        return {
          ...dog,
          [recordKey]: (dog[recordKey] || []).map(record =>
            record.id === currentRecordId
              ? { ...record, endTime: new Date() }
              : record
          ),
          [currentIdKey]: null,
        };
      }
      return dog;
    }));
    return endedRecordId;
  };

  const updateRecord = (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null, poopStatus?: PoopStatus | null, peeStatus?: PeeStatus | null, notes?: string | null) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === dogId) {
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        return {
          ...dog,
          [recordKey]: (dog[recordKey] || []).map(record =>
            record.id === recordId
              ? { ...record, startTime, endTime, poopStatus, peeStatus, notes }
              : record
          ),
        };
      }
      return dog;
    }));
  };

  const deleteRecord = (dogId: string, type: ActivityType, recordId: string) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === dogId) {
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        const currentIdKey = type === 'walk' ? 'currentWalkId' : 'currentIndoorId';

        return {
          ...dog,
          [recordKey]: (dog[recordKey] || []).filter(record => record.id !== recordId),
          // If we're deleting the current active record, clear currentId
          [currentIdKey]: dog[currentIdKey] === recordId ? null : dog[currentIdKey],
        };
      }
      return dog;
    }));
  };

  return (
    <DogsContext.Provider value={{
      dogs,
      isLoading,
      refreshDogs,
      getDog,
      startActivity,
      endActivity,
      updateRecord,
      deleteRecord,
    }}>
      {children}
    </DogsContext.Provider>
  );
}

export function useDogs() {
  const context = useContext(DogsContext);
  if (!context) {
    throw new Error('useDogs must be used within a DogsProvider');
  }
  return context;
}
