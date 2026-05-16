import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';

export default function UnidadeRedirect() {
  const [, setLocation] = useLocation();
  const { filialId } = useParams();

  useEffect(() => {
    // Se há um filialId válido, salva na sessão e redireciona
    if (filialId && filialId !== 'undefined') {
      // Salvar filialId no localStorage temporariamente para compatibilidade
      localStorage.setItem('legacyFilialId', filialId);
    }
    
    // Sempre redireciona para o novo sistema
    setLocation('/portal-unidade');
  }, [filialId, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Redirecionando para o portal da unidade...</p>
      </div>
    </div>
  );
}