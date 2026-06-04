import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { GerenciadorContas } from '@/components/SistemaContasAReceber';
import { GestaoComissoes } from '@/components/GestaoComissoes';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, TrendingUp, DollarSign, Zap, Plus, X, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Financeiro = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  const {
    contas = [],
    obras = [],
    comissoes = [],
    parceiros = [],
    addConta,
    updateConta,
    deleteConta,
    addParceiro,
    updateParceiro,
    deleteParceiro,
    addComissao,
    updateComissaoStatus,
    deleteComissao,
  } = useAppStore(tenantId) || {};

  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.tab) {
      return location.state.tab;
    }
    return 'receber';
  });
  const [modalContaPagarAberto, setModalContaPagarAberto] = useState(false);
  const [obraParaContaPagar, setObraParaContaPagar] = useState<any>(null);
  const [formContaPagar, setFormContaPagar] = useState({
    descricao: '',
    valor: '',
    dataVencimento: new Date().toISOString().split('T')[0],
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const contasReceber = (contas || []).filter(c => c.tipo !== 'Despesa');
  const contasPagar = (contas || []).filter(c => c.tipo === 'Despesa');

  const totalReceber = contasReceber.reduce((sum, c) => c.status === 'aberto' ? sum + c.valor : sum, 0);
  const totalPagar = contasPagar.reduce((sum, c) => c.status === 'aberto' ? sum + c.valor : sum, 0);
  const totalPago = contasReceber.reduce((sum, c) => c.status === 'pago' ? sum + c.valor : sum, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleAddContaPagar = () => {
    if (!formContaPagar.descricao || !formContaPagar.valor || !obraParaContaPagar) return;
    
    addConta({
      obraId: obraParaContaPagar.id,
      descricao: formContaPagar.descricao,
      valor: parseFloat(formContaPagar.valor),
      dataVencimento: formContaPagar.dataVencimento,
      status: 'aberto',
      tipo: 'Despesa'
    });

    setFormContaPagar({ descricao: '', valor: '', dataVencimento: new Date().toISOString().split('T')[0] });
    setModalContaPagarAberto(false);
  };

  const contasPagarPorObra = (obraId: string) => {
    return contasPagar.filter(c => c.obraId === obraId);
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
        </div>
      </header>

      <main className="px-4 sm:px-6 pb-8 space-y-8">
        <section className="pt-6 animate-in fade-in">
          {/* HEADER SEÇÃO */}
          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">Financeiro</h2>
              <p className="text-zinc-400 font-medium">Acompanhe entradas, saídas e comissões em tempo real</p>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'A Receber', value: totalReceber, icon: TrendingUp, color: 'emerald' },
                { label: 'A Pagar', value: totalPagar, icon: TrendingDown, color: 'orange' },
                { label: 'Já Recebido', value: totalPago, icon: DollarSign, color: 'green' },
                { label: 'Comissões', value: comissoes.length, icon: Zap, color: 'purple' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 cursor-default
                    ${stat.color === 'emerald' ? 'bg-emerald-500/[0.08] border-emerald-500/20 hover:border-emerald-500/40' : ''}
                    ${stat.color === 'orange' ? 'bg-orange-500/[0.08] border-orange-500/20 hover:border-orange-500/40' : ''}
                    ${stat.color === 'green' ? 'bg-green-500/[0.08] border-green-500/20 hover:border-green-500/40' : ''}
                    ${stat.color === 'purple' ? 'bg-purple-500/[0.08] border-purple-500/20 hover:border-purple-500/40' : ''}
                  `}
                >
                  <div className="p-4 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">{stat.label}</p>
                      <stat.icon size={16} className={
                        stat.color === 'emerald' ? 'text-emerald-400' :
                        stat.color === 'orange' ? 'text-orange-400' :
                        stat.color === 'green' ? 'text-green-400' :
                        'text-purple-400'
                      } />
                    </div>
                    <p className={`text-lg font-black
                      ${stat.color === 'emerald' ? 'text-emerald-300' : ''}
                      ${stat.color === 'orange' ? 'text-orange-300' : ''}
                      ${stat.color === 'green' ? 'text-green-300' : ''}
                      ${stat.color === 'purple' ? 'text-purple-300' : ''}
                    `}>
                      {typeof stat.value === 'number' && stat.value > 100 ? formatCurrency(stat.value) : stat.value}
                    </p>
                  </div>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${stat.color === 'emerald' ? 'bg-gradient-to-tr from-emerald-600/20 to-transparent' : ''}
                    ${stat.color === 'orange' ? 'bg-gradient-to-tr from-orange-600/20 to-transparent' : ''}
                    ${stat.color === 'green' ? 'bg-gradient-to-tr from-green-600/20 to-transparent' : ''}
                    ${stat.color === 'purple' ? 'bg-gradient-to-tr from-purple-600/20 to-transparent' : ''}
                  `} />
                </div>
              ))}
            </div>
          </div>

          {/* TABS CORRIGIDAS - TEXTO APARECE NO CELULAR */}
          <div className="flex bg-white/[0.02] p-2 rounded-2xl mb-8 border border-white/10 overflow-x-auto custom-scrollbar gap-1 backdrop-blur-sm">
            {[
              { id: 'receber', label: 'A Receber', icon: '📥', color: 'emerald' },
              { id: 'pagar', label: 'A Pagar', icon: '📤', color: 'orange' },
              { id: 'comissoes', label: 'Comissões', icon: '💼', color: 'purple' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30`
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
            {activeTab === 'receber' && (
              <GerenciadorContas
                contas={contasReceber}
                obras={obras}
                onAdicionarConta={addConta}
                onAtualizarConta={updateConta}
                onDeletarConta={deleteConta}
              />
            )}

            {activeTab === 'pagar' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase text-white">Contas a Pagar</h3>
                  <Button
                    onClick={() => setModalContaPagarAberto(true)}
                    className="gap-2 rounded-xl font-semibold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400"
                  >
                    <Plus size={16} />
                    Nova Conta
                  </Button>
                </div>

                {contasPagar.length === 0 ? (
                  <div className="p-16 border-2 border-dashed border-white/5 rounded-3xl text-center text-zinc-500 font-bold uppercase">
                    <div className="text-4xl mb-3">📭</div>
                    Nenhuma conta a pagar registrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {obras.map(obra => {
                      const contas = contasPagarPorObra(obra.id);
                      if (contas.length === 0) return null;

                      return (
                        <div key={obra.id} className="space-y-2">
                          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white uppercase truncate">{obra.nome}</p>
                              <p className="text-[10px] text-zinc-400 font-semibold">📍 {obra.endereco || 'Sem endereço'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-orange-400">{contas.length} conta{contas.length !== 1 ? 's' : ''}</p>
                              <p className="text-xs font-black text-white">{formatCurrency(contas.reduce((sum, c) => sum + c.valor, 0))}</p>
                            </div>
                          </div>

                          <div className="space-y-2 ml-4">
                            {contas.map(c => (
                              <div key={c.id} className="group bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 flex justify-between items-center transition-all">
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-white">{c.descricao}</p>
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase">
                                    Vencimento: {new Date(c.dataVencimento).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-black text-orange-400">{formatCurrency(c.valor)}</p>
                                  <button
                                    onClick={() => deleteConta(c.id)}
                                    className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comissoes' && (
              <GestaoComissoes
                comissoes={comissoes || []}
                parceiros={parceiros || []}
                obras={obras || []}
                contas={contas || []}
                onAddParceiro={addParceiro}
                onUpdateParceiro={updateParceiro}
                onDeleteParceiro={deleteParceiro}
                onAddComissao={addComissao}
                onUpdateStatus={updateComissaoStatus}
                onDeleteComissao={deleteComissao}
              />
            )}
          </div>
        </section>
      </main>

      {/* MODAL - NOVA CONTA A PAGAR */}
      {modalContaPagarAberto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="bg-gradient-to-br from-[#0f0f1e] to-[#0a0a0a] border border-white/10 rounded-[32px] max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-orange-500/5 to-transparent">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Nova Conta a Pagar</h2>
                <button
                  onClick={() => setModalContaPagarAberto(false)}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-zinc-500 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* SELEÇÃO DE OBRA */}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Obra Relacionada</label>
                <select
                  value={obraParaContaPagar?.id || ''}
                  onChange={(e) => {
                    const obra = obras.find(o => o.id === e.target.value);
                    setObraParaContaPagar(obra);
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-orange-500/30 transition-all"
                >
                  <option value="">Selecione uma obra...</option>
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>

              {/* DESCRIÇÃO */}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de materiais..."
                  value={formContaPagar.descricao}
                  onChange={(e) => setFormContaPagar({ ...formContaPagar, descricao: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-orange-500/30 transition-all"
                />
              </div>

              {/* VALOR */}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Valor (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={formContaPagar.valor}
                  onChange={(e) => setFormContaPagar({ ...formContaPagar, valor: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-orange-500/30 transition-all"
                />
              </div>

              {/* DATA VENCIMENTO */}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} />
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formContaPagar.dataVencimento}
                  onChange={(e) => setFormContaPagar({ ...formContaPagar, dataVencimento: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-orange-500/30 transition-all"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setModalContaPagarAberto(false)}
                  variant="outline"
                  className="flex-1 rounded-xl font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddContaPagar}
                  disabled={!formContaPagar.descricao || !formContaPagar.valor || !obraParaContaPagar}
                  className="flex-1 gap-2 rounded-xl font-semibold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400"
                >
                  <Plus size={16} />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="print:hidden">
        <BottomNav
          active="contasReceber"
          onNavigate={(section) => {
            const routes: Record<string, string | { path: string; state?: any }> = {
              'dashboard': '/',
              'lancamento': '/lancamentos',
              'clientes': '/clientes',
              'obras': '/obras',
              'relatorios': '/financeiro',
              'contasReceber': '/financeiro',
              'comissoes': { path: '/financeiro', state: { tab: 'comissoes' } }
            };
            const route = routes[section];
            if (typeof route === 'string') navigate(route);
            else if (route) navigate(route.path, { state: route.state });
          }}
          onMenuOpen={() => setMenuOpen(true)}
          permissions={permissions}
        />
        <SideMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          active="contasReceber"
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

export default Financeiro;
