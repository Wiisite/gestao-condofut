import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlunoSchema, type Aluno, type InsertAluno, type Filial } from "@shared/schema";
import { z } from "zod";
import { Camera, Download, Upload, ImageIcon, User } from "lucide-react";
import { useRef, useState } from "react";

// Schema base para edição (sem validação de responsável)
const editFormSchema = insertAlunoSchema.extend({
  dataNascimento: z.string().optional(),
  dataMatricula: z.string().optional(),
  filialId: z.number().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  status: z.string().default("ativo"),
  fotoUrl: z.string().optional(),
  responsavelNome: z.string().optional(),
  responsavelEmail: z.string().optional(),
  responsavelTelefone: z.string().optional(),
  responsavelCpf: z.string().optional(),
  responsavelSenha: z.string().optional(),
});

// Schema para novo cadastro (com validação de responsável)
const createFormSchema = insertAlunoSchema.extend({
  dataNascimento: z.string().optional(),
  dataMatricula: z.string().optional(),
  filialId: z.number().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  status: z.string().default("ativo"),
  fotoUrl: z.string().optional(),
  responsavelNome: z.string().min(1, "Nome do responsável é obrigatório"),
  responsavelEmail: z.string().email("Email inválido"),
  responsavelTelefone: z.string().min(1, "Telefone do responsável é obrigatório"),
  responsavelCpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
  responsavelSenha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type EditFormData = z.infer<typeof editFormSchema>;
type CreateFormData = z.infer<typeof createFormSchema>;
type FormData = EditFormData | CreateFormData;

interface AlunoFormProps {
  aluno?: Aluno | null;
  onSuccess: () => void;
}

export default function AlunoForm({ aluno, onSuccess }: AlunoFormProps) {
  const isEditing = !!aluno;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Query para buscar filiais
  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const form = useForm<EditFormData>({
    resolver: zodResolver(isEditing ? editFormSchema : createFormSchema),
    defaultValues: {
      nome: aluno?.nome || "",
      cpf: aluno?.cpf || "",
      rg: aluno?.rg || "",
      email: aluno?.email || "",
      telefone: aluno?.telefone || "",
      dataNascimento: aluno?.dataNascimento || "",
      dataMatricula: aluno?.dataMatricula || "",
      fotoUrl: aluno?.fotoUrl || "",
      endereco: aluno?.endereco || "",
      bairro: aluno?.bairro || "",
      cep: aluno?.cep || "",
      cidade: aluno?.cidade || "",
      estado: aluno?.estado || "",
      filialId: aluno?.filialId || undefined,
      nomeResponsavel: aluno?.nomeResponsavel || "",
      telefoneResponsavel: aluno?.telefoneResponsavel || "",
      ativo: aluno?.ativo ?? true,
      status: "ativo",
      responsavelNome: aluno?.nomeResponsavel || "",
      responsavelEmail: "",
      responsavelTelefone: aluno?.telefoneResponsavel || "",
      responsavelCpf: "",
      responsavelSenha: "",
    },
  });

  // Funções para captura de foto
  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        form.setValue('fotoUrl', dataURL);
        stopCapture();
      }
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const selectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          form.setValue('fotoUrl', e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCEPChange = async (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();
        if (!data.erro) {
          form.setValue('endereco', data.logradouro);
          form.setValue('bairro', data.bairro);
          form.setValue('cidade', data.localidade);
          form.setValue('estado', data.uf);
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

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const alunoData: InsertAluno = {
        nome: data.nome,
        cpf: data.cpf || null,
        rg: data.rg || null,
        email: data.email || null,
        telefone: data.telefone || null,
        dataNascimento: data.dataNascimento || null,
        dataMatricula: data.dataMatricula || null,
        fotoUrl: data.fotoUrl || null,
        endereco: data.endereco || null,
        bairro: data.bairro || null,
        cep: data.cep || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        filialId: data.filialId || null,
        ativo: true,
      };

      const responsavelData = {
        nome: data.responsavelNome!,
        email: data.responsavelEmail!,
        telefone: data.responsavelTelefone!,
        cpf: data.responsavelCpf!,
        endereco: data.endereco || "",
        senha: data.responsavelSenha!,
      };

      const response = await apiRequest("POST", "/api/alunos/completo", {
        aluno: alunoData,
        responsavel: responsavelData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Aluno e responsável cadastrados com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar aluno e responsável. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAluno>) => {
      const response = await apiRequest("PUT", `/api/alunos/${aluno!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar aluno. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    if (isEditing) {
      try {
        // 1. Atualizar dados básicos do aluno
        const submitData: Partial<InsertAluno> = {
          nome: data.nome,
          cpf: data.cpf || null,
          rg: data.rg || null,
          email: data.email || null,
          telefone: data.telefone || null,
          dataNascimento: data.dataNascimento || null,
          dataMatricula: data.dataMatricula || null,
          fotoUrl: data.fotoUrl || null,
          endereco: data.endereco || null,
          bairro: data.bairro || null,
          cep: data.cep || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          filialId: data.filialId || null,
          nomeResponsavel: data.responsavelNome || data.nomeResponsavel || null,
          telefoneResponsavel: data.responsavelTelefone || data.telefoneResponsavel || null,
          ativo: data.ativo ?? true,
        };
        
        await updateMutation.mutateAsync(submitData);

        // 2. Se não tinha portal e os dados foram preenchidos, criar portal
        if (!aluno.responsavelId && data.responsavelEmail && data.responsavelSenha) {
          const responsavelData = {
            nome: data.responsavelNome,
            email: data.responsavelEmail,
            telefone: data.responsavelTelefone,
            cpf: data.responsavelCpf,
            endereco: data.endereco || "",
            senha: data.responsavelSenha,
          };
          
          await apiRequest("POST", `/api/alunos/${aluno.id}/portal`, responsavelData);
          toast({
            title: "Portal Criado",
            description: "O portal do responsável foi ativado com sucesso.",
          });
        }
      } catch (error) {
        console.error("Erro ao atualizar:", error);
      }
    } else {
      // Se for novo cadastro, usar a nova lógica unificada
      createMutation.mutate(data as any);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo" {...field} />
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
                <FormLabel>CPF do Aluno</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="999.999.999-99" 
                    maxLength={14}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, '');
                      let formatted = numbers;
                      if (numbers.length > 3) {
                        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3);
                      }
                      if (numbers.length > 6) {
                        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6);
                      }
                      if (numbers.length > 9) {
                        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6, 9) + '-' + numbers.slice(9, 11);
                      }
                      field.onChange(formatted);
                    }}
                  />
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
                <FormLabel>RG do Aluno</FormLabel>
                <FormControl>
                  <Input placeholder="12.345.678-9" {...field} value={field.value || ""} />
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
                <FormLabel>Data de Matrícula</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filiais?.filter(f => f.ativa !== false).map((filial) => (
                      <SelectItem key={filial.id} value={filial.id.toString()}>
                        {filial.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail do Aluno</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ""} />
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
                <FormLabel>Telefone do Aluno</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Foto do Aluno */}
        <FormField
          control={form.control}
          name="fotoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto do Aluno</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {isCapturing ? (
                    <div className="space-y-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md mx-auto rounded-lg border"
                      />
                      <div className="flex justify-center space-x-2">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="flex items-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capturar Foto</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={stopCapture}
                        >
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

                  {field.value && (
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <img 
                        src={field.value} 
                        alt="Preview da foto"
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Foto do aluno</p>
                        <p className="text-xs text-gray-500">
                          {field.value.includes('canvas') || field.value.includes('video')
                            ? 'Foto capturada pela câmera'
                            : 'Imagem anexada do dispositivo'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seção de Endereço */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Endereço</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00000-000" 
                      maxLength={9}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '');
                        let formatted = numbers;
                        if (numbers.length > 5) {
                          formatted = numbers.slice(0, 5) + '-' + numbers.slice(5, 8);
                        }
                        field.onChange(formatted);
                        if (numbers.length === 8) {
                          handleCEPChange(numbers);
                        }
                      }}
                      onBlur={(e) => handleCEPChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o endereço completo"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o bairro" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite a cidade" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="SP" 
                      maxLength={2}
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção do Responsável - Dados do Portal */}
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-800">
              {aluno?.responsavelId ? "Dados do Responsável (Portal Ativo)" : "Dados do Responsável (Criar Portal)"}
            </h3>
            {aluno?.responsavelId && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Portal Ativo</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="responsavelNome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do responsável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavelEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Responsável *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavelTelefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Responsável *</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavelCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Responsável *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="999.999.999-99" 
                      maxLength={14}
                      {...field}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '');
                        let formatted = numbers;
                        if (numbers.length > 3) {
                          formatted = numbers.slice(0, 3) + '.' + numbers.slice(3);
                        }
                        if (numbers.length > 6) {
                          formatted = numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6);
                        }
                        if (numbers.length > 9) {
                          formatted = numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6, 9) + '-' + numbers.slice(9, 11);
                        }
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!aluno?.responsavelId && (
              <FormField
                control={form.control}
                name="responsavelSenha"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Senha para Portal *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Mínimo 6 caracteres" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-gray-500">
                      Esta senha será usada para acessar o portal do responsável
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Salvando..." : aluno ? "Atualizar Aluno" : "Cadastrar Aluno"}
          </Button>
        </div>
      </form>
    </Form>
  );
}