import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dog, ActivityType, ActivityRecord, PoopStatus, PeeStatus, DogSize, RoomColor, IndoorSpace, WalkingNotes, FoodInfo, SupplementItem, MedicationItem, DayHistory } from '@/types/dog';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface DogsContextType {
  dogs: Dog[];       // Only dogs currently staying (filtered by check_in/check_out dates)
  allDogs: Dog[];    // All dogs in the system (for management pages)
  isLoading: boolean;
  refreshDogs: () => Promise<void>;
  getDog: (id: string) => Dog | undefined;
  startActivity: (id: string, type: ActivityType, indoorSpace?: IndoorSpace) => Promise<void>;
  endActivity: (id: string, type: ActivityType) => Promise<string | null>;
  updateRecord: (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null, poopStatus?: PoopStatus | null, peeStatus?: PeeStatus | null, notes?: string | null) => Promise<void>;
  deleteRecord: (dogId: string, type: ActivityType, recordId: string) => Promise<void>;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

// Check if a dog is currently staying based on check_in_date / check_out_date
function isDogActive(dog: Dog): boolean {
  // Dogs with no dates set are always shown (backward compatibility)
  if (!dog.checkInDate && !dog.checkOutDate) return true;

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  // If check-in date is in the future, dog hasn't arrived yet
  if (dog.checkInDate && dog.checkInDate > todayStr) return false;

  // If check-out date is in the past, dog has already left
  if (dog.checkOutDate && dog.checkOutDate < todayStr) return false;

  return true;
}

export function DogsProvider({ children }: { children: ReactNode }) {
  const [allDogs, setAllDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Filtered list: only dogs currently staying
  const dogs = allDogs.filter(isDogActive);

  const mapDbDogToDog = (dbDog: any, activities: any[], userMap: Map<string, string>): Dog => {
    // Type guards/casting for JSON fields
    const walkingNotes = (dbDog.walking_notes as unknown as WalkingNotes) || {
      pullsOnLeash: false,
      reactiveToOtherDogs: false,
      singleLeash: false,
      notes: '',
    };

    // Backward-compatible food info parsing
    const rawFood = dbDog.food_info as unknown as Record<string, any>;
    const food: FoodInfo = rawFood ? {
      description: rawFood.description || rawFood.specialInstructions || '',
      foodSource: rawFood.foodSource || '自備',
      forbiddenFood: rawFood.forbiddenFood || '',
      remainingCount: rawFood.remainingCount || '',
    } : {
      description: '',
      foodSource: '自備',
      forbiddenFood: '',
      remainingCount: '',
    };

    // Supplements (stored inside medication_info.supplements or as top-level)
    const rawMedInfo = dbDog.medication_info as unknown as Record<string, any>;
    const supplements: SupplementItem[] = rawMedInfo?.supplements || [];
    const medications: MedicationItem[] = rawMedInfo?.medications || [];

    // Filter activities for this dog
    const dogActivities = activities.filter(a => a.dog_id === dbDog.id);

    // Map a raw activity row to an ActivityRecord
    const toRecord = (a: any): ActivityRecord => ({
      id: a.id,
      startTime: new Date(a.start_time),
      endTime: a.end_time ? new Date(a.end_time) : null,
      poopStatus: a.poop_status as PoopStatus,
      peeStatus: a.pee_status as PeeStatus,
      notes: a.notes,
      created_by: a.created_by,
      staffName: a.created_by ? userMap.get(a.created_by) || 'Unknown' : undefined,
      indoorSpace: a.indoor_space as IndoorSpace
    });

    // Get today's date string (local) for comparison
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Split activities into today vs. history
    const todayActivities: any[] = [];
    const historyActivities: any[] = [];
    dogActivities.forEach(a => {
      const dateStr = format(new Date(a.start_time), 'yyyy-MM-dd');
      if (dateStr === todayStr) {
        todayActivities.push(a);
      } else {
        historyActivities.push(a);
      }
    });

    // Process today's records
    const processToday = (kind: 'walk' | 'indoor'): ActivityRecord[] => {
      return todayActivities
        .filter(a => a.activity_kind === kind)
        .map(toRecord)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    };

    const walkRecords = processToday('walk');
    const indoorRecords = processToday('indoor');

    // Build history grouped by date (most recent first)
    const historyByDate = new Map<string, { walks: any[]; indoors: any[] }>();
    historyActivities.forEach(a => {
      const dateStr = format(new Date(a.start_time), 'yyyy-MM-dd');
      if (!historyByDate.has(dateStr)) {
        historyByDate.set(dateStr, { walks: [], indoors: [] });
      }
      const bucket = historyByDate.get(dateStr)!;
      if (a.activity_kind === 'walk') bucket.walks.push(a);
      else bucket.indoors.push(a);
    });

    const activityHistory: DayHistory[] = Array.from(historyByDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // Most recent first
      .map(([dateStr, bucket]) => ({
        date: dateStr,
        dateLabel: format(new Date(dateStr + 'T00:00:00'), 'M/d (EEEEE)', { locale: zhTW }),
        walkRecords: bucket.walks.map(toRecord).sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        indoorRecords: bucket.indoors.map(toRecord).sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
      }));

    // Find current activities (where endTime is null)
    const currentWalk = walkRecords.find(r => !r.endTime);
    const currentIndoor = indoorRecords.find(r => !r.endTime);

    return {
      id: dbDog.id,
      name: dbDog.name,
      breed: dbDog.breed,
      photo: dbDog.photo_url || '',
      roomColor: dbDog.room_color as RoomColor,
      roomNumber: dbDog.room_number as 1 | 2 | 3,
      size: dbDog.size as DogSize,
      walkRecords,
      indoorRecords,
      currentWalkId: currentWalk ? currentWalk.id : null,
      currentIndoorId: currentIndoor ? currentIndoor.id : null,
      walkingNotes,
      food,
      supplements,
      medications,
      checkInDate: dbDog.check_in_date || null,
      checkOutDate: dbDog.check_out_date || null,
      additionalNotes: dbDog.additional_notes || '',
      activityHistory,
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

      // 2. Fetch Activities (last 5 days only for performance)
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(0, 0, 0, 0);

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activity_records')
        .select('*')
        .gte('start_time', fiveDaysAgo.toISOString());

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

      setAllDogs(newDogs);
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

  // Search allDogs so dog profile pages work even for inactive dogs
  const getDog = (id: string) => allDogs.find(dog => dog.id === id);

  const startActivity = async (id: string, type: ActivityType, indoorSpace?: IndoorSpace) => {
    try {
      const { error } = await supabase
        .from('activity_records')
        .insert({
          dog_id: id,
          activity_kind: type,
          start_time: new Date().toISOString(),
          indoor_space: indoorSpace
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

  const { user } = useAuth();

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
        .eq('id', recordId)
        .eq('created_by', user?.id);

      if (error) {
        console.error('Update record failed (permission?):', error);
        toast({ title: '操作失敗', description: '只能編輯自己的紀錄', variant: 'destructive' });
        return;
      }
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
        .eq('id', recordId)
        .eq('created_by', user?.id);

      if (error) {
        console.error('Delete record failed (permission?):', error);
        toast({ title: '操作失敗', description: '只能刪除自己的紀錄', variant: 'destructive' });
        return;
      }
      await refreshDogs();
    } catch (error) {
      console.error('Delete record failed:', error);
      toast({ title: '操作失敗', description: '無法刪除紀錄', variant: 'destructive' });
    }
  };

  return (
    <DogsContext.Provider value={{
      dogs,
      allDogs,
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
