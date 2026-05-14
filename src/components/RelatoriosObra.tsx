import { useState, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, Printer, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardPropostaPagamento, PropostaPagamento } from '@/components/SistemaPropostaPagamento';

export function RelatoriosObra({ lancamentos = [] }) {
  const [expandedObras, setExpandedObras] = useState({});
  const [propostas, setPropostas] = useState<PropostaPagamento[]>([]);
  
  const [dataFiltro, setDataFiltro] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const relatorioRef = useRef(null);

  if (!lancamentos || !Array.isArray(lancamentos)) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center rounded-lg border border-border bg-muted/10 p-8 text-center">
        <p className="text-muted-foreground">Aguardando dados ou formato incorreto recebido do servidor...</p>
      </div>
    );
  }

  const lancamentosDoDia = useMemo(() => {
    return lancamentos.filter(lcto => lcto.data === dataFiltro);
  }, [lancamentos, dataFiltro]);

  const lancamentosAgrupados = lancamentosDoDia.reduce((acc, lcto) => {
    const obraNome = lcto.obraNome || 'Sem Obra';
    if (!acc[obraNome]) {
      acc[obraNome] = [];
    }
    acc[obraNome].push(lcto);
    return acc;
  }, {});

  const calcularTotalObra = (items) => {
    return items.reduce((sum, item) => sum + (item.valor || 0), 0);
  };

  const totalGeral = Object.values(lancamentosAgrupados).flat().reduce((sum, lcto) => sum + (lcto.valor || 0), 0);

  const toggleObra = (obraNome) => {
    setExpandedObras(prev => ({
      ...prev,
      [obraNome]: !prev[obraNome]
    }));
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const conteudo = relatorioRef.current?.innerText;
    const element = document.createElement('a');
    const file = new Blob([conteudo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_lancamentos_${dataFiltro}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const dataFormatadaExibicao = new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div ref={relatorioRef} className="w-full space-y-6 print:space-y-4 pb-24">
      {/* Header com Filtro de Data */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden bg-[#121212] p-5 rounded-3xl border border-white/5 shadow-2xl">
        <div>
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Relatório Diário</h2>
          <p className="text-sm text-emerald-500 font-bold mt-1 capitalize">
            {dataFormatadaExibicao}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          
          {/* =======================================================
              INPUT DE DATA CUSTOMIZADO (PRETO COM VERDE)
          ======================================================= */}
          <div className="relative group w-full sm:w-auto flex items-center">
            {/* Ícone customizado que fica por cima do input nativo */}
            <CalendarIcon className="absolute left-4 w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors pointer-events-none z-10" />
            
            <input 
              type="date" 
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              style={{ colorScheme: 'dark' }} /* Força a janela do calendário a abrir preta */
              className="date-input-custom w-full sm:w-auto bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black text-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all shadow-inner relative z-0"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="flex-1 sm:flex-none items-center gap-2 py-6 rounded-2xl border-zinc-800 hover:bg-zinc-800 hover:text-white"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex-1 sm:flex-none items-center gap-2 py-6 rounded-2xl border-zinc-800 hover:bg-zinc-800 hover:text-white"
            >
              <Download className="w-4 h-4" /> Baixar
            </Button>
          </div>
        </div>
      </div>

      {/* Tela Vazia Baseada na Data Selecionada */}
      {lancamentosDoDia.length === 0 ? (
        <div className="w-full min-h-[40vh] flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#121212]/50 p-8 text-center mt-6">
          <CalendarIcon className="w-12 h-12 text-emerald-500/30 mb-4" />
          <p className="text-zinc-300 text-lg font-black uppercase tracking-wider">Nenhum lançamento registrado</p>
          <p className="text-sm text-zinc-500 mt-1 font-bold">Nenhuma atividade financeira em {dataFiltro.split('-').reverse().join('/')}</p>
        </div>
      ) : (
        <>
          {/* Lançamentos por Obra */}
          <div className="space-y-4 print:space-y-3">
            {Object.entries(lancamentosAgrupados).map(([obraNome, items]) => {
              const totalObra = calcularTotalObra(items);
              const isExpanded = !!expandedObras[obraNome]; 
              
              return (
                <div 
                  key={obraNome} 
                  className="rounded-3xl border border-white/5 bg-[#121212] overflow-hidden shadow-sm transition-all hover:border-emerald-500/20"
                >
                  <button
                    onClick={() => toggleObra(obraNome)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors print:pointer-events-none print:bg-transparent"
                  >
                    <div className="flex-1 text-left">
                      <h3 className="font-black text-white uppercase tracking-wide text-sm">{obraNome}</h3>
                      <p className="text-xs text-zinc-500 font-bold mt-1">
                        {items.length} lançamento{items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-emerald-500 text-lg">R$ {totalObra.toFixed(2)}</p>
                      </div>
                      <div className="print:hidden bg-zinc-900 p-2 rounded-xl">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5 divide-y divide-white/5 print:border-t print:divide-y">
                      {items.map((lcto, idx) => (
                        <div 
                          key={idx} 
                          className="px-6 py-5 print:py-2 bg-zinc-900/30 print:bg-white hover:bg-zinc-900/50 print:hover:bg-white transition-colors"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 text-sm">
                            {/* Prestador */}
                            <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest print:text-[11px] mb-1">Prestador</p>
                              <p className="font-bold text-zinc-200 print:mt-0.5">{lcto.profissional || 'N/A'}</p>
                              <p className="text-xs text-zinc-600 print:text-[10px] font-semibold">{lcto.categoria || ''}</p>
                            </div>

                            {/* O que se refere */}
                            <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest print:text-[11px] mb-1">Serviço</p>
                              {lcto.descricaoEtapa ? (
                                <p className="font-bold text-zinc-200 print:mt-0.5">{lcto.descricaoEtapa}</p>
                              ) : (
                                <p className="font-bold text-zinc-200 print:mt-0.5">
                                  {lcto.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                                  {lcto.turnos?.length > 0 && ` - ${lcto.turnos.join(', ')}`}
                                </p>
                              )}
                            </div>

                            {/* Detalhes */}
                            <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest print:text-[11px] mb-1">Tipo</p>
                              <span className="font-bold text-xs bg-zinc-950 px-3 py-1.5 rounded-lg text-emerald-500 print:mt-0.5 capitalize border border-emerald-500/20 inline-block">
                                {lcto.tipo === 'diaria' ? '⏰ Diária' : '💼 Empreitada'}
                              </span>
                            </div>

                            {/* Valor */}
                            <div className="text-right sm:text-right">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest print:text-[11px] mb-1">Valor</p>
                              <p className="font-black text-white mt-1 print:mt-0.5 text-lg print:text-base">
                                R$ {lcto.valor?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumo Total */}
          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6 print:bg-white print:border print:border-foreground/20 mt-6 print:mt-4 shadow-lg shadow-emerald-500/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest print:text-[12px]">Total de Lançamentos do Dia</p>
                <p className="text-lg font-black text-white mt-1 print:mt-0.5 print:text-base">
                  {lancamentosDoDia.length} pagamento{lancamentosDoDia.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-center sm:text-right print:text-right">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest print:text-[11px]">Total Geral (Dia Selecionado)</p>
                <p className="text-3xl print:text-2xl font-black text-emerald-500 mt-1 print:mt-1">
                  R$ {totalGeral.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TRUQUE DO CSS PARA O CALENDÁRIO */}
      <style>{`
        /* Esconde o ícone de calendário feio do navegador e expande a área clicável */
        .date-input-custom::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
          z-index: 10;
        }
        
        @media print {
          body { margin: 0; padding: 12mm; }
          * { box-shadow: none !important; page-break-inside: avoid; }
          .print\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
}