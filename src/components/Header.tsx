import { Dog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title }: HeaderProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Dog className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold flex-1">{title}</h1>
        {isAdmin && (
          <Button
            variant="ghost"
            onClick={() => navigate('/manage')}
            className="text-muted-foreground hover:text-foreground font-medium"
          >
            管理狗狗資料
          </Button>
        )}
      </div>
    </header>
  );
}
