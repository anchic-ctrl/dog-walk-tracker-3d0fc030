export type ActivityStatus = 'idle' | 'active' | 'finished';
export type ActivityType = 'walk' | 'indoor';
export type DogSize = 'S' | 'M' | 'L';
export type WalkRound = 1 | 2 | 3;
export type PoopStatus = 'none' | 'normal' | 'watery' | 'unformed';
export type PeeStatus = 'yes' | 'no';

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
  poopStatus?: PoopStatus | null;
  peeStatus?: PeeStatus | null;
  notes?: string | null;
}

export type RoomColor = '黃' | '綠' | '藍' | '紅';
export type IndoorSpace = '1樓客廳' | '2樓大房間' | '2樓小房間';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  photo?: string; // Legacy field for local state
  photo_url?: string; // Database field
  roomColor?: RoomColor;
  room_color?: RoomColor; // Database field
  roomNumber?: 1 | 2 | 3;
  room_number?: 1 | 2 | 3; // Database field
  indoorSpace?: IndoorSpace;
  indoor_space?: IndoorSpace; // Database field
  size: DogSize;
  walkRecords?: ActivityRecord[];
  indoorRecords?: ActivityRecord[];
  currentWalkId?: string | null;
  currentIndoorId?: string | null;
  walkingNotes?: WalkingNotes;
  food?: FoodInfo;
  medication?: MedicationInfo;
  additionalNotes?: string;
  additional_notes?: string; // Database field
}
