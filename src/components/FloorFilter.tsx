import { cn } from '@/lib/utils';

interface FloorFilterProps {
  selected: 'all' | '1F' | '2F';
  onChange: (floor: 'all' | '1F' | '2F') => void;
}

const floors = [
  { value: 'all' as const, label: 'All' },
  { value: '1F' as const, label: '1F' },
  { value: '2F' as const, label: '2F' },
];

export function FloorFilter({ selected, onChange }: FloorFilterProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      {floors.map((floor) => (
        <button
          key={floor.value}
          onClick={() => onChange(floor.value)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors touch-action-manipulation',
            selected === floor.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {floor.label}
        </button>
      ))}
    </div>
  );
}
