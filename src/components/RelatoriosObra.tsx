import { useState, useRef, useMemo } from 'react';
import { Printer, Download, Calendar as CalendarIcon, Trash2, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Profissional {
  id: string;
  nome: string;
  categoria?: string;
  chavePix?: string;
  tipoChavePix?: string;
  documento?: string;
}

export function RelatoriosObra({ 
  lancamentos = [], 
  profissionais = [], 
  onDelete,
  onUpdate
}: { 
  lancamentos?: any[]; 
  profissionais?: Profissional[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: any) => void;
}) {
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().split('T')[0]);
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<string | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState<any>({});
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!lancamentos || !Array.isArray(lancamentos)) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center rounded-lg border border-border bg-muted/10 p-8 text-center">
        <p className="text-muted-foreground">Aguardando dados...</p>
      </div>
    );
  }

  const lancamentosDoDia = useMemo(() => {
    return lancamentos.filter(lcto => lcto.data === dataFiltro);
  }, [lancamentos, dataFiltro]);

  const lancamentosAgrupados = useMemo(() => {
    return lancamentosDoDia.reduce((acc, lcto) => {
      const obraNome = lcto.obraNome || 'Sem Obra';
      if (!acc[obraNome]) acc[obraNome] = [];
      acc[obraNome].push(lcto);
      return acc;
    }, {} as Record<string, any[]>);
  }, [lancamentosDoDia]);

  // Cruzar lançamento com cadastro do profissional para pegar pix
  const getProfissional = (nome: string): Profissional | undefined => {
    return profissionais.find(p =>
      p.nome?.toLowerCase().trim() === nome?.toLowerCase().trim()
    );
  };

  const totalPorFornecedor = useMemo(() => {
    const map: Record<string, {
      nome: string;
      categoria: string;
      total: number;
      obras: Record<string, number>;
      chavePix?: string;
      tipoChavePix?: string;
    }> = {};

    lancamentosDoDia.forEach(lcto => {
      const key = lcto.profissional || 'N/A';
      if (!map[key]) {
        const prof = getProfissional(key);
        map[key] = {
          nome: key,
          categoria: lcto.categoria || '',
          total: 0,
          obras: {},
          chavePix: prof?.chavePix,
          tipoChavePix: prof?.tipoChavePix,
        };
      }
      map[key].total += lcto.valor || 0;
      const obra = lcto.obraNome || 'Sem Obra';
      map[key].obras[obra] = (map[key].obras[obra] || 0) + (lcto.valor || 0);
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [lancamentosDoDia, profissionais]);

  const totalGeral = lancamentosDoDia.reduce((s, l) => s + (l.valor || 0), 0);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const dataFormatadaSimples = dataFiltro.split('-').reverse().join('/');
  const dataFormatadaExibicao = new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const handlePrint = () => {
    const conteudo = printRef.current?.innerHTML;
    const janela = window.open('', '_blank', 'width=900,height=700');
    if (!janela || !conteudo) return;

    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Fechamento de Pagamentos - ${dataFormatadaSimples}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #111; padding: 32px; font-size: 13px; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #111; }
          .header-left .brand { font-size: 10px; font-weight: 900; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
          .header-left h1 { font-size: 24px; font-weight: 900; color: #111; }
          .header-left .periodo { font-size: 11px; color: #666; margin-top: 4px; font-weight: 600; }
          .header-right .label { font-size: 9px; font-weight: 900; color: #888; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
          .header-right .total { font-size: 28px; font-weight: 900; color: #059669; text-align: right; margin-top: 2px; }

          /* RESUMO FORNECEDOR — VEM PRIMEIRO */
          .fornecedor-section { margin-bottom: 40px; }
          .fornecedor-section h2 { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #111; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #111; letter-spacing: 1px; }
          .fornecedor-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .fornecedor-card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
          .fornecedor-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
          .fornecedor-nome { font-size: 12px; font-weight: 900; color: #111; text-transform: uppercase; }
          .fornecedor-cat { font-size: 10px; color: #6b7280; font-weight: 600; margin-top: 2px; }
          .fornecedor-total { font-size: 16px; font-weight: 900; color: #059669; white-space: nowrap; margin-left: 12px; }
          .fornecedor-body { padding: 10px 16px; }
          .fornecedor-obra-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
          .fornecedor-obra-row:last-child { border-bottom: none; }
          .fornecedor-obra-row span { font-size: 11px; color: #374151; font-weight: 600; }
          .fornecedor-obra-row strong { font-size: 11px; font-weight: 900; color: #111; }
          .pix-badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 6px 10px; background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; }
          .pix-badge .pix-label { font-size: 9px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; }
          .pix-badge .pix-tipo { font-size: 9px; font-weight: 700; color: #6b7280; }
          .pix-badge .pix-chave { font-size: 11px; font-weight: 900; color: #059669; }
          .sem-pix { margin-top: 8px; font-size: 9px; color: #d1d5db; font-weight: 700; text-transform: uppercase; }

          /* DETALHE POR OBRA */
          .obra-section { margin-bottom: 32px; }
          .obra-section h2 { font-size: 13px; font-weight: 900; text-transform: uppercase; color: #111; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #111; letter-spacing: 1px; }
          .obra-block { margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
          .obra-header { background: #111; color: white; padding: 10px 18px; display: flex; justify-content: space-between; align-items: center; }
          .obra-header h3 { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
          .obra-header .subtotal { font-size: 13px; font-weight: 900; color: #10b981; }
          .table-head { display: grid; grid-template-columns: 1fr 1fr 110px 110px; gap: 8px; padding: 7px 18px; background: #f3f4f6; border-top: 1px solid #e5e7eb; }
          .table-head span { font-size: 9px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
          .table-head span:last-child { text-align: right; }
          .lancamento-row { display: grid; grid-template-columns: 1fr 1fr 110px 110px; gap: 8px; padding: 10px 18px; border-top: 1px solid #f3f4f6; align-items: center; }
          .col-value { font-size: 12px; font-weight: 700; color: #111; }
          .col-sub { font-size: 10px; color: #6b7280; font-weight: 600; margin-top: 1px; }
          .tag { display: inline-block; font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
          .valor-col { text-align: right; }
          .valor-col .col-value { font-size: 13px; font-weight: 900; }

          /* RODAPÉ */
          .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #111; display: flex; justify-content: space-between; align-items: flex-end; }
          .footer-total-label { font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
          .footer-total { font-size: 32px; font-weight: 900; color: #059669; margin-top: 4px; }
          .footer-info { text-align: right; font-size: 10px; color: #9ca3af; font-weight: 600; }

          @media print {
            body { padding: 15mm; }
          }
        </style>
      </head>
      <body>${conteudo}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 500);
  };

  const handleDownload = () => {
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([printRef.current?.innerText || ''], { type: 'text/plain' }));
    el.download = `fechamento_${dataFiltro}.txt`;
    el.click();
  };

  const dataFormatadaSimplesBR = dataFiltro.split('-').reverse().join('/');

  // Funções de edição
  const iniciarEdicao = (lcto: any) => {
    setLancamentoEmEdicao(lcto.id);
    setDadosEdicao({ ...lcto });
  };

  const salvarEdicao = (id: string) => {
    if (onUpdate) {
      onUpdate(id, dadosEdicao);
      setLancamentoEmEdicao(null);
      setDadosEdicao({});
      toast({ title: "Lançamento atualizado!" });
    }
  };

  const cancelarEdicao = () => {
    setLancamentoEmEdicao(null);
    setDadosEdicao({});
  };

  const deletarLancamento = (id: string) => {
    if (onDelete && window.confirm('Tem certeza que deseja deletar este lançamento?')) {
      onDelete(id);
      toast({ title: "Lançamento removido!" });
    }
  };

  // Funções de seleção múltipla
  const toggleSelecionado = (id: string) => {
    const novo = new Set(selecionados);
    if (novo.has(id)) {
      novo.delete(id);
    } else {
      novo.add(id);
    }
    setSelecionados(novo);
  };

  const selecionarTodos = () => {
    if (selecionados.size === lancamentosDoDia.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(lancamentosDoDia.map(l => l.id)));
    }
  };

  const deletarSelecionados = () => {
    if (selecionados.size === 0) return;
    if (window.confirm(`Deletar ${selecionados.size} lançamento${selecionados.size > 1 ? 's' : ''}?`)) {
      selecionados.forEach(id => {
        if (onDelete) onDelete(id);
      });
      setSelecionados(new Set());
      toast({ title: `${selecionados.size} lançamento(s) removido(s)!` });
    }
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header com Filtro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121212] p-5 rounded-3xl border border-white/5 shadow-2xl">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Fechamento de Pagamentos</h2>
          <p className="text-sm text-emerald-500 font-bold mt-1 capitalize">{dataFormatadaExibicao}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <div className="relative group w-full sm:w-auto flex items-center">
            <CalendarIcon className="absolute left-4 w-4 h-4 text-emerald-500 pointer-events-none z-10" />
            <input
              type="date"
              value={dataFiltro}
              onChange={e => setDataFiltro(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black text-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none gap-2 py-6 rounded-2xl border-zinc-800 hover:bg-zinc-800 hover:text-white">
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none gap-2 py-6 rounded-2xl border-zinc-800 hover:bg-zinc-800 hover:text-white">
              <Download className="w-4 h-4" /> Baixar
            </Button>
          </div>
        </div>
      </div>

      {/* Tela Vazia */}
      {lancamentosDoDia.length === 0 ? (
        <div className="w-full min-h-[40vh] flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#121212]/50 p-8 text-center">
          <CalendarIcon className="w-12 h-12 text-emerald-500/30 mb-4" />
          <p className="text-zinc-300 text-lg font-black uppercase tracking-wider">Nenhum lançamento registrado</p>
          <p className="text-sm text-zinc-500 mt-1 font-bold">Nenhuma atividade em {dataFormatadaSimplesBR}</p>
        </div>
      ) : (
        <>
          {/* RESUMO POR FORNECEDOR — primeiro na tela */}
          <div className="rounded-3xl border border-white/5 bg-[#121212] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-black text-white uppercase tracking-wide text-sm">Resumo por Fornecedor</h3>
            </div>
            <div className="divide-y divide-white/5">
              {totalPorFornecedor.map(f => (
                <div key={f.nome} className="px-6 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-black text-white text-sm uppercase">{f.nome}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">{f.categoria}</p>
                    </div>
                    <p className="font-black text-emerald-500 text-xl">{fmt(f.total)}</p>
                  </div>

                  {/* Obras */}
                  <div className="space-y-1 mb-3">
                    {Object.entries(f.obras).map(([obra, val]) => (
                      <div key={obra} className="flex justify-between text-xs">
                        <span className="text-zinc-500 font-semibold">{obra}</span>
                        <span className="text-zinc-300 font-black">{fmt(val as number)}</span>
                      </div>
                    ))}
                  </div>

                  {/* PIX */}
                  {f.chavePix ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">💳 Pix</span>
                      {f.tipoChavePix && (
                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">{f.tipoChavePix}</span>
                      )}
                      <span className="text-xs font-black text-emerald-400">{f.chavePix}</span>
                    </div>
                  ) : (
                    <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">💳 Pix não cadastrado</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DETALHE POR OBRA */}
          <div className="space-y-4">
            {Object.entries(lancamentosAgrupados).map(([obraNome, items]) => {
              const totalObra = items.reduce((s, i) => s + (i.valor || 0), 0);
              return (
                <div key={obraNome} className="rounded-3xl border border-white/5 bg-[#121212] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 flex items-center justify-between bg-zinc-900/60">
                    <h3 className="font-black text-white uppercase tracking-wide text-sm">🏗 {obraNome}</h3>
                    <span className="font-black text-emerald-500 text-base">Subtotal: {fmt(totalObra)}</span>
                  </div>
                  <div className="grid grid-cols-6 px-6 py-2 border-t border-white/5 bg-zinc-950/40">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        checked={selecionados.size === items.length && items.length > 0}
                        onChange={selecionarTodos}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 cursor-pointer accent-emerald-500"
                      />
                    </div>
                    {['Prestador', 'Serviço', 'Tipo', 'Valor', 'Ações'].map((h, i) => (
                      <span key={h} className={`text-[9px] font-black text-zinc-600 uppercase tracking-widest ${i === 3 ? 'text-right' : ''}`}>{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-white/5">
                    {items.map((lcto, idx) => (
                      <div key={idx}>
                        {lancamentoEmEdicao === lcto.id ? (
                          // ✏️ MODO EDIÇÃO
                          <div className="grid grid-cols-6 gap-2 px-6 py-3 bg-zinc-900/40">
                            <div></div>
                            <input
                              type="text"
                              value={dadosEdicao.profissional || ''}
                              onChange={e => setDadosEdicao({ ...dadosEdicao, profissional: e.target.value })}
                              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={dadosEdicao.descricaoEtapa || ''}
                              onChange={e => setDadosEdicao({ ...dadosEdicao, descricaoEtapa: e.target.value })}
                              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <span className="text-[10px] font-black bg-zinc-950 px-2 py-1 rounded text-emerald-500 border border-emerald-500/20 capitalize">
                              {dadosEdicao.tipo === 'diaria' ? '⏰' : '💼'}
                            </span>
                            <input
                              type="number"
                              value={dadosEdicao.valor || 0}
                              onChange={e => setDadosEdicao({ ...dadosEdicao, valor: parseFloat(e.target.value) })}
                              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white text-right"
                            />
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => salvarEdicao(lcto.id)}
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                                title="Confirmar"
                              >
                                <Check className="w-3.5 h-3.5 text-white" />
                              </button>
                              <button
                                onClick={cancelarEdicao}
                                className="p-1 bg-red-600 hover:bg-red-500 rounded transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 👁️ MODO VISUALIZAÇÃO
                          <div className="grid grid-cols-6 gap-2 px-6 py-3 hover:bg-white/[0.02] transition-colors items-center">
                            <input 
                              type="checkbox"
                              checked={selecionados.has(lcto.id)}
                              onChange={() => toggleSelecionado(lcto.id)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 cursor-pointer accent-emerald-500"
                            />
                            <div>
                              <p className="font-bold text-zinc-200 text-xs">{lcto.profissional || 'N/A'}</p>
                              <p className="text-[9px] text-zinc-600 font-semibold">{lcto.categoria || ''}</p>
                            </div>
                            <div>
                              <p className="font-bold text-zinc-200 text-xs">
                                {lcto.descricaoEtapa || (lcto.tipo === 'diaria' ? 'Diária' : 'Empreitada')}
                              </p>
                              {lcto.turnos?.length > 0 && (
                                <p className="text-[9px] text-zinc-600 font-semibold">{lcto.turnos.join(', ')}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-[9px] font-black bg-zinc-950 px-2 py-0.5 rounded text-emerald-500 border border-emerald-500/20 capitalize inline-block">
                                {lcto.tipo === 'diaria' ? '⏰' : '💼'}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-white text-sm">{fmt(lcto.valor || 0)}</p>
                            </div>
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => iniciarEdicao(lcto)}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 rounded transition-colors border border-blue-500/20"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                              </button>
                              <button
                                onClick={() => deletarLancamento(lcto.id)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded transition-colors border border-red-500/20"
                                title="Deletar"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Barra de ações se há selecionados */}
                    {selecionados.size > 0 && items.some(i => selecionados.has(i.id)) && (
                      <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400">
                          {items.filter(i => selecionados.has(i.id)).length} selecionado{items.filter(i => selecionados.has(i.id)).length > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={deletarSelecionados}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Deletar Selecionados
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Geral */}
          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
            <div>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total de Lançamentos</p>
              <p className="text-lg font-black text-white mt-1">{lancamentosDoDia.length} pagamento{lancamentosDoDia.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total Geral</p>
              <p className="text-3xl font-black text-emerald-500 mt-1">{fmt(totalGeral)}</p>
            </div>
          </div>
        </>
      )}

      {/* HTML oculto para impressão */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <div className="header-left">
            <div className="brand">Zentra-X — Gestão Inteligente de Obras</div>
            <h1>Fechamento de Pagamentos</h1>
            <div className="periodo">Data: {dataFormatadaSimplesBR}</div>
          </div>
          <div className="header-right">
            <div className="label">Total Acumulado</div>
            <div className="total">{fmt(totalGeral)}</div>
          </div>
        </div>

        {/* Resumo fornecedor primeiro na impressão */}
        <div className="fornecedor-section">
          <h2>Resumo por Fornecedor</h2>
          <div className="fornecedor-grid">
            {totalPorFornecedor.map(f => (
              <div key={f.nome} className="fornecedor-card">
                <div className="fornecedor-header">
                  <div>
                    <div className="fornecedor-nome">{f.nome}</div>
                    <div className="fornecedor-cat">{f.categoria}</div>
                  </div>
                  <div className="fornecedor-total">{fmt(f.total)}</div>
                </div>
                <div className="fornecedor-body">
                  {Object.entries(f.obras).map(([obra, val]) => (
                    <div key={obra} className="fornecedor-obra-row">
                      <span>{obra}</span>
                      <strong>{fmt(val as number)}</strong>
                    </div>
                  ))}
                  {f.chavePix ? (
                    <div className="pix-badge">
                      <span className="pix-label">💳 Pix</span>
                      {f.tipoChavePix && <span className="pix-tipo">{f.tipoChavePix}</span>}
                      <span className="pix-chave">{f.chavePix}</span>
                    </div>
                  ) : (
                    <div className="sem-pix">💳 Pix não cadastrado</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhe por obra */}
        <div className="obra-section">
          <h2>Detalhamento por Obra</h2>
          {Object.entries(lancamentosAgrupados).map(([obraNome, items]) => {
            const totalObra = items.reduce((s, i) => s + (i.valor || 0), 0);
            return (
              <div key={obraNome} className="obra-block">
                <div className="obra-header">
                  <h3>🏗 {obraNome}</h3>
                  <span className="subtotal">Subtotal: {fmt(totalObra)}</span>
                </div>
                <div className="table-head">
                  <span>Prestador</span><span>Serviço</span><span>Tipo</span><span style={{ textAlign: 'right' }}>Valor</span>
                </div>
                {items.map((lcto, idx) => (
                  <div key={idx} className="lancamento-row">
                    <div>
                      <div className="col-value">{lcto.profissional || 'N/A'}</div>
                      <div className="col-sub">{lcto.categoria || ''}</div>
                    </div>
                    <div>
                      <div className="col-value">{lcto.descricaoEtapa || (lcto.tipo === 'diaria' ? 'Diária' : 'Empreitada')}</div>
                      {lcto.turnos?.length > 0 && <div className="col-sub">{lcto.turnos.join(', ')}</div>}
                    </div>
                    <div><span className="tag">{lcto.tipo === 'diaria' ? 'Diária' : 'Empreitada'}</span></div>
                    <div className="valor-col"><div className="col-value">{fmt(lcto.valor || 0)}</div></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="footer">
          <div>
            <div className="footer-total-label">Total Geral do Dia</div>
            <div className="footer-total">{fmt(totalGeral)}</div>
          </div>
          <div className="footer-info">
            <div>Zentra-X — Gestão de Obras</div>
            <div>{new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}