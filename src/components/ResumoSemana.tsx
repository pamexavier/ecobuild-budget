import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Building2, User, Printer, Calculator } from 'lucide-react';
import { Lancamento, Obra, Profissional } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Props {
  lancamentos: Lancamento[];
  obras: Obra[];
  profissionais: Profissional[];
}

type LancamentoResolvido = Lancamento & {
  obraNomeResolvido: string;
  profissionalResolvido: string;
  categoriaResolvida: string;
  servicoResolvido: string;
};

type DiaAgrupado = {
  totalDia: number;
  lancamentos: Record<string, LancamentoResolvido>; // Alterado para Record para facilitar agrupamento
};

type ObraAgrupada = {
  id: string;
  nome: string;
  totalObra: number;
  dias: Record<string, DiaAgrupado>;
};

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const parseDataLocal = (data: string) => {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1);
};

export function ResumoSemana({ lancamentos, obras, profissionais }: Props) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  const dados = useMemo(() => {
    const obraPorId = new Map(obras.map(obra => [obra.id, obra]));
    const profissionalPorId = new Map(profissionais.map(profissional => [profissional.id, profissional]));

    const filtrados: LancamentoResolvido[] = lancamentos
      .filter(lancamento => {
        if (!dateFrom || !dateTo) return true;
        return isWithinInterval(parseDataLocal(lancamento.data), {
          start: startOfDay(dateFrom),
          end: endOfDay(dateTo),
        });
      })
      .map(lancamento => {
        const obra = obraPorId.get(lancamento.obraId);
        const profissional = profissionalPorId.get(lancamento.profissionalId);
        const categoria = lancamento.categoriaOrcamentoNome || lancamento.categoria || profissional?.categoria || 'Geral';

        return {
          ...lancamento,
          obraNomeResolvido: lancamento.obraNome || obra?.nome || 'Obra não informada',
          profissionalResolvido: lancamento.profissional || profissional?.nome || 'Profissional não informado',
          categoriaResolvida: categoria,
          servicoResolvido: lancamento.descricaoEtapa || (lancamento.turnos?.includes('[ADIANTAMENTO]') ? 'Adiantamento' : lancamento.tipo === 'diaria' ? 'Diária' : 'Empreitada'),
        };
      });

    const obrasAgrupadas: Record<string, ObraAgrupada> = {};
    const totaisPorDia: Record<string, number> = {};

    filtrados.forEach(lancamento => {
      const obraId = lancamento.obraId || 'sem-obra';
      const data = lancamento.data;
      
      // Chave para agrupar linhas idênticas (Mesmo profissional e mesmo serviço no mesmo dia/obra)
      const chaveAgrupamento = `${lancamento.profissionalId}-${lancamento.servicoResolvido}`;

      if (!obrasAgrupadas[obraId]) {
        obrasAgrupadas[obraId] = {
          id: obraId,
          nome: lancamento.obraNomeResolvido,
          totalObra: 0,
          dias: {},
        };
      }

      if (!obrasAgrupadas[obraId].dias[data]) {
        obrasAgrupadas[obraId].dias[data] = { totalDia: 0, lancamentos: {} };
      }

      const diaAtual = obrasAgrupadas[obraId].dias[data];

      // LÓGICA DE AGRUPAMENTO DE LINHA
      if (diaAtual.lancamentos[chaveAgrupamento]) {
        diaAtual.lancamentos[chaveAgrupamento].valor += lancamento.valor;
      } else {
        diaAtual.lancamentos[chaveAgrupamento] = { ...lancamento };
      }

      obrasAgrupadas[obraId].totalObra += lancamento.valor;
      diaAtual.totalDia += lancamento.valor;
      totaisPorDia[data] = (totaisPorDia[data] || 0) + lancamento.valor;
    });

    const obrasOrdenadas = Object.values(obrasAgrupadas).sort((a, b) => a.nome.localeCompare(b.nome));
    const totalGeral = filtrados.reduce((total, lancamento) => total + lancamento.valor, 0);

    return { obras: obrasOrdenadas, totaisPorDia, totalGeral, totalLancamentos: filtrados.length };
  }, [lancamentos, obras, profissionais, dateFrom, dateTo]);

  return (
    <div className="space-y-6" id="sessao-relatorio-fechamento">
      {/* Controles de Filtro */}
      <div className="flex flex-wrap gap-2 items-center print:hidden bg-card p-4 rounded-lg border">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-xs font-bold uppercase">
              <CalendarIcon className="w-3.5 h-3.5 mr-2" /> De: {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Início'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} /></PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-xs font-bold uppercase">
              <CalendarIcon className="w-3.5 h-3.5 mr-2" /> Até: {dateTo ? format(dateTo, 'dd/MM/yy') : 'Fim'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} /></PopoverContent>
        </Popover>
        <Button onClick={() => window.print()} className="ml-auto font-black uppercase text-xs bg-emerald-600 hover:bg-emerald-700">
          <Printer className="w-4 h-4 mr-2" /> Imprimir fechamento
        </Button>
      </div>

      {/* Relatório Principal */}
      <div className="bg-white text-slate-950 rounded-lg border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-400">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">ZENTRA-X</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Fechamento de Pagamentos</h2>
              <p className="text-sm text-slate-500">
                Período: {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Início'} até {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Fim'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase text-slate-400">Total acumulado</p>
              <p className="text-3xl font-black text-emerald-600">{moeda(dados.totalGeral)}</p>
            </div>
          </div>
        </div>

        {/* Tabelas por Obra */}
        <div className="p-5 space-y-8">
          {dados.obras.map(obra => (
            <section key={obra.id} className="overflow-hidden rounded-xl border border-slate-200 print:break-inside-avoid shadow-sm">
              <div className="flex flex-col gap-1 bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-sm">
                  <Building2 className="w-4 h-4 text-emerald-500" /> {obra.nome}
                </div>
                <div className="text-sm font-black text-emerald-400">Subtotal: {moeda(obra.totalObra)}</div>
              </div>

              {Object.entries(obra.dias).sort(([a], [b]) => a.localeCompare(b)).map(([data, info]) => (
                <div key={data} className="border-t border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50/80 px-5 py-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                      {format(parseDataLocal(data), 'dd/MM/yyyy, EEEE', { locale: ptBR })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                      Total dia: {moeda(info.totalDia)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-y border-slate-100 bg-white text-[9px] uppercase text-slate-400 font-black">
                          <th className="px-5 py-3">Prestador</th>
                          <th className="px-5 py-3">Categoria</th>
                          <th className="px-5 py-3">Tipo / Serviço</th>
                          <th className="px-5 py-3 text-right">Valor Consolidado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(info.lancamentos).map(lancamento => (
                          <tr key={lancamento.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-emerald-600" />
                                {lancamento.profissionalResolvido}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-500">{lancamento.categoriaResolvida}</td>
                            <td className="px-5 py-3 text-slate-500 font-medium">{lancamento.servicoResolvido}</td>
                            <td className="px-5 py-3 text-right font-black text-emerald-700 text-sm">
                              {moeda(lancamento.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>

      {/* Estilo de Impressão */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 15mm; size: A4; }
          body { background: white; }
          .print\\:hidden { display: none !important; }
          #sessao-relatorio-fechamento { visibility: visible !important; width: 100%; }
          .rounded-xl { border-radius: 4px !important; }
          .bg-slate-950 { background: #000 !important; color: #fff !important; }
          .text-emerald-600, .text-emerald-700 { color: #065f46 !important; }
        }
      `}} />
    </div>
  );
}