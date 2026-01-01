import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dog, ActivityStatus, ActivityType, WalkRound } from '@/types/dog';
import { sampleDogs } from '@/data/sampleDogs';

interface DogsContextType {
  dogs: Dog[];
  currentRound: WalkRound;
  setCurrentRound: (round: WalkRound) => void;
  getDog: (id: string) => Dog | undefined;
  startActivity: (id: string, type: ActivityType) => void;
  endActivity: (id: string, type: ActivityType) => void;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>(sampleDogs);
  const [currentRound, setCurrentRound] = useState<WalkRound>(1);

  const getDog = (id: string) => dogs.find(dog => dog.id === id);

  const startActivity = (id: string, type: ActivityType) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        const statusKey = type === 'walk' ? 'walkStatuses' : 'indoorStatuses';
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        const currentStatus = dog[statusKey][currentRound];
        
        // If finished, cycle back to active (start new activity)
        if (currentStatus === 'finished' || currentStatus === 'idle') {
          return {
            ...dog,
            [statusKey]: {
              ...dog[statusKey],
              [currentRound]: 'active' as ActivityStatus,
            },
            [recordKey]: {
              ...dog[recordKey],
              [currentRound]: {
                startTime: new Date(),
                endTime: null,
              },
            },
          };
        }
      }
      return dog;
    }));
  };

  const endActivity = (id: string, type: ActivityType) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        const statusKey = type === 'walk' ? 'walkStatuses' : 'indoorStatuses';
        const recordKey = type === 'walk' ? 'walkRecords' : 'indoorRecords';
        
        return {
          ...dog,
          [statusKey]: {
            ...dog[statusKey],
            [currentRound]: 'finished' as ActivityStatus,
          },
          [recordKey]: {
            ...dog[recordKey],
            [currentRound]: {
              ...dog[recordKey][currentRound],
              endTime: new Date(),
            },
          },
        };
      }
      return dog;
    }));
  };

  return (
    <DogsContext.Provider value={{ 
      dogs, 
      currentRound, 
      setCurrentRound, 
      getDog, 
      startActivity, 
      endActivity,
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
