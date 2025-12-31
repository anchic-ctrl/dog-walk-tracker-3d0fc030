import { cn } from '@/lib/utils';
import { WalkRound } from '@/types/dog';

interface RoundSelectorProps {
  currentRound: WalkRound;
  onChange: (round: WalkRound) => void;
}

const rounds: WalkRound[] = [1, 2, 3];

export function RoundSelector({ currentRound, onChange }: RoundSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      {rounds.map((round) => (
        <button
          key={round}
          onClick={() => onChange(round)}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-semibold rounded-md transition-colors touch-action-manipulation',
            currentRound === round
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          第 {round} / 3 輪
        </button>
      ))}
    </div>
  );
}
