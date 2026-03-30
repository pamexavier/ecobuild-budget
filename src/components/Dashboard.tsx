import { useMemo } from 'react';
import { Obra, Lancamento, Profissional } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  obras: Obra[];
  lancamentos: Lancamento[];
  profissionais: Profissional[];
}

export function Dashboard({ obras, lancamentos, profissionais }: Props) {
  const stats = useMemo(() => {
    const totalGasto = lancamentos.reduce((acc, l) => acc + l.valor, 0);
    const totalOrcado = obras.reduce((acc, o) => acc + o.orcamentoLimite, 0);
    
    const gastosPorProf: Record<string, number> = {};
    lancamentos.forEach(l => {
      const nome = l.profissional || 'Desconhecido';
      gastosPorProf[nome] = (gastosPorProf[nome] || 0) + l.valor;
    });
    
    const topProfissionais = Object.entries(gastosPorProf)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { totalGasto, totalOrcado, topProfissionais };
  }, [lancamentos, obras]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-primary uppercase">Gasto Total</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">R$ {stats.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Obras Ativas</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obras.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Equipe</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profissionais.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-primary" /> Saúde Financeira das Obras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {obras.map(obra => {
              const perc = obra.orcamentoLimite > 0 ? (obra.gastoAtual / obra.orcamentoLimite) * 100 : 0;
              const barColor = perc > 90 ? "bg-destructive" : perc > 70 ? "bg-amber-500" : "bg-primary";

              return (
                <div key={obra.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{obra.nome}</span>
                    <span className={perc > 90 ? "text-destructive" : ""}>{perc.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${barColor}`} style={{ width: `${Math.min(perc, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Maiores Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.topProfissionais.map((prof, i) => (
              <div key={prof.nome} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{i + 1}. {prof.nome}</span>
                <span className="font-bold">R$ {prof.total.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}