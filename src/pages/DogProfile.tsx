import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDogs } from '@/context/DogsContext';
import { StatusBadge } from '@/components/StatusBadge';
import { InfoSection } from '@/components/InfoSection';
import { WarningTag } from '@/components/WarningTag';
import { ActivityRecordItem } from '@/components/ActivityRecordItem';
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
  Home,
  Dog as DogIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDog, startActivity, endActivity } = useDogs();
  const today = format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhTW });
  
  // Get editRecord from URL query params (for auto-edit from home page)
  const editRecordFromUrl = searchParams.get('editRecord');
  const [justEndedRecordId, setJustEndedRecordId] = useState<string | null>(editRecordFromUrl);

  // Clear URL param after reading it (to avoid re-triggering on navigation)
  useEffect(() => {
    if (editRecordFromUrl) {
      setSearchParams({}, { replace: true });
    }
  }, [editRecordFromUrl, setSearchParams]);

  const handleEndWalk = (dogId: string) => {
    // Get the current walk ID BEFORE ending the activity (to avoid closure/timing issues)
    const currentDog = getDog(dogId);
    const currentRecordId = currentDog?.currentWalkId || null;
    endActivity(dogId, 'walk');
    setJustEndedRecordId(currentRecordId);
  };

  const handleEndIndoor = (dogId: string) => {
    const currentDog = getDog(dogId);
    const currentRecordId = currentDog?.currentIndoorId || null;
    endActivity(dogId, 'indoor');
    setJustEndedRecordId(currentRecordId);
  };
  const dog = getDog(id || '');

  if (!dog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">找不到此狗狗</p>
      </div>
    );
  }

  const isWalking = dog.currentWalkId !== null;
  const isIndoor = dog.currentIndoorId !== null;

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
            {today}
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
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <DogIcon className="w-4 h-4" />
                品種：{dog.breed}
              </p>
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

        {/* Activity Status */}
        <div className="flex gap-2">
          {isWalking && (
            <StatusBadge status="active" label="散步中" />
          )}
          {isIndoor && (
            <StatusBadge status="active" label="放風中" />
          )}
        </div>

        {/* Activity Actions */}
        <div className="grid grid-cols-2 gap-2">
          {/* Walk Button */}
          {isWalking ? (
            <Button
              onClick={() => handleEndWalk(dog.id)}
              className="h-14 text-base font-semibold bg-status-walking text-foreground hover:bg-status-walking/90"
            >
              <Square className="w-5 h-5 mr-2" />
              結束散步
            </Button>
          ) : (
            <Button
              onClick={() => startActivity(dog.id, 'walk')}
              className="h-14 text-base font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              開始散步
            </Button>
          )}

          {/* Indoor Button */}
          {isIndoor ? (
            <Button
              onClick={() => handleEndIndoor(dog.id)}
              className="h-14 text-base font-semibold bg-status-walking text-foreground hover:bg-status-walking/90"
            >
              <Square className="w-5 h-5 mr-2" />
              結束放風
            </Button>
          ) : (
            <Button
              onClick={() => startActivity(dog.id, 'indoor')}
              variant="outline"
              className="h-14 text-base font-semibold"
            >
              <Home className="w-5 h-5 mr-2" />
              開始放風
            </Button>
          )}
        </div>

        {/* Walk Records */}
        {dog.walkRecords.length > 0 && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium mb-3">散步記錄</p>
            <div className="space-y-2">
              {dog.walkRecords.map((record, index) => (
                <ActivityRecordItem
                  key={record.id}
                  dogId={dog.id}
                  record={record}
                  type="walk"
                  index={index}
                  isActive={record.id === dog.currentWalkId}
                  autoEdit={record.id === justEndedRecordId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Indoor Records */}
        {dog.indoorRecords.length > 0 && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium mb-3">放風記錄</p>
            <div className="space-y-2">
              {dog.indoorRecords.map((record, index) => (
                <ActivityRecordItem
                  key={record.id}
                  dogId={dog.id}
                  record={record}
                  type="indoor"
                  index={index}
                  isActive={record.id === dog.currentIndoorId}
                  autoEdit={record.id === justEndedRecordId}
                />
              ))}
            </div>
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
              <dt className="text-muted-foreground">餵食時間</dt>
              <dd className="font-medium">{dog.food.feedingTime}</dd>
            </div>
            {dog.food.specialInstructions && (
              <div>
                <dt className="text-muted-foreground">餵食說明</dt>
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
