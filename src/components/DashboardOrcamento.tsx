import { Obra, Lancamento } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

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
  const categoriaData = useMemo(() => {
    const map: Record<string, number> = {};
    lancamentos.forEach(l => {
      map[l.categoria] = (map[l.categoria] || 0) + l.valor;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [lancamentos]);

  return (
    <div className="space-y-4">
      {obras.map(obra => {
        const percent = Math.min((obra.gastoAtual / obra.orcamentoLimite) * 100, 100);
        const overBudget = obra.gastoAtual > obra.orcamentoLimite;

        return (
          <div key={obra.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold">{obra.nome}</span>
              {overBudget && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
            </div>
            <div className="flex justify-between text-sm">
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
            <div className="text-xs font-medium" style={{ color: getStatusColor(percent) }}>
              {percent.toFixed(0)}% utilizado
              {overBudget && ' — Orçamento estourado'}
            </div>
          </div>
        );
      })}

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Distribuição por Categoria</span>
        </div>
        {categoriaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoriaData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(v: number) => `R$ ${v.toFixed(2)}`}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)' }}
              />
              <Bar dataKey="value" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Nenhum dado disponível</p>
        )}
      </div>
    </div>
  );
}
