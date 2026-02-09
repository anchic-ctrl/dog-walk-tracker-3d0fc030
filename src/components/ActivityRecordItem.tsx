import { useState, useEffect } from 'react';
import { ActivityRecord, ActivityType, PoopStatus } from '@/types/dog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDogs } from '@/context/DogsContext';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ActivityRecordItemProps {
  dogId: string;
  record: ActivityRecord;
  type: ActivityType;
  index: number;
  isActive?: boolean;
  autoEdit?: boolean;
}

const POOP_STATUS_LABELS: Record<PoopStatus, string> = {
  none: '沒大便',
  normal: '正常',
  watery: '偏水',
  unformed: '無法成型',
};

export function ActivityRecordItem({ dogId, record, type, index, isActive, autoEdit }: ActivityRecordItemProps) {
  const { updateRecord, deleteRecord } = useDogs();
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState(format(record.startTime, 'HH:mm'));
  const [endTime, setEndTime] = useState(record.endTime ? format(record.endTime, 'HH:mm') : '');
  const [poopStatus, setPoopStatus] = useState<PoopStatus | null>(record.poopStatus || (type === 'walk' ? 'none' : null));

  // Auto-enter edit mode when autoEdit prop becomes true (e.g., after ending a walk)
  useEffect(() => {
    if (autoEdit) {
      setIsEditing(true);
      // Update endTime to the record's actual end time
      if (record.endTime) {
        setEndTime(format(record.endTime, 'HH:mm'));
      }
    }
  }, [autoEdit, record.endTime]);

  const handleSave = () => {
    const today = new Date();
    const [startHour, startMin] = startTime.split(':').map(Number);
    const newStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMin);
    
    let newEnd: Date | null = null;
    if (endTime) {
      const [endHour, endMin] = endTime.split(':').map(Number);
      newEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMin);
    }

    updateRecord(dogId, type, record.id, newStart, newEnd, type === 'walk' ? poopStatus : undefined);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setStartTime(format(record.startTime, 'HH:mm'));
    setEndTime(record.endTime ? format(record.endTime, 'HH:mm') : '');
    setPoopStatus(record.poopStatus || null);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteRecord(dogId, type, record.id);
  };

  const typeLabel = type === 'walk' ? '散步' : '放風';

  if (isEditing) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium shrink-0">第 {index + 1} 次</span>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-24 h-8 text-sm"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-24 h-8 text-sm"
            placeholder="進行中"
          />
          <div className="flex gap-1 ml-auto">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
              <Check className="w-4 h-4 text-status-finished" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Poop status selection - only for walk type */}
        {type === 'walk' && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">大便狀況</p>
            <RadioGroup
              value={poopStatus || ''}
              onValueChange={(value) => setPoopStatus(value as PoopStatus)}
              className="flex gap-4"
            >
              {(Object.keys(POOP_STATUS_LABELS) as PoopStatus[]).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <RadioGroupItem value={status} id={`${record.id}-${status}`} />
                  <Label htmlFor={`${record.id}-${status}`} className="text-sm cursor-pointer">
                    {POOP_STATUS_LABELS[status]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium shrink-0">第 {index + 1} 次{typeLabel}</span>
          <span className="text-sm">
            {format(record.startTime, 'a h:mm', { locale: zhTW })}
            {' — '}
            {record.endTime 
              ? format(record.endTime, 'a h:mm', { locale: zhTW })
              : <span className="text-status-walking">進行中</span>
            }
          </span>
        </div>
        {/* Show poop status for walk records */}
        {type === 'walk' && record.poopStatus && (
          <p className="text-xs text-muted-foreground mt-1">
            💩 {POOP_STATUS_LABELS[record.poopStatus]}
          </p>
        )}
      </div>
      {isActive && (
        <span className="px-2 py-0.5 text-xs font-medium bg-status-walking/20 text-status-walking rounded-full">
          進行中
        </span>
      )}
      {!isActive && (
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 text-danger" />
          </Button>
        </div>
      )}
    </div>
  );
}
