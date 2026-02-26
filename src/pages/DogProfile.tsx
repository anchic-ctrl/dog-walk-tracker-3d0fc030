import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDogs } from '@/context/DogsContext';
import { StatusBadge } from '@/components/StatusBadge';
import { InfoSection } from '@/components/InfoSection';
import { WarningTag } from '@/components/WarningTag';
import { ActivityRecordItem } from '@/components/ActivityRecordItem';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import DogFormDialog from '@/components/DogFormDialog';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
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
  Dog as DogIcon,
  Edit2,
  CalendarDays
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { IndoorSpace } from '@/types/dog';

export default function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDog, startActivity, endActivity, refreshDogs } = useDogs();
  const today = format(new Date(), 'yyyy年M月d日 (EEEEE)', { locale: zhTW });

  const { isAdmin } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dbDog, setDbDog] = useState<Tables<'dogs'> | null>(null);

  // Get editRecord from URL query params (for auto-edit from home page)
  const editRecordFromUrl = searchParams.get('editRecord');
  const [justEndedRecordId, setJustEndedRecordId] = useState<string | null>(editRecordFromUrl);

  // Clear URL param after reading it (to avoid re-triggering on navigation)
  useEffect(() => {
    if (editRecordFromUrl) {
      setSearchParams({}, { replace: true });
    }
  }, [editRecordFromUrl, setSearchParams]);

  const handleEndWalk = async (dogId: string) => {
    const endedId = await endActivity(dogId, 'walk');
    setJustEndedRecordId(endedId);
  };

  const handleEndIndoor = async (dogId: string) => {
    const endedId = await endActivity(dogId, 'indoor');
    setJustEndedRecordId(endedId);
  };

  const handleEditClick = async () => {
    try {
      const { data, error } = await supabase.from('dogs').select('*').eq('id', id).single();
      if (error) throw error;
      setDbDog(data);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch dog for editing', error);
    }
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
      <Header title="狗狗資料" showBack onBack={() => navigate('/')}>
        <span className="text-sm font-medium text-muted-foreground mr-2">
          {today}
        </span>
      </Header>

      <main className="px-4 space-y-4 mt-4">
        {/* Basic Info */}
        <div className="flex gap-4 items-start">
          <img
            src={dog.photo}
            alt={dog.name}
            className="w-24 h-24 rounded-2xl object-cover shadow-lg"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{dog.name}</h2>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditClick}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <DogIcon className="w-4 h-4" />
                品種：{dog.breed}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {dog.roomColor}{dog.roomNumber}
              </p>
              <p className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                體型：{sizeLabel}
              </p>
              {(dog.checkInDate || dog.checkOutDate) && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  入住：{dog.checkInDate || '?'} ~ {dog.checkOutDate || '?'}
                </p>
              )}
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
              variant="warning"
              className="h-14 text-base font-semibold"
            >
              <Square className="w-5 h-5 mr-2" />
              結束散步
            </Button>
          ) : (
            <Button
              onClick={() => startActivity(dog.id, 'walk')}
              className="h-14 text-base font-semibold"
              disabled={isIndoor}
            >
              <Play className="w-5 h-5 mr-2" />
              開始散步
            </Button>
          )}

          {/* Indoor Button */}
          {isIndoor ? (
            <Button
              onClick={() => handleEndIndoor(dog.id)}
              variant="warning"
              className="h-14 text-base font-semibold"
            >
              <Square className="w-5 h-5 mr-2" />
              結束放風
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 text-base font-semibold hover:bg-warning/10 hover:border-warning hover:text-warning"
                  disabled={isWalking}
                >
                  <Home className="w-5 h-5 mr-2" />
                  開始室內放風
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[200px]">
                <DropdownMenuLabel className="text-center">選擇放風空間</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['1樓客廳', '2樓大房間', '2樓小房間'] as IndoorSpace[]).map((space) => (
                  <DropdownMenuItem key={space} className="justify-center" onClick={() => startActivity(dog.id, 'indoor', space)}>
                    {space}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
            dog.walkingNotes.singleLeash
              ? 'warning'
              : 'default'
          }
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <WarningTag label="會拉扯牽繩" active={dog.walkingNotes.pullsOnLeash} />
            <WarningTag label="對其他狗有反應" active={dog.walkingNotes.reactiveToOtherDogs} />
            <WarningTag label="單牽" active={dog.walkingNotes.singleLeash} />
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
            {dog.food.description && (
              <div>
                <dt className="text-muted-foreground">吃飯方式</dt>
                <dd className="font-medium">{dog.food.description}</dd>
              </div>
            )}
            <div className="flex gap-4">
              {dog.food.foodSource && (
                <div>
                  <dt className="text-muted-foreground">飼料來源</dt>
                  <dd className="font-medium">{dog.food.foodSource}</dd>
                </div>
              )}
              {dog.food.remainingCount && (
                <div>
                  <dt className="text-muted-foreground">剩餘數量</dt>
                  <dd className="font-medium">{dog.food.remainingCount}</dd>
                </div>
              )}
            </div>
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

        {/* Supplements */}
        {dog.supplements && dog.supplements.length > 0 && (
          <InfoSection title="保健品" icon={<Pill className="w-4 h-4" />}>
            <div className="space-y-3">
              {dog.supplements.map((item, idx) => (
                <div key={idx} className="bg-background/50 rounded-lg p-3 text-sm space-y-1">
                  <span className="font-semibold">{item.name}</span>
                  <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    {item.dosage && <span>{item.dosage}</span>}
                    {item.frequency && <span>· {item.frequency}</span>}
                    {item.method && <span>· {item.method}</span>}
                  </div>
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Medications */}
        {dog.medications && dog.medications.length > 0 && (
          <InfoSection title="藥物" icon={<Pill className="w-4 h-4" />}>
            <div className="space-y-3">
              {dog.medications.map((item, idx) => (
                <div key={idx} className="bg-background/50 rounded-lg p-3 text-sm space-y-1">
                  <span className="font-semibold">{item.name}</span>
                  <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    {item.dosage && <span>{item.dosage}</span>}
                    {item.frequency && <span>· {item.frequency}</span>}
                    {item.method && <span>· {item.method}</span>}
                  </div>
                  {item.condition && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ {item.condition}</p>
                  )}
                  {item.remainingCount && (
                    <p className="text-xs text-muted-foreground">剩餘：{item.remainingCount}</p>
                  )}
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Additional Notes */}
        {dog.additionalNotes && (
          <InfoSection title="其他備註" icon={<StickyNote className="w-4 h-4" />}>
            <p className="text-sm">{dog.additionalNotes}</p>
          </InfoSection>
        )}
      </main>

      {
        isAdmin && (
          <DogFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            dog={dbDog}
            onSuccess={() => {
              refreshDogs();
            }}
          />
        )
      }
    </div >
  );
}
