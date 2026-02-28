import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ActivityRecord, ActivityType, PoopStatus, PeeStatus } from '@/types/dog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  readOnly?: boolean;
}

const POOP_STATUS_LABELS: Record<PoopStatus, string> = {
  none: '沒大便',
  normal: '正常',
  watery: '偏水',
  unformed: '無法成型',
};

const PEE_STATUS_LABELS: Record<PeeStatus, string> = {
  yes: '有小便',
  no: '沒小便',
};

export function ActivityRecordItem({ dogId, record, type, index, isActive, autoEdit, readOnly }: ActivityRecordItemProps) {
  const { updateRecord, deleteRecord } = useDogs();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState(format(record.startTime, 'HH:mm'));
  const [endTime, setEndTime] = useState(record.endTime ? format(record.endTime, 'HH:mm') : '');
  const [poopStatus, setPoopStatus] = useState<PoopStatus | null>(record.poopStatus || 'none');
  const [peeStatus, setPeeStatus] = useState<PeeStatus>(record.peeStatus || 'yes');
  const [notes, setNotes] = useState(record.notes || '');

  const autoEditConsumed = useRef(false);

  useEffect(() => {
    if (autoEdit && !autoEditConsumed.current) {
      autoEditConsumed.current = true;
      setIsEditing(true);
      if (record.endTime) {
        setEndTime(format(record.endTime, 'HH:mm'));
      }
    }
  }, [autoEdit, record.endTime]);

  const handleSave = () => {
    const recordDate = new Date(record.startTime);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const newStart = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), startHour, startMin);

    let newEnd: Date | null = null;
    if (endTime) {
      const [endHour, endMin] = endTime.split(':').map(Number);
      newEnd = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), endHour, endMin);
    }

    updateRecord(
      dogId, type, record.id, newStart, newEnd,
      poopStatus,
      peeStatus,
      notes.trim() || null
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setStartTime(format(record.startTime, 'HH:mm'));
    setEndTime(record.endTime ? format(record.endTime, 'HH:mm') : '');
    setPoopStatus(record.poopStatus || null);
    setPeeStatus(record.peeStatus || 'yes');
    setNotes(record.notes || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteRecord(dogId, type, record.id);
  };

  const typeLabel = type === 'walk' ? '散步' : '放風';

  if (isEditing) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
        <div className="flex flex-wrap items-center gap-y-3 gap-x-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium shrink-0">第 {index + 1} 次</span>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <span className="text-muted-foreground shrink-0">—</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-24 h-8 text-sm"
              placeholder="進行中"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto justify-end">
            <Button size="sm" variant="default" className="h-8 shrink-0 flex-1 sm:flex-none" onClick={(e) => { e.stopPropagation(); handleSave(); }}>
              <Check className="w-4 h-4 mr-1" />
              儲存紀錄
            </Button>
            <Button size="sm" variant="ghost" className="h-8 shrink-0 flex-1 sm:flex-none" onClick={(e) => { e.stopPropagation(); handleCancel(); }}>
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
          </div>
        </div>

        {/* Poop status */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">大便狀況</p>
          <RadioGroup
            value={poopStatus || ''}
            onValueChange={(value) => setPoopStatus(value as PoopStatus)}
            className="flex gap-4 flex-wrap"
          >
            {(Object.keys(POOP_STATUS_LABELS) as PoopStatus[]).map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <RadioGroupItem value={status} id={`${record.id}-poop-${status}`} />
                <Label htmlFor={`${record.id}-poop-${status}`} className="text-sm cursor-pointer">
                  {POOP_STATUS_LABELS[status]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Pee status */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">小便狀況</p>
          <RadioGroup
            value={peeStatus}
            onValueChange={(value) => setPeeStatus(value as PeeStatus)}
            className="flex gap-4"
          >
            {(Object.keys(PEE_STATUS_LABELS) as PeeStatus[]).map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <RadioGroupItem value={status} id={`${record.id}-pee-${status}`} />
                <Label htmlFor={`${record.id}-pee-${status}`} className="text-sm cursor-pointer">
                  {PEE_STATUS_LABELS[status]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Notes */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">其他備註</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="在這裡輸入備註..."
            className="min-h-[60px] text-sm"
          />
        </div>
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
          {record.staffName && (
            <span className="text-xs text-muted-foreground border-l pl-2 ml-2">
              {record.staffName}
            </span>
          )}
          {record.indoorSpace && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
              {record.indoorSpace}
            </span>
          )}
        </div>
        {(record.poopStatus || record.peeStatus) && (
          <p className="text-xs text-muted-foreground mt-1">
            {record.poopStatus && <>💩 {POOP_STATUS_LABELS[record.poopStatus]}</>}
            {record.poopStatus && record.peeStatus && '  '}
            {record.peeStatus && <>💧 {PEE_STATUS_LABELS[record.peeStatus]}</>}
          </p>
        )}
        {record.notes && (
          <p className="text-xs text-muted-foreground mt-1">
            📝 {record.notes}
          </p>
        )}
      </div>
      {isActive && (
        <span className="px-2 py-0.5 text-xs font-medium bg-status-walking/20 text-status-walking rounded-full">
          進行中
        </span>
      )}
      {!isActive && !readOnly && (
        <div className="flex gap-1 shrink-0">
          {record.created_by === user?.id && (
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
      )}
    </div>
  );
}
