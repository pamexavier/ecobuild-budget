import { useState, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [adiantamentoOpen, setAdiantamentoOpen] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroTipoContrato, setFiltroTipoContrato] = useState('');
  const [clientesAberto, setClientesAberto] = useState(false);
  const [obrasAberto, setObrasAberto] = useState(false);

  const showFinancial = permissions.podeEditarOrcamento;

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

      {/* Filters bar */}
      {(clientes.length > 0 || obras.length > 0) && (
        <div className="px-4 pt-3 print:hidden">
          <div className="flex flex-wrap gap-2 items-center glass rounded-2xl p-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {clientes.length > 0 && (
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-xs">
                <option value="">Todos os clientes</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
            <select value={filtroTipoContrato} onChange={e => setFiltroTipoContrato(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-xs">
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {(filtroCliente || filtroTipoContrato) && (
              <button onClick={() => { setFiltroCliente(''); setFiltroTipoContrato(''); }} className="text-xs text-primary font-semibold hover:underline">Limpar</button>
            )}
          </div>
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
          </section>
        )}

        {/* LANÇAMENTO */}
        {activeSection === 'lancamento' && permissions.podeLancarDespesa && (
          <section className="pt-4">
            <SectionDivider title="Lançamento" icon={FileText} />
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          <p className="text-sm font-semibold truncate">{l.profissional || l.profissionalId}</p>
                          <p className="text-xs text-muted-foreground truncate">{l.obraNome}</p>
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
                            <span className="font-medium">{l.profissional || l.profissionalId}</span>
                            <span className="text-muted-foreground"> · {l.obraNome}</span>
                          </div>
                          <span className="font-bold text-primary ml-2">R$ {l.valor?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

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
                {clientes.length > 0 ? clientes.map(c => (
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
                  <div key={o.id} className="flex items-center justify-between px-4 py-4">
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
