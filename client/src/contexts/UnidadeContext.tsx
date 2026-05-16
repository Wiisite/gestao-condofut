import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface UnidadeContextType {
  isAuthenticated: boolean;
  gestorId: number | null;
  filialId: number | null;
  nomeGestor: string | null;
  nomeFilial: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
}

const UnidadeContext = createContext<UnidadeContextType | undefined>(undefined);

export function UnidadeProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gestorId, setGestorId] = useState<number | null>(null);
  const [filialId, setFilialId] = useState<number | null>(null);
  const [nomeGestor, setNomeGestor] = useState<string | null>(null);
  const [nomeFilial, setNomeFilial] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiRequest('GET', '/api/unidade/me');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setGestorId(data.gestor.id);
        setFilialId(data.gestor.filialId);
        setNomeGestor(data.gestor.nome);
        setNomeFilial(data.filial.nome);
      } else {
        setIsAuthenticated(false);
        clearSession();
      }
    } catch (error) {
      setIsAuthenticated(false);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/unidade/login', { email, senha });
      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(true);
        setGestorId(data.gestor.id);
        setFilialId(data.gestor.filialId);
        setNomeGestor(data.gestor.nome);
        setNomeFilial(data.filial.nome);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/unidade/logout');
    } catch (error) {
      // Continue with logout even if request fails
    }
    
    clearSession();
    setLocation('/portal-unidade');
  };

  const clearSession = () => {
    setIsAuthenticated(false);
    setGestorId(null);
    setFilialId(null);
    setNomeGestor(null);
    setNomeFilial(null);
  };

  return (
    <UnidadeContext.Provider value={{
      isAuthenticated,
      gestorId,
      filialId,
      nomeGestor,
      nomeFilial,
      isLoading,
      login,
      logout
    }}>
      {children}
    </UnidadeContext.Provider>
  );
}

export function useUnidadeAuth() {
  const context = useContext(UnidadeContext);
  if (context === undefined) {
    throw new Error('useUnidadeAuth must be used within a UnidadeProvider');
  }
  return context;
}