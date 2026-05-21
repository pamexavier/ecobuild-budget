import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { DashboardGeral } from '@/components/DashboardGeral';
import { CardDashboardContas } from '@/components/SistemaContasAReceber';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import logo from '@/assets/logo.png';

const Dashboard = () => {
  const { user, permissions, tenantId, tenantNome, signOut } = useAuth();
  const { obras = [], lancamentos = [], profissionais = [], comissoes = [], contas = [] } = useAppStore(tenantId) || {};
  
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Estatísticas rápidas
  const obrasTotais = obras.length;
  const lancamentosMes = lancamentos.filter(l => {
    const data = new Date(l.data);
    const agora = new Date();
    return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      {/* HEADER - Refined */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-5 print:hidden backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl ring-1 ring-emerald-500/30" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                Zentra-X
              </h1>
              {tenantNome && <p className="text-[10px] text-zinc-400 font-semibold">{tenantNome}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="font-semibold">{obrasTotais} Obras Ativas</span>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 pb-8 space-y-8">
        {/* WELCOME SECTION */}
        <section className="pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">
                Bem-vindo de volta
              </h2>
              <p className="text-zinc-400 font-medium flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                Acompanhe seu desempenho em tempo real
              </p>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Obras Ativas', value: obrasTotais, icon: '🏗️', color: 'emerald' },
              { label: 'Lançamentos (mês)', value: lancamentosMes, icon: '📊', color: 'blue' },
              { label: 'Profissionais', value: profissionais.length, icon: '👥', color: 'purple' },
              { label: 'Comissões', value: comissoes.length, icon: '💰', color: 'orange' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 cursor-default
                  ${stat.color === 'emerald' ? 'bg-emerald-500/[0.08] border-emerald-500/20 hover:border-emerald-500/40' : ''}
                  ${stat.color === 'blue' ? 'bg-blue-500/[0.08] border-blue-500/20 hover:border-blue-500/40' : ''}
                  ${stat.color === 'purple' ? 'bg-purple-500/[0.08] border-purple-500/20 hover:border-purple-500/40' : ''}
                  ${stat.color === 'orange' ? 'bg-orange-500/[0.08] border-orange-500/20 hover:border-orange-500/40' : ''}
                `}
              >
                <div className="p-4 relative z-10">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-[11px] font-black uppercase text-zinc-500 tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black
                    ${stat.color === 'emerald' ? 'text-emerald-300' : ''}
                    ${stat.color === 'blue' ? 'text-blue-300' : ''}
                    ${stat.color === 'purple' ? 'text-purple-300' : ''}
                    ${stat.color === 'orange' ? 'text-orange-300' : ''}
                  `}>
                    {stat.value}
                  </p>
                </div>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${stat.color === 'emerald' ? 'bg-gradient-to-tr from-emerald-600/20 to-transparent' : ''}
                  ${stat.color === 'blue' ? 'bg-gradient-to-tr from-blue-600/20 to-transparent' : ''}
                  ${stat.color === 'purple' ? 'bg-gradient-to-tr from-purple-600/20 to-transparent' : ''}
                  ${stat.color === 'orange' ? 'bg-gradient-to-tr from-orange-600/20 to-transparent' : ''}
                `} />
              </div>
            ))}
          </div>
        </section>

        {/* DASHBOARDS */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
            <DashboardGeral 
              obras={obras} 
              lancamentos={lancamentos} 
              profissionais={profissionais} 
              comissoes={comissoes} 
            />
          </div>
          <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
            <CardDashboardContas contas={contas} obras={obras} />
          </div>
        </section>
      </main>

      <div className="print:hidden">
        <BottomNav 
          active="dashboard" 
          onNavigate={(section) => {
            const routes: Record<string, string> = {
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
          active="dashboard" 
          onNavigate={(section) => {
            const routes: Record<string, string> = {
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
          permissions={permissions} 
          userEmail={user?.email || ''} 
          onLogout={handleLogout} 
        />
      </div>
    </div>
  );
};

export default Dashboard;