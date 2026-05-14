import { useState } from 'react';
import { CheckCircle2, Circle, Calendar, DollarSign, AlertCircle, ChevronDown } from 'lucide-react';

interface ServicoContrato {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  data_inicio: string;
  data_termino: string;
  concluido: boolean;
  percentual_avanco: number;
}

interface ServicosContratoChecklistProps {
  servicos: ServicoContrato[];
  valorTotal: number;
  onMarcarConcluido?: (servicoId: string, concluido: boolean) => void;
}

export function ServicosContratoChecklist({
  servicos,
  valorTotal,
  onMarcarConcluido
}: ServicosContratoChecklistProps) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggleExpandir = (id: string) => {
    const novo = new Set(expandidos);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    setExpandidos(novo);
  };

  const calcularDias = (inicio: string, fim: string) => {
    const d1 = new Date(inicio);
    const d2 = new Date(fim);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const concluidos = servicos.filter(s => s.concluido).length;
  const percentualGeral = servicos.length > 0 ? (concluidos / servicos.length) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* RESUMO GERAL */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Progresso</p>
          <p className="text-xl font-black text-white">{Math.round(percentualGeral)}%</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Concluídos</p>
          <p className="text-xl font-black text-emerald-500">{concluidos}/{servicos.length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Valor Total</p>
          <p className="text-sm font-black text-white">{formatCurrency(valorTotal)}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Serviços</p>
          <p className="text-xl font-black text-white">{servicos.length}</p>
        </div>
      </div>

      {/* BARRA DE PROGRESSO */}
      <div className="space-y-2">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
            style={{ width: `${percentualGeral}%` }}
          />
        </div>
      </div>

      {/* LISTA DE SERVIÇOS */}
      <div className="space-y-3">
        {servicos.map((servico, idx) => (
          <div
            key={servico.id}
            className={`border transition-all rounded-2xl overflow-hidden ${
              servico.concluido 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            {/* HEADER SERVIÇO */}
            <button
              onClick={() => toggleExpandir(servico.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all"
            >
              {/* CHECKBOX */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarcarConcluido?.(servico.id, !servico.concluido);
                }}
                className="flex-shrink-0"
              >
                {servico.concluido ? (
                  <CheckCircle2 size={24} className="text-emerald-500" />
                ) : (
                  <Circle size={24} className="text-zinc-600 hover:text-white" />
                )}
              </button>

              {/* CONTEÚDO */}
              <div className="flex-1 text-left">
                <p className={`text-sm font-black uppercase ${servico.concluido ? 'text-zinc-500 line-through' : 'text-white'}`}>
                  {idx + 1}. {servico.nome}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                    <Calendar size={12} />
                    {formatDate(servico.data_inicio)} - {formatDate(servico.data_termino)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                    <DollarSign size={12} className="text-emerald-500" />
                    {formatCurrency(servico.valor)}
                  </div>
                </div>
              </div>

              {/* PERCENTUAL E EXPANDIR */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-white">{Math.round(servico.percentual_avanco)}%</p>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase">Progresso</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-zinc-500 transition-transform ${expandidos.has(servico.id) ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* EXPANDIDO */}
            {expandidos.has(servico.id) && (
              <div className="border-t border-white/5 p-4 space-y-4 bg-white/[0.01]">
                {servico.descricao && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-2">Descrição</p>
                    <p className="text-sm text-zinc-300">{servico.descricao}</p>
                  </div>
                )}

                {/* BARRA DE PROGRESSO DETALHADA */}
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-[9px] font-black text-zinc-600 uppercase">Andamento</p>
                    <p className="text-[9px] font-black text-emerald-500">{Math.round(servico.percentual_avanco)}%</p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                      style={{ width: `${servico.percentual_avanco}%` }}
                    />
                  </div>
                </div>

                {/* DURAÇÃO */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Duração</p>
                    <p className="text-sm font-black text-white">{calcularDias(servico.data_inicio, servico.data_termino)} dias</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Status</p>
                    <p className={`text-sm font-black ${servico.concluido ? 'text-emerald-500' : 'text-blue-400'}`}>
                      {servico.concluido ? '✓ Concluído' : 'Em Execução'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {servicos.length === 0 && (
        <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-500 font-bold uppercase text-sm">Nenhum serviço no contrato</p>
        </div>
      )}
    </div>
  );
}