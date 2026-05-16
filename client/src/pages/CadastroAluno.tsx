import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AlunoForm from "@/components/forms/AlunoForm";
import { useLocation } from "wouter";

export default function CadastroAluno() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation("/alunos");
  };

  const handleBack = () => {
    setLocation("/alunos");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cadastro de Aluno</h1>
              <p className="text-gray-600 mt-1">Cadastre um novo aluno e responsável</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="text-xl">Informações do Aluno e Responsável</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <AlunoForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}