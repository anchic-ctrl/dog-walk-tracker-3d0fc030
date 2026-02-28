export type ActivityStatus = 'idle' | 'active' | 'finished';
export type ActivityType = 'walk' | 'indoor';
export type DogSize = 'S' | 'M' | 'L';
export type WalkRound = 1 | 2 | 3;
export type PoopStatus = 'none' | 'normal' | 'watery' | 'unformed';
export type PeeStatus = 'yes' | 'no';

export interface WalkingNotes {
  pullsOnLeash: boolean;
  reactiveToOtherDogs: boolean;
  singleLeash: boolean;
  notes: string;
}

// 餵食方式（保健品 / 藥品用）
export type FeedingMethod = '加飯裡' | '用塞的' | '直接吃' | '外用塗抹' | '膠囊打開放飯' | '磨碎加飯裡';

// 飼料來源
export type FoodSource = '自備' | '店家提供';

export interface FoodInfo {
  description: string;         // 整體飲食說明
  foodSource: FoodSource;      // 飼料來源
  forbiddenFood: string;       // 禁食項目
  remainingCount?: string;     // 剩餘數量（選填，如「共26包」）
}

export interface SupplementItem {
  name: string;                // 品名
  dosage: string;              // 劑量
  frequency: string;           // 頻率
  method: FeedingMethod;       // 餵食方式
}

export interface MedicationItem {
  name: string;                // 藥名
  dosage: string;              // 劑量
  frequency: string;           // 頻率
  method: FeedingMethod;       // 餵藥方式
  condition: string;           // 使用條件/備註
  remainingCount?: string;     // 剩餘數量（選填）
}

export interface ActivityRecord {
  id: string;
  startTime: Date;
  endTime: Date | null;
  poopStatus?: PoopStatus | null;
  peeStatus?: PeeStatus | null;
  notes?: string | null;
  created_by?: string | null;
  staffName?: string | null;
  indoorSpace?: IndoorSpace; // 每一次放風的空間
}

export type RoomColor = '黃' | '綠' | '藍' | '紅';
export type IndoorSpace = '1樓客廳' | '2樓大房間' | '2樓小房間';

export interface DayHistory {
  date: string;           // ISO date string, e.g. "2026-02-25"
  dateLabel: string;      // Display label, e.g. "2/25 (二)"
  walkRecords: ActivityRecord[];
  indoorRecords: ActivityRecord[];
}

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
  size: DogSize;
  walkRecords?: ActivityRecord[];
  indoorRecords?: ActivityRecord[];
  currentWalkId?: string | null;
  currentIndoorId?: string | null;
  walkingNotes?: WalkingNotes;
  food?: FoodInfo;
  supplements?: SupplementItem[];
  medications?: MedicationItem[];
  checkInDate?: string | null;  // 入住日期 (ISO date string)
  checkOutDate?: string | null; // 退房日期 (ISO date string)
  additionalNotes?: string;
  additional_notes?: string; // Database field
  activityHistory?: DayHistory[]; // 前幾天的歷史紀錄 (按日期分組，最近的在前)
}
