import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Check, Clock, DollarSign, Filter, Trash2, UserPlus } from 'lucide-react';
import { Parceiro, Comissao, Obra } from '@/lib/types';

interface Props {
  parceiros: Parceiro[];
  comissoes: Comissao[];
  obras: Obra[];
  onAddParceiro: (p: Omit<Parceiro, 'id'>) => void;
  onAddComissao: (c: Omit<Comissao, 'id' | 'parceiroNome' | 'obraNome'>) => void;
  onUpdateStatus: (id: string, status: 'pendente' | 'pago') => void;
  onDeleteComissao: (id: string) => void;
  onDeleteParceiro: (id: string) => void;
}

const TIPO_LABELS: Record<string, string> = { projeto: 'Projeto', obra: 'Obra', rt: 'RT (Fornecedor)' };

export function GestaoComissoes({ parceiros, comissoes, obras, onAddParceiro, onAddComissao, onUpdateStatus, onDeleteComissao, onDeleteParceiro }: Props) {
  const [showParceiro, setShowParceiro] = useState(false);
  const [showComissao, setShowComissao] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroParceiro, setFiltroParceiro] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Form parceiro
  const [pNome, setPNome] = useState('');
  const [pProjeto, setPProjeto] = useState('');
  const [pObra, setPObra] = useState('');
  const [pRt, setPRt] = useState('');

  // Form comissão
  const [cParceiroId, setCParceiroId] = useState('');
  const [cTipo, setCTipo] = useState<'projeto' | 'obra' | 'rt'>('rt');
  const [cDescricao, setCDescricao] = useState('');
  const [cValorBase, setCValorBase] = useState('');
  const [cObraId, setCObraId] = useState('');

  const selectedParceiro = parceiros.find(p => p.id === cParceiroId);
  const percentualAuto = useMemo(() => {
    if (!selectedParceiro) return 0;
    if (cTipo === 'projeto') return selectedParceiro.comissaoProjetoPct;
    if (cTipo === 'obra') return selectedParceiro.comissaoObraPct;
    return selectedParceiro.comissaoRtPct;
  }, [selectedParceiro, cTipo]);

  const valorComissaoCalc = useMemo(() => {
    const base = parseFloat(cValorBase) || 0;
    return (base * percentualAuto) / 100;
  }, [cValorBase, percentualAuto]);

  const comissoesFiltradas = useMemo(() => {
    return comissoes.filter(c => {
      if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false;
      if (filtroParceiro !== 'todos' && c.parceiroId !== filtroParceiro) return false;
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
      return true;
    });
  }, [comissoes, filtroTipo, filtroParceiro, filtroStatus]);

  const totais = useMemo(() => ({
    aPagar: comissoesFiltradas.filter(c => c.status === 'pendente').reduce((s, c) => s + c.valorComissao, 0),
    pago: comissoesFiltradas.filter(c => c.status === 'pago').reduce((s, c) => s + c.valorComissao, 0),
    projetos: comissoesFiltradas.filter(c => c.tipo === 'projeto').reduce((s, c) => s + c.valorComissao, 0),
    obras: comissoesFiltradas.filter(c => c.tipo === 'obra').reduce((s, c) => s + c.valorComissao, 0),
    rts: comissoesFiltradas.filter(c => c.tipo === 'rt').reduce((s, c) => s + c.valorComissao, 0),
  }), [comissoesFiltradas]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddParceiro = () => {
    if (!pNome) return;
    onAddParceiro({
      nome: pNome,
      comissaoProjetoPct: parseFloat(pProjeto) || 0,
      comissaoObraPct: parseFloat(pObra) || 0,
      comissaoRtPct: parseFloat(pRt) || 0,
    });
    setPNome(''); setPProjeto(''); setPObra(''); setPRt('');
    setShowParceiro(false);
  };

  const handleAddComissao = () => {
    if (!cParceiroId || !cValorBase) return;
    onAddComissao({
      parceiroId: cParceiroId,
      tipo: cTipo,
      descricao: cDescricao || undefined,
      valorBase: parseFloat(cValorBase) || 0,
      percentual: percentualAuto,
      valorComissao: valorComissaoCalc,
      status: 'pendente',
      dataLancamento: new Date().toISOString().split('T')[0],
      obraId: cObraId || undefined,
    });
    setCParceiroId(''); setCTipo('rt'); setCDescricao(''); setCValorBase(''); setCObraId('');
    setShowComissao(false);
  };

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={showParceiro} onOpenChange={setShowParceiro}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="w-4 h-4" /> Novo Parceiro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Parceiro / Colaborador</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <input value={pNome} onChange={e => setPNome(e.target.value)} placeholder="Nome do parceiro" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">% Projeto</label>
                  <input type="number" step="0.1" value={pProjeto} onChange={e => setPProjeto(e.target.value)} placeholder="0" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">% Obra</label>
                  <input type="number" step="0.1" value={pObra} onChange={e => setPObra(e.target.value)} placeholder="0" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">% RT</label>
                  <input type="number" step="0.1" value={pRt} onChange={e => setPRt(e.target.value)} placeholder="0" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <Button onClick={handleAddParceiro} disabled={!pNome} className="w-full">Cadastrar Parceiro</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showComissao} onOpenChange={setShowComissao}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Comissão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Lançar Comissão / RT</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <select value={cParceiroId} onChange={e => setCParceiroId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione o parceiro</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <select value={cTipo} onChange={e => setCTipo(e.target.value as any)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="rt">RT (Reserva Técnica / Fornecedor)</option>
                <option value="projeto">Comissão de Projeto</option>
                <option value="obra">Comissão de Obra</option>
              </select>
              <select value={cObraId} onChange={e => setCObraId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Obra vinculada (opcional)</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
              <input value={cDescricao} onChange={e => setCDescricao(e.target.value)} placeholder="Descrição (ex: Marcenaria João)" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <div>
                <label className="text-sm font-medium block mb-1.5">Valor Base Recebido (R$)</label>
                <input type="number" step="0.01" value={cValorBase} onChange={e => setCValorBase(e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {cParceiroId && cValorBase && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Percentual: <strong>{percentualAuto}%</strong></p>
                  <p className="text-lg font-bold text-primary">Comissão: {fmt(valorComissaoCalc)}</p>
                </div>
              )}
              <Button onClick={handleAddComissao} disabled={!cParceiroId || !cValorBase} className="w-full">Lançar Comissão</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">A Pagar</p>
          <p className="text-lg font-bold text-amber-600">{fmt(totais.aPagar)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Pago</p>
          <p className="text-lg font-bold text-primary">{fmt(totais.pago)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Projetos</p>
          <p className="text-sm font-semibold">{fmt(totais.projetos)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Obras</p>
          <p className="text-sm font-semibold">{fmt(totais.obras)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">RTs</p>
          <p className="text-sm font-semibold">{fmt(totais.rts)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
          <option value="todos">Todos os tipos</option>
          <option value="projeto">Projeto</option>
          <option value="obra">Obra</option>
          <option value="rt">RT</option>
        </select>
        <select value={filtroParceiro} onChange={e => setFiltroParceiro(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
          <option value="todos">Todos os parceiros</option>
          {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      {/* Parceiros cadastrados */}
      {parceiros.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <span className="text-sm font-semibold">Parceiros Cadastrados</span>
          </div>
          <div className="divide-y divide-border">
            {parceiros.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{p.nome}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Proj: {p.comissaoProjetoPct}% · Obra: {p.comissaoObraPct}% · RT: {p.comissaoRtPct}%
                  </span>
                </div>
                <button onClick={() => onDeleteParceiro(p.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de comissões */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <span className="text-sm font-semibold">Lançamentos de Comissão ({comissoesFiltradas.length})</span>
        </div>
        {comissoesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma comissão lançada</div>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {comissoesFiltradas.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      c.status === 'pago' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status === 'pago' ? <Check className="w-3 h-3 inline" /> : <Clock className="w-3 h-3 inline" />}
                      {' '}{c.status}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">{TIPO_LABELS[c.tipo]}</span>
                  </div>
                  <p className="font-medium mt-1">{c.parceiroNome}</p>
                  {c.descricao && <p className="text-xs text-muted-foreground">{c.descricao}</p>}
                  {c.obraNome && <p className="text-xs text-muted-foreground">Obra: {c.obraNome}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {fmt(c.valorBase)} × {c.percentual}% = <strong className="text-primary">{fmt(c.valorComissao)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {c.status === 'pendente' && (
                    <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => onUpdateStatus(c.id, 'pago')}>
                      <DollarSign className="w-3 h-3" /> Pagar
                    </Button>
                  )}
                  {c.status === 'pago' && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onUpdateStatus(c.id, 'pendente')}>
                      Desfazer
                    </Button>
                  )}
                  <button onClick={() => onDeleteComissao(c.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
