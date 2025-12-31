import { Dog } from '@/types/dog';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDogs } from '@/context/DogsContext';
import { useNavigate } from 'react-router-dom';
import { Play, Square, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DogCardProps {
  dog: Dog;
}

export function DogCard({ dog }: DogCardProps) {
  const { startWalk, endWalk, resetWalk } = useDogs();
  const navigate = useNavigate();

  const hasWarnings = dog.walkingNotes.needsMuzzle || 
                      dog.walkingNotes.mustWalkAlone || 
                      dog.walkingNotes.reactiveToOtherDogs;

  const walkDuration = dog.currentWalk.startTime
    ? formatDistanceToNow(dog.currentWalk.startTime, { addSuffix: false })
    : null;

  return (
    <Card className="p-4 touch-action-manipulation">
      <div className="flex gap-3">
        {/* Photo */}
        <button
          onClick={() => navigate(`/dog/${dog.id}`)}
          className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
        >
          <img
            src={dog.photo}
            alt={dog.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => navigate(`/dog/${dog.id}`)}
              className="text-left focus:outline-none"
            >
              <h3 className="font-semibold text-lg leading-tight">{dog.name}</h3>
              <p className="text-sm text-muted-foreground">
                Room {dog.roomNumber} · {dog.floor}
              </p>
            </button>
            <StatusBadge status={dog.walkStatus} />
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-center gap-1.5 mt-2 text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium truncate">
                {[
                  dog.walkingNotes.needsMuzzle && 'Muzzle',
                  dog.walkingNotes.mustWalkAlone && 'Walk alone',
                  dog.walkingNotes.reactiveToOtherDogs && 'Reactive',
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}

          {/* Walk duration */}
          {dog.walkStatus === 'walking' && walkDuration && (
            <p className="text-sm text-status-walking font-medium mt-2">
              Walking for {walkDuration}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {dog.walkStatus === 'idle' && (
          <Button
            onClick={() => startWalk(dog.id)}
            className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Walk
          </Button>
        )}

        {dog.walkStatus === 'walking' && (
          <Button
            onClick={() => endWalk(dog.id)}
            variant="secondary"
            className="flex-1 h-12 text-base font-semibold bg-status-walking text-foreground hover:bg-status-walking/90"
          >
            <Square className="w-5 h-5 mr-2" />
            End Walk
          </Button>
        )}

        {dog.walkStatus === 'finished' && (
          <Button
            onClick={() => resetWalk(dog.id)}
            variant="outline"
            className="flex-1 h-12 text-base font-semibold"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        )}

        <Button
          onClick={() => navigate(`/dog/${dog.id}`)}
          variant="outline"
          className="h-12 px-4"
        >
          Details
        </Button>
      </div>
    </Card>
  );
}
