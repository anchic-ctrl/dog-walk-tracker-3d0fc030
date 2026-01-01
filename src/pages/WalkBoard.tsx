import { useDogs } from '@/context/DogsContext';
import { DogCard } from '@/components/DogCard';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function WalkBoard() {
  const { dogs, currentRound } = useDogs();

  const today = format(new Date(), 'M月d日 EEEE', { locale: zhTW });
  const walkingCount = dogs.filter((d) => d.walkStatuses[currentRound] === 'active').length;
  const indoorCount = dogs.filter((d) => d.indoorStatuses[currentRound] === 'active').length;

  return (
    <div className="min-h-screen bg-background">
      <Header title={`${today} · 第 ${currentRound}/3 輪`} />
      
      <main className="px-4 pb-8">
        {/* Stats */}
        <div className="flex gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-walking animate-pulse-soft" />
            <span className="text-sm font-medium">{walkingCount} 隻散步中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm font-medium">{indoorCount} 隻放風中</span>
          </div>
        </div>

        {/* Dog List */}
        <div className="space-y-3">
          {dogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>

        {dogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>沒有狗狗</p>
          </div>
        )}
      </main>
    </div>
  );
}
