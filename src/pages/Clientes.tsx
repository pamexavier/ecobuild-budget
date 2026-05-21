import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, User, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

interface ClienteStats {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  totalObras: number;
  totalRecebido: number;
  totalPendente: number;
  lucroPotencial: number; // Total proposta - gasto
}

const Clientes = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  const { clientes = [], obras = [], contas = [], addCliente } = useAppStore(tenantId) || {};
  
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [buscaClientes, setBuscaClientes] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  // Calcular stats de cada cliente
  const clientesComStats = useMemo(() => {
    return (clientes || []).map(c => {
      const obrasDoCliente = (obras || []).filter(o => o.clienteId === c.id);
      const contasDoCliente = (contas || []).filter(cont => 
        obrasDoCliente.some(o => o.id === cont.obraId)
      );
      
      const totalProposta = contasDoCliente.reduce((sum, cont) => sum + (cont.valor || 0), 0);
      const totalRecebido = contasDoCliente
        .filter(cont => cont.status === 'pago')
        .reduce((sum, cont) => sum + (cont.valor || 0), 0);
      const totalPendente = totalProposta - totalRecebido;
      const lucroPotencial = totalProposta - (obrasDoCliente.reduce((sum, o) => sum + (o.gastoAtual || 0), 0));

      return {
        ...c,
        totalObras: obrasDoCliente.length,
        totalRecebido,
        totalPendente,
        lucroPotencial,
      };
    });
  }, [clientes, obras, contas]);

  // Filtrar e ordenar
  const clientesFiltrados = useMemo(() => {
    return clientesComStats
      .filter(c => (c.nome || '').toLowerCase().includes((buscaClientes || '').toLowerCase()))
      .sort((a, b) => b.lucroPotencial - a.lucroPotencial);
  }, [clientesComStats, buscaClientes]);

  // KPIs
  const totalClientes = clientesComStats.length;
  const clientesRecentes = clientesComStats.slice(0, 5).length; // Simulado
  const clientesAtivos = clientesComStats.filter(c => c.totalObras > 0).length;
  const melhorCliente = clientesComStats.reduce((prev, current) => 
    (current.lucroPotencial || 0) > (prev.lucroPotencial || 0) ? current : prev, 
    clientesComStats[0]
  );

  // Obras do cliente selecionado
  const obrasDoClienteSelecionado = useMemo(() => {
    if (!clienteSelecionado) return [];
    return (obras || []).filter(o => o.clienteId === clienteSelecionado.id);
  }, [clienteSelecionado, obras]);

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
        </div>
      </header>

      <main className="px-4 sm:px-6 pb-8 space-y-8">
        <section className="pt-6 space-y-8 animate-in fade-in">
          {/* HEADER SEÇÃO */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">Clientes</h2>
              <p className="text-zinc-400 font-medium">Visualize performance e lucro potencial de cada cliente</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Clientes', value: totalClientes, icon: User, color: 'emerald' },
                { label: 'Clientes Ativos', value: clientesAtivos, icon: TrendingUp, color: 'blue' },
                { label: 'Melhor Cliente', value: melhorCliente?.nome || '-', icon: Star, color: 'purple', isBig: true },
                { label: 'Lucro Potencial', value: formatCurrency(melhorCliente?.lucroPotencial || 0), icon: Briefcase, color: 'green', isBig: true },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 cursor-default
                    ${stat.color === 'emerald' ? 'bg-emerald-500/[0.08] border-emerald-500/20 hover:border-emerald-500/40' : ''}
                    ${stat.color === 'blue' ? 'bg-blue-500/[0.08] border-blue-500/20 hover:border-blue-500/40' : ''}
                    ${stat.color === 'purple' ? 'bg-purple-500/[0.08] border-purple-500/20 hover:border-purple-500/40' : ''}
                    ${stat.color === 'green' ? 'bg-green-500/[0.08] border-green-500/20 hover:border-green-500/40' : ''}
                  `}
                >
                  <div className="p-4 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{stat.label}</p>
                      <stat.icon size={16} className={
                        stat.color === 'emerald' ? 'text-emerald-400' :
                        stat.color === 'blue' ? 'text-blue-400' :
                        stat.color === 'purple' ? 'text-purple-400' :
                        'text-green-400'
                      } />
                    </div>
                    <p className={`font-black text-sm ${stat.isBig ? 'text-lg line-clamp-2' : ''}
                      ${stat.color === 'emerald' ? 'text-emerald-300' : ''}
                      ${stat.color === 'blue' ? 'text-blue-300' : ''}
                      ${stat.color === 'purple' ? 'text-purple-300' : ''}
                      ${stat.color === 'green' ? 'text-green-300' : ''}
                    `}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${stat.color === 'emerald' ? 'bg-gradient-to-tr from-emerald-600/20 to-transparent' : ''}
                    ${stat.color === 'blue' ? 'bg-gradient-to-tr from-blue-600/20 to-transparent' : ''}
                    ${stat.color === 'purple' ? 'bg-gradient-to-tr from-purple-600/20 to-transparent' : ''}
                    ${stat.color === 'green' ? 'bg-gradient-to-tr from-green-600/20 to-transparent' : ''}
                  `} />
                </div>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative group max-w-2xl">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={buscaClientes}
                onChange={e => setBuscaClientes(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 group-focus-within:border-emerald-500/30 group-focus-within:bg-white/[0.08] rounded-2xl text-sm outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* GRID DE CLIENTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clientesFiltrados.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setClienteSelecionado(c)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer backdrop-blur-xl border border-emerald-500/30 bg-emerald-500/[0.05] hover:border-emerald-500/60 transition-all duration-300 hover:scale-105 animate-in fade-in shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/40"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* GRADIENT OVERLAY */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-emerald-600/10 to-transparent" />

                <div className="relative p-6 space-y-4">
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black uppercase text-white tracking-tight truncate">{c.nome}</h3>
                      {c.email && <p className="text-xs text-zinc-400 font-semibold mt-1 truncate">📧 {c.email}</p>}
                      {c.telefone && <p className="text-xs text-zinc-400 font-semibold truncate">📞 {c.telefone}</p>}
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Obras</p>
                      <p className="text-2xl font-black text-emerald-300">{c.totalObras}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Lucro</p>
                      <p className="text-xl font-black text-green-300">{formatCurrency(c.lucroPotencial).split(' ')[0]}</p>
                      <p className="text-[8px] text-zinc-500">{formatCurrency(c.lucroPotencial).split(' ')[1]}</p>
                    </div>
                  </div>

                  {/* RECEBIDO vs PENDENTE */}
                  <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex justify-between text-[9px]">
                      <span className="font-black text-emerald-400">Recebido</span>
                      <span className="font-black text-orange-400">Pendente</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/5 border border-white/10">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                        style={{ width: `${c.totalRecebido + c.totalPendente > 0 ? (c.totalRecebido / (c.totalRecebido + c.totalPendente)) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                        style={{ width: `${c.totalRecebido + c.totalPendente > 0 ? (c.totalPendente / (c.totalRecebido + c.totalPendente)) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-zinc-400">
                      <span>{formatCurrency(c.totalRecebido)}</span>
                      <span>{formatCurrency(c.totalPendente)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={(e) => { e.stopPropagation(); setClienteSelecionado(c); }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-black uppercase text-[10px] py-2"
                  >
                    Ver Obras →
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {clientesFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-zinc-500 font-bold text-lg">Nenhum cliente encontrado</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL - OBRAS DO CLIENTE */}
      {clienteSelecionado && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="bg-gradient-to-br from-[#0f0f1e] to-[#0a0a0a] border border-white/10 rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* HEADER */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-purple-500/5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{clienteSelecionado.nome}</h2>
                  <p className="text-sm text-zinc-400 font-semibold mt-2">
                    {obrasDoClienteSelecionado.length} obra{obrasDoClienteSelecionado.length !== 1 ? 's' : ''} registrada{obrasDoClienteSelecionado.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setClienteSelecionado(null)} 
                  className="bg-white/5 hover:bg-white/10 p-3 rounded-full text-zinc-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {obrasDoClienteSelecionado.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-zinc-500 font-bold">Nenhuma obra registrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {obrasDoClienteSelecionado.map((obra, idx) => {
                    const contasObra = (contas || []).filter(c => c.obraId === obra.id);
                    const totalProposta = contasObra.reduce((s, c) => s + (c.valor || 0), 0);
                    const percGasto = obra.orcamentoLimite ? ((obra.gastoAtual || 0) / obra.orcamentoLimite) * 100 : 0;

                    return (
                      <div
                        key={obra.id}
                        onClick={() => {
                          setClienteSelecionado(null);
                          navigate(`/obras?id=${obra.id}`);
                        }}
                        className="group relative overflow-hidden rounded-2xl cursor-pointer backdrop-blur-xl border border-emerald-500/30 bg-emerald-500/[0.05] hover:border-emerald-500/60 p-5 transition-all duration-300 hover:scale-105 animate-in fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-base font-black text-white uppercase truncate">{obra.nome}</h4>
                            <p className="text-[10px] text-zinc-400 font-semibold mt-1">📍 {obra.endereco || 'Sem endereço'}</p>
                          </div>

                          <div className="flex justify-between text-xs">
                            <div>
                              <p className="text-zinc-500 font-bold uppercase">Investido</p>
                              <p className="text-emerald-300 font-black">{formatCurrency(obra.gastoAtual || 0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-zinc-500 font-bold uppercase">Contrato</p>
                              <p className="text-emerald-300 font-black">{formatCurrency(totalProposta)}</p>
                            </div>
                          </div>

                          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                              style={{ width: `${Math.min(percGasto, 100)}%` }}
                            />
                          </div>

                          <p className="text-[9px] text-zinc-500 font-bold">Clique para abrir detalhes completos →</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="print:hidden">
        <BottomNav
          active="clientes"
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
          active="clientes"
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

export default Clientes;