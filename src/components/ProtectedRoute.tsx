import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBoss?: boolean;
}

export function ProtectedRoute({ children, requireBoss = false }: ProtectedRouteProps) {
  const { user, loading, isBoss } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireBoss && !isBoss) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">權限不足</h1>
          <p className="text-muted-foreground">此頁面僅限老闆權限存取</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
