import { useState } from 'react';
import { Upload, Loader, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadContratoObraProps {
  obraId: string;
  tenantId: string;
  onSucesso: (dados: any) => void;
}

export function UploadContratoObra({ obraId, tenantId, onSucesso }: UploadContratoObraProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState('');
  const { toast } = useToast();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!arquivo) {
      setErro('Selecione um arquivo');
      return;
    }

    setCarregando(true);
    setErro('');
    setProgresso(20); // Começa um pouco mais rápido para dar feedback visual

    try {
      // 1. Criamos um "pacote" para enviar o arquivo cru para o n8n
      const formData = new FormData();
      
      // IMPORTANTE: O nome 'data' aqui é o mesmo nome da gaveta que configuramos no nó Read PDF do n8n!
      formData.append('data', arquivo); 
      formData.append('obraId', obraId);
      formData.append('tenantId', tenantId);

      setProgresso(50);

      // 2. AQUI ENTRA A URL DO SEU N8N
     const response = await fetch(`http://localhost:5679/webhook-test/eac90f3a-542b-4db8-9c67-aaafd0334225/contratos/${obraId}`, {
  method: 'POST',
  body: formData
});

      setProgresso(75);

      if (!response.ok) {
        throw new Error('Erro ao comunicar com a IA do n8n');
      }

      // 3. Recebe a resposta mágica do Groq via n8n
      const resultado = await response.json();
      setProgresso(100);

      toast({ 
        title: "Contrato analisado com sucesso! 🎉",
        description: "Os serviços foram extraídos pelo Groq."
      });

      // Passa o resultado para a tela de Checklist renderizar
      onSucesso(resultado);
      setArquivo(null);
      setTimeout(() => setProgresso(0), 1000);

    } catch (err: any) {
      setErro(err.message);
      setCarregando(false);
      setProgresso(0);
      toast({ 
        title: "Erro ao processar",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div className="border-2 border-dashed border-emerald-500/30 rounded-2xl p-6 text-center hover:bg-emerald-500/5 transition-all">
        <input
          type="file"
          accept=".pdf,.jpg,.png"
          onChange={(e) => {
            setArquivo(e.target.files?.[0] || null);
            setErro('');
          }}
          disabled={carregando}
          className="hidden"
          id="file-input-contrato"
        />
        <label htmlFor="file-input-contrato" className="cursor-pointer">
          <Upload className="mx-auto mb-2 text-emerald-500" size={24} />
          <p className="font-black text-white text-sm uppercase">Clique ou arraste o contrato</p>
          <p className="text-[10px] text-zinc-500 font-bold">PDF ou Imagem (JPG/PNG)</p>
        </label>
      </div>

      {arquivo && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-3">
          <Check size={16} className="text-emerald-500" />
          <p className="text-sm font-bold text-white">{arquivo.name}</p>
        </div>
      )}

      {progresso > 0 && (
        <div className="space-y-2">
          <div className="w-full bg-white/5 rounded-full h-2 border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-bold text-center">{progresso}%</p>
        </div>
      )}

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold">{erro}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!arquivo || carregando}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
      >
        {carregando ? <Loader className="animate-spin" size={16} /> : <Upload size={16} />}
        {carregando ? 'ProcessFando IA...' : 'Analisar Contrato'}
      </Button>
    </form>
  );
}