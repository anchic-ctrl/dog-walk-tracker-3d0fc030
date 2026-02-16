import { Dog } from '@/types/dog';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDogs } from '@/context/DogsContext';
import { useNavigate } from 'react-router-dom';
import { Play, StopCircle, AlertTriangle, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface DogCardProps {
  dog: Dog;
}

export function DogCard({ dog }: DogCardProps) {
  const { getDog, startActivity, endActivity } = useDogs();
  const navigate = useNavigate();

  // End activity and navigate to dog profile with auto-edit
  const handleEndActivity = (dogId: string, type: 'walk' | 'indoor') => {
    const currentDog = getDog(dogId);
    const currentRecordId = type === 'walk'
      ? currentDog?.currentWalkId
      : currentDog?.currentIndoorId;

    endActivity(dogId, type);

    // Navigate to dog profile with the record ID to auto-edit
    if (currentRecordId) {
      navigate(`/dog/${dogId}?editRecord=${currentRecordId}`);
    }
  };

  const isWalking = dog.currentWalkId !== null;
  const isIndoor = dog.currentIndoorId !== null;

  const currentWalkRecord = isWalking
    ? dog.walkRecords.find(r => r.id === dog.currentWalkId)
    : null;
  const currentIndoorRecord = isIndoor
    ? dog.indoorRecords.find(r => r.id === dog.currentIndoorId)
    : null;

  const hasWarnings = dog.walkingNotes.needsMuzzle ||
    dog.walkingNotes.mustWalkAlone ||
    dog.walkingNotes.reactiveToOtherDogs;

  const walkDuration = currentWalkRecord
    ? formatDistanceToNow(currentWalkRecord.startTime, { addSuffix: false, locale: zhTW })
    : null;

  const indoorDuration = currentIndoorRecord
    ? formatDistanceToNow(currentIndoorRecord.startTime, { addSuffix: false, locale: zhTW })
    : null;

  // Count completed activities
  const walkCount = dog.walkRecords.filter(r => r.endTime !== null).length;
  const indoorCount = dog.indoorRecords.filter(r => r.endTime !== null).length;

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
                {dog.roomColor}{dog.roomNumber} · {dog.indoorSpace}
              </p>
            </button>
            <div className="flex flex-col gap-1 items-end">
              {walkCount > 0 && (
                <span className="text-xs font-medium text-status-finished">散步 {walkCount} 次</span>
              )}
              {indoorCount > 0 && (
                <span className="text-xs font-medium text-primary">放風 {indoorCount} 次</span>
              )}
            </div>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-center gap-1.5 mt-2 text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium truncate">
                {[
                  dog.walkingNotes.needsMuzzle && '需戴口罩',
                  dog.walkingNotes.mustWalkAlone && '須單獨散步',
                  dog.walkingNotes.reactiveToOtherDogs && '對其他狗有反應',
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}

          {/* Activity Status */}
          <div className="flex gap-2 mt-2">
            {isWalking && walkDuration && (
              <StatusBadge status="active" label={`散步中 ${walkDuration}`} />
            )}
            {isIndoor && indoorDuration && (
              <StatusBadge status="active" label={`放風中 ${indoorDuration}`} />
            )}
          </div>
        </div>
      </div>

      {/* Actions - Two columns for walk and indoor */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {/* Walk Button */}
        {isWalking ? (
          <Button
            onClick={() => handleEndActivity(dog.id, 'walk')}
            variant="destructive"
            className="h-12 text-sm font-semibold"
          >
            <StopCircle className="w-5 h-5 mr-1.5" />
            結束散步
          </Button>
        ) : (
          <Button
            onClick={() => startActivity(dog.id, 'walk')}
            className="h-12 text-sm font-semibold"
          >
            <Play className="w-4 h-4 mr-1.5" />
            開始散步
          </Button>
        )}

        {/* Indoor Button */}
        {isIndoor ? (
          <Button
            onClick={() => handleEndActivity(dog.id, 'indoor')}
            variant="destructive"
            className="h-12 text-sm font-semibold"
          >
            <StopCircle className="w-5 h-5 mr-1.5" />
            結束放風
          </Button>
        ) : (
          <Button
            onClick={() => startActivity(dog.id, 'indoor')}
            variant="outline"
            className="h-12 text-sm font-semibold"
          >
            <Home className="w-4 h-4 mr-1.5" />
            開始放風
          </Button>
        )}
      </div>

      {/* Detail Link */}
      <Button
        onClick={() => navigate(`/dog/${dog.id}`)}
        variant="ghost"
        className="w-full mt-2 text-muted-foreground"
      >
        查看詳細資料
      </Button>
    </Card>
  );
}
