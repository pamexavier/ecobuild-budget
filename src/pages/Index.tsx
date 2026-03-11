import { useState, useRef, useEffect } from 'react';
import { Leaf, FileText, PieChart, BarChart3, Upload, HardHat, UserPlus, Tag } from 'lucide-react';
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

const Index = () => {
  const { lancamentos, obras, profissionais, categorias, addLancamento, addMultipleLancamentos, addObra, addProfissional, updateCategorias } = useAppStore();
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">EcoGestão Obras</h1>
                <p className="text-xs text-muted-foreground">EcomindsX · Gestão de Pagamentos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <CadastrarObraModal onAdd={addObra} />
              <CadastrarProfissionalModal onAdd={addProfissional} />
            </div>
          </div>
        </div>
      </header>

      <NavAnchor active={activeSection} onNavigate={navigateTo} />

      <main className="container pb-24 space-y-10">
        {/* Lançamento */}
        <section ref={sectionRefs.lancamento} className="pt-8">
          <SectionDivider title="Formulário de Lançamento" icon={FileText} />
          <div className="mt-2 rounded-lg border border-border bg-card p-5">
            <FormularioLancamento obras={obras} profissionais={profissionais} onSubmit={addLancamento} />
          </div>
        </section>

        {/* Orçamento */}
        <section ref={sectionRefs.orcamento}>
          <SectionDivider title="Dashboard de Orçamento" icon={PieChart} />
          <div className="mt-2">
            <DashboardOrcamento obras={obras} lancamentos={lancamentos} />
          </div>
        </section>

        {/* Relatórios */}
        <section ref={sectionRefs.relatorios}>
          <SectionDivider title="Resumo da Semana" icon={BarChart3} />
          <div className="mt-2">
            <ResumoSemana lancamentos={lancamentos} obras={obras} />
          </div>
        </section>

        {/* Importar */}
        <section ref={sectionRefs.importar}>
          <SectionDivider title="Importar Dados" icon={Upload} />
          <div className="mt-2">
            <ImportarPlanilha obras={obras} onImport={addMultipleLancamentos} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
