import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { FormularioLancamento } from '@/components/FormularioLancamento';
import { RelatoriosObra } from '@/components/RelatoriosObra';
import { useNavigate } from 'react-router-dom';
import { Printer, Send, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Lancamentos = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  const { obras = [], profissionais = [], lancamentos = [], addLancamento, addMultipleLancamentos, updateLancamento, deleteLancamento } = useAppStore(tenantId) || {};
  
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendToFinance = () => {
    alert('Lançamentos enviados ao financeiro!'); // Implementar lógica real
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-5 print:hidden backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl ring-1 ring-emerald-500/30" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Zentra-X
            </h1>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="gap-2 rounded-xl font-semibold"
            >
              <Printer size={16} />
              Imprimir
            </Button>
            <Button
              onClick={handleSendToFinance}
              className="gap-2 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
            >
              <Send size={16} />
              Enviar ao Financeiro
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 pb-8">
        <section className="pt-6 space-y-6 animate-in fade-in">
          {/* HEADER SEÇÃO */}
          <div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">Lançamentos</h2>
            <p className="text-zinc-400 font-medium">Registre diárias, empreitadas e materiais. Visualize e envie ao financeiro.</p>
          </div>

          {/* GRID 2 COLUNAS: FORMULÁRIO | RECENTES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUNA 1: FORMULÁRIO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
                <h3 className="text-lg font-black uppercase text-white tracking-tight">Novo Lançamento</h3>
              </div>
              
              <div className="rounded-2xl overflow-hidden backdrop-blur-xl border border-white/5 shadow-xl shadow-black/20 bg-gradient-to-br from-white/[0.02] to-white/[0.01] p-6">
                <FormularioLancamento 
                  obras={obras} 
                  profissionais={profissionais} 
                  onSubmit={addLancamento} 
                />
              </div>

              {/* IMPORT */}
              <div className="rounded-2xl overflow-hidden backdrop-blur-xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent p-6">
                <h4 className="text-sm font-black uppercase text-purple-400 mb-4 flex items-center gap-2">
                  <Upload size={16} />
                  Importar Planilha
                </h4>
                <div className="border-2 border-dashed border-purple-500/20 rounded-xl p-6 text-center hover:border-purple-500/40 transition-colors cursor-pointer group">
                  <p className="text-xs text-zinc-400 font-semibold group-hover:text-purple-400 transition-colors">
                    Clique para importar ou arraste um arquivo Excel
                  </p>
                </div>
              </div>
            </div>

            {/* COLUNA 2: RECENTES */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                <h3 className="text-lg font-black uppercase text-white tracking-tight">Lançamentos Recentes</h3>
                <span className="ml-auto text-sm font-black bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                  {lancamentos.length}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden backdrop-blur-xl border border-white/5 shadow-xl shadow-black/20 bg-gradient-to-br from-white/[0.02] to-white/[0.01]">
                <div className="p-6">
                  {lancamentos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-zinc-500 font-bold">Nenhum lançamento registrado</p>
                      <p className="text-zinc-600 text-sm mt-1">Comece preenchendo o formulário ao lado</p>
                    </div>
                  ) : (
                    <RelatoriosObra 
                      lancamentos={lancamentos} 
                      profissionais={profissionais} 
                      onDelete={deleteLancamento} 
                      onUpdate={updateLancamento}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="print:hidden">
        <BottomNav 
          active="lancamento" 
          onNavigate={(section) => {
            const routes: Record<string, string> = {
              'dashboard': '/',
              'lancamento': '/lancamentos',
              'clientes': '/clientes',
              'obras': '/obras',
              'relatorios': '/financeiro',
              'relatoriosObra': '/obras',
              'importar': '/lancamentos',
              'contasReceber': '/financeiro',
              'comissoes': '/financeiro',
            };
            if (routes[section]) navigate(routes[section]);
          }} 
          onMenuOpen={() => setMenuOpen(true)} 
          permissions={permissions} 
        />
        <SideMenu 
          open={menuOpen} 
          onOpenChange={setMenuOpen} 
          active="lancamento" 
          onNavigate={(section) => {
            const routes: Record<string, string> = {
              'dashboard': '/',
              'clientes': '/clientes',
              'obras': '/obras',
              'relatorios': '/financeiro',
              'relatoriosObra': '/obras',
              'importar': '/lancamentos',
              'contasReceber': '/financeiro',
              'comissoes': '/financeiro',
            };
            if (routes[section]) navigate(routes[section]);
          }} 
          permissions={permissions} 
          userEmail={user?.email || ''} 
          onLogout={handleLogout} 
        />
      </div>
    </div>
  );
};

export default Lancamentos;