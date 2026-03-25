import { useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { Obra, Lancamento } from '@/lib/types';

interface Props {
  obras: Obra[];
  lancamentos: Lancamento[];
}

interface ObraReport {
  obraId: string;
  obraNome: string;
  gastoSemanal: number;
  gastoMensal: number;
  gastoTotal: number;
}

export function RelatoriosObra({ obras, lancamentos }: Props) {
  const reports: ObraReport[] = useMemo(() => {
    const now = new Date();
    
    // Semana fecha na sexta-feira
    const friday = endOfWeek(now, { weekStartsOn: 6 }); // Saturday start = Friday end
    const saturday = startOfWeek(now, { weekStartsOn: 6 });
    
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return obras.map(obra => {
      const obraLanc = lancamentos.filter(l => l.obraId === obra.id);

      const gastoSemanal = obraLanc
        .filter(l => {
          const d = new Date(l.data);
          return isWithinInterval(d, { start: saturday, end: friday });
        })
        .reduce((sum, l) => sum + l.valor, 0);

      const gastoMensal = obraLanc
        .filter(l => {
          const d = new Date(l.data);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, l) => sum + l.valor, 0);

      const gastoTotal = obraLanc.reduce((sum, l) => sum + l.valor, 0);

      return {
        obraId: obra.id,
        obraNome: obra.nome,
        gastoSemanal,
        gastoMensal,
        gastoTotal,
      };
    });
  }, [obras, lancamentos]);

  const totals = useMemo(() => ({
    semanal: reports.reduce((s, r) => s + r.gastoSemanal, 0),
    mensal: reports.reduce((s, r) => s + r.gastoMensal, 0),
    total: reports.reduce((s, r) => s + r.gastoTotal, 0),
  }), [reports]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (obras.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma obra cadastrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semana</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totals.semanal)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Últimos 7 dias (fecha sexta)</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mês</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totals.mensal)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totals.total)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Acumulado histórico</p>
        </div>
      </div>

      {/* Per-obra breakdown */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <span className="text-sm font-semibold">Detalhamento por Obra</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Obra</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Semanal</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Mensal</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.obraId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium">{r.obraNome}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{formatCurrency(r.gastoSemanal)}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{formatCurrency(r.gastoMensal)}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-semibold">{formatCurrency(r.gastoTotal)}</td>
                </tr>
              ))}
              <tr className="bg-primary/5 font-bold">
                <td className="py-3 px-4 text-primary">TOTAL</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-primary">{formatCurrency(totals.semanal)}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-primary">{formatCurrency(totals.mensal)}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-primary">{formatCurrency(totals.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}