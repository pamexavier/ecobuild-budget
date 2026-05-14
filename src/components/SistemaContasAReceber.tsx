import React, { useEffect, useMemo, useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  CircleDollarSign, 
  Plus, 
  Trash2, 
  X, 
  Tag, 
  AlertCircle 
} from 'lucide-react';
import { ContaAReceber, Obra } from '@/lib/types';
import { Button } from '@/components/ui/button';

// --- TIPAGEM E AUXILIARES ---

type StatusFiltro = 'todos' | ContaAReceber['status'];
type TipoFiltro = 'todos' | string;

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarData = (data: Date) =>
  new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const statusEfetivo = (conta: ContaAReceber): ContaAReceber['status'] => {
  if (conta.status === 'pago') return 'pago';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(conta.dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  return vencimento < hoje ? 'atrasado' : 'aberto';
};

const statusClass: Record<ContaAReceber['status'], string> = {
  aberto: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  pago: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  atrasado: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function calcularResumo(contas: ContaAReceber[]) {
  return (contas || []).reduce(
    (acc, conta) => {
      const status = statusEfetivo(conta);
      acc.total += conta.valor;
      if (status === 'pago') acc.recebidas += conta.valor;
      if (status === 'aberto') acc.aReceber += conta.valor;
      if (status === 'atrasado') acc.atrasadas += conta.valor;
      return acc;
    },
    { total: 0, aReceber: 0, recebidas: 0, atrasadas: 0 },
  );
}

// --- SUB-COMPONENTES DE UI ---

function ResumoMini({ label, valor, className }: { label: string; valor: number; className?: string }) {
  return (
    <div className={`rounded-xl border bg-white/[0.03] p-3 ${className || ''}`}>
      <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black text-foreground">{moeda(valor)}</p>
    </div>
  );
}

// --- COMPONENTES PRINCIPAIS ---

export function CardResumoFinanceiro({ obraId, contas = [], onAdicionarConta }: { obraId: string; contas: ContaAReceber[]; onAdicionarConta: () => void }) {
  const contasObra = useMemo(() => contas.filter(c => c.obraId === obraId), [contas, obraId]);
  const resumo = useMemo(() => calcularResumo(contasObra), [contasObra]);
  const percentualRecebido = resumo.total > 0 ? (resumo.recebidas / resumo.total) * 100 : 0;

  return (
    <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Contas a receber</span>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={onAdicionarConta}>
          <Plus className="h-3.5 w-3.5" /> Conta
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ResumoMini label="A receber" valor={resumo.aReceber} className="border-amber-500/20" />
        <ResumoMini label="Recebidas" valor={resumo.recebidas} className="border-emerald-500/20" />
        <ResumoMini label="Atrasadas" valor={resumo.atrasadas} className="border-red-500/20" />
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(percentualRecebido, 100)}%` }} />
      </div>

      {contasObra.length > 0 && (
        <div className="mt-3 space-y-2">
          {contasObra.slice(0, 4).map(conta => {
            const status = statusEfetivo(conta);
            return (
              <div key={conta.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{conta.descricao}</p>
                  <p className="text-muted-foreground text-[10px]">{conta.tipo} · Vence {formatarData(conta.dataVencimento)}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{moeda(conta.valor)}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass[status]}`}>{status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CardDashboardContas({ contas = [], obras = [] }: { contas: ContaAReceber[]; obras: Obra[] }) {
  const resumo = useMemo(() => calcularResumo(contas), [contas]);
  const percentualRecebido = resumo.total > 0 ? (resumo.recebidas / resumo.total) * 100 : 0;
  const obraPorId = useMemo(() => new Map(obras.map(o => [o.id, o.nome])), [obras]);
  const abertas = useMemo(() => {
    return contas
      .filter(c => statusEfetivo(c) !== 'pago')
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
      .slice(0, 5);
  }, [contas]);

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
      <div className="mb-4 flex items-center gap-2">
        <CircleDollarSign className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-wider">Contas a Receber</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResumoMini label="Total" valor={resumo.total} />
        <ResumoMini label="A receber" valor={resumo.aReceber} className="border-amber-500/20" />
        <ResumoMini label="Recebidas" valor={resumo.recebidas} className="border-emerald-500/20" />
        <ResumoMini label="Atrasadas" valor={resumo.atrasadas} className="border-red-500/20" />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-bold text-muted-foreground">
          <span>Taxa de recebimento</span>
          <span>{percentualRecebido.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percentualRecebido, 100)}%` }} />
        </div>
      </div>

      {abertas.length > 0 && (
        <div className="mt-4 space-y-2">
          {abertas.map(conta => (
            <div key={conta.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-bold">{conta.descricao}</p>
                <p className="truncate text-muted-foreground">
                   <span className="text-primary/80 font-medium">{conta.tipo}</span> · {obraPorId.get(conta.obraId) || 'Obra não informada'}
                </p>
              </div>
              <span className="font-black text-primary">{moeda(conta.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GerenciadorContas({ 
  contas = [], 
  obras = [], 
  onAdicionarConta, 
  onAtualizarConta, 
  onDeletarConta, 
  obraInicialId, 
  onObraInicialConsumida 
}: {
  contas: ContaAReceber[];
  obras: Obra[];
  onAdicionarConta: (conta: ContaAReceber) => void;
  onAtualizarConta: (conta: ContaAReceber) => void;
  onDeletarConta: (id: string) => void;
  obraInicialId?: string | null;
  onObraInicialConsumida?: () => void;
}) {
  const [obraFiltro, setObraFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ContaAReceber | null>(null);
  const [obraPadraoModal, setObraPadraoModal] = useState<string | null>(null);

  const obraPorId = useMemo(() => new Map(obras.map(o => [o.id, o.nome])), [obras]);

  // Extrair tipos únicos para o filtro
  const tiposDisponiveis = useMemo(() => {
    const ts = new Set(contas.map(c => c.tipo).filter(Boolean));
    return Array.from(ts).sort();
  }, [contas]);

  useEffect(() => {
    if (!obraInicialId) return;
    setObraFiltro(obraInicialId);
    setObraPadraoModal(obraInicialId);
    setEditando(null);
    setModalAberto(true);
    onObraInicialConsumida?.();
  }, [obraInicialId, onObraInicialConsumida]);

  const contasFiltradas = useMemo(() => {
    return contas
      .filter(conta => !obraFiltro || conta.obraId === obraFiltro)
      .filter(conta => statusFiltro === 'todos' || statusEfetivo(conta) === statusFiltro)
      .filter(conta => tipoFiltro === 'todos' || conta.tipo === tipoFiltro)
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
  }, [contas, obraFiltro, statusFiltro, tipoFiltro]);

  const abrirNovo = () => {
    setEditando(null);
    setObraPadraoModal(obraFiltro || null);
    setModalAberto(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={obraFiltro} onChange={e => setObraFiltro(e.target.value)} className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">Todas as obras</option>
          {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
        </select>

        <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="todos">Todos os tipos</option>
          {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value as StatusFiltro)} className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="todos">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
        </select>

        <Button type="button" className="gap-2" onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-card">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="border-b border-white/[0.06] text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Obra</th>
              <th className="px-4 py-3 text-left">Vencimento</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.map(conta => {
              const status = statusEfetivo(conta);
              return (
                <tr key={conta.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                  <td className="px-4 py-3 font-bold">{conta.descricao}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {conta.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{obraPorId.get(conta.obraId) || '-'}</td>
                  <td className="px-4 py-3">{formatarData(conta.dataVencimento)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass[status]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-primary">{moeda(conta.valor)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {status !== 'pago' && (
                        <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => onAtualizarConta({ ...conta, status: 'pago', dataPagamento: new Date() })}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pagar
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditando(conta); setModalAberto(true); }}>Editar</Button>
                      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => onDeletarConta(conta.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <ModalConta
          obras={obras}
          conta={editando}
          obraInicialId={obraPadraoModal}
          onClose={() => setModalAberto(false)}
          onSalvar={conta => {
            if (editando) onAtualizarConta(conta);
            else onAdicionarConta(conta);
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}

// --- COMPONENTE MODAL DE FORMULÁRIO ---

interface ModalContaProps {
  obras: Obra[];
  conta: ContaAReceber | null;
  obraInicialId?: string | null;
  onClose: () => void;
  onSalvar: (conta: any) => void;
}

function ModalConta({ obras, conta, obraInicialId, onClose, onSalvar }: ModalContaProps) {
  const [formData, setFormData] = useState({
    descricao: conta?.descricao || '',
    valor: conta?.valor || 0,
    dataVencimento: conta?.dataVencimento ? new Date(conta.dataVencimento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    obraId: conta?.obraId || obraInicialId || '',
    tipo: conta?.tipo || 'Medição',
    status: conta?.status || 'aberto'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({
      ...conta,
      ...formData,
      valor: Number(formData.valor),
      dataVencimento: new Date(formData.dataVencimento)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
            {conta ? 'Editar Conta' : 'Nova Conta a Receber'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Descrição</label>
            <input
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Medição Final da Obra"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Valor (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
                value={formData.valor}
                onChange={e => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Tipo</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-primary"
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="Medição">Medição</option>
                <option value="Parcela">Parcela</option>
                <option value="Entrada">Entrada / Sinal</option>
                <option value="Serviço Extra">Serviço Extra</option>
                <option value="Reembolso">Reembolso</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Obra</label>
            <select
              required
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-primary"
              value={formData.obraId}
              onChange={e => setFormData({ ...formData, obraId: e.target.value })}
            >
              <option value="">Selecione uma obra</option>
              {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Data de Vencimento</label>
            <input
              required
              type="date"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
              value={formData.dataVencimento}
              onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1">Salvar Conta</Button>
          </div>
        </form>
      </div>
    </div>
  );
}