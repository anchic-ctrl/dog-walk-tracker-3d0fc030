

# 新增小便狀況與其他備註欄位

## 概述
在散步活動紀錄的編輯界面中，新增「小便狀況」和「其他備註」兩個欄位，讓使用者能更完整記錄狗狗的活動狀況。

## 預期結果
- 編輯模式下顯示三個區塊：大便狀況、小便狀況、其他備註
- 小便狀況為單選按鈕：有小便（預設）/ 沒小便
- 其他備註為文字輸入欄位
- 儲存後在記錄卡片上顯示這些資訊
- 支援亮色與暗色模式

---

## 實作步驟

### 步驟 1：更新資料庫結構
在 `activity_records` 資料表新增兩個欄位：
- `pee_status` - 新建 enum 類型，值為 `yes`（有小便）和 `no`（沒小便）
- `notes` - text 類型，用於儲存其他備註

```text
┌─────────────────────────────────────────────┐
│            activity_records                 │
├─────────────────────────────────────────────┤
│ + pee_status  (enum: yes, no) 預設 yes      │
│ + notes       (text) 可空                   │
└─────────────────────────────────────────────┘
```

### 步驟 2：更新 TypeScript 類型定義
在 `src/types/dog.ts` 中：
- 新增 `PeeStatus` 類型：`'yes' | 'no'`
- 在 `ActivityRecord` 介面新增 `peeStatus` 和 `notes` 欄位

### 步驟 3：更新 DogsContext
修改 `src/context/DogsContext.tsx`：
- 更新 `updateRecord` 函數簽名，加入 `peeStatus` 和 `notes` 參數
- 確保新欄位能正確儲存到記錄中

### 步驟 4：更新活動記錄編輯元件
修改 `src/components/ActivityRecordItem.tsx`：

**編輯模式新增：**
- 小便狀況單選按鈕組（有小便 / 沒小便）
- 其他備註文字輸入欄位（使用 Textarea 元件）

**顯示模式更新：**
- 顯示小便狀況圖示與文字
- 若有備註則顯示備註內容

---

## 技術細節

### 新增的類型定義
```typescript
export type PeeStatus = 'yes' | 'no';

export interface ActivityRecord {
  id: string;
  startTime: Date;
  endTime: Date | null;
  poopStatus?: PoopStatus | null;
  peeStatus?: PeeStatus | null;    // 新增
  notes?: string | null;            // 新增
}
```

### 資料庫 Migration SQL
```sql
-- 建立小便狀況 enum
CREATE TYPE pee_status AS ENUM ('yes', 'no');

-- 新增欄位到 activity_records
ALTER TABLE activity_records 
  ADD COLUMN pee_status pee_status DEFAULT 'yes',
  ADD COLUMN notes text;
```

### UI 佈局（編輯模式）
```text
┌────────────────────────────────────────────────────┐
│ 第 1 次  [10:30] — [11:15]     [儲存紀錄] [取消]   │
├────────────────────────────────────────────────────┤
│ 大便狀況                                           │
│ ○ 沒大便  ○ 正常  ○ 偏水  ○ 無法成型              │
├────────────────────────────────────────────────────┤
│ 小便狀況                                           │
│ ● 有小便  ○ 沒小便                                │
├────────────────────────────────────────────────────┤
│ 其他備註                                           │
│ ┌──────────────────────────────────────────────┐  │
│ │ 在這裡輸入備註...                            │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### UI 佈局（顯示模式）
```text
┌────────────────────────────────────────────────────┐
│ 第 1 次散步  上午 10:30 — 上午 11:15    [✏️] [🗑️] │
│ 💩 正常  💧 有小便                                 │
│ 📝 今天特別活潑，拉繩力道較大                      │
└────────────────────────────────────────────────────┘
```

---

## 涉及的檔案

| 檔案 | 修改內容 |
|------|----------|
| 資料庫 Migration | 新增 `pee_status` enum 和兩個新欄位 |
| `src/types/dog.ts` | 新增 `PeeStatus` 類型，更新 `ActivityRecord` 介面 |
| `src/context/DogsContext.tsx` | 更新 `updateRecord` 函數以支援新欄位 |
| `src/components/ActivityRecordItem.tsx` | 新增編輯和顯示 UI |

