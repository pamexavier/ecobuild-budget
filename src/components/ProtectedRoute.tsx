import { Navigate } from 'react-router-dom';
import { useAuth, UserPermissions } from '@/hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredPermission, redirectTo = '/login' }: Props) {
  const { user, permissions, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={redirectTo} replace />;

  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
