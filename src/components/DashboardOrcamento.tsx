import { Obra, Lancamento } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  obras: Obra[];
  lancamentos: Lancamento[];
}

function getStatusColor(percent: number): string {
  if (percent > 90) return 'hsl(0, 72%, 51%)';
  if (percent > 70) return 'hsl(40, 100%, 45%)';
  return 'hsl(120, 61%, 34%)';
}

function getStatusClass(percent: number): string {
  if (percent > 90) return 'bg-destructive';
  if (percent > 70) return 'bg-warning';
  return 'bg-success';
}

export function DashboardOrcamento({ obras, lancamentos }: Props) {
  const categoriaData = useMemo(() => {
    const map: Record<string, number> = {};
    lancamentos.forEach(l => {
      const cat = l.categoria;
      map[cat] = (map[cat] || 0) + l.valor;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [lancamentos]);

  return (
    <div className="space-y-6">
      {/* Obra cards */}
      {obras.map(obra => {
        const percent = Math.min((obra.gastoAtual / obra.orcamentoLimite) * 100, 100);
        const overBudget = obra.gastoAtual > obra.orcamentoLimite;

        return (
          <div key={obra.id} className="border-2 border-foreground p-4">
            <div className="font-mono text-xs font-bold tracking-wider mb-3">{obra.nome}</div>
            <div className="flex justify-between font-mono text-sm mb-2">
              <span>
                R$ {obra.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-muted-foreground">
                / R$ {obra.orcamentoLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full h-3 bg-secondary border border-foreground">
              <div
                className={`h-full transition-all duration-500 ${getStatusClass(percent)}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-xs font-bold" style={{ color: getStatusColor(percent) }}>
                {percent.toFixed(0)}%
              </span>
              {overBudget && (
                <span className="font-mono text-xs font-bold text-destructive">ESTOURADO</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Chart by category */}
      {categoriaData.length > 0 && (
        <div className="border-2 border-foreground p-4">
          <div className="font-mono text-xs font-bold tracking-wider mb-4">DISTRIBUIÇÃO POR CATEGORIA</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoriaData} layout="vertical">
              <XAxis type="number" tick={{ fontFamily: 'Roboto Mono', fontSize: 10 }} tickFormatter={v => `R$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Roboto Mono', fontSize: 10 }} width={80} />
              <Tooltip
                formatter={(v: number) => `R$ ${v.toFixed(2)}`}
                contentStyle={{ fontFamily: 'Roboto Mono', fontSize: 12, border: '2px solid #1C1C1C', borderRadius: 0 }}
              />
              <Bar dataKey="value" fill="hsl(120, 61%, 34%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {categoriaData.length === 0 && (
        <div className="border-2 border-foreground p-4">
          <div className="font-mono text-xs font-bold tracking-wider mb-2">DISTRIBUIÇÃO POR CATEGORIA</div>
          <div className="font-mono text-xs text-muted-foreground py-4">NENHUM DADO DISPONÍVEL</div>
        </div>
      )}
    </div>
  );
}
