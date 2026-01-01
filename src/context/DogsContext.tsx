import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dog, ActivityType, ActivityRecord } from '@/types/dog';
import { sampleDogs } from '@/data/sampleDogs';

interface DogsContextType {
  dogs: Dog[];
  getDog: (id: string) => Dog | undefined;
  startActivity: (id: string, type: ActivityType) => void;
  endActivity: (id: string, type: ActivityType) => void;
  updateRecord: (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null) => void;
  deleteRecord: (dogId: string, type: ActivityType, recordId: string) => void;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>(sampleDogs);

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
          [recordKey]: [...dog[recordKey], newRecord],
          [currentIdKey]: newRecordId,
        };
      }
      return dog;
    }));
  };

  const endActivity = (id: string, type: ActivityType) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        const currentIdKey = type === 'walk' ? 'currentWalkId' : 'currentIndoorId';
        const currentRecordId = dog[currentIdKey];

        if (!currentRecordId) return dog;

        return {
          ...dog,
          [recordKey]: dog[recordKey].map(record =>
            record.id === currentRecordId
              ? { ...record, endTime: new Date() }
              : record
          ),
          [currentIdKey]: null,
        };
      }
      return dog;
    }));
  };

  const updateRecord = (dogId: string, type: ActivityType, recordId: string, startTime: Date, endTime: Date | null) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === dogId) {
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        return {
          ...dog,
          [recordKey]: dog[recordKey].map(record =>
            record.id === recordId
              ? { ...record, startTime, endTime }
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
          [recordKey]: dog[recordKey].filter(record => record.id !== recordId),
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
