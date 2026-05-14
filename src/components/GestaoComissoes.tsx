import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Plus, UserPlus, Calendar as CalendarIcon, CheckSquare, Square, 
  ArrowRightCircle, Edit3, FileText, Trash2, Tag, User, MapPin, Phone, CreditCard, Image as ImageIcon, UploadCloud
} from 'lucide-react';
import { Parceiro, Comissao, Obra, ContaAReceber } from '@/lib/types';
import { format } from 'date-fns';

// 1. Definição das Props (Isso estava faltando no seu corte)
interface Props {
  parceiros: Parceiro[];
  comissoes: Comissao[];
  obras: Obra[];
  contas: ContaAReceber[];
  onAddParceiro: (p: Omit<Parceiro, 'id'>) => void;
  onUpdateParceiro: (id: string, p: Partial<Parceiro>) => void;
  onAddComissao: (c: Omit<Comissao, 'id' | 'parceiroNome' | 'obraNome'>) => void;
  onUpdateStatus: (id: string, status: 'pendente' | 'pago') => void;
  onDeleteComissao: (id: string) => void;
  onDeleteParceiro: (id: string) => void;
}

export function GestaoComissoes({ 
  parceiros = [], comissoes = [], obras = [], contas = [], 
  onAddParceiro, onUpdateParceiro, onAddComissao, onUpdateStatus, onDeleteComissao, onDeleteParceiro 
}: Props) {
  
  const [showParceiroModal, setShowParceiroModal] = useState(false);
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | null>(null);
  
  // Refs para abrir a janela de ficheiros do computador
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [colaboradorAlvo, setColaboradorAlvo] = useState('');
  const [tipoComissaoAlvo, setTipoComissaoAlvo] = useState<'projeto' | 'obra' | 'rt'>('obra');

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    endereco: '',
    comissaoObraPct: 0,
    comissaoProjetoPct: 0,
    comissaoRtPct: 0,
    fotoUrl: '', 
    documentoPdfUrl: '' 
  });

  const contasDisponiveis = useMemo(() => {
    return (contas || []).filter(c => {
      if (c.status !== 'pago') return false;
      const dataRef = typeof c.dataVencimento === 'string' ? c.dataVencimento : c.dataVencimento.toISOString().split('T')[0];
      return dataRef >= dataInicio && dataRef <= dataFim;
    });
  }, [contas, dataInicio, dataFim]);

  const parceiroSelecionado = parceiros.find(p => p.id === colaboradorAlvo);

  // Funções para lidar com ficheiros (Foto e PDF)
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData({ ...formData, fotoUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }
};

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, documentoPdfUrl: file.name });
    }
  };

  const handleSaveParceiro = () => {
    if (editingParceiro) onUpdateParceiro(editingParceiro.id, formData);
    else onAddParceiro(formData);
    setShowParceiroModal(false);
    setEditingParceiro(null);
    setFormData({ nome: '', cpf: '', telefone: '', endereco: '', comissaoObraPct: 0, comissaoProjetoPct: 0, comissaoRtPct: 0, fotoUrl: '', documentoPdfUrl: '' });
  };

  const openEdit = (p: Parceiro) => {
    setEditingParceiro(p);
    setFormData({ 
      nome: p.nome, cpf: p.cpf || '', telefone: p.telefone || '', endereco: p.endereco || '',
      comissaoObraPct: p.comissaoObraPct, comissaoProjetoPct: p.comissaoProjetoPct, 
      comissaoRtPct: p.comissaoRtPct, fotoUrl: p.fotoUrl || '', documentoPdfUrl: p.documentoPdfUrl || ''
    });
    setShowParceiroModal(true);
  };

  const toggleConta = (id: string) => {
    setIdsSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleGerarMassa = () => {
    if (!colaboradorAlvo || idsSelecionados.length === 0) return;
    
    idsSelecionados.forEach(id => {
      const conta = contas.find(c => c.id === id);
      if (conta) {
        const pct = tipoComissaoAlvo === 'projeto' ? parceiroSelecionado?.comissaoProjetoPct : 
                    tipoComissaoAlvo === 'obra' ? parceiroSelecionado?.comissaoObraPct : 
                    parceiroSelecionado?.comissaoRtPct;

        onAddComissao({
          parceiroId: colaboradorAlvo,
          tipo: tipoComissaoAlvo,
          descricao: `Faturamento massa: ${conta.descricao}`,
          valorBase: conta.valor,
          percentual: pct || 0,
          valorComissao: (conta.valor * (pct || 0)) / 100,
          status: 'pendente',
          dataLancamento: new Date().toISOString().split('T')[0],
          obraId: conta.obraId,
        });
      }
    });
    setIdsSelecionados([]);
    setColaboradorAlvo('');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* HEADER DE GESTÃO */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-950/50 p-6 rounded-[32px] border border-white/5">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setEditingParceiro(null); setShowParceiroModal(true); }} className="bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 py-6 shadow-lg shadow-emerald-900/20">
            <UserPlus className="mr-2 w-4 h-4" /> Novo Colaborador
          </Button>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {parceiros.slice(0, 4).map(p => (
              <button key={p.id} onClick={() => openEdit(p)} className="px-4 py-2 text-[10px] font-black text-zinc-400 hover:text-white uppercase transition-all flex items-center gap-2 hover:bg-white/5 rounded-xl">
                {p.fotoUrl ? <img src={p.fotoUrl} className="w-5 h-5 rounded-full object-cover border border-emerald-500/30" /> : <User size={12} />} 
                {p.nome.split(' ')[0]}
              </button>
            ))}
            {parceiros.length > 4 && <span className="px-3 py-2 text-[10px] text-zinc-600 font-bold">+{parceiros.length - 4}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-2xl">
          <CalendarIcon className="w-4 h-4 text-emerald-500 ml-2" />
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer" />
          <span className="text-zinc-800 font-black">|</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA ESQUERDA (Flags) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Recebimentos do Período</h3>
            <span className="text-[9px] font-bold text-zinc-600 uppercase">{contasDisponiveis.length} registros</span>
          </div>
          
          <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {contasDisponiveis.length === 0 ? (
                <div className="p-20 text-center text-zinc-600 font-bold uppercase italic text-sm">Nenhum recebimento pago neste intervalo</div>
              ) : (
                contasDisponiveis.map(conta => (
                  <div key={conta.id} onClick={() => toggleConta(conta.id)} className={`flex items-center justify-between p-6 cursor-pointer transition-all ${idsSelecionados.includes(conta.id) ? 'bg-emerald-500/5 border-l-4 border-emerald-500' : 'hover:bg-white/[0.02] border-l-4 border-transparent'}`}>
                    <div className="flex items-center gap-5">
                      {idsSelecionados.includes(conta.id) ? <CheckSquare className="w-6 h-6 text-emerald-500" /> : <Square className="w-6 h-6 text-zinc-800" />}
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{conta.descricao}</p>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Vencimento Original: {new Date(conta.dataVencimento).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-white">{fmt(conta.valor)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO (Ação) */}
        <div className="space-y-4">
          <div className="bg-[#0c0c0c] border border-white/10 p-8 rounded-[40px] sticky top-24 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
              <Tag className="text-[#a78bfa]" /> Faturar Selecionados
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase ml-1 block mb-2 tracking-widest">Colaborador Alvo</label>
                <select value={colaboradorAlvo} onChange={e => setColaboradorAlvo(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-[#a78bfa]/50 transition-colors">
                  <option value="">Selecione o Colaborador</option>
                  {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'obra', label: 'OBRA', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                  { id: 'projeto', label: 'PROJETO', color: 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20' },
                  { id: 'rt', label: 'RT', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
                ].map(t => (
                  <button key={t.id} onClick={() => setTipoComissaoAlvo(t.id as any)} className={`p-3 rounded-xl border text-[9px] font-black transition-all ${tipoComissaoAlvo === t.id ? t.color : 'bg-transparent border-zinc-800 text-zinc-600'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-600 tracking-widest"><span>Contas Selecionadas</span> <span className="text-white">{idsSelecionados.length}</span></div>
                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-600 tracking-widest"><span>Taxa Aplicada</span> <span className="text-[#a78bfa]">
                  {tipoComissaoAlvo === 'obra' ? parceiroSelecionado?.comissaoObraPct : 
                   tipoComissaoAlvo === 'projeto' ? parceiroSelecionado?.comissaoProjetoPct : 
                   parceiroSelecionado?.comissaoRtPct}%
                </span></div>
              </div>

              <Button onClick={handleGerarMassa} disabled={!colaboradorAlvo || idsSelecionados.length === 0} className="w-full py-8 bg-emerald-600 hover:bg-emerald-500 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-20">
                Gerar Comissões
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: EDIÇÃO COMPLETA (COM FOTO E DADOS PESSOAIS) - Com aria-describedby resolvido! */}
      <Dialog open={showParceiroModal} onOpenChange={setShowParceiroModal}>
        <DialogContent aria-describedby={undefined} className="bg-[#0a0a0a] border-white/10 rounded-[40px] p-0 max-w-2xl overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row">
            {/* Barra Lateral do Modal com Foto */}
            <div className="md:w-1/3 bg-zinc-950 p-8 flex flex-col items-center border-r border-white/5">
              <input type="file" ref={fileInputRef} onChange={handleFotoChange} accept="image/*" className="hidden" />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-32 h-32 rounded-full bg-zinc-900 border-2 border-dashed border-emerald-500/30 flex items-center justify-center overflow-hidden mb-6"
              >
                {formData.fotoUrl ? (
                  <img src={formData.fotoUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-zinc-700 group-hover:text-emerald-500 transition-colors" size={32} />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <UploadCloud className="text-white w-6 h-6" />
                </div>
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase text-center leading-tight">Perfil do Colaborador</p>
            </div>

            {/* Formulário Principal */}
            <div className="flex-1 p-10 space-y-6 bg-[#0a0a0a]">
              <DialogHeader><DialogTitle className="text-xl font-black text-white uppercase tracking-tighter">{editingParceiro ? 'Editar Perfil' : 'Dados Cadastrais'}</DialogTitle></DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Nome Completo / Razão Social</label>
                  <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1"><CreditCard size={10}/> CPF ou CNPJ</label>
                  <input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} placeholder="00.000.000/0001-00" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1"><Phone size={10}/> Telefone</label>
                  <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1"><MapPin size={10}/> Endereço Completo</label>
                  <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
                </div>
              </div>

              {/* Upload de PDF do Documento */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-emerald-500 uppercase ml-1">Contrato ou Identificação (PDF)</label>
                <input type="file" ref={docInputRef} onChange={handleDocChange} accept="application/pdf" className="hidden" />
                <div 
                  onClick={() => docInputRef.current?.click()}
                  className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all"
                >
                  <span className="text-[10px] text-zinc-500 font-bold uppercase truncate">
                    {formData.documentoPdfUrl || 'Clique para anexar o documento...'}
                  </span>
                  <FileText size={16} className="text-emerald-500" />
                </div>
              </div>

              {/* Porcentagens (Seção Lilás/Verde/Âmbar) */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-4 rounded-2xl border border-white/5">
                 <div className="text-center">
                    <label className="text-[8px] font-black text-emerald-500 uppercase block mb-1">Obra</label>
                    <input type="number" value={formData.comissaoObraPct} onChange={e => setFormData({...formData, comissaoObraPct: Number(e.target.value)})} className="w-full bg-black border border-white/5 rounded-lg p-2 text-center text-xs text-white outline-none" />
                 </div>
                 <div className="text-center">
                    <label className="text-[8px] font-black text-[#a78bfa] uppercase block mb-1">Proj.</label>
                    <input type="number" value={formData.comissaoProjetoPct} onChange={e => setFormData({...formData, comissaoProjetoPct: Number(e.target.value)})} className="w-full bg-black border border-white/5 rounded-lg p-2 text-center text-xs text-white outline-none" />
                 </div>
                 <div className="text-center">
                    <label className="text-[8px] font-black text-amber-500 uppercase block mb-1">RT</label>
                    <input type="number" value={formData.comissaoRtPct} onChange={e => setFormData({...formData, comissaoRtPct: Number(e.target.value)})} className="w-full bg-black border border-white/5 rounded-lg p-2 text-center text-xs text-white outline-none" />
                 </div>
              </div>

              <div className="flex gap-3">
                {editingParceiro && (
                  <Button variant="destructive" onClick={() => { onDeleteParceiro(editingParceiro.id); setShowParceiroModal(false); }} className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white rounded-2xl uppercase font-black text-[10px] flex-1 py-7">Excluir</Button>
                )}
                <Button onClick={handleSaveParceiro} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 rounded-2xl uppercase font-black text-[10px] py-7 tracking-widest shadow-xl shadow-emerald-900/20">Salvar Alterações</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}