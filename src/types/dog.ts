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
  startTime: Date | null;
  endTime: Date | null;
}

export interface RoundActivity {
  1: ActivityRecord;
  2: ActivityRecord;
  3: ActivityRecord;
}

export interface RoundStatus {
  1: ActivityStatus;
  2: ActivityStatus;
  3: ActivityStatus;
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
  walkStatuses: RoundStatus;
  walkRecords: RoundActivity;
  indoorStatuses: RoundStatus;
  indoorRecords: RoundActivity;
  walkingNotes: WalkingNotes;
  food: FoodInfo;
  medication: MedicationInfo;
  additionalNotes: string;
}
