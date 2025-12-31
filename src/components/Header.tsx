import { Dog } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Dog className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    </header>
  );
}
