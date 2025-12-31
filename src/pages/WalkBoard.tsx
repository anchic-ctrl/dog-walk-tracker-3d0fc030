import { useState } from 'react';
import { useDogs } from '@/context/DogsContext';
import { DogCard } from '@/components/DogCard';
import { FloorFilter } from '@/components/FloorFilter';
import { Header } from '@/components/Header';
import { RoomColor } from '@/types/dog';

export default function WalkBoard() {
  const { dogs, currentRound } = useDogs();
  const [colorFilter, setColorFilter] = useState<'all' | RoomColor>('all');

  const filteredDogs = dogs.filter(
    (dog) => colorFilter === 'all' || dog.roomColor === colorFilter
  );

  const walkingCount = dogs.filter((d) => d.roundStatuses[currentRound] === 'walking').length;
  const finishedCount = dogs.filter((d) => d.roundStatuses[currentRound] === 'finished').length;

  return (
    <div className="min-h-screen bg-background">
      <Header title={`狗狗散步板 · 第 ${currentRound}/3 輪`} />
      
      <main className="px-4 pb-8">
        {/* Stats */}
        <div className="flex gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-walking animate-pulse-soft" />
            <span className="text-sm font-medium">{walkingCount} 隻散步中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-finished" />
            <span className="text-sm font-medium">{finishedCount} 隻已完成</span>
          </div>
        </div>

        {/* Color Filter */}
        <div className="mb-4">
          <FloorFilter selected={colorFilter} onChange={setColorFilter} />
        </div>

        {/* Dog List */}
        <div className="space-y-3">
          {filteredDogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>

        {filteredDogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>沒有狗狗</p>
          </div>
        )}
      </main>
    </div>
  );
}
