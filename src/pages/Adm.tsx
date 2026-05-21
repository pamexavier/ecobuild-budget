import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import GerenciarAcessos from './GerenciarAcessos';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

const TabsAdm = ({ active, onChange }: { active: string; onChange: (id: string) => void }) => (
  <div className="flex bg-white/[0.03] p-1.5 rounded-2xl mb-8 border border-white/5 overflow-x-auto">
    {[
      { id: 'acessos', label: 'Gerenciar Acessos' },
      { id: 'super-admin', label: 'Super Admin' },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
          active === tab.id
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            : 'text-zinc-500 hover:text-white'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const Adm = () => {
  const { user, permissions, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('acessos');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Verificar se o usuário é super admin
  const isSuperAdmin = permissions?.isSuperAdmin;

  return (
    <div className="min-h-screen bg-background pb-20 text-white">
      <header className="glass-strong border-b border-white/[0.06] sticky top-0 z-40 px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex gap-1 sm:gap-1.5">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-xl" />
          <h1 className="text-sm font-extrabold tracking-tight uppercase">Zentra-X</h1>
        </div>
        <div className="text-xs text-zinc-500">Administração</div>
      </header>

      <main className="px-4 pb-8 space-y-6">
        <section className="pt-4 animate-in fade-in">
          <TabsAdm active={activeTab} onChange={setActiveTab} />

          {activeTab === 'acessos' && (
            <div className="glass rounded-3xl p-6 border border-white/10">
              <GerenciarAcessos />
            </div>
          )}

          {activeTab === 'super-admin' && (
            <div className="glass rounded-3xl p-6 border border-white/10">
              {isSuperAdmin ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase text-white">Painel Super Admin</h3>
                  <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-zinc-500 font-bold uppercase">
                    Funcionalidade em desenvolvimento
                  </div>
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed border-red-500/20 rounded-3xl text-center">
                  <p className="text-red-400 font-bold uppercase">Acesso restrito a Super Administradores</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <div className="print:hidden">
        <BottomNav
          active="adm"
          onNavigate={(section) => {
            const routes: Record<string, string> = {
              'dashboard': '/',
              'lancamento': '/lancamentos',
              'clientes': '/clientes',
              'obras': '/obras',
              'relatorios': '/financeiro',
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
          active="adm"
          onNavigate={(section) => {
            const routes: Record<string, string> = {
              'dashboard': '/',
              'lancamento': '/lancamentos',
              'clientes': '/clientes',
              'obras': '/obras',
              'relatorios': '/financeiro',
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

export default Adm;