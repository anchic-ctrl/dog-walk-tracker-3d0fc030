import { useState } from 'react';
import { useDogs } from '@/context/DogsContext';
import { DogCard } from '@/components/DogCard';
import { FloorFilter } from '@/components/FloorFilter';
import { RoundSelector } from '@/components/RoundSelector';
import { Header } from '@/components/Header';

export default function WalkBoard() {
  const { dogs, currentRound, setCurrentRound } = useDogs();
  const [floorFilter, setFloorFilter] = useState<'all' | '1F' | '2F'>('all');

  const filteredDogs = dogs.filter(
    (dog) => floorFilter === 'all' || dog.floor === floorFilter
  );

  const walkingCount = dogs.filter((d) => d.roundStatuses[currentRound] === 'walking').length;
  const finishedCount = dogs.filter((d) => d.roundStatuses[currentRound] === 'finished').length;

  return (
    <div className="min-h-screen bg-background">
      <Header title="狗狗散步板" />
      
      <main className="px-4 pb-8">
        {/* Round Selector */}
        <div className="py-4">
          <RoundSelector currentRound={currentRound} onChange={setCurrentRound} />
        </div>

        {/* Stats */}
        <div className="flex gap-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-walking animate-pulse-soft" />
            <span className="text-sm font-medium">{walkingCount} 隻散步中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-finished" />
            <span className="text-sm font-medium">{finishedCount} 隻已完成</span>
          </div>
        </div>

        {/* Floor Filter */}
        <div className="mb-4">
          <FloorFilter selected={floorFilter} onChange={setFloorFilter} />
        </div>

        {/* Dog List */}
        <div className="space-y-3">
          {filteredDogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>

        {filteredDogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>此樓層沒有狗狗</p>
          </div>
        )}
      </main>
    </div>
  );
}
