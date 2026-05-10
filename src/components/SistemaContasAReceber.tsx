import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, CircleDollarSign, Plus, Trash2, X } from 'lucide-react';
import { ContaAReceber, Obra } from '@/lib/types';
import { Button } from '@/components/ui/button';

type StatusFiltro = 'todos' | ContaAReceber['status'];

interface CardResumoFinanceiroProps {
  obraId: string;
  contas: ContaAReceber[];
  onAdicionarConta: () => void;
}

interface CardDashboardContasProps {
  contas: ContaAReceber[];
  obras: Obra[];
}

interface GerenciadorContasProps {
  contas: ContaAReceber[];
  obras: Obra[];
  onAdicionarConta: (conta: ContaAReceber) => void;
  onAtualizarConta: (conta: ContaAReceber) => void;
  onDeletarConta: (contaId: string) => void;
  obraInicialId?: string | null;
  onObraInicialConsumida?: () => void;
}

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dataInput = (data?: Date) => {
  if (!data) return '';
  return new Date(data).toISOString().split('T')[0];
};

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
  return contas.reduce(
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

export function CardResumoFinanceiro({ obraId, contas, onAdicionarConta }: CardResumoFinanceiroProps) {
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
                  <p className="text-muted-foreground">Vence {formatarData(conta.dataVencimento)}</p>
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

function ResumoMini({ label, valor, className }: { label: string; valor: number; className?: string }) {
  return (
    <div className={`rounded-xl border bg-white/[0.03] p-3 ${className || ''}`}>
      <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black text-foreground">{moeda(valor)}</p>
    </div>
  );
}

export function CardDashboardContas({ contas, obras }: CardDashboardContasProps) {
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
                <p className="truncate text-muted-foreground">{obraPorId.get(conta.obraId) || 'Obra não informada'} · {formatarData(conta.dataVencimento)}</p>
              </div>
              <span className="font-black text-primary">{moeda(conta.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GerenciadorContas({ contas, obras, onAdicionarConta, onAtualizarConta, onDeletarConta, obraInicialId, onObraInicialConsumida }: GerenciadorContasProps) {
  const [obraFiltro, setObraFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ContaAReceber | null>(null);
  const [obraPadraoModal, setObraPadraoModal] = useState<string | null>(null);
  const obraPorId = useMemo(() => new Map(obras.map(o => [o.id, o.nome])), [obras]);

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
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
  }, [contas, obraFiltro, statusFiltro]);

  const abrirNovo = () => {
    setEditando(null);
    setObraPadraoModal(obraFiltro || null);
    setModalAberto(true);
  };

  const marcarPago = (conta: ContaAReceber) => {
    onAtualizarConta({ ...conta, status: 'pago', dataPagamento: new Date() });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={obraFiltro} onChange={e => setObraFiltro(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
          <option value="">Todas as obras</option>
          {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
        </select>
        <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value as StatusFiltro)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
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
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-white/[0.06] text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Descrição</th>
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
                <tr key={conta.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3 font-bold">{conta.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground">{obraPorId.get(conta.obraId) || '-'}</td>
                  <td className="px-4 py-3">{formatarData(conta.dataVencimento)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass[status]}`}>{status}</span></td>
                  <td className="px-4 py-3 text-right font-black text-primary">{moeda(conta.valor)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {status !== 'pago' && (
                        <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => marcarPago(conta)}>
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
            {contasFiltradas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhuma conta encontrada</td></tr>
            )}
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

function ModalConta({ obras, conta, obraInicialId, onClose, onSalvar }: { obras: Obra[]; conta: ContaAReceber | null; obraInicialId?: string | null; onClose: () => void; onSalvar: (conta: ContaAReceber) => void }) {
  const [obraId, setObraId] = useState(conta?.obraId || obraInicialId || obras[0]?.id || '');
  const [descricao, setDescricao] = useState(conta?.descricao || '');
  const [valor, setValor] = useState(conta?.valor ? String(conta.valor) : '');
  const [dataVencimento, setDataVencimento] = useState(dataInput(conta?.dataVencimento));
  const [observacoes, setObservacoes] = useState(conta?.observacoes || '');

  const salvar = () => {
    if (!obraId || !descricao || !valor || !dataVencimento) return;
    onSalvar({
      id: conta?.id || crypto.randomUUID(),
      obraId,
      descricao,
      valor: Number(valor),
      dataVencimento: new Date(`${dataVencimento}T00:00:00`),
      status: conta?.status || 'aberto',
      dataPagamento: conta?.dataPagamento,
      observacoes: observacoes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.08] bg-background p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-black uppercase">{conta ? 'Editar Conta' : 'Nova Conta a Receber'}</h3>
        </div>
        <div className="space-y-3">
          <select value={obraId} onChange={e => setObraId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
          </select>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição / NF" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor R$" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
            <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
          </div>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações" className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />
          <Button type="button" className="w-full py-6 font-bold" disabled={!obraId || !descricao || !valor || !dataVencimento} onClick={salvar}>
            Salvar Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
