import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, Download } from 'lucide-react';
import { Lancamento, Obra } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  obras: Obra[];
  onImport: (items: Omit<Lancamento, 'id'>[]) => void;
}

interface ParsedRow {
  data: string;
  obraNome: string;
  profissional: string;
  categoria: string;
  tipo: string;
  valor: string;
  turnos: string;
  error?: string;
}

const CSV_TEMPLATE = `Data;Obra;Profissional;Categoria;Tipo;Valor;Turnos
2025-03-18;Residencial Verde;CARLOS SILVA;Fundação;Diária;250;Manhã,Tarde
2025-03-18;Residencial Verde;ANA RODRIGUES;Elétrica;Empreitada;1500;
2025-03-19;Edifício Horizonte;ROBERTO SANTOS;Hidráulica;Diária;300;Manhã`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_lancamentos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportarPlanilha({ obras, onImport }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({
    data: '', obraNome: '', profissional: '', categoria: '', tipo: '', valor: '', turnos: '',
  });
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');

  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;
    const hdrs = lines[0].split(/[,;]/).map(h => h.trim());
    setHeaders(hdrs);
    const dataRows = lines.slice(1).map(l => l.split(/[,;]/).map(c => c.trim()));
    setRawRows(dataRows);

    const autoMap: Record<string, string> = { data: '', obraNome: '', profissional: '', categoria: '', tipo: '', valor: '', turnos: '' };
    hdrs.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes('data')) autoMap.data = String(i);
      if (lower.includes('obra')) autoMap.obraNome = String(i);
      if (lower.includes('prestador') || lower.includes('profissional')) autoMap.profissional = String(i);
      if (lower.includes('categoria')) autoMap.categoria = String(i);
      if (lower.includes('tipo')) autoMap.tipo = String(i);
      if (lower.includes('valor')) autoMap.valor = String(i);
      if (lower.includes('turno')) autoMap.turnos = String(i);
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
      const data = mapping.data ? row[parseInt(mapping.data)] || '' : '';
      const obraNome = mapping.obraNome ? row[parseInt(mapping.obraNome)] || '' : '';
      const profissional = mapping.profissional ? row[parseInt(mapping.profissional)] || '' : '';
      const categoria = mapping.categoria ? row[parseInt(mapping.categoria)] || '' : '';
      const tipo = mapping.tipo ? row[parseInt(mapping.tipo)] || '' : '';
      const valorStr = mapping.valor ? row[parseInt(mapping.valor)] || '' : '';
      const turnos = mapping.turnos ? row[parseInt(mapping.turnos)] || '' : '';
      const valorNum = parseFloat(valorStr.replace(',', '.'));
      const error = isNaN(valorNum) ? 'Valor inválido' : undefined;
      return { data, obraNome, profissional: profissional.toUpperCase(), categoria: categoria.toUpperCase(), tipo, valor: valorStr, turnos, error };
    });
    setRows(parsed);
    setStep('preview');
  };

  const handleConfirm = () => {
    const valid = rows.filter(r => !r.error);
    const items: Omit<Lancamento, 'id'>[] = valid.map(r => {
      const obra = obras.find(o => o.nome.toLowerCase().includes(r.obraNome.toLowerCase()));
      const tipoNorm = r.tipo.toLowerCase().includes('empreitada') ? 'empreitada' : 'diaria';
      const turnosList = r.turnos ? r.turnos.split(',').map(t => t.trim()).filter(Boolean) : ['Manhã'];
      const valorNum = parseFloat(r.valor.replace(',', '.'));

      // Auto-detect budget category from the obra
      const catName = r.categoria.charAt(0).toUpperCase() + r.categoria.slice(1).toLowerCase();
      const obraCat = obra?.categorias?.find(c => c.nome.toLowerCase() === catName.toLowerCase());

      // For diária, calculate proportional value
      let valorFinal = valorNum;
      if (tipoNorm === 'diaria' && turnosList.length > 0 && turnosList.length < 3) {
        valorFinal = (valorNum / 3) * turnosList.length;
      }

      return {
        obraId: obra?.id || obras[0]?.id || '1',
        obraNome: obra?.nome || r.obraNome,
        profissionalId: '',
        profissional: r.profissional,
        categoria: r.categoria,
        categoriaOrcamentoId: obraCat?.id || '',
        categoriaOrcamentoNome: obraCat?.nome || catName,
        tipo: tipoNorm as 'diaria' | 'empreitada',
        turnos: tipoNorm === 'diaria' ? turnosList : [],
        valor: valorFinal,
        valorDiaria: tipoNorm === 'diaria' ? valorNum : undefined,
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

  const FIELD_LABELS: Record<string, string> = {
    data: 'Data', obraNome: 'Obra', profissional: 'Profissional',
    categoria: 'Categoria', tipo: 'Tipo', valor: 'Valor', turnos: 'Turnos',
  };

  if (step === 'upload') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-input p-8 flex flex-col items-center gap-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <FileSpreadsheet className="w-8 h-8 text-primary/50" />
          <span>Importar Planilha (.csv)</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />

        <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Baixar Modelo de Planilha (.csv)
        </Button>
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
        {Object.keys(FIELD_LABELS).map(field => (
          <div key={field} className="flex items-center gap-3">
            <span className="text-sm font-medium w-28">{FIELD_LABELS[field]}</span>
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
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Data</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Obra</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Prof.</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Cat.</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Tipo</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-right">Valor</th>
              <th className="text-xs font-medium text-muted-foreground p-2.5 text-left">Turnos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-b border-border last:border-0 ${r.error ? 'bg-destructive/5' : ''}`}>
                <td className="text-xs p-2.5">{r.data}</td>
                <td className="text-xs p-2.5">{r.obraNome}</td>
                <td className="text-xs p-2.5">{r.profissional}</td>
                <td className="text-xs p-2.5">{r.categoria}</td>
                <td className="text-xs p-2.5">{r.tipo}</td>
                <td className={`text-xs p-2.5 text-right ${r.error ? 'text-destructive font-semibold' : ''}`}>
                  {r.valor} {r.error && <span className="block text-[10px]">{r.error}</span>}
                </td>
                <td className="text-xs p-2.5">{r.turnos}</td>
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
