import { Button } from '@/components/ui/button';
import { RoomColor } from '@/types/dog';

interface FloorFilterProps {
  selected: 'all' | RoomColor;
  onChange: (filter: 'all' | RoomColor) => void;
}

const colorOptions: { value: 'all' | RoomColor; label: string; bgClass: string }[] = [
  { value: 'all', label: '全部', bgClass: '' },
  { value: '黃', label: '黃區', bgClass: 'bg-yellow-400' },
  { value: '綠', label: '綠區', bgClass: 'bg-green-500' },
  { value: '藍', label: '藍區', bgClass: 'bg-blue-500' },
  { value: '紅', label: '紅區', bgClass: 'bg-red-500' },
];

export function FloorFilter({ selected, onChange }: FloorFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {colorOptions.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(option.value)}
          className="shrink-0"
        >
          {option.bgClass && (
            <span className={`w-3 h-3 rounded-full ${option.bgClass} mr-1.5`} />
          )}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
