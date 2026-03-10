import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Upload } from 'lucide-react';
import { Obra, CATEGORIAS, Turno, Lancamento } from '@/lib/types';

interface Props {
  obras: Obra[];
  onSubmit: (l: Omit<Lancamento, 'id'>) => Lancamento;
}

const TURNOS: Turno[] = ['Manhã', 'Tarde', 'Noite'];

export function FormularioLancamento({ obras, onSubmit }: Props) {
  const [obraId, setObraId] = useState('');
  const [profissional, setProfissional] = useState('');
  const [categoria, setCategoria] = useState('');
  const [turnos, setTurnos] = useState<string[]>([]);
  const [valor, setValor] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTurno = (t: string) => {
    setTurnos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId || !profissional || !categoria || turnos.length === 0 || !valor) return;

    const obraNome = obras.find(o => o.id === obraId)?.nome || '';
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) return;

    // If multiple turnos, rateio
    const valorPorTurno = valorNum / turnos.length;
    const now = new Date().toISOString().split('T')[0];

    const entry = onSubmit({
      obraId,
      obraNome,
      profissional: profissional.toUpperCase(),
      categoria: categoria.toUpperCase(),
      turnos,
      valor: valorNum,
      data: now,
    });

    const summary = `${obraNome.split('—')[0].trim()} | ${entry.profissional} | ${entry.categoria} | R$ ${valorNum.toFixed(2)} | ${now}`;
    setSubmittedEntry(summary);

    // Reset
    setObraId('');
    setProfissional('');
    setCategoria('');
    setTurnos([]);
    setValor('');
    setFoto(null);

    setTimeout(() => setSubmittedEntry(null), 3000);
  };

  const selectClass = "w-full bg-background border-2 border-foreground p-3 font-mono text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary";
  const inputClass = "w-full bg-background border-2 border-foreground p-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div>
      <AnimatePresence>
        {submittedEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-foreground text-background font-mono text-xs p-3 mb-4 tracking-wide"
          >
            ✓ {submittedEntry}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Obra */}
        <div className="relative">
          <label className="font-mono text-xs font-bold tracking-wider block mb-1">OBRA</label>
          <select value={obraId} onChange={e => setObraId(e.target.value)} className={selectClass}>
            <option value="">SELECIONE A OBRA</option>
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-8 w-4 h-4 pointer-events-none" />
        </div>

        {/* Profissional */}
        <div>
          <label className="font-mono text-xs font-bold tracking-wider block mb-1">PROFISSIONAL</label>
          <input
            type="text"
            value={profissional}
            onChange={e => setProfissional(e.target.value)}
            placeholder="Nome do profissional"
            className={inputClass}
          />
        </div>

        {/* Categoria */}
        <div className="relative">
          <label className="font-mono text-xs font-bold tracking-wider block mb-1">CATEGORIA</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className={selectClass}>
            <option value="">SELECIONE</option>
            {CATEGORIAS.map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-8 w-4 h-4 pointer-events-none" />
        </div>

        {/* Turnos */}
        <div>
          <label className="font-mono text-xs font-bold tracking-wider block mb-2">
            TURNO {turnos.length > 1 && <span className="text-muted-foreground">(RATEIO: {turnos.length} TURNOS)</span>}
          </label>
          <div className="flex gap-0">
            {TURNOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTurno(t)}
                className={`flex-1 py-3 font-mono text-sm font-bold border-2 border-foreground transition-colors ${
                  turnos.includes(t)
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground'
                } ${t !== 'Manhã' ? '-ml-0.5' : ''}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="font-mono text-xs font-bold tracking-wider block mb-1">VALOR (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0,00"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Foto */}
        <div>
          <label className="font-mono text-xs font-bold tracking-wider block mb-1">COMPROVANTE</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-foreground p-4 flex items-center justify-center gap-2 font-mono text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Upload className="w-4 h-4" />
            {foto ? foto.name : 'UPLOAD DE FOTO'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => setFoto(e.target.files?.[0] || null)}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-mono font-bold text-sm py-4 tracking-wider hover:opacity-90 transition-opacity"
        >
          LANÇAR PAGAMENTO
        </button>
      </form>
    </div>
  );
}
