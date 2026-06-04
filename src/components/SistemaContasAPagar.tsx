import { useState, useMemo } from 'react';
import { Obra, ContaAPagar } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Search, Calendar, CheckCircle2, AlertCircle, 
  Clock, DollarSign, Check, Trash2, X, Plus 
} from 'lucide-react';

interface Props {
  obras: Obra[];
  contasAPagar: ContaAPagar[];
  onUpdate: (conta: ContaAPagar) => void;
  onDelete: (id: string) => void;
  onAddManual: (conta: Omit<ContaAPagar, 'id'>) => void; // Para despesas que não vêm da obra
}

export function SistemaContasAPagar({ obras, contasAPagar, onUpdate, onDelete, onAddManual }: Props) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'aberto' | 'atrasado' | 'pago'>('todos');

  // Filtra as contas baseado na busca e na aba selecionada
  const contasFiltradas = useMemo(() => {
    return contasAPagar.filter(conta => {
      const matchBusca = conta.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'todos' || conta.status === filtroStatus;
      return matchBusca && matchStatus;
    }).sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
  }, [contasAPagar, busca, filtroStatus]);

  // Resumo Financeiro
  const totalAberto = contasAPagar.filter(c => c.status === 'aberto').reduce((acc, c) => acc + c.valor, 0);
  const totalAtrasado = contasAPagar.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + c.valor, 0);
  const totalPago = contasAPagar.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0);

  const darBaixa = (conta: ContaAPagar) => {
    onUpdate({
      ...conta,
      status: 'pago',
      dataPagamento: new Date().toISOString().split('T')[0]
    });
  };

  const reabrir = (conta: ContaAPagar) => {
    onUpdate({
      ...conta,
      status: 'aberto',
      dataPagamento: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER / CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-400 font-black text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-500" /> A Vencer
          </div>
          <span className="text-2xl font-black text-amber-500">
            R$ {totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-red-500" /> Atrasadas
          </div>
          <span className="text-2xl font-black text-red-500">
            R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pagas
          </div>
          <span className="text-2xl font-black text-emerald-500">
            R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* CONTROLES: Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#121212] p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar despesa..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-zinc-200 outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {(['todos', 'aberto', 'atrasado', 'pago'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap",
                filtroStatus === status 
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-md" 
                  : "bg-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE CONTAS */}
      <div className="space-y-3">
        {contasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/20 rounded-3xl border border-zinc-800 border-dashed">
            <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-bold">Nenhuma conta encontrada nesta categoria.</p>
          </div>
        ) : (
          contasFiltradas.map(conta => {
            const obra = obras.find(o => o.id === conta.obraId);
            const vencimento = new Date(conta.dataVencimento);
            const hoje = new Date();
            // Atualiza status visualmente se estiver atrasado
            const isAtrasado = conta.status !== 'pago' && vencimento < hoje && vencimento.toDateString() !== hoje.toDateString();

            return (
              <div 
                key={conta.id} 
                className={cn(
                  "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all",
                  conta.status === 'pago' ? "bg-zinc-900/30 border-zinc-800 opacity-60" : 
                  isAtrasado ? "bg-red-500/5 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={cn("font-black text-sm", conta.status === 'pago' ? "line-through text-zinc-500" : "text-zinc-200")}>
                      {conta.descricao}
                    </h4>
                    {isAtrasado && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Atrasado</span>}
                  </div>
                  {obra && (
                    <p className="text-xs font-bold text-zinc-500">Obra: <span className="text-zinc-400">{obra.nome}</span></p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-600 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 
                      Vence em: {vencimento.toLocaleDateString('pt-BR')}
                    </span>
                    {conta.dataPagamento && (
                      <span className="flex items-center gap-1 text-emerald-500/70">
                        <CheckCircle2 className="w-3 h-3" /> 
                        Pago em: {new Date(conta.dataPagamento).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-zinc-800 md:border-0 pt-4 md:pt-0">
                  <span className={cn(
                    "text-xl font-black",
                    conta.status === 'pago' ? "text-zinc-500" : isAtrasado ? "text-red-500" : "text-amber-500"
                  )}>
                    R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>

                  <div className="flex gap-2">
                    {conta.status !== 'pago' ? (
                      <Button 
                        onClick={() => darBaixa(conta)}
                        className="bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white font-bold h-9 rounded-xl border border-zinc-700 hover:border-emerald-500 transition-all gap-1 text-xs"
                      >
                        <Check className="w-4 h-4" /> Baixa
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => reabrir(conta)}
                        variant="ghost"
                        className="text-zinc-500 hover:text-zinc-300 font-bold h-9 rounded-xl gap-1 text-xs"
                      >
                        <X className="w-4 h-4" /> Reabrir
                      </Button>
                    )}
                    <Button 
                      onClick={() => onDelete(conta.id)}
                      variant="ghost"
                      className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 h-9 w-9 p-0 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}