import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { HardHat, Users, TrendingUp, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Obra, Lancamento, Profissional, Comissao } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Props {
  obras: Obra[];
  lancamentos: Lancamento[];
  profissionais: Profissional[];
  comissoes: Comissao[];
}

export function DashboardGeral({ obras, lancamentos, profissionais, comissoes }: Props) {
  const now = new Date();
  const mesInicio = startOfMonth(now);
  const mesFim = endOfMonth(now);

  const gastoMes = useMemo(() => {
    return lancamentos
      .filter(l => {
        const d = new Date(l.data);
        return isWithinInterval(d, { start: mesInicio, end: mesFim });
      })
      .reduce((s, l) => s + l.valor, 0);
  }, [lancamentos, mesInicio, mesFim]);

  const comissoesPendentes = useMemo(() => {
    return comissoes
      .filter(c => c.status === 'pendente')
      .reduce((s, c) => s + c.valorComissao, 0);
  }, [comissoes]);

  const gastoPorObra = useMemo(() => {
    const map: Record<string, number> = {};
    lancamentos.forEach(l => {
      map[l.obraNome] = (map[l.obraNome] || 0) + l.valor;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [lancamentos]);

  const ultimos10 = useMemo(() => {
    return [...lancamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10);
  }, [lancamentos]);

  const kpis = [
    { label: 'Gasto este mês', value: `R$ ${gastoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp },
    { label: 'Obras ativas', value: obras.length, icon: HardHat },
    { label: 'Equipe', value: profissionais.length, icon: Users },
    { label: 'Comissões pendentes', value: `R$ ${comissoesPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{k.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-foreground">{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Gasto por Obra</CardTitle>
          </CardHeader>
          <CardContent>
            {gastoPorObra.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gastoPorObra} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} className="text-[10px]" />
                  <YAxis type="category" dataKey="name" width={100} className="text-[10px]" />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {gastoPorObra.map((_, i) => (
                      <Cell key={i} fill={`hsl(153, 60%, ${28 + i * 5}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Obras progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Orçamento por Obra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[280px] overflow-y-auto">
            {obras.map(o => {
              const pct = o.orcamentoLimite > 0 ? (o.gastoAtual / o.orcamentoLimite) * 100 : 0;
              const color = pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-yellow-500' : 'bg-primary';
              return (
                <div key={o.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate max-w-[60%]">{o.nome}</span>
                    <span className="text-muted-foreground">
                      R$ {o.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {o.orcamentoLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            {obras.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma obra</p>}
          </CardContent>
        </Card>
      </div>

      {/* Last 10 entries */}
      {ultimos10.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Últimos Lançamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3 font-medium">Data</th>
                    <th className="text-left py-2 pr-3 font-medium">Profissional</th>
                    <th className="text-left py-2 pr-3 font-medium">Obra</th>
                    <th className="text-right py-2 pr-3 font-medium">Valor</th>
                    <th className="text-left py-2 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimos10.map(l => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">{l.data}</td>
                      <td className="py-2 pr-3 font-medium">{l.profissional}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{l.obraNome}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-primary">R$ {l.valor.toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          l.tipo === 'diaria' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                        }`}>
                          {l.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
