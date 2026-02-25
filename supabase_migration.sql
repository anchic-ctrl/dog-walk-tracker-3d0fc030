-- ===================================================
-- 1. 新增入住期間欄位
-- ===================================================
ALTER TABLE public.dogs
ADD COLUMN IF NOT EXISTS check_in_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS check_out_date date DEFAULT NULL;

-- ===================================================
-- 2. 新增三隻狗狗資料
-- ===================================================

-- Marble / 法鬥
INSERT INTO public.dogs (name, breed, size, room_color, room_number, indoor_space, check_in_date, check_out_date, food_info, medication_info, walking_notes)
VALUES (
  'Marble',
  '法鬥',
  'M',
  '黃',
  1,
  '1樓客廳',
  '2026-07-08',
  '2026-07-29',
  '{"description": "早晚一包鮮食 + 50~80cc水 + 2匙凍乾", "foodSource": "自備", "forbiddenFood": "", "remainingCount": "共26顆"}'::jsonb,
  '{
    "supplements": [
      {"name": "Wakamoto", "dosage": "一顆", "frequency": "每次飯後", "method": "加飯裡"},
      {"name": "神經修護", "dosage": "一匙", "frequency": "每晚", "method": "加飯裡"}
    ],
    "medications": [
      {"name": "CystoPro", "dosage": "一顆", "frequency": "早晚各一次", "method": "膠囊打開放飯", "condition": "若血尿才給", "remainingCount": ""},
      {"name": "美康（白）", "dosage": "", "frequency": "需要時使用", "method": "外用塗抹", "condition": "長紅疹處可擦", "remainingCount": ""},
      {"name": "妥膚淨（黃）", "dosage": "", "frequency": "需要時使用", "method": "外用塗抹", "condition": "發炎或傷口可擦", "remainingCount": ""}
    ]
  }'::jsonb,
  '{"pullsOnLeash": false, "reactiveToOtherDogs": false, "singleLeash": false, "notes": ""}'::jsonb
);

-- Doreen / 柴犬
INSERT INTO public.dogs (name, breed, size, room_color, room_number, indoor_space, check_in_date, check_out_date, food_info, medication_info, walking_notes)
VALUES (
  'Doreen',
  '柴犬',
  'M',
  '黃',
  2,
  '1樓客廳',
  '2026-07-12',
  '2026-07-23',
  '{"description": "早晚1匙飼料", "foodSource": "自備", "forbiddenFood": "", "remainingCount": ""}'::jsonb,
  '{
    "supplements": [
      {"name": "魚油", "dosage": "1匙", "frequency": "早晚各一次", "method": "加飯裡"}
    ],
    "medications": []
  }'::jsonb,
  '{"pullsOnLeash": false, "reactiveToOtherDogs": false, "singleLeash": false, "notes": ""}'::jsonb
);

-- 甜甜 / 臘腸
INSERT INTO public.dogs (name, breed, size, room_color, room_number, indoor_space, check_in_date, check_out_date, food_info, medication_info, walking_notes)
VALUES (
  '甜甜',
  '臘腸',
  'S',
  '黃',
  3,
  '1樓客廳',
  '2026-07-12',
  '2026-07-23',
  '{"description": "早晚各43克飼料", "foodSource": "自備", "forbiddenFood": "", "remainingCount": ""}'::jsonb,
  '{
    "supplements": [
      {"name": "皮膚", "dosage": "1包", "frequency": "早各一次", "method": "加飯裡"},
      {"name": "益生菌", "dosage": "1包", "frequency": "早各一次", "method": "加飯裡"},
      {"name": "B群", "dosage": "1顆", "frequency": "早晚各一次", "method": "用塞的"},
      {"name": "每達得", "dosage": "1顆", "frequency": "早晚各一次", "method": "用塞的"}
    ],
    "medications": [
      {"name": "令離集廣藻", "dosage": "1包", "frequency": "早晚各一次", "method": "用塞的", "condition": "藥丸用塞的，有分早晚，藥袋上有標明", "remainingCount": "早共40剩129、晚共41剩130"}
    ]
  }'::jsonb,
  '{"pullsOnLeash": false, "reactiveToOtherDogs": false, "singleLeash": false, "notes": ""}'::jsonb
);
