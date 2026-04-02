import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PieChart, BarChart3, Upload, LogOut, Trash2, Users, Building2, Users2, Filter, Percent, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { NavAnchor } from '@/components/NavAnchor';
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
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TIPO_CONTRATO_LABELS, TipoContrato } from '@/lib/types';
import logo from '@/assets/logo.png';

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
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipoContrato, setFiltroTipoContrato] = useState('');
  const [clientesAberto, setClientesAberto] = useState(false);
  const [obrasAberto, setObrasAberto] = useState(false);

  const showFinancial = permissions.podeEditarOrcamento;

  useEffect(() => {
    if (showFinancial) setActiveSection('dashboard');
  }, [showFinancial]);

  const navigateTo = (section: string) => {
    setActiveSection(section);
  };

  const obrasFiltradas = obras.filter(o => {
    if (filtroCliente && o.clienteId !== filtroCliente) return false;
    if (filtroTipoContrato && o.tipoContrato !== filtroTipoContrato) return false;
    return true;
  });

  const lancamentosFiltrados = filtroCliente || filtroTipoContrato
    ? lancamentos.filter(l => obrasFiltradas.some(o => o.id === l.obraId))
    : lancamentos;

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-[hsl(155,55%,12%)] via-[hsl(153,60%,18%)] to-[hsl(153,45%,25%)] shadow-lg print:hidden">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white">ZENTRA-X</h1>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-white/40" />
                  <p className="text-xs text-white/60">{tenantNome || user?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {permissions.podeCriarObra && <CadastrarClienteModal onAdd={addCliente} />}
              {permissions.podeCriarObra && (
                <CadastrarObraModal
                  onAdd={addObra}
                  clientes={clientes}
                  onAddCliente={addCliente}
                />
              )}
              {permissions.podeCadastrarProfissional && (
                <CadastrarProfissionalModal
                  onAdd={addProfissional}
                  categoriasExtras={categorias}
                  onNovaCategoria={handleNovaCategoria}
                />
              )}
              {permissions.podeGerenciarAcessos && (
                <Button variant="outline" size="sm" className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate('/gerenciar-acessos')}>
                  <Users className="w-4 h-4" /> Equipe
                </Button>
              )}
              {isSuperAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate('/super-admin')}>
                  <Building2 className="w-4 h-4" /> Admin
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="print:hidden">
        <NavAnchor active={activeSection} onNavigate={navigateTo} permissions={permissions} />
      </div>

      {(clientes.length > 0 || obras.length > 0) && (
        <div className="container pt-4 print:hidden">
          <div className="flex flex-wrap gap-2 items-center rounded-lg border border-border bg-card p-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">Filtros:</span>
            {clientes.length > 0 && (
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
                <option value="">Todos os clientes</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
            <select value={filtroTipoContrato} onChange={e => setFiltroTipoContrato(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {(filtroCliente || filtroTipoContrato) && (
              <button onClick={() => { setFiltroCliente(''); setFiltroTipoContrato(''); }} className="text-xs text-primary font-semibold hover:underline">Limpar filtros</button>
            )}
          </div>
        </div>
      )}

      <main className="container pb-24 space-y-10">
        {/* DASHBOARD GERAL */}
        {activeSection === 'dashboard' && showFinancial && (
          <section className="pt-8">
            <DashboardGeral
              obras={obrasFiltradas}
              lancamentos={lancamentosFiltrados}
              profissionais={profissionais}
              comissoes={comissoes}
            />
          </section>
        )}

        {/* LANÇAMENTO — grid 2 colunas em desktop */}
        {activeSection === 'lancamento' && permissions.podeLancarDespesa && (
          <section className="pt-8">
            <SectionDivider title="Formulário de Lançamento" icon={FileText} />
            <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-5 print:hidden">
                <FormularioLancamento
                  obras={obrasFiltradas}
                  profissionais={profissionais}
                  onSubmit={addLancamento}
                  onAddProfissional={permissions.podeCadastrarProfissional ? addProfissional : undefined}
                />
              </div>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border flex justify-between items-center">
                  <span className="text-sm font-semibold">Lançamentos de Hoje</span>
                  <span className="text-xs font-bold text-primary">Total: R$ {totalHoje.toFixed(2)}</span>
                </div>
                {lancamentosHoje.length > 0 ? (
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {lancamentosHoje.reverse().map(l => (
                      <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{l.profissional || l.profissionalId}</span>
                          <span className="text-muted-foreground"> · {l.obraNome} · </span>
                          <span className="font-semibold text-primary">R$ {l.valor?.toFixed(2)}</span>
                          <span className={`ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            l.tipo === 'diaria' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                          }`}>
                            {l.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                          </span>
                        </div>
                        {permissions.podeGerenciarAcessos && (
                          <button onClick={() => handleDeleteLancamento(l.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-2 print:hidden">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum lançamento hoje
                  </div>
                )}
                {/* All recent entries */}
                {lancamentosFiltrados.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-muted/30 border-t border-border flex justify-between items-center">
                      <span className="text-xs font-semibold text-muted-foreground">Últimos Lançamentos</span>
                      <Button onClick={handlePrint} variant="ghost" size="sm" className="h-7 gap-1 text-[10px] print:hidden">
                        <Printer className="w-3 h-3" /> Imprimir
                      </Button>
                    </div>
                    <div className="divide-y divide-border max-h-48 overflow-y-auto">
                      {lancamentosFiltrados.slice(-10).reverse().map(l => (
                        <div key={l.id} className="flex items-center justify-between px-4 py-2 text-xs">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{l.profissional || l.profissionalId}</span>
                            <span className="text-muted-foreground"> · {l.obraNome} · </span>
                            <span className="font-semibold text-primary">R$ {l.valor?.toFixed(2)}</span>
                            <span className="text-muted-foreground ml-2">{l.data}</span>
                          </div>
                          {permissions.podeGerenciarAcessos && (
                            <button onClick={() => handleDeleteLancamento(l.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-2 print:hidden">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* CLIENTES */}
        {activeSection === 'clientes' && permissions.podeCriarObra && (
          <section className="pt-4 print:hidden">
            <button
              onClick={() => setClientesAberto(v => !v)}
              className="w-full flex items-center justify-between group"
            >
              <SectionDivider title={`Clientes${clientes.length > 0 ? ` (${clientes.length})` : ''}`} icon={Users2} />
              <span className="ml-3 text-muted-foreground group-hover:text-primary transition-colors">
                {clientesAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            </button>

            {clientesAberto && (
              <div className="mt-2 rounded-lg border border-border bg-card divide-y divide-border animate-in fade-in duration-200">
                {clientes.length > 0 ? clientes.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">{c.nome}</span>
                      {c.cpfCnpj && <span className="text-xs text-muted-foreground ml-2">{c.cpfCnpj}</span>}
                      {c.contato && <span className="text-xs text-muted-foreground ml-2">· {c.contato}</span>}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {obras.filter(o => o.clienteId === c.id).length} obra(s) vinculada(s)
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCliente(c.id, c.nome)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum cliente cadastrado. Use o botão "Novo Cliente" acima.
                  </div>
                )}
              </div>
            )}

            {/* Obras section inline */}
            <div className="mt-6">
              <button
                onClick={() => setObrasAberto(v => !v)}
                className="w-full flex items-center justify-between group"
              >
                <SectionDivider title={`Obras / Projetos${obrasFiltradas.length > 0 ? ` (${obrasFiltradas.length})` : ''}`} icon={PieChart} />
                <span className="ml-3 text-muted-foreground group-hover:text-primary transition-colors">
                  {obrasAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </button>

              {obrasAberto && obrasFiltradas.length > 0 && (
                <div className="mt-2 rounded-lg border border-border bg-card divide-y divide-border animate-in fade-in duration-200">
                  {obrasFiltradas.map(o => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-sm font-medium">{o.nome}</span>
                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold uppercase">
                          {TIPO_CONTRATO_LABELS[o.tipoContrato as TipoContrato] || o.tipoContrato}
                        </span>
                        {o.clienteNome && <span className="text-xs text-muted-foreground ml-2">· {o.clienteNome}</span>}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          R$ {o.gastoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {o.orcamentoLimite?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteObra(o.id, o.nome)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {obrasAberto && obrasFiltradas.length === 0 && (
                <div className="mt-2 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground animate-in fade-in duration-200">
                  Nenhuma obra cadastrada. Use o botão "Nova Obra" acima.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ORÇAMENTO */}
        {activeSection === 'orcamento' && showFinancial && (
          <section className="pt-8">
            <SectionDivider title="Dashboard de Orçamento" icon={PieChart} />
            <div className="mt-2">
              <DashboardOrcamento obras={obrasFiltradas} lancamentos={lancamentosFiltrados} />
            </div>
          </section>
        )}

        {/* RELATÓRIOS DE OBRA */}
        {activeSection === 'relatoriosObra' && showFinancial && (
          <section className="pt-8">
            <SectionDivider title="Relatórios de Obra" icon={BarChart3} />
            <div className="mt-2">
              <RelatoriosObra obras={obrasFiltradas} lancamentos={lancamentosFiltrados} />
            </div>
          </section>
        )}

        {/* COMISSÕES */}
        {activeSection === 'comissoes' && permissions.podeGerenciarAcessos && (
          <section className="pt-8 print:hidden">
            <SectionDivider title="Comissões e Parceiros" icon={Percent} />
            <div className="mt-2">
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

        {/* RESUMO DA SEMANA */}
        {activeSection === 'relatorios' && showFinancial && (
          <section className="pt-8">
            <SectionDivider title="Resumo da Semana" icon={BarChart3} />
            <div className="mt-2">
              <ResumoSemana lancamentos={lancamentosFiltrados} obras={obrasFiltradas} profissionais={profissionais} />
            </div>
          </section>
        )}

        {/* IMPORTAR */}
        {activeSection === 'importar' && showFinancial && (
          <section className="pt-8 print:hidden">
            <SectionDivider title="Importar Dados" icon={Upload} />
            <div className="mt-2">
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
    </div>
  );
};

export default Index;
