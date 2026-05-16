import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Upload } from "lucide-react";

interface ConfigData {
  id?: number;
  nomeEscola?: string;
  corPrimaria?: string;
  logoUrl?: string | null;
}

export default function ConfiguracoesSimples() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [nomeEscola, setNomeEscola] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [corPrimaria, setCorPrimaria] = useState("#3b82f6");

  const { data: config, isLoading } = useQuery<ConfigData>({
    queryKey: ["/api/configuracoes"],
  });

  useEffect(() => {
    if (config) {
      setNomeEscola(config.nomeEscola || "");
      setCorPrimaria(config.corPrimaria || "#3b82f6");
      if (config.logoUrl) {
        setLogoPreview(config.logoUrl);
      }
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuracoes"] });
      toast({
        title: "Salvo!",
        description: "Configurações atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar.",
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O logo deve ter no máximo 2MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      nomeEscola,
      corPrimaria,
      logoUrl: logoPreview,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo da Escola</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-[100px] h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG (max 2MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nome */}
        <Card>
          <CardHeader>
            <CardTitle>Nome da Escola</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={nomeEscola}
              onChange={(e) => setNomeEscola(e.target.value)}
              placeholder="Nome da Escola"
            />
          </CardContent>
        </Card>

        {/* Cor */}
        <Card>
          <CardHeader>
            <CardTitle>Cor Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <Input
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="w-32 font-mono"
                maxLength={7}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="w-full"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
