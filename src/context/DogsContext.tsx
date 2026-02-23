import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dog, ActivityType, ActivityRecord, PoopStatus, PeeStatus, DogSize, RoomColor, IndoorSpace, WalkingNotes, FoodInfo, MedicationInfo } from '@/types/dog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DogsContextType {
  dogs: Dog[];
  isLoading: boolean;
  refreshDogs: () => Promise<void>;
  getDog: (id: string) => Dog | undefined;
  startActivity: (id: string, type: ActivityType) => Promise<void>;
  endActivity: (id: string, type: ActivityType) => Promise<string | null>;
  updateRecord: (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null, poopStatus?: PoopStatus | null, peeStatus?: PeeStatus | null, notes?: string | null) => Promise<void>;
  deleteRecord: (dogId: string, type: ActivityType, recordId: string) => Promise<void>;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const mapDbDogToDog = (dbDog: any, activities: any[], userMap: Map<string, string>): Dog => {
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

    // Filter activities for this dog
    const dogActivities = activities.filter(a => a.dog_id === dbDog.id);

    // Process records
    const processRecords = (kind: 'walk' | 'indoor'): ActivityRecord[] => {
      return dogActivities
        .filter(a => a.activity_kind === kind)
        .map(a => ({
          id: a.id,
          startTime: new Date(a.start_time),
          endTime: a.end_time ? new Date(a.end_time) : null,
          poopStatus: a.poop_status as PoopStatus,
          peeStatus: a.pee_status as PeeStatus,
          notes: a.notes,
          created_by: a.created_by,
          staffName: a.created_by ? userMap.get(a.created_by) || 'Unknown' : undefined
        }))
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Newest first
    };

    const walkRecords = processRecords('walk');
    const indoorRecords = processRecords('indoor');

    // Find current activities (where endTime is null)
    // We take the most recent one if multiple exist (shouldn't happen ideally)
    const currentWalk = walkRecords.find(r => !r.endTime);
    const currentIndoor = indoorRecords.find(r => !r.endTime);

    return {
      id: dbDog.id,
      name: dbDog.name,
      breed: dbDog.breed,
      photo: dbDog.photo_url || '',
      roomColor: dbDog.room_color as RoomColor,
      roomNumber: dbDog.room_number as 1 | 2 | 3,
      indoorSpace: dbDog.indoor_space as IndoorSpace,
      size: dbDog.size as DogSize,
      walkRecords,
      indoorRecords,
      currentWalkId: currentWalk ? currentWalk.id : null,
      currentIndoorId: currentIndoor ? currentIndoor.id : null,
      walkingNotes,
      food,
      medication,
      additionalNotes: dbDog.additional_notes || '',
    };
  };

  const refreshDogs = useCallback(async () => {
    try {
      // 1. Fetch Dogs
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .order('room_color')
        .order('room_number')
        .order('name');

      if (dogsError) throw dogsError;

      // 2. Fetch Activities (all for now, can be optimized)
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activity_records')
        .select('*');

      if (activitiesError) throw activitiesError;

      // 3. Fetch Users for name resolution (Profiles and Members)
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name');
      const { data: members } = await supabase.from('members').select('user_id, email');

      // Build User Map (UserId -> Name)
      const userMap = new Map<string, string>();
      members?.forEach(m => {
        if (m.user_id && m.email) {
          userMap.set(m.user_id, m.email.split('@')[0]); // Fallback to email username
        }
      });
      // Override with display name if available
      profiles?.forEach(p => {
        if (p.user_id && p.display_name) {
          userMap.set(p.user_id, p.display_name);
        }
      });

      // 4. Map to Domain Objects
      const newDogs = (dogsData || []).map(dbDog =>
        mapDbDogToDog(dbDog, activitiesData || [], userMap)
      );

      setDogs(newDogs);
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

  const startActivity = async (id: string, type: ActivityType) => {
    try {
      const { error } = await supabase
        .from('activity_records')
        .insert({
          dog_id: id,
          activity_kind: type,
          start_time: new Date().toISOString(),
        });

      if (error) throw error;
      await refreshDogs();
    } catch (error) {
      console.error('Start activity failed:', error);
      toast({ title: '操作失敗', description: '無法開始活動', variant: 'destructive' });
    }
  };

  const endActivity = async (id: string, type: ActivityType): Promise<string | null> => {
    const dog = getDog(id);
    if (!dog) return null;

    const currentIdKey = type === 'walk' ? 'currentWalkId' : 'currentIndoorId';
    const recordId = dog[currentIdKey];

    if (!recordId) return null;

    try {
      const { error } = await supabase
        .from('activity_records')
        .update({ end_time: new Date().toISOString() })
        .eq('id', recordId);

      if (error) throw error;
      await refreshDogs();
      return recordId;
    } catch (error) {
      console.error('End activity failed:', error);
      toast({ title: '操作失敗', description: '無法結束活動', variant: 'destructive' });
      return null;
    }
  };

  const updateRecord = async (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null, poopStatus?: PoopStatus | null, peeStatus?: PeeStatus | null, notes?: string | null) => {
    try {
      const { error } = await supabase
        .from('activity_records')
        .update({
          start_time: startTime.toISOString(),
          end_time: endTime ? endTime.toISOString() : null,
          poop_status: poopStatus,
          pee_status: peeStatus,
          notes: notes,
        })
        .eq('id', recordId);

      if (error) throw error;
      await refreshDogs();
    } catch (error) {
      console.error('Update record failed:', error);
      toast({ title: '操作失敗', description: '無法更新紀錄', variant: 'destructive' });
    }
  };

  const deleteRecord = async (dogId: string, type: ActivityType, recordId: string) => {
    try {
      const { error } = await supabase
        .from('activity_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      await refreshDogs();
    } catch (error) {
      console.error('Delete record failed:', error);
      toast({ title: '操作失敗', description: '無法刪除紀錄', variant: 'destructive' });
    }
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
