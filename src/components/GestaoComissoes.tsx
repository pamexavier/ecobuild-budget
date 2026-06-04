import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Plus, UserPlus, Calendar as CalendarIcon, CheckSquare, Square, 
  Trash2, Tag, User, MapPin, Phone, CreditCard, Image as ImageIcon, UploadCloud, CheckCircle2, Printer, FileText, Edit2,
  ArrowDownRight, ArrowUpRight, Store, LockKeyhole
} from 'lucide-react';
import { Parceiro, Comissao, Obra, ContaAReceber } from '@/lib/types';
import { format } from 'date-fns';

interface Props {
  parceiros: Parceiro[];
  comissoes: Comissao[];
  obras: Obra[];
  contas: ContaAReceber[];
  onAddParceiro: (p: Omit<Parceiro, 'id'>) => void;
  onUpdateParceiro: (id: string, p: Partial<Parceiro>) => void;
  onAddComissao: (c: Omit<Comissao, 'id' | 'parceiroNome' | 'obraNome'>) => void;
  onUpdateStatus: (id: string, status: Comissao['status']) => void;
  onDeleteComissao: (id: string) => void;
  onDeleteParceiro: (id: string) => void;
}

export function GestaoComissoes({ 
  parceiros = [], comissoes = [], obras = [], contas = [], 
  onAddParceiro, onUpdateParceiro, onAddComissao, onUpdateStatus, onDeleteComissao, onDeleteParceiro 
}: Props) {
  
  const [showParceiroModal, setShowParceiroModal] = useState(false);
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [colaboradorAlvo, setColaboradorAlvo] = useState('');
  const [tipoComissaoAlvo, setTipoComissaoAlvo] = useState<'projeto' | 'obra' | 'rt'>('obra');
  const [descontoImpostoPct, setDescontoImpostoPct] = useState<number>(0);
  const [subAbaComissao, setSubAbaComissao] = useState<'pagar' | 'receber'>('pagar');

  const [colaboradorFiltroRelatorio, setColaboradorFiltroRelatorio] = useState('todos');

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

  const getIsodata = (d: any) => {
    if (!d) return '';
    if (typeof d === 'string') return d.substring(0, 10);
    try { return d.toISOString().split('T')[0]; } catch(e) { return ''; }
  };

  const getTipoNormalizado = (tipo?: string) => (tipo || '').toLowerCase();
  const isComissaoAReceber = (c: Comissao) => ['fornecedor', 'rt', 'reserva_tecnica'].includes(getTipoNormalizado(c.tipo));
  const isComissaoAPagar = (c: Comissao) => !isComissaoAReceber(c);
  const fornecedorPendentePorObra = useMemo(() => {
    return new Set(
      comissoes
        .filter(c => isComissaoAReceber(c) && c.status !== 'pago' && c.obraId)
        .map(c => c.obraId as string)
    );
  }, [comissoes]);

  const getComissaoParceiroBloqueada = (c: Comissao) => {
    return c.status !== 'pago' && !!c.obraId && fornecedorPendentePorObra.has(c.obraId);
  };

  const contasDisponiveis = useMemo(() => {
    return (contas || []).filter(c => {
      if (c.status !== 'pago') return false;
      const dataRef = c.dataPagamento ? getIsodata(c.dataPagamento) : getIsodata(c.dataVencimento);
      const inRange = dataRef >= dataInicio && dataRef <= dataFim;
      
      const isFaturada = colaboradorAlvo 
        ? comissoes.some(com => com.parceiroId === colaboradorAlvo && com.obraId === c.obraId && com.descricao.includes(c.descricao))
        : false;

      return inRange && !isFaturada;
    });
  }, [contas, dataInicio, dataFim, comissoes, colaboradorAlvo]);

  const comissoesFiltradas = useMemo(() => {
    return comissoes.filter(c => {
      if (colaboradorFiltroRelatorio === 'todos') return true;
      return c.parceiroId === colaboradorFiltroRelatorio;
    });
  }, [comissoes, colaboradorFiltroRelatorio]);

  const comissoesAPagar = useMemo(() => {
    return comissoesFiltradas.filter(isComissaoAPagar);
  }, [comissoesFiltradas]);

  const comissoesAReceber = useMemo(() => {
    return comissoesFiltradas.filter(isComissaoAReceber);
  }, [comissoesFiltradas]);

  const totalAPagarLiberado = useMemo(() => {
    return comissoesAPagar
      .filter(c => c.status !== 'pago' && !getComissaoParceiroBloqueada(c))
      .reduce((sum, c) => sum + c.valorComissao, 0);
  }, [comissoesAPagar, fornecedorPendentePorObra]);

  const totalAPagarBloqueado = useMemo(() => {
    return comissoesAPagar
      .filter(getComissaoParceiroBloqueada)
      .reduce((sum, c) => sum + c.valorComissao, 0);
  }, [comissoesAPagar, fornecedorPendentePorObra]);

  const totalAReceberPendente = useMemo(() => {
    return comissoesAReceber
      .filter(c => c.status !== 'pago')
      .reduce((sum, c) => sum + c.valorComissao, 0);
  }, [comissoesAReceber]);

  const totalComissoesFiltradas = useMemo(() => {
    return comissoesFiltradas.reduce((sum, c) => sum + c.valorComissao, 0);
  }, [comissoesFiltradas]);

  const parceiroSelecionado = parceiros.find(p => p.id === colaboradorAlvo);

  // Extrai informações do imposto salvos na descrição de forma inteligente
  const extrairImposto = (descricao: string, valorBase: number) => {
    const match = descricao.match(/Desc\. Imposto:\s*([\d.]+)%/);
    if (match) {
      const pct = parseFloat(match[1]);
      const valorOriginal = valorBase / (1 - pct / 100);
      return { pct: `${pct}%`, valor: valorOriginal * (pct / 100) };
    }
    return { pct: '0%', valor: 0 };
  };

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

        const pctImposto = descontoImpostoPct || 0;
        const valorBaseLiquido = conta.valor - (conta.valor * (pctImposto / 100));
        const notaDesconto = pctImposto > 0 ? ` (Desc. Imposto: ${pctImposto}%)` : '';

        onAddComissao({
          parceiroId: colaboradorAlvo,
          tipo: 'parceiro',
          descricao: `Faturamento ${tipoComissaoAlvo.toUpperCase()}: ${conta.descricao}${notaDesconto}`,
          valorBase: valorBaseLiquido,
          percentual: pct || 0,
          valorComissao: (valorBaseLiquido * (pct || 0)) / 100,
          status: 'pendente',
          dataLancamento: new Date().toISOString().split('T')[0],
          obraId: conta.obraId,
        });
      }
    });
    
    setIdsSelecionados([]);
    setDescontoImpostoPct(0);
  };

  const handleEditarComissao = (c: Comissao) => {
    setColaboradorAlvo(c.parceiroId);
    const tipoDescricao = c.descricao?.match(/Faturamento\s+(OBRA|PROJETO|RT):/i)?.[1]?.toLowerCase();
    setTipoComissaoAlvo((tipoDescricao || c.tipo || 'obra') as any);
    
    const matchImposto = c.descricao.match(/Desc\. Imposto:\s*([\d.]+)%/);
    if (matchImposto) setDescontoImpostoPct(parseFloat(matchImposto[1]));
    else setDescontoImpostoPct(0);
    
    onDeleteComissao(c.id);
  };

  const handleBaixarFornecedor = (c: Comissao) => {
    onUpdateStatus(c.id, 'pago');

    comissoesAPagar
      .filter(comissaoParceiro => (
        comissaoParceiro.obraId === c.obraId &&
        comissaoParceiro.status === 'aguardando_rt'
      ))
      .forEach(comissaoParceiro => onUpdateStatus(comissaoParceiro.id, 'pendente'));
  };

  const handleImprimir = () => {
    window.print();
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      {/* SEÇÃO EXCLUSIVA DO PDF EMITIDO */}
      <div className="hidden print:block p-10 bg-white text-zinc-950 min-h-screen font-sans">
        <div className="flex justify-between items-center border-b-4 border-zinc-900 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">ZENTRA-X</h1>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-1">Demonstrativo de Repasse de Comissões</p>
          </div>
          <div className="text-right text-xs text-zinc-600 font-bold space-y-1">
            <p>Período: {new Date(dataInicio).toLocaleDateString('pt-BR')} — {new Date(dataFim).toLocaleDateString('pt-BR')}</p>
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="mb-8 bg-zinc-50 p-5 rounded-2xl border border-zinc-200 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Filtro do Relatório</span>
            <span className="text-lg font-black text-zinc-900 uppercase">
              {colaboradorFiltroRelatorio === 'todos' ? 'Todos os profissionais' : parceiros.find(p => p.id === colaboradorFiltroRelatorio)?.nome}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Total Líquido Gerado</span>
            <span className="text-2xl font-black text-emerald-600">{fmt(totalComissoesFiltradas)}</span>
          </div>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-zinc-900 text-zinc-700 uppercase font-black text-left bg-zinc-100">
              <th className="p-3">Colaborador / Tipo</th>
              <th className="p-3">Descrição / Referência</th>
              <th className="p-3 text-right">Imposto Retido</th>
              <th className="p-3 text-right">Base Líquida</th>
              <th className="p-3 text-center">Taxa</th>
              <th className="p-3 text-right">Comissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {comissoesFiltradas.map(c => {
              const impDetails = extrairImposto(c.descricao, c.valorBase);
              return (
                <tr key={c.id}>
                  <td className="p-3 font-bold text-zinc-900">
                    <p>{c.parceiroNome}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-medium">{c.tipo}</p>
                  </td>
                  <td className="p-3 text-zinc-700">
                    <p className="font-semibold">{c.descricao.split(' (Desc')[0]}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{c.obraNome}</p>
                  </td>
                  <td className="p-3 text-right text-red-600 font-bold">
                    {impDetails.valor > 0 ? `${fmt(impDetails.valor)} (${impDetails.pct})` : '—'}
                  </td>
                  <td className="p-3 text-right text-zinc-800 font-medium">{fmt(c.valorBase)}</td>
                  <td className="p-3 text-center text-zinc-800 font-bold">{c.percentual}%</td>
                  <td className="p-3 text-right font-black text-zinc-900">{fmt(c.valorComissao)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TELA INTERATIVA DO SISTEMA */}
      <div className="print:hidden space-y-6">
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
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-2xl">
            <CalendarIcon className="w-4 h-4 text-emerald-500 ml-2" />
            <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setIdsSelecionados([]); }} style={{ colorScheme: 'dark' }} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer" />
            <span className="text-zinc-800 font-black">|</span>
            <input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setIdsSelecionados([]); }} style={{ colorScheme: 'dark' }} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Recebimentos do Período</h3>
              <span className="text-[9px] font-bold text-zinc-600 uppercase">{contasDisponiveis.length} registros livres</span>
            </div>
            
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                {contasDisponiveis.length === 0 ? (
                  <div className="p-20 text-center text-zinc-600 font-bold uppercase italic text-sm">Nenhum recebimento disponível neste intervalo para o colaborador</div>
                ) : (
                  contasDisponiveis.map(conta => (
                    <div key={conta.id} onClick={() => toggleConta(conta.id)} className={`flex items-center justify-between p-6 cursor-pointer transition-all ${idsSelecionados.includes(conta.id) ? 'bg-emerald-500/5 border-l-4 border-emerald-500' : 'hover:bg-white/[0.02] border-l-4 border-transparent'}`}>
                      <div className="flex items-center gap-5">
                        {idsSelecionados.includes(conta.id) ? <CheckSquare className="w-6 h-6 text-emerald-500" /> : <Square className="w-6 h-6 text-zinc-800" />}
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{conta.descricao}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                            Venc: {new Date(conta.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            {conta.dataPagamento && <span className="text-emerald-500 ml-2">Recebido em: {new Date(conta.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>}
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-black text-white">{fmt(conta.valor)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 rounded-[40px] sticky top-24 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
                <Tag className="text-[#a78bfa]" /> Faturar Selecionados
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase ml-1 block mb-2 tracking-widest">Colaborador Alvo</label>
                  <select value={colaboradorAlvo} onChange={e => { setColaboradorAlvo(e.target.value); setIdsSelecionados([]); }} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-[#a78bfa]/50 transition-colors">
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
                    <button key={t.id} type="button" onClick={() => setTipoComissaoAlvo(t.id as any)} className={`p-3 rounded-xl border text-[9px] font-black transition-all ${tipoComissaoAlvo === t.id ? t.color : 'bg-transparent border-zinc-800 text-zinc-600'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase ml-1 block mb-2 tracking-widest">Desconto Imposto da Nota (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={descontoImpostoPct} onChange={e => setDescontoImpostoPct(Number(e.target.value))} placeholder="Ex: 6.5" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-red-500/50 transition-colors" />
                </div>

                <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-zinc-600 tracking-widest"><span>Contas Selecionadas</span> <span className="text-white">{idsSelecionados.length}</span></div>
                  {descontoImpostoPct > 0 && (
                    <div className="flex justify-between text-[10px] font-black uppercase text-zinc-600 tracking-widest"><span>Imposto Retido</span> <span className="text-red-400">-{descontoImpostoPct}%</span></div>
                  )}
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

        {/* RELATÓRIO INTERATIVO EM TELA */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
              <FileText className="text-emerald-500" /> Relatório Geral de Comissões
            </h3>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={colaboradorFiltroRelatorio} onChange={e => setColaboradorFiltroRelatorio(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none">
                <option value="todos">Todos os Colaboradores</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <Button onClick={handleImprimir} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 text-xs font-bold uppercase gap-2">
                <Printer size={14} /> PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-2"><ArrowUpRight size={14} /> Liberado a pagar</p>
              <p className="mt-2 text-xl font-black text-white">{fmt(totalAPagarLiberado)}</p>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-300 flex items-center gap-2"><LockKeyhole size={14} /> Aguardando RT</p>
              <p className="mt-2 text-xl font-black text-white">{fmt(totalAPagarBloqueado)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-2"><ArrowDownRight size={14} /> RT a receber</p>
              <p className="mt-2 text-xl font-black text-white">{fmt(totalAReceberPendente)}</p>
            </div>
          </div>

          <div className="mx-4 flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 gap-1 overflow-x-auto custom-scrollbar">
            {[
              { id: 'pagar', label: 'ComissÃµes a Pagar', icon: ArrowUpRight, color: 'purple' },
              { id: 'receber', label: 'ComissÃµes a Receber', icon: Store, color: 'emerald' },
            ].map(tab => {
              const Icon = tab.icon;
              const selected = subAbaComissao === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubAbaComissao(tab.id as 'pagar' | 'receber')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selected
                      ? tab.color === 'emerald'
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                        : 'bg-purple-500/15 text-purple-200 border border-purple-500/30'
                      : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-[32px] border border-white/5 bg-[#0c0c0c] shadow-2xl">
            {subAbaComissao === 'pagar' ? (
              <table className="w-full text-sm min-w-[920px]">
                <thead className="bg-purple-500/[0.06] border-b border-purple-500/10 text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Parceiro</th>
                    <th className="px-6 py-4 text-left">Obra / Referencia</th>
                    <th className="px-6 py-4 text-left">Base / Taxa</th>
                    <th className="px-6 py-4 text-right">Valor a transferir</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comissoesAPagar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-600 font-bold uppercase text-xs">Nenhuma comissao a pagar encontrada</td>
                    </tr>
                  ) : comissoesAPagar.map(c => {
                    const bloqueada = getComissaoParceiroBloqueada(c);
                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{c.parceiroNome || 'Parceiro nao identificado'}</p>
                          <p className="text-[10px] text-purple-300 uppercase font-black">Parceiro / Saida</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-300">{(c.descricao || '').split(' (Desc')[0]}</p>
                          <p className="text-[10px] text-zinc-500">{c.obraNome || 'Sem obra vinculada'}</p>
                          {bloqueada && (
                            <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[9px] font-black uppercase text-orange-300">
                              <LockKeyhole size={10} /> Aguardando pagamento do fornecedor
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-300">{fmt(c.valorBase)}</p>
                          <p className="text-[10px] text-purple-300 font-black">{c.percentual}% aplicado</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-black text-orange-300">{fmt(c.valorComissao)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            c.status === 'pago'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : bloqueada
                                ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                                : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          }`}>
                            {c.status === 'pago' ? 'pago' : bloqueada ? 'bloqueado' : 'pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status !== 'pago' && (
                              <>
                                <Button size="sm" variant="outline" disabled={bloqueada} className="h-8 gap-1 text-[10px] font-black uppercase text-purple-300 border-purple-500/30 hover:bg-purple-500/10 disabled:opacity-30" onClick={() => onUpdateStatus(c.id, 'pago')}>
                                  <CheckCircle2 size={14} /> Pagar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 gap-1 text-[10px] font-black uppercase text-amber-400 hover:bg-amber-500/10" onClick={() => handleEditarComissao(c)}>
                                  <Edit2 size={12} /> Editar
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full" onClick={() => onDeleteComissao(c.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm min-w-[960px]">
                <thead className="bg-emerald-500/[0.06] border-b border-emerald-500/10 text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">Fornecedor / Loja</th>
                    <th className="px-6 py-4 text-left">Obra / Compra</th>
                    <th className="px-6 py-4 text-right">Valor bruto</th>
                    <th className="px-6 py-4 text-center">% RT</th>
                    <th className="px-6 py-4 text-right">RT a cobrar</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comissoesAReceber.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-600 font-bold uppercase text-xs">Nenhuma RT de fornecedor encontrada</td>
                    </tr>
                  ) : comissoesAReceber.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{c.parceiroNome || 'Fornecedor nao identificado'}</p>
                        <p className="text-[10px] text-emerald-300 uppercase font-black">Fornecedor / Entrada</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-300">{(c.descricao || '').split(' (Desc')[0]}</p>
                        <p className="text-[10px] text-zinc-500">{c.obraNome || 'Sem obra vinculada'}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-300">{fmt(c.valorBase)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-300">{c.percentual}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-emerald-300">{fmt(c.valorComissao)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${c.status === 'pago' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                          {c.status === 'pago' ? 'recebido' : 'pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status !== 'pago' && (
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-[10px] font-black uppercase text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleBaixarFornecedor(c)}>
                              <CheckCircle2 size={14} /> Receber
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full" onClick={() => onDeleteComissao(c.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="hidden">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Colaborador</th>
                  <th className="px-6 py-4 text-left">Referência</th>
                  <th className="px-6 py-4 text-right">Imposto Retido</th>
                  <th className="px-6 py-4 text-left">Base Líquida / Taxa</th>
                  <th className="px-6 py-4 text-right">Comissão</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comissoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-600 font-bold uppercase text-xs">Nenhuma comissão encontrada para o filtro</td>
                  </tr>
                ) : comissoesFiltradas.map(c => {
                  const impDetails = extrairImposto(c.descricao, c.valorBase);
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{c.parceiroNome || 'Desconhecido'}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">{c.tipo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-300">{c.descricao.split(' (Desc')[0]}</p>
                        <p className="text-[10px] text-zinc-500">{c.obraNome}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-rose-400 font-bold bg-rose-500/[0.02]">
                        {impDetails.valor > 0 ? (
                          <div>
                            <p>{fmt(impDetails.valor)}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">Taxa: {impDetails.pct}</p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-300">{fmt(c.valorBase)}</p>
                        <p className="text-[10px] text-[#a78bfa] font-black">{c.percentual}% Aplicado</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-emerald-400">{fmt(c.valorComissao)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${c.status === 'pago' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'pendente' && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 gap-1 text-[10px] font-black uppercase text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => onUpdateStatus(c.id, 'pago')}>
                                <CheckCircle2 size={14} /> Pagar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 gap-1 text-[10px] font-black uppercase text-amber-400 hover:bg-amber-500/10" onClick={() => handleEditarComissao(c)}>
                                <Edit2 size={12} /> Editar
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full" onClick={() => onDeleteComissao(c.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showParceiroModal} onOpenChange={setShowParceiroModal}>
        <DialogContent aria-describedby={undefined} className="bg-[#0a0a0a] border-white/10 rounded-3xl sm:rounded-[40px] p-0 w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
          <div className="flex flex-col md:flex-row h-full">
            <div className="md:w-1/3 bg-zinc-950 p-6 md:p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5">
              <input type="file" ref={fileInputRef} onChange={handleFotoChange} accept="image/*" className="hidden" />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer w-24 h-24 md:w-32 md:h-32 rounded-full bg-zinc-900 border-2 border-dashed border-emerald-500/30 flex items-center justify-center overflow-hidden mb-4 md:mb-6"
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

            <div className="flex-1 p-5 sm:p-10 space-y-6 bg-[#0a0a0a]">
              <DialogHeader><DialogTitle className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">{editingParceiro ? 'Editar Perfil' : 'Dados Cadastrais'}</DialogTitle></DialogHeader>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
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

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1"><MapPin size={10}/> Endereço Completo</label>
                  <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-emerald-500 uppercase ml-1">Contrato ou Identificação (PDF)</label>
                <input type="file" ref={docInputRef} onChange={handleDocChange} accept="application/pdf" className="hidden" />
                <div 
                  onClick={() => docInputRef.current?.click()}
                  className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all"
                >
                  <span className="text-[10px] text-zinc-500 font-bold uppercase truncate max-w-[200px] sm:max-w-none">
                    {formData.documentoPdfUrl || 'Clique para anexar o documento...'}
                  </span>
                  <FileText size={16} className="text-emerald-500 flex-shrink-0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 sm:p-4 rounded-2xl border border-white/5">
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

              <div className="flex gap-2 sm:gap-3 pt-2">
                {editingParceiro && (
                  <Button variant="destructive" onClick={() => { onDeleteParceiro(editingParceiro.id); setShowParceiroModal(false); }} className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white rounded-2xl uppercase font-black text-[10px] flex-1 py-6 sm:py-7">Excluir</Button>
                )}
                <Button onClick={handleSaveParceiro} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 rounded-2xl uppercase font-black text-[10px] py-6 sm:py-7 tracking-widest shadow-xl shadow-emerald-900/20">Salvar Alterações</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
