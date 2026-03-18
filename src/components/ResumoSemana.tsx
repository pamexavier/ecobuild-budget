import { useState, useMemo } from 'react';
import { Download, FileCheck } from 'lucide-react';
import { Lancamento, Obra } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  lancamentos: Lancamento[];
  obras: Obra[];
}

function generateCSVExport(entries: Lancamento[]): string {
  // Group by profissional
  const grouped: Record<string, { total: number; entries: Lancamento[] }> = {};
  entries.forEach(l => {
    if (!grouped[l.profissional]) grouped[l.profissional] = { total: 0, entries: [] };
    grouped[l.profissional].total += l.valor;
    grouped[l.profissional].entries.push(l);
  });

  let csv = 'Profissional;Obra;Categoria;Tipo;Valor;Data\n';
  Object.entries(grouped)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([prof, data]) => {
      data.entries.forEach(l => {
        csv += `${prof};${l.obraNome};${l.categoriaOrcamentoNome};${l.tipo === 'diaria' ? 'Diária' : 'Empreitada'};${l.valor.toFixed(2)};${l.data}\n`;
      });
      csv += `TOTAL ${prof};;;; ${data.total.toFixed(2)};\n`;
    });

  const grandTotal = entries.reduce((s, l) => s + l.valor, 0);
  csv += `\nTOTAL GERAL PIX;;;; ${grandTotal.toFixed(2)};\n`;
  return csv;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResumoSemana({ lancamentos, obras }: Props) {
  const [filtroObra, setFiltroObra] = useState('');

  const filtered = filtroObra ? lancamentos.filter(l => l.obraId === filtroObra) : lancamentos;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekEntries = filtered.filter(l => new Date(l.data) >= startOfWeek);
  const total = weekEntries.reduce((acc, l) => acc + l.valor, 0);

  // PIX summary grouped by profissional
  const pixSummary = useMemo(() => {
    const grouped: Record<string, number> = {};
    weekEntries.forEach(l => {
      grouped[l.profissional] = (grouped[l.profissional] || 0) + l.valor;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [weekEntries]);

  const handleFecharSemana = () => {
    const weekLabel = now.toISOString().split('T')[0];
    const csv = generateCSVExport(weekEntries);
    downloadCSV(csv, `fechamento_semana_${weekLabel}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={filtroObra}
          onChange={e => setFiltroObra(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas as obras</option>
          {obras.map(o => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
        {weekEntries.length > 0 && (
          <Button onClick={handleFecharSemana} variant="outline" className="gap-2 shrink-0">
            <FileCheck className="w-4 h-4" />
            Fechar Semana
          </Button>
        )}
      </div>

      {/* PIX Summary */}
      {pixSummary.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Resumo PIX da Semana</span>
          </div>
          {pixSummary.map(([prof, val]) => (
            <div key={prof} className="flex justify-between text-sm">
              <span className="font-medium">{prof}</span>
              <span className="font-semibold">R$ {val.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="font-bold">Total PIX</span>
            <span className="font-bold text-primary">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Data</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Profissional</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Cat. Orçamento</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Tipo</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {weekEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-sm text-muted-foreground p-4 text-center">
                  Nenhum lançamento nesta semana
                </td>
              </tr>
            ) : (
              weekEntries.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="text-sm p-3">{l.data}</td>
                  <td className="text-sm p-3">{l.profissional}</td>
                  <td className="text-sm p-3">{l.categoriaOrcamentoNome}</td>
                  <td className="text-sm p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      l.tipo === 'diaria' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                    }`}>
                      {l.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                    </span>
                  </td>
                  <td className="text-sm p-3 text-right font-medium">R$ {l.valor.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          {weekEntries.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={4} className="text-sm font-semibold p-3">Total</td>
                <td className="text-sm font-semibold p-3 text-right">R$ {total.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
