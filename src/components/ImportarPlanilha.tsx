import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';
import { Lancamento, Obra } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  obras: Obra[];
  onImport: (items: Omit<Lancamento, 'id'>[]) => void;
}

interface ParsedRow {
  obraNome: string;
  profissional: string;
  categoria: string;
  valor: string;
  data: string;
  error?: string;
}

export function ImportarPlanilha({ obras, onImport }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({ obraNome: '', profissional: '', categoria: '', valor: '', data: '' });
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');

  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;
    const hdrs = lines[0].split(/[,;]/).map(h => h.trim());
    setHeaders(hdrs);
    const dataRows = lines.slice(1).map(l => l.split(/[,;]/).map(c => c.trim()));
    setRawRows(dataRows);

    const autoMap: Record<string, string> = { obraNome: '', profissional: '', categoria: '', valor: '', data: '' };
    hdrs.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes('obra')) autoMap.obraNome = String(i);
      if (lower.includes('prestador') || lower.includes('profissional') || lower.includes('nome')) autoMap.profissional = String(i);
      if (lower.includes('categoria') || lower.includes('tipo')) autoMap.categoria = String(i);
      if (lower.includes('valor')) autoMap.valor = String(i);
      if (lower.includes('data')) autoMap.data = String(i);
    });
    setMapping(autoMap);
    setStep('map');
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target?.result as string);
    reader.readAsText(file);
  };

  const applyMapping = () => {
    const parsed: ParsedRow[] = rawRows.map(row => {
      const obraNome = mapping.obraNome ? row[parseInt(mapping.obraNome)] || '' : '';
      const profissional = mapping.profissional ? row[parseInt(mapping.profissional)] || '' : '';
      const categoria = mapping.categoria ? row[parseInt(mapping.categoria)] || '' : '';
      const valorStr = mapping.valor ? row[parseInt(mapping.valor)] || '' : '';
      const data = mapping.data ? row[parseInt(mapping.data)] || '' : '';
      const valorNum = parseFloat(valorStr.replace(',', '.'));
      const error = isNaN(valorNum) ? 'Valor inválido' : undefined;
      return { obraNome, profissional: profissional.toUpperCase(), categoria: categoria.toUpperCase(), valor: valorStr, data, error };
    });
    setRows(parsed);
    setStep('preview');
  };

  const handleConfirm = () => {
    const valid = rows.filter(r => !r.error);
    const items: Omit<Lancamento, 'id'>[] = valid.map(r => {
      const obra = obras.find(o => o.nome.toLowerCase().includes(r.obraNome.toLowerCase()));
      return {
        obraId: obra?.id || obras[0]?.id || '1',
        obraNome: obra?.nome || r.obraNome,
        profissionalId: '',
        profissional: r.profissional,
        categoria: r.categoria,
        categoriaOrcamentoId: obra?.categorias?.[0]?.id || '',
        categoriaOrcamentoNome: obra?.categorias?.[0]?.nome || '',
        tipo: 'diaria' as const,
        turnos: ['Manhã'],
        valor: parseFloat(r.valor.replace(',', '.')),
        data: r.data || new Date().toISOString().split('T')[0],
      };
    });
    onImport(items);
    reset();
  };

  const reset = () => {
    setStep('upload');
    setRows([]);
    setFileName('');
    setHeaders([]);
    setRawRows([]);
  };

  if (step === 'upload') {
    return (
      <div>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-input p-8 flex flex-col items-center gap-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <FileSpreadsheet className="w-8 h-8 text-primary/50" />
          <span>Importar Planilha (.csv)</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  if (step === 'map') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{fileName}</span>
          <button onClick={reset} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm font-semibold">Mapeamento de Colunas</p>
        {(['obraNome', 'profissional', 'categoria', 'valor', 'data'] as const).map(field => (
          <div key={field} className="flex items-center gap-3">
            <span className="text-sm font-medium w-28 capitalize">{field === 'obraNome' ? 'Obra' : field}</span>
            <select
              value={mapping[field]}
              onChange={e => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">—</option>
              {headers.map((h, i) => <option key={i} value={String(i)}>{h}</option>)}
            </select>
          </div>
        ))}
        <Button onClick={applyMapping} className="w-full">Visualizar Preview</Button>
      </div>
    );
  }

  const hasErrors = rows.some(r => r.error);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Preview — {rows.length} linhas</span>
        <button onClick={reset} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Obra</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Prof.</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Cat.</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-right">Valor</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-b border-border last:border-0 ${r.error ? 'bg-destructive/5' : ''}`}>
                <td className="text-xs p-2.5">{r.obraNome}</td>
                <td className="text-xs p-2.5">{r.profissional}</td>
                <td className="text-xs p-2.5">{r.categoria}</td>
                <td className={`text-xs p-2.5 text-right ${r.error ? 'text-destructive font-semibold' : ''}`}>
                  {r.valor} {r.error && <span className="block text-[10px]">{r.error}</span>}
                </td>
                <td className="text-xs p-2.5">{r.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasErrors && <p className="text-xs text-destructive font-medium">Linhas com erro serão ignoradas</p>}
      <Button onClick={handleConfirm} className="w-full">Confirmar Importação</Button>
    </div>
  );
}
