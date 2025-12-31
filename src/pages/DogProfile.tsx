import { useParams, useNavigate } from 'react-router-dom';
import { useDogs } from '@/context/DogsContext';
import { StatusBadge } from '@/components/StatusBadge';
import { InfoSection } from '@/components/InfoSection';
import { WarningTag } from '@/components/WarningTag';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MapPin, 
  Ruler, 
  Footprints, 
  UtensilsCrossed, 
  Pill, 
  StickyNote,
  AlertTriangle,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDog, startWalk, endWalk, resetWalk, currentRound } = useDogs();

  const dog = getDog(id || '');

  if (!dog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">找不到此狗狗</p>
      </div>
    );
  }

  const currentStatus = dog.roundStatuses[currentRound];
  const currentWalk = dog.roundWalks[currentRound];

  const sizeLabel = {
    S: '小型犬',
    M: '中型犬',
    L: '大型犬',
  }[dog.size];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">狗狗資料</h1>
          <span className="ml-auto text-sm font-medium text-muted-foreground">
            第 {currentRound} / 3 輪
          </span>
        </div>
      </header>

      <main className="px-4 space-y-4 mt-4">
        {/* Basic Info */}
        <div className="flex gap-4 items-start">
          <img
            src={dog.photo}
            alt={dog.name}
            className="w-24 h-24 rounded-2xl object-cover shadow-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">{dog.name}</h2>
              <StatusBadge status={currentStatus} />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {dog.roomColor}{dog.roomNumber} · {dog.indoorSpace}
              </p>
              <p className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                體型：{sizeLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Walk Actions */}
        <div className="flex gap-2">
          {currentStatus === 'idle' && (
            <Button
              onClick={() => startWalk(dog.id)}
              className="flex-1 h-14 text-base font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              開始第 {currentRound} 輪散步
            </Button>
          )}
          {currentStatus === 'walking' && (
            <Button
              onClick={() => endWalk(dog.id)}
              className="flex-1 h-14 text-base font-semibold bg-status-walking text-foreground hover:bg-status-walking/90"
            >
              <Square className="w-5 h-5 mr-2" />
              結束第 {currentRound} 輪散步
            </Button>
          )}
          {currentStatus === 'finished' && (
            <Button
              onClick={() => resetWalk(dog.id)}
              variant="outline"
              className="flex-1 h-14 text-base font-semibold"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重置第 {currentRound} 輪
            </Button>
          )}
        </div>

        {/* Walk Times */}
        {(currentWalk.startTime || currentWalk.endTime) && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            {currentWalk.startTime && (
              <p className="text-sm">
                <span className="text-muted-foreground">開始時間：</span>
                <span className="font-medium">
                  {format(currentWalk.startTime, 'a h:mm', { locale: zhTW })}
                </span>
              </p>
            )}
            {currentWalk.endTime && (
              <p className="text-sm">
                <span className="text-muted-foreground">結束時間：</span>
                <span className="font-medium">
                  {format(currentWalk.endTime, 'a h:mm', { locale: zhTW })}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Walking Notes */}
        <InfoSection
          title="散步注意事項"
          icon={<Footprints className="w-4 h-4" />}
          variant={
            dog.walkingNotes.needsMuzzle || dog.walkingNotes.mustWalkAlone
              ? 'warning'
              : 'default'
          }
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <WarningTag label="會拉扯牽繩" active={dog.walkingNotes.pullsOnLeash} />
            <WarningTag label="對其他狗有反應" active={dog.walkingNotes.reactiveToOtherDogs} />
            <WarningTag label="需戴口罩" active={dog.walkingNotes.needsMuzzle} />
            <WarningTag label="須單獨散步" active={dog.walkingNotes.mustWalkAlone} />
          </div>
          {dog.walkingNotes.notes && (
            <p className="text-sm text-foreground bg-background/50 rounded-lg p-3">
              {dog.walkingNotes.notes}
            </p>
          )}
        </InfoSection>

        {/* Food */}
        <InfoSection title="飲食" icon={<UtensilsCrossed className="w-4 h-4" />}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">飼料種類</dt>
              <dd className="font-medium">{dog.food.foodType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">餵食時間</dt>
              <dd className="font-medium">{dog.food.feedingTime}</dd>
            </div>
            {dog.food.specialInstructions && (
              <div>
                <dt className="text-muted-foreground">特殊說明</dt>
                <dd className="font-medium">{dog.food.specialInstructions}</dd>
              </div>
            )}
            {dog.food.forbiddenFood && dog.food.forbiddenFood !== '無' && (
              <div className="bg-danger-bg rounded-lg p-3 border border-danger/30">
                <dt className="text-danger font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  禁止食物
                </dt>
                <dd className="font-medium mt-1">{dog.food.forbiddenFood}</dd>
              </div>
            )}
          </dl>
        </InfoSection>

        {/* Medication */}
        {dog.medication.medicationName && dog.medication.medicationName !== '無' && (
          <InfoSection title="藥物" icon={<Pill className="w-4 h-4" />}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">藥物名稱</dt>
                <dd className="font-medium">{dog.medication.medicationName}</dd>
              </div>
              {dog.medication.frequency && (
                <div>
                  <dt className="text-muted-foreground">頻率</dt>
                  <dd className="font-medium">{dog.medication.frequency}</dd>
                </div>
              )}
              {dog.medication.howToGive && (
                <div>
                  <dt className="text-muted-foreground">餵藥方式</dt>
                  <dd className="font-medium">{dog.medication.howToGive}</dd>
                </div>
              )}
              {dog.medication.notes && (
                <div>
                  <dt className="text-muted-foreground">備註</dt>
                  <dd className="font-medium">{dog.medication.notes}</dd>
                </div>
              )}
            </dl>
          </InfoSection>
        )}

        {/* Additional Notes */}
        {dog.additionalNotes && (
          <InfoSection title="其他備註" icon={<StickyNote className="w-4 h-4" />}>
            <p className="text-sm">{dog.additionalNotes}</p>
          </InfoSection>
        )}
      </main>
    </div>
  );
}
