import { useState } from 'react';
import { useDogs } from '@/context/DogsContext';
import { DogCard } from '@/components/DogCard';
import { FloorFilter } from '@/components/FloorFilter';
import { Header } from '@/components/Header';

export default function WalkBoard() {
  const { dogs } = useDogs();
  const [floorFilter, setFloorFilter] = useState<'all' | '1F' | '2F'>('all');

  const filteredDogs = dogs.filter(
    (dog) => floorFilter === 'all' || dog.floor === floorFilter
  );

  const walkingCount = dogs.filter((d) => d.walkStatus === 'walking').length;
  const finishedCount = dogs.filter((d) => d.walkStatus === 'finished').length;

  return (
    <div className="min-h-screen bg-background">
      <Header title="Dog Walk Board" />
      
      <main className="px-4 pb-8">
        {/* Stats */}
        <div className="flex gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-walking animate-pulse-soft" />
            <span className="text-sm font-medium">{walkingCount} walking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-status-finished" />
            <span className="text-sm font-medium">{finishedCount} done</span>
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
            <p>No dogs on this floor</p>
          </div>
        )}
      </main>
    </div>
  );
}
