import React, { useMemo } from 'react';
import { Printer, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lancamento {
  id: string;
  data: string;
  profissional: string;
  obraNome: string;
  valor: number;
  tipo: string;
  categoria?: string;
  descricaoEtapa?: string;
}

interface Props {
  lancamentos: Lancamento[];
}

export function RelatorioLancamentos({ lancamentos }: Props) {
  // Agrupamento por Obra -> Profissional
  const lancamentosPorObraEProfissional = useMemo(() => {
    const agrupado = {} as Record<string, Record<string, Lancamento[]>>;
    
    lancamentos.forEach(lcto => {
      const obra = lcto.obraNome || 'Sem Obra';
      if (!agrupado[obra]) agrupado[obra] = {};
      
      const chave = lcto.profissional;
      if (!agrupado[obra][chave]) agrupado[obra][chave] = [];
      agrupado[obra][chave].push(lcto);
    });
    
    return agrupado;
  }, [lancamentos]);

  const totalGeral = useMemo(() => 
    lancamentos.reduce((sum, l) => sum + l.valor, 0), 
  [lancamentos]);

  if (!lancamentos || lancamentos.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado</div>;
  }

  return (
    <div className="mt-6 space-y-6" id="relatorio-imprimivel">
      {/* Botão de Impressão */}
      <div className="flex justify-between items-center print:hidden border-b pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HardHat className="w-5 h-5 text-primary" />
          Relatório Diário de Pagamentos
        </h2>
        <Button onClick={() => window.print()} variant="default" className="font-bold gap-2">
          <Printer className="w-4 h-4" /> IMPRIMIR AGORA
        </Button>
      </div>

      {/* Título na Impressão */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase">Relatório de Pagamentos - Obras</h1>
        <p className="text-sm">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* LISTAGEM POR OBRA */}
      <div className="space-y-8">
        {Object.entries(lancamentosPorObraEProfissional).map(([obra, profissionais]) => {
          const totalObra = Object.values(profissionais)
            .flat()
            .reduce((s, i) => s + i.valor, 0);
          
          return (
            <div key={obra} className="border-2 border-border rounded-xl overflow-hidden print:border-black">
              {/* Header da Obra */}
              <div className="bg-muted px-4 py-3 flex justify-between items-center print:bg-gray-100 border-b-2 print:border-black">
                <span className="font-black text-sm uppercase tracking-tighter">OBRA: {obra}</span>
                <span className="font-bold text-primary print:text-black">
                  Total na Obra: R$ {totalObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tabela */}
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 text-[10px] font-bold uppercase print:bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b">Profissional</th>
                    <th className="px-4 py-2 border-b">Lançamentos</th>
                    <th className="px-4 py-2 border-b text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(profissionais).map(([profissional, itens]) => {
                    const totalProfi = itens.reduce((s, l) => s + l.valor, 0);
                    
                    return (
                      <tr key={profissional} className="text-sm">
                        <td className="px-4 py-3 font-bold">{profissional}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs italic">
                          {itens.length} lançamento(s)
                        </td>
                        <td className="px-4 py-3 text-right font-black">
                          R$ {totalProfi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* TOTAL GERAL */}
      <div className="mt-8 p-6 bg-black text-white rounded-xl flex justify-between items-center print:bg-white print:text-black print:border-4 print:border-black">
        <div className="uppercase font-black tracking-widest text-sm">Total Geral de Pagamentos</div>
        <div className="text-3xl font-black">
          R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #relatorio-imprimivel, #relatorio-imprimivel * { visibility: visible !important; }
          #relatorio-imprimivel { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .bg-black { background-color: white !important; color: black !important; }
          .text-white { color: black !important; }
        }
      `}} />
    </div>
  );
}