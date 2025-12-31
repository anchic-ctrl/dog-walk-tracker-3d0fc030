import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dog, WalkStatus, WalkRound } from '@/types/dog';
import { sampleDogs } from '@/data/sampleDogs';

interface DogsContextType {
  dogs: Dog[];
  currentRound: WalkRound;
  setCurrentRound: (round: WalkRound) => void;
  getDog: (id: string) => Dog | undefined;
  startWalk: (id: string) => void;
  endWalk: (id: string) => void;
  updateWalkTime: (id: string, type: 'start' | 'end', time: Date) => void;
  resetWalk: (id: string) => void;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>(sampleDogs);
  const [currentRound, setCurrentRound] = useState<WalkRound>(1);

  const getDog = (id: string) => dogs.find(dog => dog.id === id);

  const startWalk = (id: string) => {
    setDogs(prev => prev.map(dog => {
      if (dog.id === id) {
        return {
          ...dog,
          roundStatuses: {
            ...dog.roundStatuses,
            [currentRound]: 'walking' as WalkStatus,
          },
          roundWalks: {
            ...dog.roundWalks,
            [currentRound]: {
              startTime: new Date(),
              endTime: null,
            },
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
          roundStatuses: {
            ...dog.roundStatuses,
            [currentRound]: 'finished' as WalkStatus,
          },
          roundWalks: {
            ...dog.roundWalks,
            [currentRound]: {
              ...dog.roundWalks[currentRound],
              endTime: new Date(),
            },
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
          roundWalks: {
            ...dog.roundWalks,
            [currentRound]: {
              ...dog.roundWalks[currentRound],
              [type === 'start' ? 'startTime' : 'endTime']: time,
            },
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
          roundStatuses: {
            ...dog.roundStatuses,
            [currentRound]: 'idle' as WalkStatus,
          },
          roundWalks: {
            ...dog.roundWalks,
            [currentRound]: {
              startTime: null,
              endTime: null,
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
      startWalk, 
      endWalk, 
      updateWalkTime, 
      resetWalk 
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
