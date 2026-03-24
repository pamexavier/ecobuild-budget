import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, FileText, PieChart, BarChart3, Upload, Tag, Shield, LogOut, Trash2, Pencil } from 'lucide-react';
import { NavAnchor } from '@/components/NavAnchor';
import { SectionDivider } from '@/components/SectionDivider';
import { FormularioLancamento } from '@/components/FormularioLancamento';
import { DashboardOrcamento } from '@/components/DashboardOrcamento';
import { ResumoSemana } from '@/components/ResumoSemana';
import { ImportarPlanilha } from '@/components/ImportarPlanilha';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { CadastrarProfissionalModal } from '@/components/CadastrarProfissionalModal';
import { ConfigurarCategorias } from '@/components/ConfigurarCategorias';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ROLE_LABELS = {
  gestor: 'Gestor',
  supervisor: 'Supervisor',
  encarregada: 'Encarregada',
};

const Index = () => {
  const { 
    lancamentos, obras, profissionais, categorias, 
    addLancamento, addMultipleLancamentos, addObra, addProfissional, updateCategorias,
    deleteObra, deleteProfissional, deleteLancamento
  } = useAppStore();
  const { user, role, isGestor, isEncarregada, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('lancamento');

  const sectionRefs = {
    lancamento: useRef<HTMLDivElement>(null),
    orcamento: useRef<HTMLDivElement>(null),
    relatorios: useRef<HTMLDivElement>(null),
    categorias: useRef<HTMLDivElement>(null),
    importar: useRef<HTMLDivElement>(null),
  };

  const navigateTo = (section: string) => {
    setActiveSection(section);
    sectionRefs[section as keyof typeof sectionRefs]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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
    if (!confirm(`Excluir obra "${nome}"? Isso removerá todos os lançamentos vinculados.`)) return;
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

  // Encarregada only sees lançamento
  const showFinancial = !isEncarregada;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(158,64%,32%)] to-[hsl(160,50%,42%)] shadow-lg">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center backdrop-blur-sm">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-primary-foreground">EcoGestão Obras</h1>
                <p className="text-xs text-primary-foreground/70">
                  {user?.email} · {role ? ROLE_LABELS[role] : '...'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isGestor && (
                <>
                  <CadastrarObraModal onAdd={addObra} />
                  <CadastrarProfissionalModal onAdd={addProfissional} />
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/gerenciar-acessos')}>
                    <Shield className="w-4 h-4" />
                    Acessos
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <NavAnchor active={activeSection} onNavigate={navigateTo} role={role} />

      <main className="container pb-24 space-y-10">
        {/* Lançamento */}
        <section ref={sectionRefs.lancamento} className="pt-8">
          <SectionDivider title="Formulário de Lançamento" icon={FileText} />
          <div className="mt-2 rounded-lg border border-border bg-card p-5">
            <FormularioLancamento obras={obras} profissionais={profissionais} onSubmit={addLancamento} onAddProfissional={addProfissional} />
          </div>

          {/* Lista de Lançamentos com Excluir (Gestor) */}
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
                    {isGestor && (
                      <button onClick={() => handleDeleteLancamento(l.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Obras list with delete (Gestor only) */}
        {isGestor && obras.length > 0 && (
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

        {/* Profissionais list with delete (Gestor only) */}
        {isGestor && profissionais.length > 0 && (
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

        {/* Orçamento - hidden for Encarregada */}
        {showFinancial && (
          <section ref={sectionRefs.orcamento}>
            <SectionDivider title="Dashboard de Orçamento" icon={PieChart} />
            <div className="mt-2">
              <DashboardOrcamento obras={obras} lancamentos={lancamentos} />
            </div>
          </section>
        )}

        {/* Relatórios - hidden for Encarregada */}
        {showFinancial && (
          <section ref={sectionRefs.relatorios}>
            <SectionDivider title="Resumo da Semana" icon={BarChart3} />
            <div className="mt-2">
              <ResumoSemana lancamentos={lancamentos} obras={obras} profissionais={profissionais} />
            </div>
          </section>
        )}

        {/* Categorias - hidden for Encarregada */}
        {showFinancial && (
          <section ref={sectionRefs.categorias}>
            <SectionDivider title="Categorias de Serviço" icon={Tag} />
            <div className="mt-2 rounded-lg border border-border bg-card p-5">
              <ConfigurarCategorias categorias={categorias} onUpdate={updateCategorias} />
            </div>
          </section>
        )}

        {/* Importar - hidden for Encarregada */}
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
