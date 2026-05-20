import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlunoSchema, type AlunoWithFilial, type Filial } from "@shared/schema";
import { z } from "zod";
import { useUnidadeAuth } from "@/contexts/UnidadeContext";
import { Camera, Upload, X, User, MapPin, Building } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),
  dataMatricula: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  apartamento: z.string().optional(),
  bloco: z.string().optional(),
  nomeResponsavel: z.string().optional(),
  telefoneResponsavel: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
  filialId: z.number(),
  fotoUrl: z.string().optional(),
  // Campos para portal do responsável
  cpfResponsavel: z.string().min(1, "CPF do responsável é obrigatório para acesso ao portal"),
  emailResponsavel: z.string().email("Email inválido").min(1, "Email é obrigatório para acesso ao portal"),
  senhaResponsavel: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface AlunoUnidadeFormProps {
  initialData?: AlunoWithFilial | null;
  onSuccess: () => void;
}

export default function AlunoUnidadeForm({ initialData, onSuccess }: AlunoUnidadeFormProps) {
  const { filialId } = useUnidadeAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.fotoUrl || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      email: initialData?.email || "",
      telefone: initialData?.telefone || "",
      cpf: initialData?.cpf || "",
      rg: initialData?.rg || "",
      dataNascimento: initialData?.dataNascimento ? new Date(initialData.dataNascimento).toISOString().split('T')[0] : "",
      dataMatricula: initialData?.dataMatricula ? new Date(initialData.dataMatricula).toISOString().split('T')[0] : "",
      endereco: initialData?.endereco || "",
      bairro: initialData?.bairro || "",
      cidade: initialData?.cidade || "",
      estado: initialData?.estado || "",
      cep: initialData?.cep || "",
      apartamento: (initialData as any)?.apartamento || "",
      bloco: (initialData as any)?.bloco || "",
      nomeResponsavel: initialData?.nomeResponsavel || "",
      telefoneResponsavel: initialData?.telefoneResponsavel || "",
      observacoes: "",
      ativo: initialData?.ativo ?? true,
      filialId: filialId || 0,
      fotoUrl: initialData?.fotoUrl || "",
      cpfResponsavel: "",
      emailResponsavel: "",
      senhaResponsavel: "",
    },
  });

  const { data: filial } = useQuery<Filial>({
    queryKey: [`/api/filiais/${filialId}`],
    enabled: !!filialId,
  });

  useEffect(() => {
    if (filial && !initialData) {
      form.setValue("endereco", filial.endereco || "");
      form.setValue("bairro", filial.bairro || "");
      form.setValue("cidade", filial.cidade || "São Paulo");
      form.setValue("estado", filial.estado || "SP");
      form.setValue("cep", filial.cep || "");
    }
  }, [filial, initialData, form]);

  const createAlunoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/alunos", data);
      if (!response.ok) {
        throw new Error("Failed to create aluno");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Aluno cadastrado",
        description: "O aluno foi cadastrado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o aluno.",
        variant: "destructive",
      });
    },
  });

  const updateAlunoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PUT", `/api/alunos/${initialData?.id}`, data);
      if (!response.ok) {
        throw new Error("Failed to update aluno");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Aluno atualizado",
        description: "Os dados do aluno foram atualizados com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o aluno.",
        variant: "destructive",
      });
    },
  });

  // Photo upload functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        form.setValue('fotoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoPreview(photoData);
      form.setValue('fotoUrl', photoData);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue('fotoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: FormData) => {
    if (initialData) {
      updateAlunoMutation.mutate(data);
    } else {
      createAlunoMutation.mutate(data);
    }
  };

  const isLoading = createAlunoMutation.isPending || updateAlunoMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Foto do Aluno</h3>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Photo Preview */}
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>

                {/* Camera Feed */}
                {isCapturing && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-64 h-48 bg-black rounded"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        className="flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Capturar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={stopCamera}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload Buttons */}
                {!isCapturing && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Selecionar Arquivo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startCamera}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Tirar Foto
                    </Button>
                    {photoPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={removePhoto}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo do aluno" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000-0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataMatricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Matrícula</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção de Endereço */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span>Endereço do Aluno (Condomínio)</span>
          </h3>

          {filial ? (
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 flex items-start space-x-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-neutral-800">Endereço da Unidade: {filial.nome}</h4>
                <p className="text-xs text-neutral-600 mt-1">
                  {filial.endereco}
                  {filial.bairro ? `, ${filial.bairro}` : ""}
                  {filial.cidade ? ` - ${filial.cidade}` : ""}
                  {filial.estado ? `/${filial.estado}` : ""}
                </p>
                <span className="text-[10px] text-primary font-semibold mt-2.5 inline-block bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                  Preenchido Automaticamente
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl p-4 flex items-center justify-center space-x-2 text-neutral-500 mb-6 text-sm">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>Carregando endereço do condomínio...</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="apartamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartamento / Unidade</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: 102, Bloco C" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bloco / Torre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Torre A" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Campos escondidos de endereço para compatibilidade com o schema e o envio ao backend */}
          <div className="hidden">
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => <Input type="hidden" {...field} value={field.value || ""} />}
            />
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => <Input type="hidden" {...field} value={field.value || ""} />}
            />
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => <Input type="hidden" {...field} value={field.value || ""} />}
            />
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => <Input type="hidden" {...field} value={field.value || ""} />}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => <Input type="hidden" {...field} value={field.value || ""} />}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Responsável</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nomeResponsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefoneResponsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Acesso ao Portal do Responsável</h3>
          <p className="text-sm text-gray-600">
            Estes dados serão utilizados pelo responsável para acessar o portal e acompanhar o desenvolvimento do aluno.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cpfResponsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Responsável *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailResponsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email para Acesso *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="email@exemplo.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senhaResponsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha para Acesso *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais sobre o aluno"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Aluno Ativo</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Aluno pode participar das aulas e atividades
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </form>
    </Form>
  );
}