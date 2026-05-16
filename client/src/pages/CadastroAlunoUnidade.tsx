import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, Building2 } from "lucide-react";
import { useUnidadeAuth } from "@/contexts/UnidadeContext";
import AlunoUnidadeForm from "@/components/unidade/forms/AlunoUnidadeForm";

export default function CadastroAlunoUnidade() {
  const [, setLocation] = useLocation();
  const { nomeFilial, isAuthenticated } = useUnidadeAuth();
  const [editingAlunoId, setEditingAlunoId] = useState<number | null>(null);

  // Get edit ID from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      setEditingAlunoId(parseInt(editId));
    }
  }, []);

  // Fetch student data if editing
  const { data: alunoData, isLoading: isLoadingAluno } = useQuery({
    queryKey: ["/api/alunos", editingAlunoId],
    enabled: !!editingAlunoId,
  });

  const handleSuccess = () => {
    setLocation('/unidade/sistema?tab=alunos');
  };

  const handleGoBack = () => {
    setLocation('/unidade/sistema?tab=alunos');
  };

  if (!isAuthenticated || (editingAlunoId && isLoadingAluno)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Cadastro de Aluno
                </h1>
                <p className="text-sm text-gray-600">
                  {nomeFilial || 'Sistema da Unidade'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="pb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  {editingAlunoId ? "Editar Aluno" : "Novo Aluno"}
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  {editingAlunoId ? "Edite os dados do aluno" : "Preencha os dados completos do aluno para realizar o cadastro"}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-8">
            <AlunoUnidadeForm 
              initialData={alunoData as any}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}