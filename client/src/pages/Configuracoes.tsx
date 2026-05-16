import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Palette, Image, Save, RotateCcw } from "lucide-react";

interface ConfiguracoesSistema {
  id: number;
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  corAcento: string;
  corFundo: string;
  corTexto: string;
  nomeEscola: string;
}

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<ConfiguracoesSistema>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery<ConfiguracoesSistema>({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/configuracoes");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ConfiguracoesSistema>) => {
      const res = await apiRequest("PUT", "/api/configuracoes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      toast({
        title: "Configurações salvas",
        description: "As alterações foram aplicadas com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    },
  });

  const handleColorChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Garantir que o logo seja incluído se houver preview
    const dataToSave = { ...formData };
    if (logoPreview && !dataToSave.logoUrl) {
      dataToSave.logoUrl = logoPreview;
    }
    console.log("Salvando configurações:", dataToSave);
    updateMutation.mutate(dataToSave);
  };

  const handleReset = () => {
    setFormData({});
    setLogoPreview(null);
  };

  const getColor = (field: keyof ConfiguracoesSistema) => {
    return (formData[field] as string) || (config?.[field] as string) || "#3b82f6";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
          <p className="text-gray-600">Personalize o logo e as cores do sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo da Escola
            </CardTitle>
            <CardDescription>
              Faça upload do logo da sua escola de futebol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                {(logoPreview || config?.logoUrl) ? (
                  <img 
                    src={logoPreview || config?.logoUrl || ""} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Image className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <p className="text-sm text-gray-600">Clique para selecionar uma imagem</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG (max. 2MB)</p>
                  </div>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nome da Escola */}
        <Card>
          <CardHeader>
            <CardTitle>Nome da Escola</CardTitle>
            <CardDescription>
              Nome que aparecerá no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.nomeEscola ?? config?.nomeEscola ?? ""}
              onChange={(e) => setFormData(prev => ({ ...prev, nomeEscola: e.target.value }))}
              placeholder="Nome da Escola de Futebol"
            />
          </CardContent>
        </Card>

        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores do Sistema
            </CardTitle>
            <CardDescription>
              Personalize as cores para combinar com a identidade visual da sua escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cor Primária */}
              <div className="space-y-2">
                <Label htmlFor="corPrimaria">Cor Primária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="corPrimaria"
                    value={getColor("corPrimaria")}
                    onChange={(e) => handleColorChange("corPrimaria", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <Input
                    value={getColor("corPrimaria")}
                    onChange={(e) => handleColorChange("corPrimaria", e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-gray-500">Botões, links e destaques</p>
              </div>

              {/* Cor Secundária */}
              <div className="space-y-2">
                <Label htmlFor="corSecundaria">Cor Secundária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="corSecundaria"
                    value={getColor("corSecundaria")}
                    onChange={(e) => handleColorChange("corSecundaria", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <Input
                    value={getColor("corSecundaria")}
                    onChange={(e) => handleColorChange("corSecundaria", e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-gray-500">Cabeçalhos e menus</p>
              </div>

              {/* Cor de Acento */}
              <div className="space-y-2">
                <Label htmlFor="corAcento">Cor de Acento</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="corAcento"
                    value={getColor("corAcento")}
                    onChange={(e) => handleColorChange("corAcento", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <Input
                    value={getColor("corAcento")}
                    onChange={(e) => handleColorChange("corAcento", e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-gray-500">Sucesso e confirmações</p>
              </div>

              {/* Cor de Fundo */}
              <div className="space-y-2">
                <Label htmlFor="corFundo">Cor de Fundo</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="corFundo"
                    value={getColor("corFundo")}
                    onChange={(e) => handleColorChange("corFundo", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <Input
                    value={getColor("corFundo")}
                    onChange={(e) => handleColorChange("corFundo", e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-gray-500">Fundo geral do sistema</p>
              </div>

              {/* Cor do Texto */}
              <div className="space-y-2">
                <Label htmlFor="corTexto">Cor do Texto</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="corTexto"
                    value={getColor("corTexto")}
                    onChange={(e) => handleColorChange("corTexto", e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                  <Input
                    value={getColor("corTexto")}
                    onChange={(e) => handleColorChange("corTexto", e.target.value)}
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-gray-500">Texto principal</p>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Pré-visualização</h3>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: getColor("corFundo") }}
              >
                <div 
                  className="p-3 rounded-lg mb-3"
                  style={{ backgroundColor: getColor("corSecundaria") }}
                >
                  <span className="text-white font-medium">Cabeçalho</span>
                </div>
                <p style={{ color: getColor("corTexto") }}>
                  Este é um exemplo de texto com a cor configurada.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: getColor("corPrimaria") }}
                  >
                    Botão Primário
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: getColor("corAcento") }}
                  >
                    Sucesso
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
