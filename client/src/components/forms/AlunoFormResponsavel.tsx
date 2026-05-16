import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { AlunoWithFilial, InsertAluno, Filial } from "@shared/schema";
import { Camera, ImageIcon, Loader2 } from "lucide-react";

interface AlunoFormResponsavelProps {
  aluno: AlunoWithFilial | null;
  onSuccess: () => void;
  filiais: Filial[];
  responsavelId?: number;
  createMutation: any;
  updateMutation: any;
}

export default function AlunoFormResponsavel({ 
  aluno, 
  onSuccess, 
  filiais, 
  responsavelId,
  createMutation,
  updateMutation 
}: AlunoFormResponsavelProps) {
  const [formData, setFormData] = useState({
    nome: aluno?.nome || '',
    cpf: aluno?.cpf || '',
    email: aluno?.email || '',
    telefone: aluno?.telefone || '',
    endereco: aluno?.endereco || '',
    bairro: aluno?.bairro || '',
    cep: aluno?.cep || '',
    cidade: aluno?.cidade || '',
    estado: aluno?.estado || '',
    dataNascimento: aluno?.dataNascimento || '',
    fotoUrl: aluno?.fotoUrl || '',
    filialId: aluno?.filialId || '',
    responsavelId: responsavelId || aluno?.responsavelId,
    ativo: aluno?.ativo ?? true,
    dataMatricula: aluno?.dataMatricula || new Date().toISOString().split('T')[0]
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Função para buscar CEP
  const handleCEPChange = async (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
            cep: numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
          }));
          toast({
            title: "CEP Encontrado",
            description: "Endereço preenchido automaticamente.",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para iniciar captura de foto
  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera.",
        variant: "destructive",
      });
    }
  };

  // Função para capturar foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      setFormData(prev => ({ ...prev, fotoUrl: dataURL }));
      stopCapture();
      toast({
        title: "Sucesso",
        description: "Foto capturada com sucesso!",
      });
    }
  };

  // Função para parar captura
  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  // Função para processar arquivo de imagem
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, fotoUrl: result }));
        toast({
          title: "Sucesso",
          description: "Imagem anexada com sucesso!",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para abrir seletor de arquivos
  const selectFile = () => {
    fileInputRef.current?.click();
  };

  // Função para remover foto
  const removePhoto = () => {
    setFormData(prev => ({ ...prev, fotoUrl: '' }));
  };

  // Função para submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.filialId) {
      toast({
        title: "Erro",
        description: "Selecione uma unidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (aluno) {
        await updateMutation.mutateAsync({ id: aluno.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar aluno.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo Nome */}
      <div>
        <Label htmlFor="nome">Nome Completo *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Nome completo do aluno"
          required
        />
      </div>

      {/* Campo CPF */}
      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          value={formData.cpf}
          onChange={(e) => {
            const formatted = formatCPF(e.target.value);
            if (formatted.length <= 14) {
              setFormData(prev => ({ ...prev, cpf: formatted }));
            }
          }}
          placeholder="000.000.000-00"
          maxLength={14}
        />
      </div>

      {/* Campos Email e Telefone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email do Aluno</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone do Aluno</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      {/* Campo CEP primeiro para busca automática */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => {
              const val = e.target.value;
              const numbers = val.replace(/\D/g, '');
              let formatted = numbers;
              if (numbers.length > 5) {
                formatted = numbers.slice(0, 5) + '-' + numbers.slice(5, 8);
              }
              setFormData(prev => ({ ...prev, cep: formatted }));
              if (numbers.length === 8) {
                handleCEPChange(numbers);
              }
            }}
            onBlur={(e) => handleCEPChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
        <div>
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
            placeholder="Endereço completo"
          />
        </div>
      </div>

      {/* Campos de Endereço Detalhado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            value={formData.bairro}
            onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
            placeholder="Digite o bairro"
          />
        </div>
        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={formData.cidade}
            onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
            placeholder="Digite a cidade"
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            value={formData.estado}
            onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>

      {/* Campos Data de Nascimento e Unidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Input
            id="dataNascimento"
            type="date"
            value={formData.dataNascimento}
            onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="filialId">Unidade *</Label>
          <Select value={formData.filialId.toString()} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, filialId: parseInt(value) }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {filiais.filter(f => f.ativa !== false).map((filial) => (
                <SelectItem key={filial.id} value={filial.id.toString()}>
                  {filial.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campo Data de Matrícula */}
      <div>
        <Label htmlFor="dataMatricula">Data de Matrícula</Label>
        <Input
          id="dataMatricula"
          type="date"
          value={formData.dataMatricula}
          onChange={(e) => setFormData(prev => ({ ...prev, dataMatricula: e.target.value }))}
        />
      </div>

      {/* Seção de Foto */}
      <div>
        <Label>Foto do Aluno</Label>
        {isCapturing ? (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              className="w-full max-w-md rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button type="button" onClick={capturePhoto}>
                Capturar Foto
              </Button>
              <Button type="button" variant="outline" onClick={stopCapture}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={selectFile}
                className="flex items-center justify-center space-x-2 flex-1 h-12"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Anexar Imagem</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={startCapture}
                className="flex items-center justify-center space-x-2 flex-1 h-12"
              >
                <Camera className="w-5 h-5" />
                <span>Tirar Foto</span>
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Preview da foto */}
        {formData.fotoUrl && (
          <div className="flex items-center space-x-3 p-3 border rounded-lg mt-3">
            <img 
              src={formData.fotoUrl} 
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Foto do aluno</p>
              <p className="text-xs text-gray-500">
                {formData.fotoUrl.includes('canvas') || formData.fotoUrl.includes('video')
                  ? 'Foto capturada pela câmera'
                  : 'Imagem anexada do dispositivo'
                }
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removePhoto}
            >
              Remover
            </Button>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {aluno ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}