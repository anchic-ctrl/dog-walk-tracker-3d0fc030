import { Dog, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title }: HeaderProps) {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Dog className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold flex-1">{title}</h1>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/manage')}
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                管理狗狗
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/staff')}
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                管理員工
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive"
            title="登出"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
