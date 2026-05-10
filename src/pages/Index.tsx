import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PieChart, BarChart3, Upload, Trash2, Users2, Filter, Percent, Printer, ChevronDown, ChevronRight, Zap, Building2, HardHat, Plus } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { SectionDivider } from '@/components/SectionDivider';
import { FormularioLancamento } from '@/components/FormularioLancamento';
import { DashboardOrcamento } from '@/components/DashboardOrcamento';
import { DashboardGeral } from '@/components/DashboardGeral';
import { ResumoSemana } from '@/components/ResumoSemana';
import { ImportarPlanilha } from '@/components/ImportarPlanilha';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { CadastrarProfissionalModal } from '@/components/CadastrarProfissionalModal';
import { CadastrarClienteModal } from '@/components/CadastrarClienteModal';
import { RelatoriosObra } from '@/components/RelatoriosObra';
import { GestaoComissoes } from '@/components/GestaoComissoes';
import { AdiantamentoModal } from '@/components/AdiantamentoModal';
import { FiltrosDashboard } from '@/components/FiltrosDashboard';
import { CardDashboardContas, CardResumoFinanceiro, GerenciadorContas } from '@/components/SistemaContasAReceber';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ContaAReceber, TIPO_CONTRATO_LABELS, TipoContrato } from '@/lib/types';
import logo from '@/assets/logo.png';

