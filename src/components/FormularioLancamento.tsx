import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, DollarSign, Check, Sun, Moon, Sunset, Briefcase, Clock } from 'lucide-react';
import { Obra, Profissional, Turno, Lancamento, TipoLancamento } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  obras: Obra[];
  profissionais: Profissional[];
  onSubmit: (l: Omit<Lancamento, 'id'>) => Lancamento;
}

const TURNOS: { label: Turno; icon: typeof Sun }[] = [
  { label: 'Manhã', icon: Sun },
  { label: 'Tarde', icon: Sunset },
  { label: 'Noite', icon: Moon },
];

export function FormularioLancamento({ obras, profissionais, onSubmit }: Props) {
  const [obraId, setObraId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [categoriaOrcamentoId, setCategoriaOrcamentoId] = useState('');
  const [tipo, setTipo] = useState<TipoLancamento>('diaria');
  const [turnos, setTurnos] = useState<string[]>([]);
  const [valorDiaria, setValorDiaria] = useState('');
  const [valorEmpreitada, setValorEmpreitada] = useState('');
  const [descricaoEtapa, setDescricaoEtapa] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedObra = obras.find(o => o.id === obraId);
  const selectedProf = profissionais.find(p => p.id === profissionalId);
  const categoriasObra = selectedObra?.categorias || [];

  const valorCalculado = useMemo(() => {
    if (tipo === 'empreitada') return parseFloat(valorEmpreitada) || 0;
    const diaria = parseFloat(valorDiaria) || 0;
    if (turnos.length === 0) return 0;
    return (diaria / 3) * turnos.length;
  }, [tipo, valorDiaria, valorEmpreitada, turnos]);

  const toggleTurno = (t: string) => {
    setTurnos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId || !profissionalId || !categoriaOrcamentoId) return;
    if (tipo === 'diaria' && (turnos.length === 0 || !valorDiaria)) return;
    if (tipo === 'empreitada' && (!valorEmpreitada || !descricaoEtapa)) return;
    if (valorCalculado <= 0) return;

    const obraNome = selectedObra?.nome || '';
    const catOrc = categoriasObra.find(c => c.id === categoriaOrcamentoId);
    const now = new Date().toISOString().split('T')[0];

    const entry = onSubmit({
      obraId,
      obraNome,
      profissionalId,
      profissional: selectedProf?.nome.toUpperCase() || '',
      categoria: selectedProf?.categoria.toUpperCase() || '',
      categoriaOrcamentoId,
      categoriaOrcamentoNome: catOrc?.nome || '',
      tipo,
      turnos: tipo === 'diaria' ? turnos : [],
      valor: valorCalculado,
      valorDiaria: tipo === 'diaria' ? parseFloat(valorDiaria) : undefined,
      descricaoEtapa: tipo === 'empreitada' ? descricaoEtapa : undefined,
      data: now,
    });

    const summary = `${obraNome} · ${entry.profissional} · R$ ${valorCalculado.toFixed(2)}`;
    setSubmittedEntry(summary);

    setObraId('');
    setProfissionalId('');
    setCategoriaOrcamentoId('');
    setTurnos([]);
    setValorDiaria('');
    setValorEmpreitada('');
    setDescricaoEtapa('');
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
        {/* Card: Vínculo */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vínculo</span>

          {/* Obra */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Obra</label>
            <select
              value={obraId}
              onChange={e => { setObraId(e.target.value); setCategoriaOrcamentoId(''); }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione a obra</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Categoria de Orçamento */}
          {obraId && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Categoria de Orçamento</label>
              <select
                value={categoriaOrcamentoId}
                onChange={e => setCategoriaOrcamentoId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione a categoria</option>
                {categoriasObra.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — Previsto: R$ {c.valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>
          )}

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
        </div>

        {/* Card: Tipo de Pagamento */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Pagamento</span>

          {/* Tipo selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo('diaria')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                tipo === 'diaria'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-input hover:border-foreground/30'
              }`}
            >
              <Clock className="w-4 h-4" />
              Diária
            </button>
            <button
              type="button"
              onClick={() => setTipo('empreitada')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                tipo === 'empreitada'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-input hover:border-foreground/30'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Empreitada
            </button>
          </div>

          {/* Diária: Turnos + Valor */}
          {tipo === 'diaria' && (
            <>
              <div>
                <label className="text-sm font-medium block mb-2">
                  Turno{' '}
                  {turnos.length > 1 && (
                    <span className="text-muted-foreground font-normal">
                      ({turnos.length}/3 turnos = {((turnos.length / 3) * 100).toFixed(0)}% da diária)
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  {TURNOS.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleTurno(label)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                        turnos.includes(label)
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background text-muted-foreground border-input hover:border-foreground/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Valor da Diária Completa (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorDiaria}
                    onChange={e => setValorDiaria(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {turnos.length > 0 && valorDiaria && (
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    Valor proporcional: R$ {valorCalculado.toFixed(2)} ({turnos.length}/3 turnos)
                  </p>
                )}
              </div>
            </>
          )}

          {/* Empreitada: Descrição + Valor */}
          {tipo === 'empreitada' && (
            <>
              <div>
                <label className="text-sm font-medium block mb-1.5">Descrição da Etapa</label>
                <input
                  type="text"
                  value={descricaoEtapa}
                  onChange={e => setDescricaoEtapa(e.target.value)}
                  placeholder="Ex: Entrega do reboco do 2º pavimento"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Valor do Pagamento (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorEmpreitada}
                    onChange={e => setValorEmpreitada(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Card: Comprovante */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comprovante</span>
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

        {/* Resumo + Submit */}
        {valorCalculado > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
            <span className="text-sm text-muted-foreground">Valor a lançar: </span>
            <span className="text-lg font-bold text-primary">R$ {valorCalculado.toFixed(2)}</span>
          </div>
        )}

        <Button type="submit" className="w-full py-5 text-sm font-semibold">
          <DollarSign className="w-4 h-4 mr-1" />
          Lançar Pagamento
        </Button>
      </form>
    </div>
  );
}
