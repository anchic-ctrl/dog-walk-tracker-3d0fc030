import { useParams, useNavigate } from 'react-router-dom';
import { useDogs } from '@/context/DogsContext';
import { StatusBadge } from '@/components/StatusBadge';
import { InfoSection } from '@/components/InfoSection';
import { WarningTag } from '@/components/WarningTag';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Dog, 
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

export default function DogProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDog, startWalk, endWalk, resetWalk } = useDogs();

  const dog = getDog(id || '');

  if (!dog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Dog not found</p>
      </div>
    );
  }

  const sizeLabel = {
    S: 'Small',
    M: 'Medium',
    L: 'Large',
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
          <h1 className="text-xl font-bold">Dog Profile</h1>
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
              <StatusBadge status={dog.walkStatus} />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Room {dog.roomNumber} · {dog.floor}
              </p>
              <p className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Size: {sizeLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Walk Actions */}
        <div className="flex gap-2">
          {dog.walkStatus === 'idle' && (
            <Button
              onClick={() => startWalk(dog.id)}
              className="flex-1 h-14 text-base font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Walk
            </Button>
          )}
          {dog.walkStatus === 'walking' && (
            <Button
              onClick={() => endWalk(dog.id)}
              className="flex-1 h-14 text-base font-semibold bg-status-walking text-foreground hover:bg-status-walking/90"
            >
              <Square className="w-5 h-5 mr-2" />
              End Walk
            </Button>
          )}
          {dog.walkStatus === 'finished' && (
            <Button
              onClick={() => resetWalk(dog.id)}
              variant="outline"
              className="flex-1 h-14 text-base font-semibold"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset Walk
            </Button>
          )}
        </div>

        {/* Walk Times */}
        {(dog.currentWalk.startTime || dog.currentWalk.endTime) && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            {dog.currentWalk.startTime && (
              <p className="text-sm">
                <span className="text-muted-foreground">Started: </span>
                <span className="font-medium">
                  {format(dog.currentWalk.startTime, 'h:mm a')}
                </span>
              </p>
            )}
            {dog.currentWalk.endTime && (
              <p className="text-sm">
                <span className="text-muted-foreground">Ended: </span>
                <span className="font-medium">
                  {format(dog.currentWalk.endTime, 'h:mm a')}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Walking Notes */}
        <InfoSection
          title="Walking Precautions"
          icon={<Footprints className="w-4 h-4" />}
          variant={
            dog.walkingNotes.needsMuzzle || dog.walkingNotes.mustWalkAlone
              ? 'warning'
              : 'default'
          }
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <WarningTag label="Pulls on leash" active={dog.walkingNotes.pullsOnLeash} />
            <WarningTag label="Reactive to dogs" active={dog.walkingNotes.reactiveToOtherDogs} />
            <WarningTag label="Needs muzzle" active={dog.walkingNotes.needsMuzzle} />
            <WarningTag label="Walk alone" active={dog.walkingNotes.mustWalkAlone} />
          </div>
          {dog.walkingNotes.notes && (
            <p className="text-sm text-foreground bg-background/50 rounded-lg p-3">
              {dog.walkingNotes.notes}
            </p>
          )}
        </InfoSection>

        {/* Food */}
        <InfoSection title="Food" icon={<UtensilsCrossed className="w-4 h-4" />}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Food Type</dt>
              <dd className="font-medium">{dog.food.foodType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Feeding Time</dt>
              <dd className="font-medium">{dog.food.feedingTime}</dd>
            </div>
            {dog.food.specialInstructions && (
              <div>
                <dt className="text-muted-foreground">Special Instructions</dt>
                <dd className="font-medium">{dog.food.specialInstructions}</dd>
              </div>
            )}
            {dog.food.forbiddenFood && dog.food.forbiddenFood !== 'None' && (
              <div className="bg-danger-bg rounded-lg p-3 border border-danger/30">
                <dt className="text-danger font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Forbidden Food
                </dt>
                <dd className="font-medium mt-1">{dog.food.forbiddenFood}</dd>
              </div>
            )}
          </dl>
        </InfoSection>

        {/* Medication */}
        {dog.medication.medicationName && dog.medication.medicationName !== 'None' && (
          <InfoSection title="Medication" icon={<Pill className="w-4 h-4" />}>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Medication</dt>
                <dd className="font-medium">{dog.medication.medicationName}</dd>
              </div>
              {dog.medication.frequency && (
                <div>
                  <dt className="text-muted-foreground">Frequency</dt>
                  <dd className="font-medium">{dog.medication.frequency}</dd>
                </div>
              )}
              {dog.medication.howToGive && (
                <div>
                  <dt className="text-muted-foreground">How to Give</dt>
                  <dd className="font-medium">{dog.medication.howToGive}</dd>
                </div>
              )}
              {dog.medication.notes && (
                <div>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium">{dog.medication.notes}</dd>
                </div>
              )}
            </dl>
          </InfoSection>
        )}

        {/* Additional Notes */}
        {dog.additionalNotes && (
          <InfoSection title="Additional Notes" icon={<StickyNote className="w-4 h-4" />}>
            <p className="text-sm">{dog.additionalNotes}</p>
          </InfoSection>
        )}
      </main>
    </div>
  );
}
