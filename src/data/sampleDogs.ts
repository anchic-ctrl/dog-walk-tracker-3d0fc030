import { Dog } from '@/types/dog';

export const sampleDogs: Dog[] = [
  {
    id: '1',
    name: 'Max',
    breed: '黃金獵犬',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&crop=face',
    roomColor: '黃',
    roomNumber: 1,
    indoorSpace: '1樓客廳',
    size: 'L',
    walkRecords: [],
    indoorRecords: [],
    currentWalkId: null,
    currentIndoorId: null,
    walkingNotes: {
      pullsOnLeash: true,
      reactiveToOtherDogs: false,
      needsMuzzle: false,
      mustWalkAlone: false,
      notes: '喜歡停下來聞東西，請耐心等待。',
    },
    food: {
      foodType: 'Royal Canin 大型犬成犬糧',
      feedingTime: '早上 8:00 / 晚上 6:00',
      specialInstructions: '加溫水軟化飼料',
      forbiddenFood: '雞肉（過敏）',
    },
    medication: {
      medicationName: '關節保健品',
      frequency: '每日一次',
      howToGive: '混入食物中',
      notes: '早餐時給予',
    },
    additionalNotes: '對工作人員很友善，喜歡被摸肚子。',
  },
  {
    id: '2',
    name: 'Bella',
    breed: '米克斯',
    photo: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=200&h=200&fit=crop&crop=face',
    roomColor: '綠',
    roomNumber: 2,
    indoorSpace: '2樓大房間',
    size: 'M',
    walkRecords: [
      { id: 'w-bella-1', startTime: new Date(Date.now() - 1000 * 60 * 12), endTime: null }
    ],
    indoorRecords: [],
    currentWalkId: 'w-bella-1',
    currentIndoorId: null,
    walkingNotes: {
      pullsOnLeash: false,
      reactiveToOtherDogs: true,
      needsMuzzle: false,
      mustWalkAlone: true,
      notes: '與其他狗保持距離，容易焦慮。',
    },
    food: {
      foodType: 'Hills 希爾思科學飲食',
      feedingTime: '早上 7:30 / 晚上 5:30',
      specialInstructions: '需使用慢食碗',
      forbiddenFood: '無',
    },
    medication: {
      medicationName: '無',
      frequency: '',
      howToGive: '',
      notes: '',
    },
    additionalNotes: '一開始害羞但會慢慢熟悉。最愛的玩具：藍色球。',
  },
  {
    id: '3',
    name: 'Charlie',
    breed: '柴犬',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face',
    roomColor: '藍',
    roomNumber: 1,
    indoorSpace: '2樓小房間',
    size: 'S',
    walkRecords: [
      { 
        id: 'w-charlie-1',
        startTime: new Date(Date.now() - 1000 * 60 * 45), 
        endTime: new Date(Date.now() - 1000 * 60 * 25) 
      }
    ],
    indoorRecords: [
      { 
        id: 'i-charlie-1',
        startTime: new Date(Date.now() - 1000 * 60 * 60), 
        endTime: new Date(Date.now() - 1000 * 60 * 50) 
      }
    ],
    currentWalkId: null,
    currentIndoorId: null,
    walkingNotes: {
      pullsOnLeash: false,
      reactiveToOtherDogs: false,
      needsMuzzle: false,
      mustWalkAlone: false,
      notes: '散步表現很好！可以與其他狗一起散步。',
    },
    food: {
      foodType: 'Blue Buffalo 小型犬糧',
      feedingTime: '早上 8:00 / 中午 12:00 / 晚上 6:00',
      specialInstructions: '因體型小需分3餐餵食',
      forbiddenFood: '葡萄、葡萄乾',
    },
    medication: {
      medicationName: 'Apoquel 止癢錠',
      frequency: '每日兩次',
      howToGive: '用零食包藥餵食',
      notes: '治療皮膚過敏，早晚各一次。',
    },
    additionalNotes: '興奮時會吠叫，屬正常行為。',
  },
  {
    id: '4',
    name: 'Luna',
    breed: '哈士奇',
    photo: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop&crop=face',
    roomColor: '紅',
    roomNumber: 3,
    indoorSpace: '1樓客廳',
    size: 'M',
    walkRecords: [],
    indoorRecords: [],
    currentWalkId: null,
    currentIndoorId: null,
    walkingNotes: {
      pullsOnLeash: true,
      reactiveToOtherDogs: true,
      needsMuzzle: true,
      mustWalkAlone: true,
      notes: '戶外必須戴口罩。獵食慾望強。',
    },
    food: {
      foodType: 'Orijen 原始糧',
      feedingTime: '早上 7:00 / 晚上 5:00',
      specialInstructions: '不吃時可用手餵食',
      forbiddenFood: '牛肉',
    },
    medication: {
      medicationName: 'Trazodone 鎮定劑',
      frequency: '需要時使用',
      howToGive: '藏在起司裡餵食',
      notes: '僅在出現焦慮症狀時給予',
    },
    additionalNotes: '精力旺盛，散步需有經驗的工作人員。',
  },
];
