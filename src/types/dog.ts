export type ActivityStatus = 'idle' | 'active' | 'finished';
export type ActivityType = 'walk' | 'indoor';
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

export interface ActivityRecord {
  id: string;
  startTime: Date;
  endTime: Date | null;
}

export type RoomColor = '黃' | '綠' | '藍' | '紅';
export type IndoorSpace = '1樓客廳' | '2樓大房間' | '2樓小房間';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  photo: string;
  roomColor: RoomColor;
  roomNumber: 1 | 2 | 3;
  indoorSpace: IndoorSpace;
  size: DogSize;
  walkRecords: ActivityRecord[];
  indoorRecords: ActivityRecord[];
  currentWalkId: string | null;
  currentIndoorId: string | null;
  walkingNotes: WalkingNotes;
  food: FoodInfo;
  medication: MedicationInfo;
  additionalNotes: string;
}
