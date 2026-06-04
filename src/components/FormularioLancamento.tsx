import { useState, useMemo, useRef, useEffect } from 'react';
import { Sun, Moon, Sunset, Zap, Search, User, Calendar, CalendarDays, CheckSquare, Square, AlertCircle, FileText } from 'lucide-react'; // Adicionei o CalendarDays
import { Obra, Profissional, Turno, Lancamento } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Estendemos o tipo submetido para incluir a data de vencimento
interface Props {
  obras: Obra[];
  profissionais: Profissional[];
  onSubmit: (l: Omit<Lancamento, 'id'> & { data_vencimento: string }) => void; 
}

const TURNOS: { label: Turno; icon: any }[] = [
  { label: 'Manhã', icon: Sun },
  { label: 'Tarde', icon: Sunset },
  { label: 'Noite', icon: Moon },
];

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Configuração de tipos (Mantida igual)
const TIPOS_LANCAMENTO = {
  diaria: {
    label: 'Diária',
    cor: 'bg-blue-500/20 text-blue-700 border-blue-300 hover:bg-blue-500/30',
    corBotao: 'bg-blue-600 hover:bg-blue-700 border-blue-800',
    hint: 'Trabalho por hora/dia',
    corGrade: 'border-blue-500/30 text-blue-400'
  },
  empreitada: {
    label: 'Empreitada',
    cor: 'bg-green-500/20 text-green-700 border-green-300 hover:bg-green-500/30',
    corBotao: 'bg-green-600 hover:bg-green-700 border-green-800',
    hint: 'Trabalho por escopo (Lançar por medição/parcela)',
    corGrade: 'border-green-500/30 text-green-400'
  },
  extra: {
    label: 'Serviço Extra',
    cor: 'bg-purple-500/20 text-purple-700 border-purple-300 hover:bg-purple-500/30',
    corBotao: 'bg-purple-600 hover:bg-purple-700 border-purple-800',
    hint: 'Serviço adicional não previsto',
    corGrade: 'border-purple-500/30 text-purple-400'
  },
  reembolso: {
    label: 'Reembolso',
    cor: 'bg-orange-500/20 text-orange-700 border-orange-300 hover:bg-orange-500/30',
    corBotao: 'bg-orange-600 hover:bg-orange-700 border-orange-800',
    hint: 'Devolução de valores gastos',
    corGrade: 'border-orange-500/30 text-orange-400'
  },
  frete: {
    label: 'Frete',
    cor: 'bg-cyan-500/20 text-cyan-700 border-cyan-300 hover:bg-cyan-500/30',
    corBotao: 'bg-cyan-600 hover:bg-cyan-700 border-cyan-800',
    hint: 'Transporte de materiais',
    corGrade: 'border-cyan-500/30 text-cyan-400'
  }
};

const padronizar = (txt: string) => txt.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());

