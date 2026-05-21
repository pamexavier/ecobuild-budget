import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { TIPO_CONTRATO_LABELS } from '@/lib/types';
import logo from '@/assets/logo.png';

const Projetos = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  const { obras = [], clientes = [], addObra, addCliente, deleteObra, contas = [] } = useAppStore(tenantId) || {};

  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [buscaProjetos, setBuscaProjetos] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getObraInfo = (obra: any) => {
    if (!obra) return { totalProposta: 0, valorPago: 0, aReceber: 0, temAtraso: false };
    const contasObra = (contas || []).filter(c => c.obraId === obra.id);
    const totalProposta = contasObra.reduce((s, c) => s + (c.valor || 0), 0);
    const valorPago = contasObra.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor || 0), 0);
    const aReceber = totalProposta - valorPago;
    const temAtraso = contasObra.some(c => c.status !== 'pago' && new Date(c.dataVencimento) < new Date());
    return { totalProposta, valorPago, aReceber, temAtraso };
  };

  const projetos = useMemo(() => {
    let res = (obras || []).filter(o => o.tipoContrato === 'projeto');
    res = res.filter(o => (o.nome || '').toLowerCase().includes((buscaProjetos || '').toLowerCase()));
    return res.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [obras, buscaProjetos]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-5 print:hidden backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl ring-1 ring-emerald-500/30" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            Zentra-X
          </h1>
        </div>
      </header>

      <main className="px-4 sm:px-6 pb-8 space-y-8">
        <section className="pt-6 space-y-8 animate-in fade-in">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">Projetos</h2>
              <p className="text-zinc-400 font-medium">Gerenciar e acompanhar todos seus projetos</p>
            </div>
            
            <div className="relative group max-w-2xl">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar projeto..."
                value={buscaProjetos}
                onChange={e => setBuscaProjetos(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 group-focus-within:border-emerald-500/30 group-focus-within:bg-white/[0.08] rounded-2xl text-sm outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* CARD NOVO PROJETO */}
            <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-dashed border-purple-500/40 bg-purple-500/[0.03] hover:border-purple-500/60 transition-all duration-300 hover:scale-105 cursor-pointer shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/40 flex items-center justify-center min-h-[400px]">
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-purple-600/10 to-transparent" />
              
              <div className="relative p-6 text-center space-y-4">
                <div className="text-6xl">✨</div>
                <div>
                  <h4 className="text-lg font-black text-purple-300 uppercase tracking-tight mb-2">Novo Projeto</h4>
                  <p className="text-xs text-zinc-400 font-semibold">Clique para criar um novo projeto</p>
                </div>
                <CadastrarObraModal 
                  onAdd={addObra} 
                  clientes={clientes} 
                  onAddCliente={addCliente}
                />
              </div>
            </div>

            {/* CARDS DE PROJETOS */}
            {projetos.map((p, idx) => {
              const { totalProposta, aReceber } = getObraInfo(p);
              const percGasto = p.orcamentoLimite ? ((p.gastoAtual || 0) / p.orcamentoLimite) * 100 : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/obras?id=${p.id}`)}
                  className="group relative overflow-hidden rounded-2xl cursor-pointer backdrop-blur-xl border border-purple-500/30 bg-purple-500/[0.05] hover:border-purple-500/60 transition-all duration-300 hover:scale-105 animate-in fade-in shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/40"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-purple-600/10 to-transparent" />

                  <div className="relative p-6 space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-sm bg-purple-500/30 text-purple-200">
                            {TIPO_CONTRATO_LABELS[p.tipoContrato]}
                          </span>
                        </div>
                        <h3 className="text-lg font-black uppercase text-white tracking-tight truncate">{p.nome || 'Sem Nome'}</h3>
                        <p className="text-xs text-zinc-400 font-semibold mt-1 truncate">{p.clienteNome}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteObra(p.id); }} 
                        className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-lg">📍</span>
                      <p className="font-semibold truncate text-purple-200">
                        {p.endereco || 'Endereço não informado'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Progresso</span>
                        <span className="text-[10px] font-black text-purple-400">
                          {Math.round(percGasto)}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                        <div
                          className="h-full transition-all duration-700 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50"
                          style={{ width: `${Math.min(percGasto, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Investido</p>
                        <p className="text-sm font-black text-white">{formatCurrency(p.gastoAtual || 0).split(' ')[0]}</p>
                        <p className="text-[8px] text-zinc-500">{formatCurrency(p.gastoAtual || 0).split(' ')[1]}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Contrato</p>
                        <p className="text-sm font-black text-white">{formatCurrency(totalProposta).split(' ')[0]}</p>
                        <p className="text-[8px] text-zinc-500">{formatCurrency(totalProposta).split(' ')[1]}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl backdrop-blur-sm border bg-purple-500/15 border-purple-500/30">
                      <p className="text-[8px] font-black uppercase tracking-wider mb-1 text-purple-300">
                        Saldo Pendente
                      </p>
                      <p className="text-lg font-black text-purple-200">
                        {formatCurrency(aReceber)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {projetos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-zinc-500 font-bold text-lg">Nenhum projeto encontrado</p>
            </div>
          )}
        </section>
      </main>

      <div className="print:hidden">
        <BottomNav
          active="projetos"
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
          active="projetos"
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

export default Projetos;