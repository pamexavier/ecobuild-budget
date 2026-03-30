import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, DollarSign, Check, Sun, Moon, Sunset, Briefcase, Clock, UserPlus, Stamp } from 'lucide-react';
import { Obra, Profissional, Turno, Lancamento, TipoLancamento } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CadastrarProfissionalModal } from './CadastrarProfissionalModal';

interface Props {
  obras: Obra[];
  profissionais: Profissional[];
  onSubmit: (l: Omit<Lancamento, 'id'>) => void;
  onAddProfissional?: (p: Omit<Profissional, 'id'>) => void;
}

const TURNOS: { label: Turno; icon: typeof Sun }[] = [
  { label: 'Manhã', icon: Sun },
  { label: 'Tarde', icon: Sunset },
  { label: 'Noite', icon: Moon },
];

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function FormularioLancamento({ obras, profissionais, onSubmit, onAddProfissional }: Props) {
  const [profissionalId, setProfissionalId] = useState('');
  const [obraId, setObraId] = useState('');
  const [categoriaOrcamentoId, setCategoriaOrcamentoId] = useState(''); 
  const [tipo, setTipo] = useState<TipoLancamento>('diaria');
  
  const [gradeSemanal, setGradeSemanal] = useState<Record<string, Record<string, {obraId: string, catId: string}>>>({});
  
  const [valorDiaria, setValorDiaria] = useState('');
  const [valorEmpreitada, setValorEmpreitada] = useState('');
  const [descricaoEtapa, setDescricaoEtapa] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedObra = obras.find(o => o.id === obraId);
  const selectedProf = profissionais.find(p => p.id === profissionalId);
  const categoriasObra = selectedObra?.categorias || [];

  const handleObraChange = (newObraId: string) => {
    setObraId(newObraId);
    if (newObraId && selectedProf) {
      const obra = obras.find(o => o.id === newObraId);
      // Se não tem categoria na obra, não exige
      if (!obra?.categorias || obra.categorias.length === 0) {
        setCategoriaOrcamentoId('');
        return;
      }
      const match = obra.categorias.find(c => c.nome.toLowerCase() === selectedProf.categoria.toLowerCase());
      setCategoriaOrcamentoId(match ? match.id : (obra.categorias[0]?.id || ''));
    } else {
      setCategoriaOrcamentoId('');
    }
  };

  const handleProfissionalChange = (newProfId: string) => {
    setProfissionalId(newProfId);
    setGradeSemanal({}); 
    
    if (obraId && newProfId) {
      const prof = profissionais.find(p => p.id === newProfId);
      const obra = obras.find(o => o.id === obraId);
      if (!obra?.categorias || obra.categorias.length === 0) {
        setCategoriaOrcamentoId('');
        return;
      }
      const match = obra.categorias.find(c => c.nome.toLowerCase() === prof?.categoria.toLowerCase());
      setCategoriaOrcamentoId(match ? match.id : (obra.categorias[0]?.id || ''));
    }
  };

  const valorCalculado = useMemo(() => {
    if (tipo === 'empreitada') return parseFloat(valorEmpreitada) || 0;
    
    const diaria = parseFloat(valorDiaria) || 0;
    let totalTurnosSelecionados = 0;
    Object.values(gradeSemanal).forEach(turnosDoDia => {
      totalTurnosSelecionados += Object.keys(turnosDoDia).length;
    });

    if (totalTurnosSelecionados === 0) return 0;
    return (diaria / 2) * totalTurnosSelecionados;
  }, [tipo, valorDiaria, valorEmpreitada, gradeSemanal]);

  const toggleTurnoGrade = (dia: string, turno: string) => {
    const obraSelecionada = obras.find(o => o.id === obraId);
    const temCategorias = obraSelecionada?.categorias && obraSelecionada.categorias.length > 0;

    if (!obraId || (temCategorias && !categoriaOrcamentoId)) {
      alert("⚠️ Selecione a Obra (e a Categoria, se houver) no Carimbo fixo no topo!");
      return;
    }

    setGradeSemanal(prev => {
      const novaGrade = { ...prev };
      if (!novaGrade[dia]) novaGrade[dia] = {};

      const atual = novaGrade[dia][turno];
      if (atual && atual.obraId === obraId && atual.catId === categoriaOrcamentoId) {
        delete novaGrade[dia][turno];
        if (Object.keys(novaGrade[dia]).length === 0) delete novaGrade[dia];
      } else {
        novaGrade[dia][turno] = { obraId, catId: categoriaOrcamentoId };
      }
      
      return novaGrade;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profissionalId) return;
    if (valorCalculado <= 0) return;

    const obraSelecionada = obras.find(o => o.id === obraId);
    const temCategorias = obraSelecionada?.categorias && obraSelecionada.categorias.length > 0;

    if (tipo === 'diaria' && !valorDiaria) return;
    if (tipo === 'empreitada' && (!valorEmpreitada || !descricaoEtapa || !obraId || (temCategorias && !categoriaOrcamentoId))) return;

    const now = new Date().toISOString().split('T')[0];
    const valorDiariaNum = parseFloat(valorDiaria);

    if (tipo === 'diaria') {
      const agrupado: Record<string, { obraId: string, catId: string, turnos: string[] }> = {};
      
      Object.entries(gradeSemanal).forEach(([dia, turnosDoDia]) => {
        Object.entries(turnosDoDia).forEach(([turno, carimbo]) => {
          const chave = `${carimbo.obraId}-${carimbo.catId}`;
          if (!agrupado[chave]) {
            agrupado[chave] = { obraId: carimbo.obraId, catId: carimbo.catId, turnos: [] };
          }
          agrupado[chave].turnos.push(`${dia} - ${turno}`);
        });
      });

      Object.values(agrupado).forEach(grupo => {
        const obraDoLcto = obras.find(o => o.id === grupo.obraId);
        const catOrc = obraDoLcto?.categorias?.find(c => c.id === grupo.catId);
        if (!obraDoLcto) return;

        const valorDesteLcto = (valorDiariaNum / 2) * grupo.turnos.length;

        onSubmit({
          obraId: grupo.obraId,
          obraNome: obraDoLcto.nome,
          profissionalId,
          profissional: selectedProf?.nome.toUpperCase() || '',
          categoria: selectedProf?.categoria.toUpperCase() || '',
          categoriaOrcamentoId: grupo.catId || '', // Permite vazio
          categoriaOrcamentoNome: catOrc?.nome || 'Geral/Sem Categoria',
          tipo,
          turnos: grupo.turnos,
          valor: valorDesteLcto,
          valorDiaria: valorDiariaNum,
          data: now,
        });
      });
    } else {
      const catOrc = categoriasObra.find(c => c.id === categoriaOrcamentoId);
      onSubmit({
        obraId,
        obraNome: selectedObra?.nome || '',
        profissionalId,
        profissional: selectedProf?.nome.toUpperCase() || '',
        categoria: selectedProf?.categoria.toUpperCase() || '',
        categoriaOrcamentoId: catOrc?.id || '',
        categoriaOrcamentoNome: catOrc?.nome || 'Geral/Sem Categoria',
        tipo,
        turnos: [],
        valor: parseFloat(valorEmpreitada) || 0,
        descricaoEtapa,
        data: now,
      });
    }

    const summary = `${selectedProf?.nome.toUpperCase()} · Lançamento Concluído · R$ ${valorCalculado.toFixed(2)}`;
    setSubmittedEntry(summary);

    setObraId('');
    setProfissionalId('');
    setCategoriaOrcamentoId('');
    setGradeSemanal({});
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
        
        {/* Bloco 1: Quem trabalhou? */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">1. Profissional</span>
          <div>
            <div className="flex gap-2">
              <select value={profissionalId} onChange={e => handleProfissionalChange(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione quem trabalhou...</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.categoria}</option>)}
              </select>
              {onAddProfissional && (
                <CadastrarProfissionalModal
                  onAdd={onAddProfissional}
                  trigger={
                    <Button type="button" variant="outline" size="icon" className="shrink-0" title="Cadastrar novo profissional">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Bloco 2: Como e Onde? */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 relative">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. Pagamento e Grade</span>
          
          <div className="flex gap-2 pb-2">
            <button type="button" onClick={() => setTipo('diaria')} className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${tipo === 'diaria' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-input hover:border-foreground/30'}`}>
              <Clock className="w-4 h-4" /> Diária
            </button>
            <button type="button" onClick={() => setTipo('empreitada')} className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${tipo === 'empreitada' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-input hover:border-foreground/30'}`}>
              <Briefcase className="w-4 h-4" /> Empreitada
            </button>
          </div>

          {tipo === 'diaria' && (
            <div className="space-y-6 pt-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Valor da Diária Completa (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="number" step="0.01" min="0" value={valorDiaria} onChange={e => setValorDiaria(e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              {/* O CARIMBO FIXO (STICKY) */}
              <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-muted/95 backdrop-blur-md border-y border-border shadow-md mb-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Stamp className="w-4 h-4 text-primary" />
                  <label className="text-sm font-bold text-primary">Carimbo de Obra (Desce com a tela!)</label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={obraId} onChange={e => handleObraChange(e.target.value)} className="w-full rounded-lg border border-primary/50 bg-primary/5 text-primary font-semibold px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
                    <option value="">[ Escolher Obra... ]</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>

                  {/* Esconde se a obra não tiver categorias cadastradas */}
                  {obras.find(o => o.id === obraId)?.categorias?.length ? (
                    <select value={categoriaOrcamentoId} onChange={e => setCategoriaOrcamentoId(e.target.value)} className="w-full rounded-lg border border-primary/50 bg-primary/5 text-primary font-semibold px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
                      <option value="">[ Escolher Categoria... ]</option>
                      {obras.find(o => o.id === obraId)?.categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="bg-background rounded-lg border border-border p-3 space-y-3 shadow-sm">
                    <span className="text-sm font-bold text-foreground">{dia}</span>
                    <div className="flex gap-2">
                      {TURNOS.map(({ label, icon: Icon }) => {
                        const carimbo = gradeSemanal[dia]?.[label];
                        const isMarcado = !!carimbo;
                        
                        let infoCarimbo = '';
                        if (isMarcado) {
                          const obra = obras.find(o => o.id === carimbo.obraId);
                          infoCarimbo = obra ? obra.nome.substring(0, 12) + (obra.nome.length > 12 ? '...' : '') : '';
                        }

                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleTurnoGrade(dia, label)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all flex flex-col items-center justify-center gap-1
                              ${isMarcado ? 'bg-primary text-primary-foreground border-primary shadow-md' : 
                                'bg-background text-muted-foreground border-input hover:border-foreground/30'}`}
                          >
                            <Icon className="w-4 h-4" /> 
                            <span>{label}</span>
                            {isMarcado && (
                              <span className="text-[9px] px-1.5 py-0.5 mt-0.5 rounded-full bg-black/20 text-white font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                {infoCarimbo}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tipo === 'empreitada' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Obra</label>
                <select value={obraId} onChange={e => handleObraChange(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Selecione a obra</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              
              {/* Só exibe se a obra tiver categorias */}
              {obraId && obras.find(o => o.id === obraId)?.categorias?.length ? (
                <div>
                  <label className="text-sm font-medium block mb-1.5">Categoria de Orçamento</label>
                  <select value={categoriaOrcamentoId} onChange={e => setCategoriaOrcamentoId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione a categoria</option>
                    {categoriasObra.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium block mb-1.5">Descrição da Etapa</label>
                <input type="text" value={descricaoEtapa} onChange={e => setDescricaoEtapa(e.target.value)} placeholder="Ex: Entrega do reboco do 2º pavimento" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Valor do Pagamento (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="number" step="0.01" min="0" value={valorEmpreitada} onChange={e => setValorEmpreitada(e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bloco 3: Finalização */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3. Comprovante</span>
          <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-lg border border-dashed border-input p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            <Upload className="w-4 h-4" /> {foto ? foto.name : 'Upload de foto (opcional)'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFoto(e.target.files?.[0] || null)} />
        </div>

        {valorCalculado > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center shadow-inner">
            <span className="text-sm text-muted-foreground">Valor a lançar: </span>
            <span className="text-lg font-black text-primary">R$ {valorCalculado.toFixed(2)}</span>
          </div>
        )}

        <Button type="submit" className="w-full py-6 text-base font-bold tracking-wide shadow-md hover:scale-[1.02] transition-transform">
          <DollarSign className="w-5 h-5 mr-1" /> SALVAR LANÇAMENTO
        </Button>
      </form>
    </div>
  );
}