import { useState, useMemo, useRef, useEffect } from 'react';
import { Sun, Moon, Sunset, Zap, Search, User, Calendar, CheckSquare, Square } from 'lucide-react';
import { Obra, Profissional, Turno, Lancamento } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  obras: Obra[];
  profissionais: Profissional[];
  onSubmit: (l: Omit<Lancamento, 'id'>) => void;
}

const TURNOS: { label: Turno; icon: any }[] = [
  { label: 'Manhã', icon: Sun },
  { label: 'Tarde', icon: Sunset },
  { label: 'Noite', icon: Moon },
];

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const padronizar = (txt: string) => txt.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());

export function FormularioLancamento({ obras, profissionais, onSubmit }: Props) {
  const [profissionalId, setProfissionalId] = useState('');
  const [buscaProfissional, setBuscaProfissional] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [valorDiaria, setValorDiaria] = useState('');
  const [obraPadraoId, setObraPadraoId] = useState('');
  const [dataLancamento, setDataLancamento] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });
  
  const [gradeSemanal, setGradeSemanal] = useState<Record<string, Record<string, {obraId: string, horas: number}>>>({});
  const [turnosSelecionados, setTurnosSelecionados] = useState<Record<string, Set<string>>>({});
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickFora = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownAberto(false);
    };
    document.addEventListener('mousedown', clickFora);
    return () => document.removeEventListener('mousedown', clickFora);
  }, []);

  const profissionaisFiltrados = useMemo(() => {
    return profissionais
      .map(p => ({ ...p, nome: padronizar(p.nome) }))
      .filter(p => p.nome.toLowerCase().includes(buscaProfissional.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [profissionais, buscaProfissional]);

  const toggleTurnoSelecionado = (dia: string, turno: string) => {
    setTurnosSelecionados(prev => {
      const nova = { ...prev };
      const setDia = new Set(nova[dia] || []);
      if (setDia.has(turno)) {
        setDia.delete(turno);
      } else {
        setDia.add(turno);
      }
      return { ...prev, [dia]: setDia };
    });
  };

  const aplicarEmLote = () => {
    if (!obraPadraoId) return;
    
    const novaGrade = { ...gradeSemanal };
    const novosSelecionados = { ...turnosSelecionados };
    
    // Seleciona de Segunda a Sexta (indices 0 a 4)
    const diasUteis = DIAS_SEMANA.slice(0, 5);

    diasUteis.forEach(dia => {
      if (!novaGrade[dia]) novaGrade[dia] = {};
      if (!novosSelecionados[dia]) novosSelecionados[dia] = new Set();

      // Define Manhã e Tarde (totalizando a diária padrão de 8h)
      ['Manhã', 'Tarde'].forEach(turno => {
        novaGrade[dia][turno] = { obraId: obraPadraoId, horas: 4 };
        novosSelecionados[dia].add(turno);
      });
    });
    
    setGradeSemanal(novaGrade);
    setTurnosSelecionados(novosSelecionados);
  };

  const atualizarTurno = (dia: string, turno: string, obraId: string, horas: number) => {
    setGradeSemanal(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [turno]: { obraId, horas } }
    }));
  };

  const valorTotalCalculado = useMemo(() => {
    const valorHora = (parseFloat(valorDiaria) || 0) / 8;
    let totalHoras = 0;
    
    Object.entries(turnosSelecionados).forEach(([dia, turnos]) => {
      turnos.forEach(turno => {
        const horas = gradeSemanal[dia]?.[turno]?.horas || 0;
        totalHoras += horas;
      });
    });
    
    return totalHoras * valorHora;
  }, [gradeSemanal, turnosSelecionados, valorDiaria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profissionalId || valorTotalCalculado <= 0) return;
    const selectedProf = profissionais.find(p => p.id === profissionalId);

    Object.entries(turnosSelecionados).forEach(([dia, turnos]) => {
      turnos.forEach(turno => {
        const dados = gradeSemanal[dia]?.[turno];
        if (!dados || !dados.obraId || dados.horas <= 0) return;
        
        const obra = obras.find(o => o.id === dados.obraId);
        onSubmit({
          obraId: dados.obraId,
          obraNome: obra?.nome || '',
          profissionalId,
          profissional: padronizar(selectedProf?.nome || ''),
          categoria: selectedProf?.categoria || '',
          tipo: 'diaria',
          turnos: [`${dia}-${turno} (${dados.horas}h)`],
          valor: ((parseFloat(valorDiaria) / 8) * dados.horas),
          data: dataLancamento,
        });
      });
    });

    setGradeSemanal({});
    setTurnosSelecionados({});
    setProfissionalId('');
    setBuscaProfissional('');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 px-2">
      <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        
        {/* Data */}
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-2 block flex items-center gap-2">
            <Calendar className="w-3 h-3 text-emerald-500" /> Data do Lançamento
          </label>
          <input 
            type="date" 
            value={dataLancamento} 
            onChange={e => setDataLancamento(e.target.value)} 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-zinc-200 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
        </div>

        {/* Busca Profissional */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-1 block">Prestador / Fornecedor</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text"
              placeholder="Digite o nome..."
              value={buscaProfissional}
              onFocus={() => setDropdownAberto(true)}
              onChange={(e) => { setBuscaProfissional(e.target.value); setDropdownAberto(true); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-11 pr-4 text-zinc-200 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          
          {dropdownAberto && (
            <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
              {profissionaisFiltrados.length > 0 ? (
                profissionaisFiltrados.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setProfissionalId(p.id); setBuscaProfissional(p.nome); setDropdownAberto(false); }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3",
                      profissionalId === p.id ? "bg-emerald-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                    )}
                  >
                    <User className="w-4 h-4 opacity-50" /> {p.nome}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-600">Nenhum prestador encontrado</div>
              )}
            </div>
          )}
        </div>

        {/* Ferramenta Rápida */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-emerald-500 ml-1 block mb-1">Preencher Semanal (Seg a Sex)</label>
            <div className="relative">
              <select 
                value={obraPadraoId} 
                onChange={e => setObraPadraoId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-zinc-300 outline-none appearance-none"
              >
                <option value="">Selecione a obra...</option>
                {obras.map(o => <option key={o.id} value={o.id} className="bg-zinc-900">{o.nome}</option>)}
              </select>
            </div>
          </div>
          <Button type="button" onClick={aplicarEmLote} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-xl transition-all active:scale-95">
            <Zap className="w-3 h-3 mr-1" /> Ativar
          </Button>
        </div>

        {/* Valor Diária */}
        <div className="relative">
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 block mb-1 text-center">Valor Base Diária (8h)</label>
          <input 
            type="number" 
            placeholder="0,00" 
            value={valorDiaria}
            onChange={e => setValorDiaria(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl font-black text-center text-3xl text-emerald-500 outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Grade de Lançamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className={cn(
            "rounded-3xl p-5 border transition-all",
            dia === 'Sábado' ? "bg-zinc-900/40 border-zinc-800/50" : "bg-zinc-900/20 border-zinc-800"
          )}>
            <h3 className="text-[11px] font-black uppercase border-b border-zinc-800/50 pb-2 mb-3 text-zinc-500 flex justify-between items-center">
              {dia} {dia === 'Sábado' && <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-[8px]">Extra</span>}
            </h3>
            <div className="space-y-3">
              {TURNOS.map(t => {
                const info = gradeSemanal[dia]?.[t.label];
                const estaSelecionado = turnosSelecionados[dia]?.has(t.label);
                
                return (
                  <div key={t.label} className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => toggleTurnoSelecionado(dia, t.label)}
                      className="mt-1 flex-shrink-0"
                    >
                      {estaSelecionado ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-800 hover:text-zinc-700" />
                      )}
                    </button>

                    <div className="flex-1">
                      <select 
                        value={info?.obraId || ''} 
                        onChange={e => atualizarTurno(dia, t.label, e.target.value, info?.horas || 4)}
                        className={cn(
                          "w-full bg-zinc-950 border rounded-xl p-3 text-[11px] font-bold outline-none transition-all appearance-none",
                          estaSelecionado ? "border-emerald-500/30 text-emerald-400" : "border-zinc-800 text-zinc-600"
                        )}
                      >
                        <option value="">{t.label}...</option>
                        {obras.map(o => <option key={o.id} value={o.id} className="bg-zinc-900">{o.nome}</option>)}
                      </select>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="number" 
                        value={info?.horas || ''}
                        onChange={e => atualizarTurno(dia, t.label, info?.obraId || '', parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center text-xs font-black text-emerald-500 outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Botão Flutuante */}
      <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-50">
        <Button 
          onClick={handleSubmit}
          disabled={!profissionalId || valorTotalCalculado <= 0}
          className="w-full h-16 rounded-2xl shadow-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg uppercase tracking-wider border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-900"
        >
          Salvar: R$ {valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Button>
      </div>
    </div>
  );
}