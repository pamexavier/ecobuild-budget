import { useState, useMemo, useRef } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, FileCheck, Copy, Check, CalendarIcon, Building2, User, Key } from 'lucide-react';
import { Lancamento, Obra, Profissional } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Props {
  lancamentos: Lancamento[];
  obras: Obra[];
  profissionais: Profissional[];
}

interface ObraGroup {
  obraId: string;
  obraNome: string;
  total: number;
  profissionais: {
    profissionalId: string;
    nome: string;
    chavePix?: string;
    total: number;
    lancamentos: Lancamento[];
  }[];
}

function generateCSVExport(groups: ObraGroup[]): string {
  let csv = 'Obra;Profissional;Chave PIX;Categoria;Tipo;Valor;Data\n';
  let grandTotal = 0;
  groups.forEach(g => {
    g.profissionais.forEach(p => {
      p.lancamentos.forEach(l => {
        csv += `${g.obraNome};${p.nome};${p.chavePix || 'N/A'};${l.categoriaOrcamentoNome};${l.tipo === 'diaria' ? 'Diária' : 'Empreitada'};${l.valor.toFixed(2)};${l.data}\n`;
      });
      csv += `;;SUBTOTAL ${p.nome};;;${p.total.toFixed(2)};\n`;
    });
    csv += `;TOTAL ${g.obraNome};;;;${g.total.toFixed(2)};\n\n`;
    grandTotal += g.total;
  });
  csv += `TOTAL GERAL PIX;;;;;${grandTotal.toFixed(2)};\n`;
  return csv;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generatePDFContent(groups: ObraGroup[], dateLabel: string): string {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resumo Semanal - ZENTRA-X</title>
<style>
body{font-family:Arial,sans-serif;padding:40px;color:#1a2a1f}
h1{color:#1a6b3c;font-size:22px;border-bottom:3px solid #1a6b3c;padding-bottom:8px}
h2{color:#1a6b3c;font-size:16px;margin-top:24px;background:#e8f5e9;padding:8px 12px;border-radius:6px}
h3{font-size:14px;margin:12px 0 4px;color:#2e7d52}
table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:13px}
th{background:#1a6b3c;color:white;padding:8px 10px;text-align:left}
td{padding:6px 10px;border-bottom:1px solid #ddd}
.total-row{font-weight:bold;background:#f0faf3}
.grand-total{font-size:18px;text-align:right;margin-top:20px;padding:12px;background:#1a6b3c;color:white;border-radius:8px}
.pix{color:#666;font-size:12px}
.header{display:flex;justify-content:space-between;align-items:center}
.period{color:#666;font-size:14px}
</style></head><body>
<div class="header"><h1>ZENTRA-X — Resumo Semanal</h1></div>
<p class="period">Período: ${dateLabel}</p>`;

  let grandTotal = 0;
  groups.forEach(g => {
    html += `<h2>🏗️ ${g.obraNome} — Total: R$ ${g.total.toFixed(2)}</h2>`;
    g.profissionais.forEach(p => {
      html += `<h3>👷 ${p.nome} ${p.chavePix ? `<span class="pix">PIX: ${p.chavePix}</span>` : ''}</h3>`;
      html += `<table><thead><tr><th>Data</th><th>Categoria</th><th>Tipo</th><th style="text-align:right">Valor</th></tr></thead><tbody>`;
      p.lancamentos.forEach(l => {
        html += `<tr><td>${l.data}</td><td>${l.categoriaOrcamentoNome}</td><td>${l.tipo === 'diaria' ? 'Diária' : 'Empreitada'}</td><td style="text-align:right">R$ ${l.valor.toFixed(2)}</td></tr>`;
      });
      html += `<tr class="total-row"><td colspan="3">Subtotal ${p.nome}</td><td style="text-align:right">R$ ${p.total.toFixed(2)}</td></tr>`;
      html += `</tbody></table>`;
    });
    grandTotal += g.total;
  });

  html += `<div class="grand-total">Total Geral PIX: R$ ${grandTotal.toFixed(2)}</div>`;
  html += `<p style="text-align:center;margin-top:30px;color:#999;font-size:11px">ZENTRA-X · Gestão Inteligente · Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>`;
  html += `</body></html>`;
  return html;
}

export function ResumoSemana({ lancamentos, obras, profissionais }: Props) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const now = new Date();
  const defaultStart = subDays(now, 6);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(defaultStart);
  const [dateTo, setDateTo] = useState<Date | undefined>(now);

  const filtered = useMemo(() => {
    if (!dateFrom || !dateTo) return lancamentos;
    return lancamentos.filter(l => {
      const d = new Date(l.data);
      return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
    });
  }, [lancamentos, dateFrom, dateTo]);

  const groups: ObraGroup[] = useMemo(() => {
    const obraMap: Record<string, ObraGroup> = {};
    filtered.forEach(l => {
      if (!obraMap[l.obraId]) {
        obraMap[l.obraId] = { obraId: l.obraId, obraNome: l.obraNome, total: 0, profissionais: [] };
      }
      const group = obraMap[l.obraId];
      let prof = group.profissionais.find(p => p.profissionalId === l.profissionalId);
      if (!prof) {
        const profData = profissionais.find(p => p.id === l.profissionalId);
        prof = {
          profissionalId: l.profissionalId,
          nome: l.profissional,
          chavePix: profData?.chavePix,
          total: 0,
          lancamentos: [],
        };
        group.profissionais.push(prof);
      }
      prof.total += l.valor;
      prof.lancamentos.push(l);
      group.total += l.valor;
    });
    return Object.values(obraMap).sort((a, b) => b.total - a.total);
  }, [filtered, profissionais]);

  const grandTotal = groups.reduce((s, g) => s + g.total, 0);

  const dateLabel = dateFrom && dateTo
    ? `${format(dateFrom, 'dd/MM/yyyy')} a ${format(dateTo, 'dd/MM/yyyy')}`
    : 'Período não definido';

  const handleCopyPix = (profName: string, chavePix: string) => {
    navigator.clipboard.writeText(chavePix);
    setCopiedId(profName);
    toast({ title: 'PIX copiado!', description: `Chave de ${profName} copiada.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const csv = generateCSVExport(groups);
    downloadFile(csv, `resumo_semanal_${format(now, 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportPDF = () => {
    const html = generatePDFContent(groups, dateLabel);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("gap-2 text-sm", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="w-4 h-4" />
              {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Data início'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-sm">até</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("gap-2 text-sm", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="w-4 h-4" />
              {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Data fim'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex gap-2">
          {groups.length > 0 && (
            <>
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-1.5">
                <FileCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Fechar Semana (CSV)</span>
              </Button>
              <Button onClick={handleExportPDF} variant="default" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Gerar PDF</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grand total */}
      {groups.length > 0 && (
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">Total PIX do Período</span>
          </div>
          <span className="text-xl font-bold text-primary">R$ {grandTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Grouped by Obra */}
      {groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Nenhum lançamento no período selecionado</p>
        </div>
      ) : (
        groups.map(group => (
          <div key={group.obraId} className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Obra header */}
            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-primary/20">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">{group.obraNome}</span>
              </div>
              <span className="font-bold text-primary text-sm">R$ {group.total.toFixed(2)}</span>
            </div>

            {/* Profissionais */}
            <div className="divide-y divide-border">
              {group.profissionais.sort((a, b) => b.total - a.total).map(prof => (
                <div key={prof.profissionalId} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{prof.nome}</span>
                    </div>
                    <span className="font-bold text-sm">R$ {prof.total.toFixed(2)}</span>
                  </div>

                  {/* Chave PIX */}
                  {prof.chavePix && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                      <Key className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{prof.chavePix}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={() => handleCopyPix(prof.nome, prof.chavePix!)}
                      >
                        {copiedId === prof.nome ? (
                          <><Check className="w-3 h-3 text-primary" /> Copiado</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copiar PIX</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Lancamentos detail */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-1 pr-3 font-medium">Data</th>
                          <th className="text-left py-1 pr-3 font-medium">Categoria</th>
                          <th className="text-left py-1 pr-3 font-medium">Tipo</th>
                          <th className="text-right py-1 font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prof.lancamentos.map(l => (
                          <tr key={l.id} className="border-t border-border/50">
                            <td className="py-1.5 pr-3">{l.data}</td>
                            <td className="py-1.5 pr-3">{l.categoriaOrcamentoNome}</td>
                            <td className="py-1.5 pr-3">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                l.tipo === 'diaria' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                              }`}>
                                {l.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                              </span>
                            </td>
                            <td className="py-1.5 text-right font-medium">R$ {l.valor.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
