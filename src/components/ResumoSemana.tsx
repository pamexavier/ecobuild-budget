import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Building2, User, Printer, Calculator } from 'lucide-react';
import { Lancamento, Obra, Profissional } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  lancamentos: LancamentoResolvido[];
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
          obraNomeResolvido: lancamento.obraNome || obra?.nome || 'Obra nao informada',
          profissionalResolvido: lancamento.profissional || profissional?.nome || 'Profissional nao informado',
          categoriaResolvida: categoria,
          servicoResolvido: lancamento.descricaoEtapa || (lancamento.turnos?.includes('[ADIANTAMENTO]') ? 'Adiantamento' : lancamento.tipo === 'diaria' ? 'Diaria' : 'Empreitada'),
        };
      });

    const obrasAgrupadas: Record<string, ObraAgrupada> = {};
    const totaisPorDia: Record<string, number> = {};

    filtrados.forEach(lancamento => {
      const obraId = lancamento.obraId || 'sem-obra';
      const data = lancamento.data;

      if (!obrasAgrupadas[obraId]) {
        obrasAgrupadas[obraId] = {
          id: obraId,
          nome: lancamento.obraNomeResolvido,
          totalObra: 0,
          dias: {},
        };
      }

      if (!obrasAgrupadas[obraId].dias[data]) {
        obrasAgrupadas[obraId].dias[data] = { totalDia: 0, lancamentos: [] };
      }

      obrasAgrupadas[obraId].totalObra += lancamento.valor;
      obrasAgrupadas[obraId].dias[data].totalDia += lancamento.valor;
      obrasAgrupadas[obraId].dias[data].lancamentos.push(lancamento);
      totaisPorDia[data] = (totaisPorDia[data] || 0) + lancamento.valor;
    });

    const obrasOrdenadas = Object.values(obrasAgrupadas).sort((a, b) => a.nome.localeCompare(b.nome));
    const totalGeral = filtrados.reduce((total, lancamento) => total + lancamento.valor, 0);

    return { obras: obrasOrdenadas, totaisPorDia, totalGeral, totalLancamentos: filtrados.length };
  }, [lancamentos, obras, profissionais, dateFrom, dateTo]);

  return (
    <div className="space-y-6" id="sessao-relatorio-fechamento">
      <div className="flex flex-wrap gap-2 items-center print:hidden bg-card p-4 rounded-lg border">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-xs font-bold uppercase">
              <CalendarIcon className="w-3.5 h-3.5 mr-2" /> De: {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Inicio'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} /></PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-xs font-bold uppercase">
              <CalendarIcon className="w-3.5 h-3.5 mr-2" /> Ate: {dateTo ? format(dateTo, 'dd/MM/yy') : 'Fim'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} /></PopoverContent>
        </Popover>
        <Button onClick={() => window.print()} className="ml-auto font-black uppercase text-xs">
          <Printer className="w-4 h-4 mr-2" /> Imprimir fechamento
        </Button>
      </div>

      <div className="bg-white text-slate-950 rounded-lg border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-400">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">ZENTRA-X</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Fechamento de Pagamentos</h2>
              <p className="text-sm text-slate-600">
                {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Inicio'} ate {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Fim'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase text-slate-500">Total geral</p>
              <p className="text-3xl font-black text-emerald-700">{moeda(dados.totalGeral)}</p>
              <p className="text-xs text-slate-500">{dados.totalLancamentos} pagamento(s)</p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 border-b border-slate-200 md:grid-cols-2">
          <div className="p-5 md:border-r border-slate-200">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-slate-700">
              <Building2 className="w-4 h-4" /> Resumo geral das obras
            </div>
            <div className="space-y-2">
              {dados.obras.length > 0 ? dados.obras.map(obra => (
                <div key={obra.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                  <span className="min-w-0 truncate text-sm font-semibold">{obra.nome}</span>
                  <span className="text-sm font-black text-emerald-700">{moeda(obra.totalObra)}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500">Nenhum pagamento no periodo.</p>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-slate-700">
              <Calculator className="w-4 h-4" /> Resumo por dia
            </div>
            <div className="space-y-2">
              {Object.entries(dados.totaisPorDia).sort(([a], [b]) => a.localeCompare(b)).map(([data, total]) => (
                <div key={data} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm font-semibold">{format(parseDataLocal(data), 'dd/MM/yyyy, EEEE', { locale: ptBR })}</span>
                  <span className="text-sm font-black text-emerald-700">{moeda(total)}</span>
                </div>
              ))}
              {Object.keys(dados.totaisPorDia).length === 0 && (
                <p className="text-sm text-slate-500">Nenhum pagamento no periodo.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {dados.obras.map(obra => (
            <section key={obra.id} className="overflow-hidden rounded-lg border border-slate-300 print:break-inside-avoid">
              <div className="flex flex-col gap-1 bg-slate-900 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-black uppercase tracking-wide">
                  <Building2 className="w-4 h-4" /> {obra.nome}
                </div>
                <div className="text-sm font-black">Total da obra: {moeda(obra.totalObra)}</div>
              </div>

              {Object.entries(obra.dias).sort(([a], [b]) => a.localeCompare(b)).map(([data, info]) => (
                <div key={data} className="border-t border-slate-200">
                  <div className="flex flex-col gap-1 bg-slate-100 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-black uppercase text-slate-600">
                      {format(parseDataLocal(data), 'dd/MM/yyyy, EEEE', { locale: ptBR })}
                    </span>
                    <span className="text-xs font-black uppercase text-slate-700">Total do dia nesta obra: {moeda(info.totalDia)}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-y border-slate-200 bg-white text-[11px] uppercase text-slate-500">
                          <th className="px-4 py-2 font-black">Prestador</th>
                          <th className="px-4 py-2 font-black">Categoria</th>
                          <th className="px-4 py-2 font-black">Obra</th>
                          <th className="px-4 py-2 font-black">Pagamento</th>
                          <th className="px-4 py-2 text-right font-black">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {info.lancamentos.map(lancamento => (
                          <tr key={lancamento.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3 font-bold">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-emerald-700" />
                                {lancamento.profissionalResolvido}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{lancamento.categoriaResolvida}</td>
                            <td className="px-4 py-3 text-slate-700">{lancamento.obraNomeResolvido}</td>
                            <td className="px-4 py-3 text-slate-600">{lancamento.servicoResolvido}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-700">{moeda(lancamento.valor)}</td>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 12mm; }
          body * { visibility: hidden !important; }
          #sessao-relatorio-fechamento, #sessao-relatorio-fechamento * { visibility: visible !important; }
          #sessao-relatorio-fechamento {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
          }
          #sessao-relatorio-fechamento {
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #sessao-relatorio-fechamento .bg-slate-900 {
            background: #0f172a !important;
            color: white !important;
          }
          #sessao-relatorio-fechamento table {
            page-break-inside: auto;
          }
          #sessao-relatorio-fechamento tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}} />
    </div>
  );
}
