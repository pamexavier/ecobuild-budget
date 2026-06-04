import { useState, useRef } from 'react';
import { Upload, Camera, FileText, Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/store';

interface AddMaterialProps {
  obraId: string;
  onSucesso: (material: any) => void;
}

export const AddMaterialModal = ({ obraId, onSucesso }: AddMaterialProps) => {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [tipoEntrada, setTipoEntrada] = useState<'upload' | 'camera' | 'manual'>('manual');
  const [carregando, setCarregando] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados do formulário manual
  const [manual, setManual] = useState({
    descricao: '',
    valor: '',
    fornecedor: '',
    dataEmissao: ''
  });

  // Upload de arquivo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCarregando(true);
    try {
      // 1. Upload pra storage do Supabase
      const timestamp = Date.now();
      const nomeArquivo = `notas/${obraId}/${timestamp}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(nomeArquivo, file);

      if (uploadError) throw uploadError;

      // 2. Pegar URL pública
      const { data } = supabase.storage
        .from('materiais')
        .getPublicUrl(nomeArquivo);

      const notaUrl = data.publicUrl;

      // 3. Disparar webhook pro n8n processar com LLM
      await processarNotaComIA(notaUrl);

      setOpen(false);
      toast({ title: 'Nota enviada! Processando...' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao fazer upload', description: String(error) });
    } finally {
      setCarregando(false);
    }
  };

  // Câmera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({ title: 'Erro ao acessar câmera' });
    }
  };

  const capturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const e = { target: { files: [file] } } as any;
      await handleUpload(e);
    });
  };

  // Manual
  const handleAdicionarManual = async () => {
  // Validação básica: Não deixa enviar se a descrição estiver vazia
  if (!manual.descricao.trim()) {
    toast({ title: 'A descrição é obrigatória' });
    return;
  }

  // Prepara o valor numérico com segurança para evitar NaN
  const valorNumerico = manual.valor ? parseFloat(manual.valor) : null;
  if (manual.valor && isNaN(valorNumerico)) {
    toast({ title: 'O valor digitado é inválido' });
    return;
  }

  setCarregando(true);
  try {
    const { data, error } = await supabase
      .from('materiais_notas')
      .insert([
        {
          tenant_id: tenantId,
          obra_id: obraId, // Garantido que vem via Props correto
          tipo_entrada: 'manual',
          descricao: manual.descricao,
          valor: valorNumerico, // Agora vai um número ou null, nunca NaN
          fornecedor: manual.fornecedor || null, // Se estiver vazio, envia null
          data_emissao: manual.dataEmissao || null, // Se estiver vazio, envia null
          processado: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    onSucesso(data);
    setManual({ descricao: '', valor: '', fornecedor: '', dataEmissao: '' });
    setOpen(false);
    toast({ title: 'Material adicionado!' });
  } catch (error) {
    console.error("Erro completo do Supabase:", error);
    toast({ title: 'Erro ao adicionar', description: String(error) });
  } finally {
    setCarregando(false);
  }
};

  // Chamar webhook do n8n pra processar com LLM
  const processarNotaComIA = async (notaUrl: string) => {
    try {
      const response = await fetch(process.env.REACT_APP_N8N_WEBHOOK_MATERIAIS || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId,
          tenantId,
          notaUrl,
          timestamp: Date.now()
        })
      });

      if (!response.ok) throw new Error('Erro ao processar');

      const resultado = await response.json();
      onSucesso(resultado.material);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao processar nota com IA' });
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold"
      >
        + Adicionar Material
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-black text-white">Adicionar Material</h2>

        {/* ABAS */}
        <div className="flex gap-2">
          <button
            onClick={() => setTipoEntrada('upload')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tipoEntrada === 'upload'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Upload size={14} className="mx-auto mb-1" /> Upload
          </button>
          <button
            onClick={() => { setTipoEntrada('camera'); startCamera(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tipoEntrada === 'camera'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Camera size={14} className="mx-auto mb-1" /> Câmera
          </button>
          <button
            onClick={() => setTipoEntrada('manual')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tipoEntrada === 'manual'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <FileText size={14} className="mx-auto mb-1" /> Manual
          </button>
        </div>

        {/* UPLOAD */}
        {tipoEntrada === 'upload' && (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-emerald-500/40 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500/60 transition-all"
          >
            <Upload size={32} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Clique ou arraste a nota fiscal</p>
            <p className="text-xs text-zinc-400">PDF ou imagem</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={carregando}
            />
          </div>
        )}

        {/* CÂMERA */}
        {tipoEntrada === 'camera' && (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            <button
              onClick={capturePhoto}
              disabled={carregando}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {carregando ? <Loader className="animate-spin mx-auto" size={18} /> : 'Tirar Foto'}
            </button>
          </div>
        )}

        {/* MANUAL */}
        {tipoEntrada === 'manual' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Descrição do material"
              value={manual.descricao}
              onChange={(e) => setManual(m => ({ ...m, descricao: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <input
              type="number"
              placeholder="Valor (R$)"
              value={manual.valor}
              onChange={(e) => setManual(m => ({ ...m, valor: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <input
              type="text"
              placeholder="Fornecedor"
              value={manual.fornecedor}
              onChange={(e) => setManual(m => ({ ...m, fornecedor: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
            <input
              type="date"
              value={manual.dataEmissao}
              onChange={(e) => setManual(m => ({ ...m, dataEmissao: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        )}

        {/* BOTÕES */}
        <div className="flex gap-3">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={tipoEntrada === 'manual' ? handleAdicionarManual : undefined}
            disabled={carregando || (tipoEntrada === 'manual' && !manual.descricao)}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {carregando && <Loader size={14} className="animate-spin" />}
            {tipoEntrada === 'manual' ? 'Adicionar' : 'Enviando...'}
          </button>
        </div>
      </div>
    </div>
  );
};