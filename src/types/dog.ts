export type WalkStatus = 'idle' | 'walking' | 'finished';
export type DogSize = 'S' | 'M' | 'L';
export type WalkRound = 1 | 2 | 3;

export interface WalkingNotes {
  pullsOnLeash: boolean;
  reactiveToOtherDogs: boolean;
  needsMuzzle: boolean;
  mustWalkAlone: boolean;
  notes: string;
}

export interface FoodInfo {
  foodType: string;
  feedingTime: string;
  specialInstructions: string;
  forbiddenFood: string;
}

export interface MedicationInfo {
  medicationName: string;
  frequency: string;
  howToGive: string;
  notes: string;
}

export interface WalkRecord {
  startTime: Date | null;
  endTime: Date | null;
}

export interface RoundWalks {
  1: WalkRecord;
  2: WalkRecord;
  3: WalkRecord;
}

export interface RoundStatuses {
  1: WalkStatus;
  2: WalkStatus;
  3: WalkStatus;
}

export interface Dog {
  id: string;
  name: string;
  photo: string;
  roomNumber: string;
  floor: '1F' | '2F';
  size: DogSize;
  roundStatuses: RoundStatuses;
  roundWalks: RoundWalks;
  walkingNotes: WalkingNotes;
  food: FoodInfo;
  medication: MedicationInfo;
  additionalNotes: string;
}
