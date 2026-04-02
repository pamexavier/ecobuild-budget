import { useState, useRef, useCallback } from 'react';
import { Upload, X, UserPlus } from 'lucide-react';
import { Obra, Profissional, LancamentoInsert } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CadastrarProfissionalModal } from './CadastrarProfissionalModal';
import { CadastrarObraModal } from './CadastrarObraModal';

const normalize = (str: string) =>
  str?.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

const cleanForMatch = (str: string) =>
  normalize(str).replace(/\b(ltda|me|epp|sa|s\/a|eireli|cnpj|cpf|servicos|comercio|artigos|de|da|do)\b/gi, '')
    .replace(/[0-9.\/\-]/g, '').replace(/\s+/g, ' ').trim();

const CPF_REGEX = /\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}/;
const CNPJ_REGEX = /\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/.\s]?\d{4}[-.\s]?\d{2}/;

const extractDocumento = (text: string): string | null => {
  const cnpjMatch = text.match(CNPJ_REGEX);
  if (cnpjMatch) return cnpjMatch[0];
  const cpfMatch = text.match(CPF_REGEX);
  if (cpfMatch) return cpfMatch[0];
  return null;
};

const findBestMatch = (original: string, list: any[], field: string) => {
  if (!list) return null;
  const target = cleanForMatch(original);
  if (!target || target.length < 3) return null;
  const exact = list.find(item => cleanForMatch(item[field]) === target);
  if (exact) return exact;
  const partial = list.find(item => {
    const sysName = cleanForMatch(item[field]);
    return sysName.length > 2 && (target.includes(sysName) || sysName.includes(target));
  });
  if (partial) return partial;
  const firstWord = target.split(' ')[0];
  if (firstWord.length > 3) return list.find(item => cleanForMatch(item[field]).startsWith(firstWord)) || null;
  return null;
};

const MAP_KEYWORDS: Record<string, string[]> = {
  data: ['data', 'vencimento', 'date', 'dia', 'pagamento', 'competencia'],
  obraNome: ['obra', 'local', 'destino', 'projeto', 'unidade', 'canteiro'],
  profissional: ['profissional', 'nome', 'fornecedor', 'prestador', 'favorecido', 'recebedor'],
  valor: ['valor', 'preco', 'custo', 'total', 'montante', 'pago'],
};

interface Props {
  obras: Obra[];
  profissionais: Profissional[];
  onImport: (items: LancamentoInsert[]) => void;
  onAddProfissional: (p: Omit<Profissional, 'id'>) => void;
  onAddObra: (o: Omit<Obra, 'id' | 'gastoAtual'>) => void;
  categoriasExtras?: string[];
  onNovaCategoria?: (nova: string) => void;
}

interface ParsedRow {
  id: number;
  data: string;
  dataFormatada: string;
  obraNomeOriginal: string;
  obraIdSelecionada: string;
  profissionalOriginal: string;
  profissionalIdSelecionada: string;
  valorNum: number;
  documentoExtraido: string | null;
}

