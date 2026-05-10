import React, { useMemo } from 'react';
import { Printer, HardHat, DollarSign } from 'lucide-react';
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
  // 1. Agrupamento por Obra
  const lancamentosPorObra = useMemo(() => {
    return lancamentos.reduce((acc, lcto) => {
      const obra = lcto.obraNome || 'Sem Obra';
      if (!acc[obra]) acc[obra] = [];
      acc[obra].push(lcto);
      return acc;
    }, {} as Record<string, Lancamento[]>);
  }, [lancamentos]);

  // 2. Cálculo do Total Geral
  const totalGeral = useMemo(() => 
    lancamentos.reduce((sum, l) => sum + l.valor, 0), 
  [lancamentos]);

  if (!lancamentos || lancamentos.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado</div>;
  }

  return (
    <div className="mt-6 space-y-6" id="relatorio-imprimivel">
      {/* Botão de Impressão - Fica invisível no papel */}
      <div className="flex justify-between items-center print:hidden border-b pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HardHat className="w-5 h-5 text-primary" />
          Relatório Diário de Pagamentos
        </h2>
        <Button onClick={() => window.print()} variant="default" className="font-bold gap-2">
          <Printer className="w-4 h-4" /> IMPRIMIR AGORA
        </Button>
      </div>

      {/* Título do Relatório na Impressão */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase">Relatório de Pagamentos - Obras</h1>
        <p className="text-sm">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* LISTAGEM POR OBRA */}
      <div className="space-y-8">
        {Object.entries(lancamentosPorObra).map(([obra, itens]) => {
          const totalObra = itens.reduce((s, i) => s + i.valor, 0);
          
          return (
            <div key={obra} className="border-2 border-border rounded-xl overflow-hidden print:border-black">
              {/* Nome da Obra e Subtotal da Obra */}
              <div className="bg-muted px-4 py-3 flex justify-between items-center print:bg-gray-100 border-b-2 print:border-black">
                <span className="font-black text-sm uppercase tracking-tighter">OBRA: {obra}</span>
                <span className="font-bold text-primary print:text-black">
                  Total na Obra: R$ {totalObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tabela de Profissionais e Serviços */}
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 text-[10px] font-bold uppercase print:bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b">Profissional</th>
                    <th className="px-4 py-2 border-b">Serviço / Referência</th>
                    <th className="px-4 py-2 border-b text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itens.map((l) => (
                    <tr key={l.id} className="text-sm">
                      <td className="px-4 py-3 font-bold">{l.profissional}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs italic">
                        {l.descricaoEtapa || (l.tipo === 'diaria' ? 'Diária' : 'Empreitada')}
                      </td>
                      <td className="px-4 py-3 text-right font-black">
                        R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* TOTAL GERAL DO DIA */}
      <div className="mt-8 p-6 bg-black text-white rounded-xl flex justify-between items-center print:bg-white print:text-black print:border-4 print:border-black">
        <div className="uppercase font-black tracking-widest text-sm">Total Geral de Pagamentos</div>
        <div className="text-3xl font-black">
          R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* ESTA É A MÁGICA QUE ESCONDE O FORMULÁRIO NA IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Esconde absolutamente TUDO do site */
          body * { visibility: hidden !important; }
          
          /* Mostra apenas a div do relatório e seus filhos */
          #relatorio-imprimivel, #relatorio-imprimivel * { 
            visibility: visible !important; 
          }
          
          /* Reposiciona o relatório no topo da folha para não sair no meio do papel */
          #relatorio-imprimivel { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Remove cores de botões e fundos escuros para economizar tinta e ficar legível */
          .bg-black { background-color: white !important; color: black !important; }
          .text-white { color: black !important; }
        }
      `}} />
    </div>
  );
}