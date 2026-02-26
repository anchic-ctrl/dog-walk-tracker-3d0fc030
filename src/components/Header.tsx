import { Dog, LogOut, PawPrint, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
  hideManagementIcons?: boolean;
}

export function Header({ title, showBack, onBack, children, hideManagementIcons }: HeaderProps) {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        {!hideManagementIcons && (
          <div
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer shrink-0 shadow-sm hover:opacity-90 transition-opacity"
            onClick={() => navigate('/')}
            title="回到首頁"
          >
            <Dog className="w-6 h-6 text-primary-foreground" />
          </div>
        )}

        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack || (() => navigate(-1))}
            className="shrink-0 [&_svg]:size-6"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}

        <div className="flex-1 min-w-0 ml-1">
          <h1 className="text-lg sm:text-xl font-bold leading-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          {children}
          {isAdmin && !hideManagementIcons && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/manage')}
                className="text-muted-foreground hover:text-foreground [&_svg]:size-6"
                title="管理狗狗"
              >
                <PawPrint className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/staff')}
                className="text-muted-foreground hover:text-foreground [&_svg]:size-6"
                title="管理員工"
              >
                <Users className="w-6 h-6" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive [&_svg]:size-6"
            title="登出"
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
