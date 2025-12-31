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

export type RoomColor = '黃' | '綠' | '藍' | '紅';
export type IndoorSpace = '1樓客廳' | '2樓大房間' | '2樓小房間';

export interface Dog {
  id: string;
  name: string;
  photo: string;
  roomColor: RoomColor;
  roomNumber: 1 | 2 | 3;
  indoorSpace: IndoorSpace;
  size: DogSize;
  roundStatuses: RoundStatuses;
  roundWalks: RoundWalks;
  walkingNotes: WalkingNotes;
  food: FoodInfo;
  medication: MedicationInfo;
  additionalNotes: string;
}