export function ImportarPlanilha({ obras, profissionais, onImport, onAddProfissional, onAddObra, categoriasExtras = [], onNovaCategoria }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [mapping, setMapping] = useState<Record<string, string>>({ data: '', obraNome: '', profissional: '', valor: '' });
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setStep('upload'); setRows([]); setFileName(''); setMapping({ data: '', obraNome: '', profissional: '', valor: '' }); };

  const parseCSV = useCallback((text: string) => {
    const delimiter = text.indexOf(';') > -1 ? ';' : ',';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;
    const splitCSV = (str: string) => {
      const res: string[] = []; let q = false; let c = '';
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '"') q = !q;
        else if (str[i] === delimiter && !q) { res.push(c.trim()); c = ''; }
        else c += str[i];
      }
      res.push(c.trim());
      return res.map(s => s.replace(/^"|"$/g, '').trim());
    };
    const hdrs = splitCSV(lines[0]);
    setHeaders(hdrs);
    setRawRows(lines.slice(1).map(l => splitCSV(l)));
    const autoMap: any = { data: '', obraNome: '', profissional: '', valor: '' };
    hdrs.forEach((h, i) => {
      const hn = normalize(h);
      Object.keys(MAP_KEYWORDS).forEach(k => {
        if (MAP_KEYWORDS[k].some(kw => hn.includes(kw))) autoMap[k] = String(i);
      });
    });
    setMapping(autoMap);
    setStep('map');
  }, []);

  const applyMapping = () => {
    const colData = parseInt(mapping.data);
    const colObra = parseInt(mapping.obraNome);
    const colProf = parseInt(mapping.profissional);
    const colValor = parseInt(mapping.valor);

    const parsed = rawRows.map((row, index) => {
      const obraRaw = !isNaN(colObra) ? (row[colObra] || '') : '';
      const profRaw = !isNaN(colProf) ? (row[colProf] || '') : '';
      const dataRaw = !isNaN(colData) ? (row[colData] || '') : '';
      const valorRaw = !isNaN(colValor) ? (row[colValor] || '0') : '0';

      const matchedObra = findBestMatch(obraRaw, obras, 'nome');
      const matchedProf = findBestMatch(profRaw, profissionais, 'nome');
      const valorNum = Math.abs(parseFloat(valorRaw.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.'))) || 0;

      const rowText = row.join(' ');
      const documentoExtraido = extractDocumento(rowText);

      return {
        id: index,
        data: dataRaw,
        dataFormatada: dataRaw.includes('/') ? dataRaw.split('/').reverse().join('-') : dataRaw,
        obraNomeOriginal: obraRaw,
        obraIdSelecionada: matchedObra?.id || '',
        profissionalOriginal: profRaw,
        profissionalIdSelecionada: matchedProf?.id || '',
        valorNum,
        documentoExtraido,
      };
    });
    setRows(parsed);
    setStep('preview');
  };

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <button onClick={() => fileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-primary/20 p-12 flex flex-col items-center gap-4 hover:bg-primary/5 transition-all">
          <Upload className="w-10 h-10 text-primary/40" />
          <span className="text-sm font-semibold text-muted-foreground">Selecionar Planilha (.CSV)</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setFileName(f.name); const r = new FileReader(); r.onload = (ev) => parseCSV(ev.target?.result as string); r.readAsText(f); }
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-xl p-4 bg-card shadow-sm animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="text-[10px] font-black uppercase text-primary tracking-widest italic">ZENTRA-X // {step === 'map' ? 'MAPEAMENTO' : 'REVISÃO'}</span>
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 text-destructive"><X className="w-5 h-5" /></Button>
      </div>

      {step === 'map' ? (
        <div className="space-y-4">
          <div className="bg-muted/50 p-2 rounded text-[10px] font-medium truncate">Arquivo: {fileName}</div>
          {['data', 'obraNome', 'profissional', 'valor'].map(field => (
            <div key={field} className="flex items-center gap-4">
              <label className="text-[10px] font-bold w-24 uppercase text-muted-foreground">{field}</label>
              <select value={mapping[field]} onChange={e => setMapping(p => ({ ...p, [field]: e.target.value }))} className={`flex-1 p-2 text-xs border rounded-lg bg-background ${mapping[field] ? 'border-primary/50 bg-primary/5' : 'border-dashed'}`}>
                <option value="">-- Selecionar Coluna --</option>
                {headers.map((h, i) => <option key={i} value={String(i)}>{h}</option>)}
              </select>
            </div>
          ))}
          <Button onClick={applyMapping} className="w-full font-bold uppercase py-6">Visualizar Lançamentos</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-96 overflow-auto border rounded-lg">
            <table className="w-full text-[11px]">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left">Profissional</th>
                  <th className="p-3 text-left">Obra / Destino</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-muted-foreground uppercase text-[9px]">{r.profissionalOriginal}</span>
                        {r.documentoExtraido && (
                          <span className="text-[9px] text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded w-fit">DOC: {r.documentoExtraido}</span>
                        )}
                        <select
                          value={r.profissionalIdSelecionada}
                          onChange={e => { const n = [...rows]; n[i].profissionalIdSelecionada = e.target.value; setRows(n); }}
                          className={`p-1 border rounded-md text-[10px] ${!r.profissionalIdSelecionada ? 'border-amber-500 bg-amber-50' : 'border-green-500/30 bg-green-50/30'}`}
                        >
                          <option value="">Vincular Profissional...</option>
                          {profissionais?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        {!r.profissionalIdSelecionada && (
                          <CadastrarProfissionalModal
                            onAdd={onAddProfissional}
                            defaultValues={{ nome: r.profissionalOriginal, documento: r.documentoExtraido || undefined }}
                            categoriasExtras={categoriasExtras}
                            onNovaCategoria={onNovaCategoria}
                            trigger={<button className="text-[9px] text-primary font-bold hover:underline text-left">+ CADASTRAR NOVO</button>}
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-muted-foreground uppercase text-[9px]">{r.obraNomeOriginal || 'N/A'}</span>
                        <select
                          value={r.obraIdSelecionada}
                          onChange={e => { const n = [...rows]; n[i].obraIdSelecionada = e.target.value; setRows(n); }}
                          className={`p-1 border rounded-md text-[10px] ${!r.obraIdSelecionada ? 'border-amber-500 bg-amber-50' : 'border-green-500/30 bg-green-50/30'}`}
                        >
                          <option value="">Vincular Obra...</option>
                          {obras?.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                        {!r.obraIdSelecionada && (
                          <CadastrarObraModal
                            onAdd={onAddObra}
                            onAddCliente={() => {}}
                            defaultNome={r.obraNomeOriginal}
                            trigger={<button className="text-[9px] text-primary font-bold hover:underline text-left">+ NOVA OBRA</button>}
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-primary">R$ {r.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            disabled={rows.some(r => !r.obraIdSelecionada || !r.profissionalIdSelecionada)}
            onClick={() => onImport(rows.map(r => ({
              obraId: r.obraIdSelecionada,
              profissionalId: r.profissionalIdSelecionada,
              valor: r.valorNum,
              data: r.dataFormatada,
              tipo: 'empreitada' as const,
              turnos: [],
            })))}
            className="w-full py-6 font-black uppercase"
          >
            Finalizar Importação ({rows.length})
          </Button>
        </div>
      )}
    </div>
  );
}