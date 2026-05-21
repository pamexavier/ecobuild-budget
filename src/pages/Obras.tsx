import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2, Users2, X, Wallet, Hammer, Box, Search, ShoppingCart, Plus, MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { CadastrarClienteModal } from '@/components/CadastrarClienteModal';
import { DashboardOrcamento } from '@/components/DashboardOrcamento';
import { RelatoriosObra } from '@/components/RelatoriosObra';
import { UploadContratoObra } from '@/components/UploadContratoObra';
import { ServicosContratoChecklist } from '@/components/ServicosContratoChecklist';
import { MateriaisNotaFiscal } from '@/components/MateriaisNotaFiscal';
import { GerenciadorContas } from '@/components/SistemaContasAReceber';
import { ModalCriarProposta } from '@/components/SistemaPropostaPagamento';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TIPO_CONTRATO_LABELS } from '@/lib/types';
import logo from '@/assets/logo.png';

const TabsObra = ({ active, onChange }: { active: string; onChange: (id: string) => void }) => (
  <div className="flex bg-white/[0.02] p-2 rounded-2xl mb-8 border border-white/10 overflow-x-auto gap-1 backdrop-blur-sm">
    {[
      { id: 'info', label: 'Resumo', icon: '📋' },
      { id: 'contrato', label: 'Contrato', icon: '📄' },
      { id: 'financeiro', label: 'Financeiro', icon: '💰' },
      { id: 'servicos', label: 'Execução', icon: '🔨' },
      { id: 'materiais', label: 'Materiais', icon: '📦' },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
          active === tab.id
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>{tab.icon}</span>
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </div>
);

const Obras = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  const {
    obras = [], clientes = [], profissionais = [], lancamentos = [], categorias = [], contas = [],
    addObra, addCliente, addLancamento, deleteLancamento, updateLancamento, deleteObra, addConta, updateConta, deleteConta, updateCategorias
  } = useAppStore(tenantId) || {};

  const navigate = useNavigate();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('obras');
  const [buscaObras, setBuscaObras] = useState('');
  const [mostrarApenasAtraso, setMostrarApenasAtraso] = useState(false);
  const [obraDetalheSelecionada, setObraDetalheSelecionada] = useState<any>(null);
  const [activeTabObra, setActiveTabObra] = useState('info');
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false);
  const [contratoObra, setContratoObra] = useState<any>(null);
  const [servicosContrato, setServicosContrato] = useState<any[]>([]);
  const [materiaisContrato, setMateriaisContrato] = useState<any[]>([]);
  const [matNome, setMatNome] = useState('');
  const [matValor, setMatValor] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getObraInfo = (obra: any) => {
    if (!obra) return { totalProposta: 0, valorPago: 0, aReceber: 0, temAtraso: false, contasObra: [] };
    const contasObra = (contas || []).filter(c => c.obraId === obra.id);
    const totalProposta = contasObra.reduce((s, c) => s + (c.valor || 0), 0);
    const valorPago = contasObra.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor || 0), 0);
    const aReceber = totalProposta - valorPago;
    const temAtraso = contasObra.some(c => c.status !== 'pago' && new Date(c.dataVencimento) < new Date());
    return { totalProposta, valorPago, aReceber, temAtraso, contasObra };
  };

  const obrasOrdenadas = useMemo(() => {
    let res = (obras || []).filter(o => (o.nome || '').toLowerCase().includes((buscaObras || '').toLowerCase()));
    if (mostrarApenasAtraso) res = res.filter(o => getObraInfo(o).temAtraso);
    return res.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [obras, buscaObras, mostrarApenasAtraso, contas]);

  const handleAddMaterial = async () => {
    if (!matNome || !matValor || !addLancamento) return;
    await addLancamento({
      obraId: obraDetalheSelecionada.id,
      profissionalId: 'material-generico',
      tipo: 'material' as any,
      valor: parseFloat(matValor),
      data: new Date().toISOString().split('T')[0],
      descricaoEtapa: matNome,
      turnos: ['Material']
    });
    setMatNome('');
    setMatValor('');
    toast({ title: 'Material registrado!' });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
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
        <section className="pt-6 space-y-8 animate-in fade-in">
          {activeSection === 'obras' && (
            <>
              {/* HEADER SEÇÃO */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter mb-2">Obras & Projetos</h2>
                  <p className="text-zinc-400 font-medium">Gerenciar e acompanhar todas suas obras em tempo real</p>
                </div>
                
                {/* SEARCH */}
                <div className="relative group max-w-2xl">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Buscar obra ou projeto..."
                    value={buscaObras}
                    onChange={e => setBuscaObras(e.target.value)}
                    className="w-full pl-14 pr-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 group-focus-within:border-emerald-500/30 group-focus-within:bg-white/[0.08] rounded-2xl text-sm outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* CARD NOVA OBRA */}
                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.03] hover:border-emerald-500/60 transition-all duration-300 hover:scale-105 cursor-pointer shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/40 flex items-center justify-center min-h-[400px]">
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-emerald-600/10 to-transparent" />
                  
                  <div className="relative p-6 text-center space-y-4">
                    <div className="text-6xl">🏗️</div>
                    <div>
                      <h4 className="text-lg font-black text-emerald-300 uppercase tracking-tight mb-2">Nova Obra</h4>
                      <p className="text-xs text-zinc-400 font-semibold">Clique para criar uma nova obra ou projeto</p>
                    </div>
                    <CadastrarObraModal 
                      onAdd={(newObra) => {
                        addObra(newObra);
                      }} 
                      clientes={clientes} 
                      onAddCliente={addCliente}
                    />
                  </div>
                </div>

                {/* CARDS DE OBRAS */}
{obrasOrdenadas.map((o, idx) => {
  const { totalProposta, aReceber, temAtraso } = getObraInfo(o);
  const percGasto = o.orcamentoLimite ? ((o.gastoAtual || 0) / o.orcamentoLimite) * 100 : 0;
  const isProjeto = o.tipoContrato === 'projeto';

  return (
    <div
      key={o.id}
      onClick={() => {
        setObraDetalheSelecionada(o);
        setActiveTabObra('info');
      }}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer backdrop-blur-xl border transition-all duration-300 hover:scale-105 animate-in fade-in
        ${temAtraso ? 'border-red-500/40 bg-red-500/[0.05]' : ''}
        ${!temAtraso && isProjeto ? 'border-purple-500/30 bg-purple-500/[0.05] hover:border-purple-500/60' : ''}
        ${!temAtraso && !isProjeto ? 'border-emerald-500/30 bg-emerald-500/[0.05] hover:border-emerald-500/60' : ''}
        shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/40
      `}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className={`absolute inset-0 ${isProjeto ? 'bg-gradient-to-br from-purple-600/10 to-transparent' : 'bg-gradient-to-br from-emerald-600/10 to-transparent'}`} />
                      </div>

                      <div className="relative p-6 space-y-4">
                        {/* HEADER */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-sm ${
                                isProjeto ? 'bg-purple-500/30 text-purple-200' : 'bg-emerald-500/30 text-emerald-200'
                              }`}>
                                {TIPO_CONTRATO_LABELS[o.tipoContrato]}
                              </span>
                              {temAtraso && <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-500/30 text-red-200 animate-pulse">⚠️ ATRASO</span>}
                            </div>
                            <h3 className="text-lg font-black uppercase text-white tracking-tight truncate">{o.nome || 'Sem Nome'}</h3>
                            <p className="text-xs text-zinc-400 font-semibold mt-1 truncate">{o.clienteNome}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteObra(o.id); }} 
                            className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* LOCALIZAÇÃO */}
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={14} className={isProjeto ? 'text-purple-400' : 'text-emerald-400'} />
                          <p className={`font-semibold truncate ${isProjeto ? 'text-purple-200' : 'text-emerald-200'}`}>
                            {o.endereco || 'Endereço não informado'}
                          </p>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Progresso</span>
                            <span className={`text-[10px] font-black ${
                              percGasto > 100 ? 'text-red-400' : (isProjeto ? 'text-purple-300' : 'text-emerald-300')
                            }`}>
                              {Math.round(percGasto)}%
                            </span>
                          </div>
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                            <div
                              className={`h-full transition-all duration-700 rounded-full ${
                                percGasto > 100
                                  ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50'
                                  : isProjeto
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50'
                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50'
                              }`}
                              style={{ width: `${Math.min(percGasto, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* VALORES */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Investido</p>
                            <p className="text-sm font-black text-white">{formatCurrency(o.gastoAtual || 0).split(' ')[0]}</p>
                            <p className="text-[8px] text-zinc-500">{formatCurrency(o.gastoAtual || 0).split(' ')[1]}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Contrato</p>
                            <p className="text-sm font-black text-white">{formatCurrency(totalProposta).split(' ')[0]}</p>
                            <p className="text-[8px] text-zinc-500">{formatCurrency(totalProposta).split(' ')[1]}</p>
                          </div>
                        </div>

                        {/* SALDO */}
                        <div className={`p-3.5 rounded-xl backdrop-blur-sm border transition-all ${
                          isProjeto ? 'bg-purple-500/15 border-purple-500/30' : 'bg-emerald-500/15 border-emerald-500/30'
                        }`}>
                          <p className={`text-[8px] font-black uppercase tracking-wider mb-1 ${isProjeto ? 'text-purple-300' : 'text-emerald-300'}`}>
                            Saldo Pendente
                          </p>
                          <p className={`text-lg font-black ${isProjeto ? 'text-purple-200' : 'text-emerald-200'}`}>
                            {formatCurrency(aReceber)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {obrasOrdenadas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-zinc-500 font-bold text-lg">Nenhuma obra encontrada</p>
                  <p className="text-zinc-600 text-sm mt-1">Crie uma nova obra para começar</p>
                </div>
              )}
            </>
          )}

          {activeSection === 'orcamento' && (
            <DashboardOrcamento obras={obras} lancamentos={lancamentos} categorias={categorias} updateCategorias={updateCategorias} />
          )}

          {activeSection === 'relatorios' && (
            <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/50">
              <RelatoriosObra lancamentos={lancamentos} profissionais={profissionais} onDelete={deleteLancamento} onUpdate={updateLancamento} />
            </div>
          )}
        </section>
      </main>

      {/* MODAL (mantém igual) */}
      {obraDetalheSelecionada && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="bg-gradient-to-br from-[#0f0f1e] to-[#0a0a0a] border border-white/10 rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{obraDetalheSelecionada?.nome || 'Sem Nome'}</h2>
                <p className="text-sm text-zinc-400 font-semibold flex items-center gap-2 mt-2">
                  <Users2 size={14} className="text-emerald-500" /> {obraDetalheSelecionada?.clienteNome || 'Cliente não definido'}
                </p>
              </div>
              <button onClick={() => setObraDetalheSelecionada(null)} className="bg-white/5 hover:bg-white/10 p-3 rounded-full text-zinc-500 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <TabsObra active={activeTabObra} onChange={setActiveTabObra} />

              {/* CONTENT TABS (mantém igual, mas com melhor estilo) */}
              {activeTabObra === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
                  {[
                    { label: 'Orçamento Previsto', value: obraDetalheSelecionada.orcamentoLimite, color: 'blue' },
                    { label: 'Total Gasto', value: obraDetalheSelecionada.gastoAtual, color: 'orange' },
                    { label: 'Saldo em Caixa', value: (obraDetalheSelecionada.orcamentoLimite || 0) - (obraDetalheSelecionada.gastoAtual || 0), color: 'emerald' },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-2xl p-6 backdrop-blur-xl border ${
                      item.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' : 
                      item.color === 'orange' ? 'bg-orange-500/10 border-orange-500/20' : 
                      'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                        item.color === 'blue' ? 'text-blue-400' : 
                        item.color === 'orange' ? 'text-orange-400' : 
                        'text-emerald-400'
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-2xl font-black ${
                        item.color === 'blue' ? 'text-blue-200' : 
                        item.color === 'orange' ? 'text-orange-200' : 
                        'text-emerald-200'
                      }`}>
                        {formatCurrency(item.value || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTabObra === 'contrato' && (
                <div className="space-y-6 animate-in fade-in">
                  {!contratoObra ? (
                    <UploadContratoObra
                      obraId={obraDetalheSelecionada.id}
                      tenantId={tenantId}
                      onSucesso={(dados) => {
                        setContratoObra(dados);
                        setServicosContrato(dados.dados?.servicos || []);
                        setMateriaisContrato(dados.dados?.materiais || []);
                      }}
                    />
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase mb-2">Contrato Analisado</p>
                            <p className="text-lg font-black text-white">{formatCurrency(contratoObra.dados?.valor_total)}</p>
                          </div>
                          <button onClick={() => setContratoObra(null)} className="text-zinc-600 hover:text-red-500 transition-all">
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTabObra === 'financeiro' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase text-zinc-300">Fluxo de Pagamentos</h3>
                    <Button
                      onClick={() => setModalPropostaAberto(true)}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-[10px] font-black uppercase px-4"
                    >
                      <Plus size={14} className="mr-2" /> Gerar Proposta
                    </Button>
                  </div>
                  {(() => {
                    const info = getObraInfo(obraDetalheSelecionada);
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-emerald-500/15 border border-emerald-500/30 p-5 rounded-2xl">
                            <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Recebido</p>
                            <p className="text-lg font-black text-white">{formatCurrency(info.valorPago)}</p>
                          </div>
                          <div className="bg-blue-500/15 border border-blue-500/30 p-5 rounded-2xl">
                            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Falta</p>
                            <p className="text-lg font-black text-white">{formatCurrency(info.aReceber)}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Total</p>
                            <p className="text-lg font-black text-white">{formatCurrency(info.totalProposta)}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-black/50 flex gap-3">
               <button className="flex-1 py-3 bg-white/5 text-zinc-400 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">Exportar PDF</button>
               <button onClick={() => setObraDetalheSelecionada(null)} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:from-emerald-500 hover:to-emerald-400 transition-all">
                 Fechar Central
               </button>
            </div>
          </div>
        </div>
      )}

      {modalPropostaAberto && obraDetalheSelecionada && (
        <ModalCriarProposta
          obra={obraDetalheSelecionada}
          onClose={() => setModalPropostaAberto(false)}
          onSave={(proposta) => {
            addConta({
              obraId: obraDetalheSelecionada.id,
              descricao: 'Entrada Contrato',
              valor: proposta.entrada.valor,
              dataVencimento: new Date(),
              status: 'aberto',
              tipo: 'Entrada'
            });

            proposta.parcelas.forEach(p => {
              addConta({
                obraId: obraDetalheSelecionada.id,
                descricao: p.descricao,
                valor: p.valor,
                dataVencimento: p.dataVencimento,
                status: 'aberto',
                tipo: 'Parcela'
              });
            });

            setModalPropostaAberto(false);
            toast({ title: 'Proposta salva!', description: 'Entrada e parcelas geradas.' });
          }}
        />
      )}

      <div className="print:hidden">
        <BottomNav
          active="clientes"
          onNavigate={(section) => {
            const routes: Record<string, string> = {
              'dashboard': '/',
              'lancamento': '/lancamentos',
              'obras': '/obras',
              'relatorios': '/financeiro',
              'relatoriosObra': '/obras',
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
              'obras': '/obras',
              'relatorios': '/financeiro',
              'relatoriosObra': '/obras',
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

export default Obras;