import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUnidadeAuth } from '@/contexts/UnidadeContext';

interface UnidadeProtectedRouteProps {
  children: React.ReactNode;
}

export default function UnidadeProtectedRoute({ children }: UnidadeProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useUnidadeAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/portal-unidade');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}