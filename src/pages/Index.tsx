import { useState, useRef, useEffect } from 'react';
import { NavAnchor } from '@/components/NavAnchor';
import { SectionDivider } from '@/components/SectionDivider';
import { FormularioLancamento } from '@/components/FormularioLancamento';
import { DashboardOrcamento } from '@/components/DashboardOrcamento';
import { ResumoSemana } from '@/components/ResumoSemana';
import { ImportarPlanilha } from '@/components/ImportarPlanilha';
import { useAppStore } from '@/lib/store';

const Index = () => {
  const { lancamentos, obras, addLancamento, addMultipleLancamentos } = useAppStore();
  const [activeSection, setActiveSection] = useState('lancamento');

  const sectionRefs = {
    lancamento: useRef<HTMLDivElement>(null),
    orcamento: useRef<HTMLDivElement>(null),
    relatorios: useRef<HTMLDivElement>(null),
    importar: useRef<HTMLDivElement>(null),
  };

  const navigateTo = (section: string) => {
    setActiveSection(section);
    sectionRefs[section as keyof typeof sectionRefs]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Update active on scroll
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
      <header className="border-b-2 border-foreground">
        <div className="container py-4">
          <h1 className="font-mono text-base font-bold tracking-wider">ECOGESTÃO OBRAS</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">ECOMINDS X — GESTÃO DE PAGAMENTOS</p>
        </div>
      </header>

      <NavAnchor active={activeSection} onNavigate={navigateTo} />

      <main className="container pb-20">
        {/* Lançamento */}
        <section ref={sectionRefs.lancamento} className="py-6">
          <SectionDivider title="Formulário de Lançamento" />
          <div className="mt-4">
            <FormularioLancamento obras={obras} onSubmit={addLancamento} />
          </div>
        </section>

        {/* Orçamento */}
        <section ref={sectionRefs.orcamento} className="py-6">
          <SectionDivider title="Dashboard de Orçamento" />
          <div className="mt-4">
            <DashboardOrcamento obras={obras} lancamentos={lancamentos} />
          </div>
        </section>

        {/* Relatórios */}
        <section ref={sectionRefs.relatorios} className="py-6">
          <SectionDivider title="Resumo da Semana" />
          <div className="mt-4">
            <ResumoSemana lancamentos={lancamentos} obras={obras} />
          </div>
        </section>

        {/* Importar */}
        <section ref={sectionRefs.importar} className="py-6">
          <SectionDivider title="Importar Dados" />
          <div className="mt-4">
            <ImportarPlanilha obras={obras} onImport={addMultipleLancamentos} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
