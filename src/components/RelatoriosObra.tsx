import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// MUDAMOS O NOME DA FUNÇÃO PARA BATER COM O SEU INDEX.TSX
export function RelatoriosObra({ lancamentos = [] }) {
  const [expandedObras, setExpandedObras] = useState({});
  const relatorioRef = useRef(null);

  // Agrupar lançamentos por obra
  const lancamentosAgrupados = lancamentos.reduce((acc, lcto) => {
    const obraNome = lcto.obraNome || 'Sem Obra';
    if (!acc[obraNome]) {
      acc[obraNome] = [];
    }
    acc[obraNome].push(lcto);
    return acc;
  }, {});

  // Calcular totais
  const calcularTotalObra = (items) => {
    return items.reduce((sum, item) => sum + (item.valor || 0), 0);
  };

  const totalGeral = Object.values(lancamentosAgrupados).flat().reduce((sum, lcto) => sum + (lcto.valor || 0), 0);

  // Toggle expansão de obra
  const toggleObra = (obraNome) => {
    setExpandedObras(prev => ({
      ...prev,
      [obraNome]: !prev[obraNome]
    }));
  };

  // Imprimir relatório
  const handlePrint = () => {
    window.print();
  };

  // Exportar para PDF/Download
  const handleDownload = () => {
    const conteudo = relatorioRef.current?.innerText;
    const element = document.createElement('a');
    const file = new Blob([conteudo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_lancamentos_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (lancamentos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-8 text-center">
        <p className="text-muted-foreground">Nenhum lançamento registrado para hoje</p>
      </div>
    );
  }

  return (
    <div ref={relatorioRef} className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatório do Dia</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Baixar
          </Button>
        </div>
      </div>

      {/* Lançamentos por Obra */}
      <div className="space-y-4 print:space-y-3">
        {Object.entries(lancamentosAgrupados).map(([obraNome, items]) => {
          const totalObra = calcularTotalObra(items);
          const isExpanded = expandedObras[obraNome] !== false;
          
          return (
            <div 
              key={obraNome} 
              className="rounded-lg border border-border bg-background overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleObra(obraNome)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors print:pointer-events-none print:bg-transparent"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">{obraNome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {items.length} lançamento{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-primary">R$ {totalObra.toFixed(2)}</p>
                  </div>
                  <div className="print:hidden">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border print:border-t print:divide-y">
                  {items.map((lcto, idx) => (
                    <div 
                      key={idx} 
                      className="px-4 py-3 print:py-2 bg-muted/30 print:bg-white hover:bg-muted/50 print:hover:bg-white transition-colors"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2 text-sm">
                        {/* Prestador */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide print:text-[11px]">Prestador</p>
                          <p className="font-medium text-foreground mt-1 print:mt-0.5">{lcto.profissional || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground print:text-[10px]">{lcto.categoria || ''}</p>
                        </div>

                        {/* O que se refere */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide print:text-[11px]">Serviço</p>
                          {lcto.descricaoEtapa ? (
                            <p className="font-medium text-foreground mt-1 print:mt-0.5">{lcto.descricaoEtapa}</p>
                          ) : (
                            <p className="font-medium text-foreground mt-1 print:mt-0.5">
                              {lcto.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                              {lcto.turnos?.length > 0 && ` - ${lcto.turnos.join(', ')}`}
                            </p>
                          )}
                        </div>

                        {/* Detalhes */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide print:text-[11px]">Tipo</p>
                          <p className="font-medium text-foreground mt-1 print:mt-0.5 capitalize">
                            {lcto.tipo === 'diaria' ? '⏰ Diária' : '💼 Empreitada'}
                          </p>
                        </div>

                        {/* Valor */}
                        <div className="text-right sm:text-right">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide print:text-[11px]">Valor</p>
                          <p className="font-bold text-primary mt-1 print:mt-0.5 text-lg print:text-base">
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
      <div className="rounded-lg bg-primary/10 border border-primary/20 p-6 print:bg-white print:border print:border-foreground/20 mt-6 print:mt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground print:text-[12px]">Total de Lançamentos</p>
            <p className="text-lg font-semibold text-foreground mt-1 print:mt-0.5 print:text-base">
              {lancamentos.length} pagamento{lancamentos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-center print:text-right">
            <p className="text-sm text-muted-foreground uppercase tracking-wide print:text-[11px]">Total Geral</p>
            <p className="text-3xl print:text-2xl font-black text-primary mt-2 print:mt-1">
              R$ {totalGeral.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 12mm; }
          * { box-shadow: none !important; page-break-inside: avoid; }
          .print\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
}