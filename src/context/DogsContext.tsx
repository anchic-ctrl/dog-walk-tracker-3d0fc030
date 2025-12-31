import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dog, WalkStatus } from '@/types/dog';
import { sampleDogs } from '@/data/sampleDogs';

interface DogsContextType {
  dogs: Dog[];
  getDog: (id: string) => Dog | undefined;
  startWalk: (id: string) => void;
  endWalk: (id: string) => void;
  updateWalkTime: (id: string, type: 'start' | 'end', time: Date) => void;
  resetWalk: (id: string) => void;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>(sampleDogs);

  const getDog = (id: string) => dogs.find(dog => dog.id === id);

  const startWalk = (id: string) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        return {
          ...dog,
          walkStatus: 'walking' as WalkStatus,
          currentWalk: {
            startTime: new Date(),
            endTime: null,
          },
        };
      }
      return dog;
    }));
  };

  const endWalk = (id: string) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        return {
          ...dog,
          walkStatus: 'finished' as WalkStatus,
          currentWalk: {
            ...dog.currentWalk,
            endTime: new Date(),
          },
        };
      }
      return dog;
    }));
  };

  const updateWalkTime = (id: string, type: 'start' | 'end', time: Date) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        return {
          ...dog,
          currentWalk: {
            ...dog.currentWalk,
            [type === 'start' ? 'startTime' : 'endTime']: time,
          },
        };
      }
      return dog;
    }));
  };

  const resetWalk = (id: string) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        return {
          ...dog,
          walkStatus: 'idle' as WalkStatus,
          currentWalk: {
            startTime: null,
            endTime: null,
          },
        };
      }
      return dog;
    }));
  };

  return (
    <DogsContext.Provider value={{ dogs, getDog, startWalk, endWalk, updateWalkTime, resetWalk }}>
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
