import { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Lancamento, Obra } from '@/lib/types';

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

  // Column mapping
  const [mapping, setMapping] = useState<Record<string, string>>({
    obraNome: '',
    profissional: '',
    categoria: '',
    valor: '',
    data: '',
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

    // Auto-map by common names
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
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCSV(text);
    };
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
      const error = isNaN(valorNum) ? 'VALOR INVÁLIDO' : undefined;

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
        profissional: r.profissional,
        categoria: r.categoria,
        turnos: ['Manhã'],
        valor: parseFloat(r.valor.replace(',', '.')),
        data: r.data || new Date().toISOString().split('T')[0],
      };
    });
    onImport(items);
    setStep('upload');
    setRows([]);
    setFileName('');
  };

  const reset = () => {
    setStep('upload');
    setRows([]);
    setFileName('');
    setHeaders([]);
    setRawRows([]);
  };

  const selectClass = "bg-background border-2 border-foreground p-2 font-mono text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary";

  if (step === 'upload') {
    return (
      <div>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-foreground p-6 flex flex-col items-center gap-2 font-mono text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Upload className="w-5 h-5" />
          IMPORTAR PLANILHA (.CSV)
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  if (step === 'map') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs font-bold tracking-wider">{fileName}</span>
          <button onClick={reset} className="p-1 hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="font-mono text-xs font-bold tracking-wider mb-2">MAPEAMENTO DE COLUNAS</div>
        {(['obraNome', 'profissional', 'categoria', 'valor', 'data'] as const).map(field => (
          <div key={field} className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold w-28 uppercase">{field === 'obraNome' ? 'OBRA' : field}</span>
            <select
              value={mapping[field]}
              onChange={e => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
              className={selectClass + ' flex-1'}
            >
              <option value="">—</option>
              {headers.map((h, i) => (
                <option key={i} value={String(i)}>{h}</option>
              ))}
            </select>
          </div>
        ))}
        <button
          onClick={applyMapping}
          className="w-full bg-primary text-primary-foreground font-mono font-bold text-sm py-3 tracking-wider hover:opacity-90 transition-opacity"
        >
          PREVIEW
        </button>
      </div>
    );
  }

  // Preview step
  const hasErrors = rows.some(r => r.error);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs font-bold tracking-wider">PREVIEW — {rows.length} LINHAS</span>
        <button onClick={reset} className="p-1 hover:bg-secondary"><X className="w-4 h-4" /></button>
      </div>

      <div className="border-2 border-foreground overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="font-mono text-[10px] font-bold p-2 text-left">OBRA</th>
              <th className="font-mono text-[10px] font-bold p-2 text-left">PROF.</th>
              <th className="font-mono text-[10px] font-bold p-2 text-left">CAT.</th>
              <th className="font-mono text-[10px] font-bold p-2 text-right">VALOR</th>
              <th className="font-mono text-[10px] font-bold p-2 text-left">DATA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-b border-input ${r.error ? 'bg-destructive/10' : ''}`}>
                <td className="font-mono text-xs p-2">{r.obraNome}</td>
                <td className="font-mono text-xs p-2">{r.profissional}</td>
                <td className="font-mono text-xs p-2">{r.categoria}</td>
                <td className={`font-mono text-xs p-2 text-right ${r.error ? 'text-destructive font-bold' : ''}`}>
                  {r.valor} {r.error && <span className="block text-[9px]">{r.error}</span>}
                </td>
                <td className="font-mono text-xs p-2">{r.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasErrors && (
        <div className="font-mono text-xs text-destructive font-bold">
          LINHAS COM ERRO SERÃO IGNORADAS
        </div>
      )}

      <button
        onClick={handleConfirm}
        className="w-full bg-primary text-primary-foreground font-mono font-bold text-sm py-3 tracking-wider hover:opacity-90 transition-opacity"
      >
        CONFIRMAR IMPORTAÇÃO
      </button>
    </div>
  );
}