export function FormularioLancamento({ obras, profissionais, onSubmit }: Props) {
  const [tipoSelecionado, setTipoSelecionado] = useState<keyof typeof TIPOS_LANCAMENTO>('diaria');
  const [profissionalId, setProfissionalId] = useState('');
  const [buscaProfissional, setBuscaProfissional] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  
  // Estado original para a data do apontamento
  const [dataLancamento, setDataLancamento] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });

  // NOVO: Estado para a data de vencimento (Sugere o dia de hoje + 5 dias por padrão, você pode mudar se quiser)
  const [dataVencimento, setDataVencimento] = useState(() => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 5); 
    return hoje.toISOString().split('T')[0];
  });
  
  // Estados para Diárias (Grade) - Mantidos
  const [valorDiaria, setValorDiaria] = useState('');
  const [obraPadraoId, setObraPadraoId] = useState('');
  const [gradeSemanal, setGradeSemanal] = useState<Record<string, Record<string, {obraId: string, horas: number}>>>({});
  const [turnosSelecionados, setTurnosSelecionados] = useState<Record<string, Set<string>>>({});
  
  // Estados para Outros Tipos (Empreitada, etc) - Mantidos
  const [obraUnicaId, setObraUnicaId] = useState('');
  const [valorUnico, setValorUnico] = useState('');
  const [descricaoUnica, setDescricaoUnica] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const tipoConfig = TIPOS_LANCAMENTO[tipoSelecionado];

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

  // Lógica Diárias - Mantida
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
    const diasUteis = DIAS_SEMANA.slice(0, 5);

    diasUteis.forEach(dia => {
      if (!novaGrade[dia]) novaGrade[dia] = {};
      if (!novosSelecionados[dia]) novosSelecionados[dia] = new Set();
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

  // Cálculo de Valor Dinâmico - Mantido
  const valorTotalCalculado = useMemo(() => {
    if (tipoSelecionado !== 'diaria') {
      return parseFloat(valorUnico) || 0;
    }

    const valorHora = (parseFloat(valorDiaria) || 0) / 8;
    let totalHoras = 0;
    
    Object.entries(turnosSelecionados).forEach(([dia, turnos]) => {
      turnos.forEach(turno => {
        const horas = gradeSemanal[dia]?.[turno]?.horas || 0;
        totalHoras += horas;
      });
    });
    
    return totalHoras * valorHora;
  }, [gradeSemanal, turnosSelecionados, valorDiaria, valorUnico, tipoSelecionado]);

  // Submit Dinâmico Modificado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profissionalId || valorTotalCalculado <= 0) return;
    const selectedProf = profissionais.find(p => p.id === profissionalId);

    if (tipoSelecionado === 'diaria') {
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
            tipo: tipoSelecionado,
            turnos: [`${dia}-${turno} (${dados.horas}h)`],
            valor: ((parseFloat(valorDiaria) / 8) * dados.horas),
            data: dataLancamento,
            data_vencimento: dataVencimento // NOVO: Enviando a data de vencimento
          });
        });
      });
    } else {
      if (!obraUnicaId) return; 
      const obra = obras.find(o => o.id === obraUnicaId);
      
      onSubmit({
        obraId: obraUnicaId,
        obraNome: obra?.nome || '',
        profissionalId,
        profissional: padronizar(selectedProf?.nome || ''),
        categoria: selectedProf?.categoria || '',
        tipo: tipoSelecionado,
        turnos: [descricaoUnica || tipoConfig.label],
        valor: valorTotalCalculado,
        data: dataLancamento,
        data_vencimento: dataVencimento // NOVO: Enviando a data de vencimento
      });
    }

    // Resetar Formulário
    setGradeSemanal({});
    setTurnosSelecionados({});
    setProfissionalId('');
    setBuscaProfissional('');
    setValorUnico('');
    setDescricaoUnica('');
    setObraUnicaId('');
  };

  const isBotaoDesativado = !profissionalId || valorTotalCalculado <= 0 || (tipoSelecionado !== 'diaria' && !obraUnicaId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 px-2">
      <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
        
        {/* SELETOR DE TIPO */}
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-3 block flex items-center gap-2">
            <AlertCircle className="w-3 h-3" /> Tipo de Lançamento
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(TIPOS_LANCAMENTO).map(([tipoKey, config]) => (
              <button
                key={tipoKey}
                type="button"
                onClick={() => setTipoSelecionado(tipoKey as keyof typeof TIPOS_LANCAMENTO)}
                className={`px-3 py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                  tipoSelecionado === tipoKey
                    ? `${config.cor} border-current scale-105`
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {tipoConfig.hint}
          </p>
        </div>

        {/* Datas Lado a Lado */}
        <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-2 block flex items-center gap-2">
              <CalendarDays className="w-3 h-3 text-red-500" /> Data de Vencimento
            </label>
            <input 
              type="date" 
              value={dataVencimento} 
              onChange={e => setDataVencimento(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-zinc-200 font-bold text-sm focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
            />
          </div>
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

        {/* ... (O restante do código de MODO DIÁRIA e MODO LANÇAMENTO ÚNICO permanece inalterado) ... */}
        {/* MODO DIÁRIA: Ferramenta Rápida + Valor */}
        {tipoSelecionado === 'diaria' && (
          <>
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
          </>
        )}
        
        {/* MODO LANÇAMENTO ÚNICO (Empreitada, Frete, etc) */}
        {tipoSelecionado !== 'diaria' && (
          <div className="space-y-4 pt-2 border-t border-white/5">
             <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 block mb-1">Obra Referente</label>
                <select 
                  value={obraUnicaId} 
                  onChange={e => setObraUnicaId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-200 outline-none appearance-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id} className="bg-zinc-900">{o.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 block mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Descrição do Serviço / Medição (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Assentamento de piso - 30% concluído" 
                  value={descricaoUnica}
                  onChange={e => setDescricaoUnica(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="relative pt-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 block mb-1 text-center">Valor a Pagar (Nesta Medição)</label>
                <input 
                  type="number" 
                  placeholder="0,00" 
                  value={valorUnico}
                  onChange={e => setValorUnico(e.target.value)}
                  className={cn(
                    "w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl font-black text-center text-3xl outline-none transition-all",
                    `focus:border-${tipoConfig.cor.split('-')[1]}-500/50 text-${tipoConfig.cor.split('-')[1]}-500`
                  )}
                />
              </div>
          </div>
        )}
      </div>

      {/* Grade de Lançamentos - SÓ MOSTRA SE FOR DIÁRIA */}
      {tipoSelecionado === 'diaria' && (
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
                          <CheckSquare className={cn("w-5 h-5", tipoConfig.corGrade)} />
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
                            estaSelecionado ? tipoConfig.corGrade : "border-zinc-800 text-zinc-600"
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
      )}

      {/* Botão Flutuante */}
      <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-50">
        <Button 
          onClick={handleSubmit}
          disabled={isBotaoDesativado}
          className={cn(
            "w-full h-16 rounded-2xl shadow-2xl text-white font-black text-lg uppercase tracking-wider border-b-4 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-900",
            isBotaoDesativado 
              ? 'opacity-50 bg-zinc-800 border-zinc-900' 
              : `${tipoConfig.corBotao} border-current`
          )}
        >
          {tipoConfig.label}: R$ {valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Button>
      </div>
    </div>
  );
}