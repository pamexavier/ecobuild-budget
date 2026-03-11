import { Obra, Lancamento } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Layers } from 'lucide-react';

interface Props {
  obras: Obra[];
  lancamentos: Lancamento[];
}

function getStatusColor(percent: number): string {
  if (percent > 90) return 'hsl(0, 72%, 51%)';
  if (percent > 70) return 'hsl(40, 100%, 50%)';
  return 'hsl(160, 84%, 39%)';
}

function getBarClass(percent: number): string {
  if (percent > 90) return 'bg-destructive';
  if (percent > 70) return 'bg-warning';
  return 'bg-primary';
}

export function DashboardOrcamento({ obras, lancamentos }: Props) {
  // Per-obra, per-category realizado vs previsto
  const obrasCategoriaData = useMemo(() => {
    return obras.map(obra => {
      const obraLancamentos = lancamentos.filter(l => l.obraId === obra.id);
      const categoriasComGasto = obra.categorias.map(cat => {
        const gasto = obraLancamentos
          .filter(l => l.categoriaOrcamentoId === cat.id)
          .reduce((sum, l) => sum + l.valor, 0);
        return {
          nome: cat.nome,
          previsto: cat.valorPrevisto,
          realizado: gasto,
          percent: cat.valorPrevisto > 0 ? (gasto / cat.valorPrevisto) * 100 : 0,
        };
      });
      return { obra, categoriasComGasto };
    });
  }, [obras, lancamentos]);

  return (
    <div className="space-y-4">
      {obrasCategoriaData.map(({ obra, categoriasComGasto }) => {
        const percent = Math.min((obra.gastoAtual / obra.orcamentoLimite) * 100, 100);
        const overBudget = obra.gastoAtual > obra.orcamentoLimite;

        return (
          <div key={obra.id} className="rounded-lg border border-border bg-card p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold">{obra.nome}</span>
              {overBudget && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
            </div>

            {/* Total bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  R$ {obra.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">
                  / R$ {obra.orcamentoLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarClass(percent)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: getStatusColor(percent) }}>
                {percent.toFixed(0)}% utilizado
                {overBudget && ' — Orçamento estourado'}
              </div>
            </div>

            {/* Category breakdown */}
            {categoriasComGasto.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Por Categoria</span>
                </div>
                {categoriasComGasto.map(cat => {
                  const catPercent = Math.min(cat.percent, 100);
                  return (
                    <div key={cat.nome} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{cat.nome}</span>
                        <span className="text-muted-foreground">
                          R$ {cat.realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {' / '}
                          R$ {cat.previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getBarClass(cat.percent)}`}
                          style={{ width: `${catPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Chart: Realizado vs Previsto */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Realizado vs. Previsto por Categoria</span>
        </div>
        {(() => {
          const allCats: Record<string, { previsto: number; realizado: number }> = {};
          obras.forEach(obra => {
            const obraLanc = lancamentos.filter(l => l.obraId === obra.id);
            obra.categorias.forEach(cat => {
              if (!allCats[cat.nome]) allCats[cat.nome] = { previsto: 0, realizado: 0 };
              allCats[cat.nome].previsto += cat.valorPrevisto;
              allCats[cat.nome].realizado += obraLanc
                .filter(l => l.categoriaOrcamentoId === cat.id)
                .reduce((s, l) => s + l.valor, 0);
            });
          });
          const chartData = Object.entries(allCats).map(([name, vals]) => ({ name, ...vals }));

          return chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  formatter={(v: number, name: string) => [`R$ ${v.toFixed(2)}`, name === 'previsto' ? 'Previsto' : 'Realizado']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)' }}
                />
                <Legend formatter={(value) => value === 'previsto' ? 'Previsto' : 'Realizado'} />
                <Bar dataKey="previsto" fill="hsl(210, 15%, 80%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="realizado" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Nenhum dado disponível</p>
          );
        })()}
      </div>
    </div>
  );
}
