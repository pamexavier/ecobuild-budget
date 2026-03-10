import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, DollarSign, Check } from 'lucide-react';
import { Obra, Profissional, Turno, Lancamento } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  obras: Obra[];
  profissionais: Profissional[];
  onSubmit: (l: Omit<Lancamento, 'id'>) => Lancamento;
}

const TURNOS: Turno[] = ['Manhã', 'Tarde', 'Noite'];

export function FormularioLancamento({ obras, profissionais, onSubmit }: Props) {
  const [obraId, setObraId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [turnos, setTurnos] = useState<string[]>([]);
  const [valor, setValor] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedProf = profissionais.find(p => p.id === profissionalId);

  const toggleTurno = (t: string) => {
    setTurnos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId || !profissionalId || turnos.length === 0 || !valor) return;

    const obraNome = obras.find(o => o.id === obraId)?.nome || '';
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) return;

    const now = new Date().toISOString().split('T')[0];

    const entry = onSubmit({
      obraId,
      obraNome,
      profissionalId,
      profissional: selectedProf?.nome.toUpperCase() || '',
      categoria: selectedProf?.categoria.toUpperCase() || '',
      turnos,
      valor: valorNum,
      data: now,
    });

    const summary = `${obraNome} · ${entry.profissional} · R$ ${valorNum.toFixed(2)}`;
    setSubmittedEntry(summary);

    setObraId('');
    setProfissionalId('');
    setTurnos([]);
    setValor('');
    setFoto(null);

    setTimeout(() => setSubmittedEntry(null), 3000);
  };

  return (
    <div>
      <AnimatePresence>
        {submittedEntry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm p-3 mb-5 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {submittedEntry}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Obra */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Obra</label>
          <select
            value={obraId}
            onChange={e => setObraId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione a obra</option>
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>

        {/* Profissional */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Profissional</label>
          <select
            value={profissionalId}
            onChange={e => setProfissionalId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione o profissional</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {p.categoria}</option>
            ))}
          </select>
          {selectedProf && (
            <span className="text-xs text-muted-foreground mt-1 block">
              Categoria: {selectedProf.categoria}
            </span>
          )}
        </div>

        {/* Turnos */}
        <div>
          <label className="text-sm font-medium block mb-2">
            Turno {turnos.length > 1 && <span className="text-muted-foreground font-normal">(Rateio: {turnos.length} turnos)</span>}
          </label>
          <div className="flex gap-2">
            {TURNOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTurno(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  turnos.includes(t)
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-input hover:border-foreground/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Valor (R$)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Foto */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Comprovante</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-input p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {foto ? foto.name : 'Upload de foto'}
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
        <Button type="submit" className="w-full py-5 text-sm font-semibold">
          <DollarSign className="w-4 h-4 mr-1" />
          Lançar Pagamento
        </Button>
      </form>
    </div>
  );
}
