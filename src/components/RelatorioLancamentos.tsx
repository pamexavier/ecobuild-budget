import React, { useMemo, useState } from 'react';
import { Printer, HardHat, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Estado para controlar quais IDs estão selecionados para exclusão
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

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

  // Função para marcar/desmarcar todos os lançamentos de uma vez
  const toggleTodos = () => {
    if (selecionados.size === lancamentos.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(lancamentos.map(l => l.id)));
    }
  };

  // Função para marcar/desmarcar um lançamento individual
  const toggleUm = (id: string) => {
    const novoSet = new Set(selecionados);
    if (novoSet.has(id)) {
      novoSet.delete(id);
    } else {
      novoSet.add(id);
    }
    setSelecionados(novoSet);
  };

  const handleExcluirLote = async () => {
    if (selecionados.size === 0) return;
    
    const confirmacao = confirm(`Deseja realmente excluir os ${selecionados.size} lançamentos selecionados?`);
    if (!confirmacao) return;

    const { error } = await supabase
      .from('lancamentos')
      .delete()
      .in('id', Array.from(selecionados));

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message
      });
    } else {
      toast({
        title: "Sucesso",
        description: `${selecionados.size} lançamentos removidos.`
      });
      setSelecionados(new Set());
      window.location.reload();
    }
  };

  if (!lancamentos || lancamentos.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado</div>;
  }

  return (
    <div className="mt-6 space-y-6" id="relatorio-imprimivel">
      {/* Barra de Ações */}
      <div className="flex justify-between items-center print:hidden border-b pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Relatório Diário
          </h2>
          
          {selecionados.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleExcluirLote}
              className="font-bold animate-in fade-in zoom-in duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              EXCLUIR {selecionados.size} SELECIONADOS
            </Button>
          )}
        </div>

        <Button onClick={() => window.print()} variant="default" className="font-bold gap-2">
          <Printer className="w-4 h-4" /> IMPRIMIR AGORA
        </Button>
      </div>

      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase">Relatório de Pagamentos - Obras</h1>
        <p className="text-sm">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="space-y-8">
        {Object.entries(lancamentosPorObraEProfissional).map(([obra, profissionais]) => {
          const totalObra = Object.values(profissionais)
            .flat()
            .reduce((s, i) => s + i.valor, 0);
          
          return (
            <div key={obra} className="border-2 border-border rounded-xl overflow-hidden print:border-black">
              <div className="bg-muted px-4 py-3 flex justify-between items-center print:bg-gray-100 border-b-2 print:border-black">
                <span className="font-black text-sm uppercase tracking-tighter">OBRA: {obra}</span>
                <span className="font-bold text-primary print:text-black">
                  Total na Obra: R$ {totalObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 text-[10px] font-bold uppercase print:bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b w-10 print:hidden">
                      <button onClick={toggleTodos} className="hover:text-primary transition-colors">
                        {selecionados.size === lancamentos.length ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2 border-b">Profissional</th>
                    <th className="px-4 py-2 border-b">Detalhes</th>
                    <th className="px-4 py-2 border-b text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(profissionais).map(([profissional, itens]) => (
                    <React.Fragment key={profissional}>
                      {itens.map((lcto, idx) => {
                        const isSelected = selecionados.has(lcto.id);
                        return (
                          <tr key={lcto.id} className={`text-sm transition-colors ${isSelected ? 'bg-red-50/50' : ''}`}>
                            <td className="px-4 py-3 border-b print:hidden">
                              <button onClick={() => toggleUm(lcto.id)} className="transition-colors">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-red-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-bold border-b">
                              {idx === 0 ? profissional : ""}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs italic border-b">
                              {lcto.data} - {lcto.tipo} {lcto.descricaoEtapa ? `(${lcto.descricaoEtapa})` : ""}
                            </td>
                            <td className="px-4 py-3 text-right font-black border-b">
                              R$ {lcto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

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