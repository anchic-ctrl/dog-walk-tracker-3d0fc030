import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// Development preview mode - allows viewing UI without auth in preview/dev
const isDevPreview = () => {
  const devParam = new URLSearchParams(window.location.search).get('dev');
  const hasDevParam = devParam === 'true' || devParam === '1';

  // Only allow bypass in dev/preview builds (prevents exposing this in production)
  const isDevBuild = import.meta.env.DEV;

  return isDevBuild && hasDevParam;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isActiveMember } = useAuth();
  const location = useLocation();

  // Dev preview bypass - simulates logged-in admin for UI development
  if (isDevPreview()) {
    return <>{children}</>;
  }

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

  if (!isActiveMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">尚未啟用</h1>
          <p className="text-muted-foreground">您的帳號尚未被邀請或已停用</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">權限不足</h1>
          <p className="text-muted-foreground">此頁面僅限管理員權限存取</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