const formatarNome = (nome: string) => {
  return nome
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const Index = () => {
  const { user, permissions, tenantId, tenantNome, isSuperAdmin, signOut } = useAuth();

  const {
    lancamentos, obras, profissionais, clientes, parceiros, comissoes, categorias,
    addLancamento, addMultipleLancamentos, addObra, addProfissional, addCliente,
    addParceiro, addComissao, updateCategorias,
    deleteObra, deleteLancamento, deleteCliente,
    deleteParceiro, deleteComissao, updateComissaoStatus,
  } = useAppStore(tenantId);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('lancamento');
  const [menuOpen, setMenuOpen] = useState(false);
  const [adiantamentoOpen, setAdiantamentoOpen] = useState(false);
  const [contas, setContas] = useState<ContaAReceber[]>([]);
  const [contasCarregadas, setContasCarregadas] = useState(false);
  const [obraContaInicialId, setObraContaInicialId] = useState<string | null>(null);
  // Filtros do dashboard
  const [filtros, setFiltros] = useState({
    clienteId: null,
    empreendimentoId: null,
    tipo: null,
    tipoEmpreendimento: 'ambos',
  });
  const [clientesAberto, setClientesAberto] = useState(false);
  const [obrasAberto, setObrasAberto] = useState(false);

  const showFinancial = permissions.podeEditarOrcamento;

  useEffect(() => {
    const key = `contas-a-receber:${tenantId || 'local'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((conta: any) => ({
          ...conta,
          dataVencimento: new Date(conta.dataVencimento),
          dataPagamento: conta.dataPagamento ? new Date(conta.dataPagamento) : undefined,
        }));
        setContas(parsed);
      } catch {
        setContas([]);
      }
    } else {
      setContas([]);
    }
    setContasCarregadas(true);
  }, [tenantId]);

  useEffect(() => {
    if (!contasCarregadas) return;
    const key = `contas-a-receber:${tenantId || 'local'}`;
    localStorage.setItem(key, JSON.stringify(contas));
  }, [contas, contasCarregadas, tenantId]);

  useEffect(() => {
    if (permissions.podeEditarOrcamento) {
      setActiveSection('dashboard');
    } else {
      setActiveSection('lancamento');
    }
  }, [permissions.podeEditarOrcamento]);

  const navigateTo = (section: string) => {
    setActiveSection(section);
  };

  const handleAdicionarConta = (conta: ContaAReceber) => {
    setContas(prev => [...prev, conta]);
  };

  const handleAtualizarConta = (contaAtualizada: ContaAReceber) => {
    setContas(prev => prev.map(c => c.id === contaAtualizada.id ? contaAtualizada : c));
  };

  const handleDeletarConta = (contaId: string) => {
    setContas(prev => prev.filter(c => c.id !== contaId));
  };


  // Aplica filtros de obras/projetos
  const obrasFiltradas = obras.filter(o => {
    if (filtros.clienteId && o.clienteId !== filtros.clienteId) return false;
    if (filtros.tipoEmpreendimento === 'projeto') return false;
    if (filtros.empreendimentoId && o.id !== filtros.empreendimentoId) return false;
    return true;
  });
  const projetosFiltrados = (typeof projetos !== 'undefined' ? projetos : []).filter(p => {
    if (filtros.clienteId && p.clienteId !== filtros.clienteId) return false;
    if (filtros.tipoEmpreendimento === 'obra') return false;
    if (filtros.empreendimentoId && p.id !== filtros.empreendimentoId) return false;
    return true;
  });
  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtros.tipo && l.tipo !== filtros.tipo) return false;
    if (filtros.empreendimentoId) {
      return (
        obrasFiltradas.some(o => o.id === l.obraId) ||
        projetosFiltrados.some(p => p.id === l.projetoId)
      );
    }
    if (filtros.clienteId) {
      return (
        obrasFiltradas.some(o => o.id === l.obraId) ||
        projetosFiltrados.some(p => p.id === l.projetoId)
      );
    }
    return true;
  });

  const handleNovaCategoria = (nova: string) => {
    if (!categorias.includes(nova)) updateCategorias([...categorias, nova]);
  };

  const handleLogout = async () => { await signOut(); navigate('/login'); };

  const handleDeleteObra = async (id: string, nome: string) => {
    if (!confirm(`Excluir obra "${nome}"?`)) return;
    await deleteObra(id);
    toast({ title: 'Obra excluída', description: nome });
  };

  const handleDeleteLancamento = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    await deleteLancamento(id);
    toast({ title: 'Lançamento excluído' });
  };

  const handleDeleteCliente = async (id: string, nome: string) => {
    if (!confirm(`Excluir cliente "${nome}"?`)) return;
    await deleteCliente(id);
    toast({ title: 'Cliente excluído', description: nome });
  };

  const handlePrint = () => { window.print(); };

  const hoje = new Date().toISOString().split('T')[0];
  const lancamentosHoje = lancamentosFiltrados.filter(l => l.data === hoje);
  const totalHoje = lancamentosHoje.reduce((s, l) => s + l.valor, 0);
  const nomeProfissional = (id: string, nome?: string) =>
    nome || profissionais.find(p => p.id === id)?.nome || 'Profissional nao informado';
  const categoriaProfissional = (id: string, categoria?: string) =>
    categoria || profissionais.find(p => p.id === id)?.categoria || 'Sem categoria';
  const pixProfissional = (id: string) =>
    profissionais.find(p => p.id === id)?.chavePix || 'Nao informado';
  const nomeObra = (id: string, nome?: string) =>
    nome || obras.find(o => o.id === id)?.nome || 'Obra nao informada';
  const clientesOrdenados = useMemo(() => {
    return [...clientes]
      .map(cliente => ({ ...cliente, nome: formatarNome(cliente.nome || '') }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientes]);
  const descricaoPagamento = (tipo: string, turnos?: string[], descricaoEtapa?: string) => {
    if (descricaoEtapa) return descricaoEtapa;
    if (turnos?.includes('[ADIANTAMENTO]')) return 'Adiantamento';
    return tipo === 'diaria' ? 'Diaria' : 'Empreitada';
  };
  const resumoObrasHoje = useMemo(() => {
    return lancamentosHoje.reduce((acc, lancamento) => {
      const obra = nomeObra(lancamento.obraId, lancamento.obraNome);
      acc[obra] = (acc[obra] || 0) + lancamento.valor;
      return acc;
    }, {} as Record<string, number>);
  }, [lancamentosHoje, obras]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Compact header */}
      <header className="glass-strong border-b border-white/[0.06] print:hidden sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-foreground">ZENTRA-X</h1>
              <p className="text-[10px] text-muted-foreground">{tenantNome || user?.email}</p>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-1.5">
            {permissions.podeCriarObra && <CadastrarClienteModal onAdd={addCliente} />}
            {permissions.podeCriarObra && (
              <CadastrarObraModal onAdd={addObra} clientes={clientes} onAddCliente={addCliente} />
            )}
            {permissions.podeCadastrarProfissional && (
              <CadastrarProfissionalModal
                onAdd={addProfissional}
                categoriasExtras={categorias}
                onNovaCategoria={handleNovaCategoria}
              />
            )}
          </div>
        </div>
      </header>


      {/* Filters bar removida, agora só FiltrosDashboard controla os filtros */}

      {/* Filtros Dashboard */}
      {activeSection !== 'lancamento' && (
        <div className="px-4 pt-4 pb-2 print:hidden">
          <FiltrosDashboard
            clientes={clientes}
            obras={obras}
            projetos={typeof projetos !== 'undefined' ? projetos : []}
            onFilterChange={setFiltros}
          />
        </div>
      )}

      {/* Main content */}
      <main className="px-4 pb-8 space-y-6">
        {/* DASHBOARD GERAL */}
        {activeSection === 'dashboard' && showFinancial && (
          <section className="pt-4">
            <DashboardGeral
              obras={obrasFiltradas}
              lancamentos={lancamentosFiltrados}
              profissionais={profissionais}
              comissoes={comissoes}
            />
            <div className="mt-6">
              <CardDashboardContas contas={contas} obras={obrasFiltradas} />
            </div>
          </section>
        )}

        {/* LANÇAMENTO */}
        {activeSection === 'lancamento' && permissions.podeLancarDespesa && (
          <section className="pt-4">
            <div className="print:hidden">
              <SectionDivider title="Lançamento" icon={FileText} />
            </div>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
              <div className="glass rounded-2xl p-4 sm:p-5">
                <FormularioLancamento
                  obras={obrasFiltradas}
                  profissionais={profissionais}
                  onSubmit={addLancamento}
                  onAddProfissional={permissions.podeCadastrarProfissional ? addProfissional : undefined}
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex justify-between items-center">
                  <span className="text-sm font-bold">Hoje</span>
                  <span className="text-xs font-extrabold text-primary">R$ {totalHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {lancamentosHoje.length > 0 ? (
                  <div className="divide-y divide-white/[0.04] max-h-[350px] overflow-y-auto">
                    {[...lancamentosHoje].reverse().map(l => (
                      <div key={l.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{nomeProfissional(l.profissionalId, l.profissional)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {categoriaProfissional(l.profissionalId, l.categoria)} · {nomeObra(l.obraId, l.obraNome)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                            l.tipo === 'diaria' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent-foreground'
                          }`}>
                            {l.tipo === 'diaria' ? 'Diária' : 'Empr.'}
                          </span>
                          <span className="text-sm font-extrabold text-primary whitespace-nowrap">
                            R$ {l.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {permissions.podeGerenciarAcessos && (
                            <button onClick={() => handleDeleteLancamento(l.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors print:hidden">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    Nenhum lançamento hoje
                  </div>
                )}

                {/* Últimos lançamentos */}
                {lancamentosFiltrados.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 border-t border-white/[0.06] flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recentes</span>
                      <Button onClick={handlePrint} variant="ghost" size="sm" className="h-7 gap-1 text-[10px] print:hidden">
                        <Printer className="w-3 h-3" /> Imprimir
                      </Button>
                    </div>
                    <div className="divide-y divide-white/[0.04] max-h-48 overflow-y-auto">
                      {lancamentosFiltrados.slice(-10).reverse().map(l => (
                        <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{nomeProfissional(l.profissionalId, l.profissional)}</span>
                            <span className="text-muted-foreground"> · {categoriaProfissional(l.profissionalId, l.categoria)} · {nomeObra(l.obraId, l.obraNome)}</span>
                          </div>
                          <span className="font-bold text-primary ml-2">R$ {l.valor?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div id="relatorio-pagamentos-dia" className="hidden print:block">
              <div className="relatorio-pagamentos">
                <div className="relatorio-cabecalho">
                  <div>
                    <p className="relatorio-marca">ZENTRA-X</p>
                    <h1>Relatorio de Pagamentos</h1>
                    <p>Data: {new Date(`${hoje}T00:00:00`).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="relatorio-total">
                    <span>Total do dia</span>
                    <strong>R$ {totalHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <section className="relatorio-bloco">
                  <h2>Resumo por obra</h2>
                  <div className="relatorio-resumo-grid">
                    {Object.entries(resumoObrasHoje).map(([obra, total]) => (
                      <div key={obra} className="relatorio-resumo-item">
                        <span>{obra}</span>
                        <strong>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    ))}
                    {Object.keys(resumoObrasHoje).length === 0 && (
                      <p className="relatorio-vazio">Nenhum pagamento registrado hoje.</p>
                    )}
                  </div>
                </section>

                <section className="relatorio-bloco">
                  <h2>Pagamentos</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Prestador</th>
                        <th>PIX</th>
                        <th>Categoria</th>
                        <th>Obra</th>
                        <th>Pagamento</th>
                        <th className="texto-direita">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...lancamentosHoje].reverse().map(l => (
                        <tr key={l.id}>
                          <td>{nomeProfissional(l.profissionalId, l.profissional)}</td>
                          <td>{pixProfissional(l.profissionalId)}</td>
                          <td>{categoriaProfissional(l.profissionalId, l.categoria)}</td>
                          <td>{nomeObra(l.obraId, l.obraNome)}</td>
                          <td>{descricaoPagamento(l.tipo, l.turnos, l.descricaoEtapa)}</td>
                          <td className="texto-direita valor">R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page { margin: 12mm; }
                body * { visibility: hidden !important; }
                #relatorio-pagamentos-dia, #relatorio-pagamentos-dia * { visibility: visible !important; }
                #relatorio-pagamentos-dia {
                  display: block !important;
                  position: absolute !important;
                  inset: 0 auto auto 0 !important;
                  width: 100% !important;
                  color: #0f172a !important;
                  font-family: Arial, sans-serif !important;
                }
                .relatorio-pagamentos { width: 100%; }
                .relatorio-cabecalho {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                  border-bottom: 3px solid #15803d;
                  padding-bottom: 14px;
                  margin-bottom: 18px;
                }
                .relatorio-marca {
                  margin: 0 0 4px;
                  color: #15803d;
                  font-size: 10px;
                  font-weight: 900;
                  letter-spacing: 0.22em;
                }
                .relatorio-cabecalho h1 {
                  margin: 0;
                  font-size: 24px;
                  text-transform: uppercase;
                  font-weight: 900;
                }
                .relatorio-cabecalho p {
                  margin: 4px 0 0;
                  font-size: 12px;
                  color: #475569;
                }
                .relatorio-total { text-align: right; }
                .relatorio-total span {
                  display: block;
                  color: #475569;
                  font-size: 11px;
                  font-weight: 800;
                  text-transform: uppercase;
                }
                .relatorio-total strong {
                  color: #15803d;
                  font-size: 24px;
                  font-weight: 900;
                }
                .relatorio-bloco {
                  margin-top: 16px;
                  break-inside: avoid;
                }
                .relatorio-bloco h2 {
                  margin: 0 0 8px;
                  color: #15803d;
                  font-size: 13px;
                  text-transform: uppercase;
                  font-weight: 900;
                }
                .relatorio-resumo-grid {
                  display: grid;
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  gap: 8px;
                }
                .relatorio-resumo-item {
                  display: flex;
                  justify-content: space-between;
                  gap: 12px;
                  border: 1px solid #cbd5e1;
                  border-radius: 6px;
                  padding: 8px 10px;
                  font-size: 12px;
                }
                .relatorio-resumo-item strong,
                .valor {
                  color: #15803d;
                  font-weight: 900;
                }
                .relatorio-vazio {
                  margin: 0;
                  color: #64748b;
                  font-size: 12px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 11px;
                }
                th {
                  background: #0f172a !important;
                  color: white !important;
                  padding: 8px;
                  text-align: left;
                  text-transform: uppercase;
                  font-size: 9px;
                  letter-spacing: 0.04em;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                td {
                  border-bottom: 1px solid #e2e8f0;
                  padding: 8px;
                  vertical-align: top;
                }
                .texto-direita { text-align: right; }
              }
            `}} />

            {/* FAB - Novo Adiantamento */}
            <button
              onClick={() => setAdiantamentoOpen(true)}
              className="fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-5 py-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all print:hidden"
            >
              <Zap className="w-5 h-5" />
              <span className="text-sm font-bold hidden sm:inline">Adiantamento</span>
            </button>
          </section>
        )}

        {/* CLIENTES */}
        {activeSection === 'clientes' && permissions.podeCriarObra && (
          <section className="pt-4 print:hidden space-y-4">
            <button
              onClick={() => setClientesAberto(v => !v)}
              className="w-full flex items-center justify-between group"
            >
              <SectionDivider title={`Clientes (${clientes.length})`} icon={Users2} />
              <span className="ml-3 text-muted-foreground group-hover:text-primary transition-colors">
                {clientesAberto ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </span>
            </button>

            {clientesAberto && (
              <div className="glass rounded-2xl divide-y divide-white/[0.04] animate-in fade-in duration-200">
                {clientesOrdenados.length > 0 ? clientesOrdenados.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-4">
                    <div>
                      <span className="text-sm font-semibold">{c.nome}</span>
                      {c.cpfCnpj && <span className="text-xs text-muted-foreground ml-2">{c.cpfCnpj}</span>}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {obras.filter(o => o.clienteId === c.id).length} obra(s)
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCliente(c.id, c.nome)} className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado</div>
                )}
              </div>
            )}

            {/* Obras */}
            <button
              onClick={() => setObrasAberto(v => !v)}
              className="w-full flex items-center justify-between group"
            >
              <SectionDivider title={`Obras / Projetos (${obrasFiltradas.length})`} icon={HardHat} />
              <span className="ml-3 text-muted-foreground group-hover:text-primary transition-colors">
                {obrasAberto ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </span>
            </button>

            {obrasAberto && (
              <div className="glass rounded-2xl divide-y divide-white/[0.04] animate-in fade-in duration-200">
                {obrasFiltradas.length > 0 ? obrasFiltradas.map(o => (
                  <div key={o.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-sm font-semibold">{o.nome}</span>
                        <span className="text-[10px] ml-2 px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold uppercase">
                          {TIPO_CONTRATO_LABELS[o.tipoContrato as TipoContrato] || o.tipoContrato}
                        </span>
                        {o.clienteNome && <span className="text-xs text-muted-foreground ml-2">· {o.clienteNome}</span>}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          R$ {o.gastoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {o.orcamentoLimite?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteObra(o.id, o.nome)} className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <CardResumoFinanceiro
                      obraId={o.id}
                      contas={contas}
                      onAdicionarConta={() => {
                        setObraContaInicialId(o.id);
                        setActiveSection('contasReceber');
                      }}
                    />
                  </div>
                )) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma obra cadastrada</div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ORÇAMENTO */}
        {activeSection === 'orcamento' && showFinancial && (
          <section className="pt-4">
            <SectionDivider title="Dashboard de Orçamento" icon={PieChart} />
            <div className="mt-3">
              <DashboardOrcamento obras={obrasFiltradas} lancamentos={lancamentosFiltrados} />
            </div>
          </section>
        )}

        {/* RELATÓRIOS DE OBRA */}
        {activeSection === 'relatoriosObra' && showFinancial && (
          <section className="pt-4">
            <SectionDivider title="Relatórios de Obra" icon={BarChart3} />
            <div className="mt-3">
              <RelatoriosObra obras={obrasFiltradas} lancamentos={lancamentosFiltrados} />
            </div>
          </section>
        )}

        {/* COMISSÕES */}
        {activeSection === 'comissoes' && permissions.podeGerenciarAcessos && (
          <section className="pt-4 print:hidden">
            <SectionDivider title="Comissões e Parceiros" icon={Percent} />
            <div className="mt-3">
              <GestaoComissoes
                parceiros={parceiros}
                comissoes={comissoes}
                obras={obras}
                onAddParceiro={addParceiro}
                onAddComissao={addComissao}
                onUpdateStatus={updateComissaoStatus}
                onDeleteComissao={deleteComissao}
                onDeleteParceiro={deleteParceiro}
              />
            </div>
          </section>
        )}

        {/* CONTAS A RECEBER */}
        {activeSection === 'contasReceber' && showFinancial && (
          <section className="pt-4 print:hidden">
            <SectionDivider title="Contas a Receber" icon={Percent} />
            <div className="mt-3">
              <GerenciadorContas
                contas={contas}
                obras={obrasFiltradas}
                onAdicionarConta={handleAdicionarConta}
                onAtualizarConta={handleAtualizarConta}
                onDeletarConta={handleDeletarConta}
                obraInicialId={obraContaInicialId}
                onObraInicialConsumida={() => setObraContaInicialId(null)}
              />
            </div>
          </section>
        )}

        {/* RESUMO DA SEMANA */}
        {activeSection === 'relatorios' && showFinancial && (
          <section className="pt-4">
            <SectionDivider title="Resumo da Semana" icon={BarChart3} />
            <div className="mt-3">
              <ResumoSemana lancamentos={lancamentosFiltrados} obras={obrasFiltradas} profissionais={profissionais} />
            </div>
          </section>
        )}

        {/* IMPORTAR */}
        {activeSection === 'importar' && showFinancial && (
          <section className="pt-4 print:hidden">
            <SectionDivider title="Importar Dados" icon={Upload} />
            <div className="mt-3">
              <ImportarPlanilha
                obras={obras}
                profissionais={profissionais}
                onImport={addMultipleLancamentos}
                onAddProfissional={addProfissional}
                onAddObra={addObra}
                categoriasExtras={categorias}
                onNovaCategoria={handleNovaCategoria}
              />
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        active={activeSection}
        onNavigate={navigateTo}
        onMenuOpen={() => setMenuOpen(true)}
        permissions={permissions}
      />

      {/* Side Menu */}
      <SideMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        active={activeSection}
        onNavigate={navigateTo}
        permissions={permissions}
        isSuperAdmin={isSuperAdmin}
        tenantNome={tenantNome}
        userEmail={user?.email || ''}
        onLogout={handleLogout}
      />

      {/* Adiantamento Modal */}
      <AdiantamentoModal
        open={adiantamentoOpen}
        onOpenChange={setAdiantamentoOpen}
        profissionais={profissionais}
        obras={obrasFiltradas}
        onSubmit={addLancamento}
      />
    </div>
  );
};

export default Index;
