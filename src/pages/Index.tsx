import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PieChart, BarChart3, Upload, Tag, LogOut, Trash2, Users, Building2 } from 'lucide-react';
import { NavAnchor } from '@/components/NavAnchor';
import { SectionDivider } from '@/components/SectionDivider';
import { FormularioLancamento } from '@/components/FormularioLancamento';
import { DashboardOrcamento } from '@/components/DashboardOrcamento';
import { ResumoSemana } from '@/components/ResumoSemana';
import { ImportarPlanilha } from '@/components/ImportarPlanilha';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { CadastrarProfissionalModal } from '@/components/CadastrarProfissionalModal';
import { ConfigurarCategorias } from '@/components/ConfigurarCategorias';
import { RelatoriosObra } from '@/components/RelatoriosObra';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, permissions, tenantId, tenantNome, isSuperAdmin, signOut } = useAuth();

  // Passa o tenantId para o store — todas as queries ficam isoladas
  const {
    lancamentos, obras, profissionais, categorias,
    addLancamento, addMultipleLancamentos, addObra, addProfissional, updateCategorias,
    deleteObra, deleteProfissional, deleteLancamento,
  } = useAppStore(tenantId);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('lancamento');

  const sectionRefs = {
    lancamento:    useRef<HTMLDivElement>(null),
    orcamento:     useRef<HTMLDivElement>(null),
    relatorios:    useRef<HTMLDivElement>(null),
    relatoriosObra: useRef<HTMLDivElement>(null),
    categorias:    useRef<HTMLDivElement>(null),
    importar:      useRef<HTMLDivElement>(null),
  };

  const navigateTo = (section: string) => {
    setActiveSection(section);
    sectionRefs[section as keyof typeof sectionRefs]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) setActiveSection(id);
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', key);
        observer.observe(ref.current);
      }
    });
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteObra = async (id: string, nome: string) => {
    if (!confirm(`Excluir obra "${nome}"?`)) return;
    await deleteObra(id);
    toast({ title: 'Obra excluída', description: nome });
  };

  const handleDeleteProfissional = async (id: string, nome: string) => {
    if (!confirm(`Excluir profissional "${nome}"?`)) return;
    await deleteProfissional(id);
    toast({ title: 'Profissional excluído', description: nome });
  };

  const handleDeleteLancamento = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    await deleteLancamento(id);
    toast({ title: 'Lançamento excluído' });
  };

  const showFinancial = permissions.podeEditarOrcamento;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-[hsl(155,55%,12%)] via-[hsl(153,60%,18%)] to-[hsl(153,45%,25%)] shadow-lg">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <span className="text-sm font-black text-white tracking-tighter">ZX</span>
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white">ZENTRA-X</h1>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-white/40" />
                  {/* Nome da empresa do tenant — cada cliente vê o seu */}
                  <p className="text-xs text-white/60">{tenantNome || user?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {permissions.podeCriarObra && <CadastrarObraModal onAdd={addObra} />}
              {permissions.podeCadastrarProfissional && <CadastrarProfissionalModal onAdd={addProfissional} />}
              {permissions.podeGerenciarAcessos && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => navigate('/gerenciar-acessos')}
                >
                  <Users className="w-4 h-4" />
                  Equipe
                </Button>
              )}
              {/* Atalho para o super admin voltar ao painel */}
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => navigate('/super-admin')}
                >
                  <Building2 className="w-4 h-4" />
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <NavAnchor active={activeSection} onNavigate={navigateTo} permissions={permissions} />

      <main className="container pb-24 space-y-10">
        {permissions.podeLancarDespesa && (
          <section ref={sectionRefs.lancamento} className="pt-8">
            <SectionDivider title="Formulário de Lançamento" icon={FileText} />
            <div className="mt-2 rounded-lg border border-border bg-card p-5">
              <FormularioLancamento
                obras={obras}
                profissionais={profissionais}
                onSubmit={addLancamento}
                onAddProfissional={permissions.podeCadastrarProfissional ? addProfissional : undefined}
              />
            </div>

            {lancamentos.length > 0 && (
              <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                  <span className="text-sm font-semibold">Últimos Lançamentos</span>
                </div>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {lancamentos.slice(-10).reverse().map(l => (
                    <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{l.profissional || l.profissionalId}</span>
                        <span className="text-muted-foreground"> · {l.obraNome} · </span>
                        <span className="font-semibold text-primary">R$ {l.valor?.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs ml-2">{l.data}</span>
                      </div>
                      {permissions.podeGerenciarAcessos && (
                        <button
                          onClick={() => handleDeleteLancamento(l.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {permissions.podeCriarObra && obras.length > 0 && (
          <section>
            <SectionDivider title="Obras Cadastradas" icon={PieChart} />
            <div className="mt-2 rounded-lg border border-border bg-card divide-y divide-border">
              {obras.map(o => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{o.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      R$ {o.gastoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {o.orcamentoLimite?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteObra(o.id, o.nome)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {permissions.podeCadastrarProfissional && profissionais.length > 0 && (
          <section>
            <SectionDivider title="Profissionais Cadastrados" icon={Tag} />
            <div className="mt-2 rounded-lg border border-border bg-card divide-y divide-border">
              {profissionais.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{p.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p.categoria}</span>
                    {p.chavePix && <span className="text-xs text-muted-foreground ml-2">PIX: {p.chavePix}</span>}
                  </div>
                  <button onClick={() => handleDeleteProfissional(p.id, p.nome)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {showFinancial && (
          <section ref={sectionRefs.orcamento}>
            <SectionDivider title="Dashboard de Orçamento" icon={PieChart} />
            <div className="mt-2">
              <DashboardOrcamento obras={obras} lancamentos={lancamentos} />
            </div>
          </section>
        )}

        {showFinancial && (
          <section ref={sectionRefs.relatoriosObra}>
            <SectionDivider title="Relatórios de Obra" icon={BarChart3} />
            <div className="mt-2">
              <RelatoriosObra obras={obras} lancamentos={lancamentos} />
            </div>
          </section>
        )}

        {showFinancial && (
          <section ref={sectionRefs.relatorios}>
            <SectionDivider title="Resumo da Semana" icon={BarChart3} />
            <div className="mt-2">
              <ResumoSemana lancamentos={lancamentos} obras={obras} profissionais={profissionais} />
            </div>
          </section>
        )}

        {showFinancial && (
          <section ref={sectionRefs.categorias}>
            <SectionDivider title="Categorias de Serviço" icon={Tag} />
            <div className="mt-2 rounded-lg border border-border bg-card p-5">
              <ConfigurarCategorias categorias={categorias} onUpdate={updateCategorias} />
            </div>
          </section>
        )}

        {showFinancial && (
          <section ref={sectionRefs.importar}>
            <SectionDivider title="Importar Dados" icon={Upload} />
            <div className="mt-2">
              <ImportarPlanilha obras={obras} onImport={addMultipleLancamentos} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;