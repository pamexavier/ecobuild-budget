import { useState, useMemo } from 'react';
import { Leaf, Sun, Sunset, Moon, Clock, Briefcase, DollarSign, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { Turno, TipoLancamento } from '@/lib/types';

const TURNOS: { label: Turno; icon: typeof Sun }[] = [
  { label: 'Manhã', icon: Sun },
  { label: 'Tarde', icon: Sunset },
  { label: 'Noite', icon: Moon },
];

const Enviar = () => {
  const { obras, profissionais, addLancamento } = useAppStore();

  const [obraId, setObraId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [categoriaOrcamentoId, setCategoriaOrcamentoId] = useState('');
  const [tipo, setTipo] = useState<TipoLancamento>('diaria');
  const [turnos, setTurnos] = useState<string[]>([]);
  const [valorDiaria, setValorDiaria] = useState('');
  const [valorEmpreitada, setValorEmpreitada] = useState('');
  const [descricaoEtapa, setDescricaoEtapa] = useState('');
  const [assinadoPor, setAssinadoPor] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
    if (!obraId || !profissionalId || !categoriaOrcamentoId || !assinadoPor) return;
    if (tipo === 'diaria' && (turnos.length === 0 || !valorDiaria)) return;
    if (tipo === 'empreitada' && (!valorEmpreitada || !descricaoEtapa)) return;
    if (valorCalculado <= 0) return;

    const catOrc = categoriasObra.find(c => c.id === categoriaOrcamentoId);
    const now = new Date().toISOString().split('T')[0];

    addLancamento({
      obraId,
      obraNome: selectedObra?.nome || '',
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

    setSubmitted(true);
  };

  const resetForm = () => {
    setObraId('');
    setProfissionalId('');
    setCategoriaOrcamentoId('');
    setTurnos([]);
    setValorDiaria('');
    setValorEmpreitada('');
    setDescricaoEtapa('');
    setAssinadoPor('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground">Lançamento Enviado!</h2>
          <p className="text-primary-foreground/80 text-lg">
            R$ {valorCalculado.toFixed(2)} · {selectedObra?.nome}
          </p>
          <p className="text-primary-foreground/60 text-sm">Assinado por: {assinadoPor}</p>
          <Button
            onClick={resetForm}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg py-6 px-10 rounded-lg"
          >
            Novo Lançamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header verde */}
      <div className="bg-primary px-5 py-6">
        <div className="flex items-center gap-3">
          <Leaf className="w-7 h-7 text-primary-foreground" />
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">EcoGestão</h1>
            <p className="text-sm text-primary-foreground/70">Lançamento Rápido</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 max-w-lg mx-auto">
        {/* Obra */}
        <div>
          <label className="text-base font-semibold block mb-2">Obra</label>
          <select
            value={obraId}
            onChange={e => { setObraId(e.target.value); setCategoriaOrcamentoId(''); }}
            className="w-full rounded-lg border border-input bg-card px-4 py-4 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione a obra</option>
            {obras.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>

        {/* Categoria Orçamento */}
        {obraId && (
          <div>
            <label className="text-base font-semibold block mb-2">Categoria de Orçamento</label>
            <select
              value={categoriaOrcamentoId}
              onChange={e => setCategoriaOrcamentoId(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-4 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione a categoria</option>
              {categoriasObra.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Profissional */}
        <div>
          <label className="text-base font-semibold block mb-2">Profissional</label>
          <select
            value={profissionalId}
            onChange={e => setProfissionalId(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-4 py-4 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione o profissional</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {p.categoria}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="text-base font-semibold block mb-2">Tipo</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo('diaria')}
              className={`py-4 rounded-lg text-base font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                tipo === 'diaria'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-input'
              }`}
            >
              <Clock className="w-5 h-5" />
              Diária
            </button>
            <button
              type="button"
              onClick={() => setTipo('empreitada')}
              className={`py-4 rounded-lg text-base font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                tipo === 'empreitada'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-input'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Empreitada
            </button>
          </div>
        </div>

        {/* Diária: Turnos + Valor */}
        {tipo === 'diaria' && (
          <>
            <div>
              <label className="text-base font-semibold block mb-2">Turnos Trabalhados</label>
              <div className="grid grid-cols-3 gap-2">
                {TURNOS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleTurno(label)}
                    className={`py-4 rounded-lg text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                      turnos.includes(label)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-input'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    {label}
                  </button>
                ))}
              </div>
              {turnos.length > 0 && (
                <p className="text-sm text-primary mt-2 font-medium text-center">
                  {turnos.length}/3 turnos selecionados
                </p>
              )}
            </div>

            <div>
              <label className="text-base font-semibold block mb-2">Valor da Diária Completa (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorDiaria}
                  onChange={e => setValorDiaria(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-input bg-card pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {turnos.length > 0 && valorDiaria && (
                <div className="mt-2 rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                  <span className="text-sm text-muted-foreground">Valor proporcional: </span>
                  <span className="text-lg font-bold text-primary">R$ {valorCalculado.toFixed(2)}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empreitada */}
        {tipo === 'empreitada' && (
          <>
            <div>
              <label className="text-base font-semibold block mb-2">Descrição da Etapa</label>
              <input
                type="text"
                value={descricaoEtapa}
                onChange={e => setDescricaoEtapa(e.target.value)}
                placeholder="Ex: Entrega do reboco do 2º pavimento"
                className="w-full rounded-lg border border-input bg-card px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-base font-semibold block mb-2">Valor Fixo (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorEmpreitada}
                  onChange={e => setValorEmpreitada(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-input bg-card pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </>
        )}

        {/* Assinado por */}
        <div>
          <label className="text-base font-semibold block mb-2">Assinado por</label>
          <input
            type="text"
            value={assinadoPor}
            onChange={e => setAssinadoPor(e.target.value)}
            placeholder="Nome de quem está enviando"
            className="w-full rounded-lg border border-input bg-card px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Valor total */}
        {valorCalculado > 0 && (
          <div className="rounded-lg bg-primary/10 border-2 border-primary/30 p-4 text-center">
            <span className="text-base text-muted-foreground">Total: </span>
            <span className="text-2xl font-bold text-primary">R$ {valorCalculado.toFixed(2)}</span>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full py-6 text-lg font-bold rounded-lg">
          <Send className="w-5 h-5 mr-2" />
          Enviar Lançamento
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-2">
          EcomindsX · EcoGestão Obras
        </p>
      </form>
    </div>
  );
};

export default Enviar;
