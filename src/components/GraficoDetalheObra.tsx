import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { X, TrendingUp } from 'lucide-react';
import { Obra, Lancamento } from '@/lib/types';

interface Props {
  obra: Obra;
  lancamentos: Lancamento[];
  onClose: () => void;
}

const CORES = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];
const getCategoria = (lancamento: Lancamento) => lancamento.categoria || 'Mão de Obra';
const moeda = (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const formatarData = (data: string) => new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');

export function GraficoDetalheObra({ obra, lancamentos, onClose }: Props) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);

  const lancamentosObra = useMemo(() => {
    return lancamentos.filter(l => l.obraId === obra.id);
  }, [obra.id, lancamentos]);

  const dadosGrafico = useMemo(() => {
    const categorias: Record<string, number> = {};

    if (lancamentosObra.length === 0) return [];

    lancamentosObra.forEach(l => {
      const cat = getCategoria(l);
      categorias[cat] = (categorias[cat] || 0) + l.valor;
    });

    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [lancamentosObra]);

  const totalGasto = useMemo(() => {
    return dadosGrafico.reduce((total, item) => total + item.value, 0);
  }, [dadosGrafico]);

  const pagamentosCategoria = useMemo(() => {
    if (!categoriaSelecionada) return [];
    return lancamentosObra
      .filter(l => getCategoria(l) === categoriaSelecionada)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [categoriaSelecionada, lancamentosObra]);

  const totalCategoria = pagamentosCategoria.reduce((total, lancamento) => total + lancamento.valor, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0c0c0c] p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-zinc-500 transition-colors hover:text-white"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Insights de Custo</span>
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight text-white">{obra.nome}</h3>
        </div>

        <div className="relative h-[300px] w-full">
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGrafico}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  onClick={(data) => setCategoriaSelecionada(data.name)}
                  className="cursor-pointer"
                >
                  {dadosGrafico.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-500">
              Nenhum dado para exibir nesta obra
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500">Total Gasto</span>
            <span className="text-2xl font-black text-white">
              {moeda(totalGasto)}
            </span>
          </div>
        </div>

        <div className="custom-scrollbar mt-6 grid max-h-40 grid-cols-1 gap-2 overflow-y-auto pr-2">
          {dadosGrafico.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategoriaSelecionada(item.name)}
              className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3 text-left transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CORES[index % CORES.length] }} />
                <span className="text-[11px] font-bold uppercase text-zinc-400">{item.name}</span>
              </div>
              <span className="text-xs font-black text-white">{moeda(item.value)}</span>
            </button>
          ))}
        </div>
      </div>

      {categoriaSelecionada && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0c0c0c] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setCategoriaSelecionada(null)}
              className="absolute right-5 top-5 p-2 text-zinc-500 transition-colors hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pr-10">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500">Pagamentos da categoria</p>
              <h4 className="mt-1 text-xl font-black uppercase text-white">{categoriaSelecionada}</h4>
              <p className="mt-1 text-xs font-medium text-zinc-500">{obra.nome}</p>
            </div>

            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase text-emerald-500">Total da categoria</span>
                <span className="text-lg font-black text-white">{moeda(totalCategoria)}</span>
              </div>
            </div>

            <div className="custom-scrollbar max-h-[420px] space-y-2 overflow-y-auto pr-2">
              {pagamentosCategoria.map(l => (
                <div key={l.id} className="grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-600">Data</p>
                    <p className="text-xs font-bold text-zinc-300">{formatarData(l.data)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-zinc-600">Fornecedor</p>
                    <p className="truncate text-sm font-bold text-white">{l.fornecedor || l.profissional || 'Fornecedor não informado'}</p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">
                      {l.descricaoEtapa || (l.tipo === 'diaria' ? 'Diária' : 'Empreitada')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-black uppercase text-zinc-600">Valor</p>
                    <p className="text-sm font-black text-emerald-400">{moeda(l.valor)}</p>
                  </div>
                </div>
              ))}

              {pagamentosCategoria.length === 0 && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center text-sm font-medium text-zinc-500">
                  Nenhum pagamento encontrado nesta categoria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
