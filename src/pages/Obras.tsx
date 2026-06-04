import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { Search, Menu, ArrowRight, MapPin, DollarSign, ShieldAlert, CheckCircle2, HardHat, TrendingUp, Trash2, ExternalLink } from 'lucide-react';
import logo from '@/assets/logo.png';

const Obras = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  // Trazendo as funções do seu store (incluindo addObra, addCliente e deleteObra)
  const { obras = [], contas = [], clientes = [], addObra, addCliente, deleteObra } = useAppStore(tenantId) || {};
  
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [buscaObras, setBuscaObras] = useState('');
  const [obraSelecionada, setObraSelecionada] = useState<any>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  // 🧮 Processamento inteligente da Obra (Calcula gastos lendo as 'contas' ou o 'gastoAtual')
  const obrasComStats = useMemo(() => {
    // Filtra apenas o que é EXECUÇÃO DE OBRA e que está ATIVA
    const apenasObrasFisicas = (obras || []).filter(o => o.tipoContrato !== 'projeto' && o.status !== 'inativa');

    return apenasObrasFisicas.map(o => {
      const clienteDono = (clientes || []).find(c => c.id === o.clienteId || c.id === o.cliente_id);
      
      // Lê as contas/propostas associadas à obra para montar os KPIs
      const contasDaObra = (contas || []).filter(c => c.obraId === o.id || c.obra_id === o.id);
      const totalProposta = contasDaObra.reduce((sum, c) => sum + (c.valor || 0), 0);
      
      // O gasto atual geralmente vem direto do objeto obra, mas você pode cruzar com lançamentos se preferir
      const gastoReal = o.gastoAtual || o.gasto_atual || 0;
      const limiteOrcamento = o.orcamentoLimite || o.orcamento || totalProposta || 0;
      
      const progressoFinanceiro = limiteOrcamento > 0 ? (gastoReal / limiteOrcamento) * 100 : 0;

      return {
        ...o,
        clienteNome: clienteDono ? clienteDono.nome : 'Cliente Não Vinculado',
        gastoRealAcumulado: gastoReal,
        orcamentoTeto: limiteOrcamento,
        porcentagemUso: Math.min(progressoFinanceiro, 100)
      };
    });
  }, [obras, contas, clientes]);

  // 🔍 MENU DA ESQUERDA: Ordem alfabética e limite de 8
  const listaObrasEsquerda = useMemo(() => {
    let resultado = [...obrasComStats];

    if (buscaObras.trim()) {
      resultado = resultado.filter(o => (o.nome || '').toLowerCase().includes(buscaObras.toLowerCase()));
    }

    resultado.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    return resultado.slice(0, 8); // Trava os 8 primeiros
  }, [obrasComStats, buscaObras]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-4 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl ring-1 ring-emerald-500/30" />
            <h1 className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Zentra-X</h1>
          </div>
          <button onClick={() => setMenuOpen(true)} className="text-zinc-400 hover:text-white"><Menu size={24} /></button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 space-y-6">
        
        {/* CABEÇALHO DA SEÇÃO COM LINHA DIVISÓRIA (CORRIGIDO) */}
        <div className="flex justify-between items-end border-b border-white/10 pb-5 mb-2">
          <div>
            <h2 className="text-2xl font-black tracking-tighter">Canteiro de Obras</h2>
            <p className="text-zinc-500 text-xs font-medium">Acompanhamento de execução, aportes financeiros e teto de gastos</p>
          </div>
          
          {/* ✨ MODAL DE NOVA OBRA INTEGRADO */}
          <div className="scale-90 origin-bottom-right sm:scale-100">
            <CadastrarObraModal 
              onAdd={addObra}
              clientes={clientes}
              onAddCliente={addCliente}
            />
          </div>
        </div>

        {/* 🏛️ MESTRE-DETALHE EM DUAS COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUNA ESQUERDA: LISTA COMPACTA */}
          <div className="space-y-3.5">
            <div className="relative group">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar obra ativa..."
                value={buscaObras}
                onChange={e => setBuscaObras(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 group-focus-within:border-emerald-500/20 group-focus-within:bg-white/[0.07] rounded-xl text-xs outline-none transition-all"
              />
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden p-1.5 space-y-1">
              <p className="text-[9px] font-black tracking-widest text-zinc-500 uppercase px-2 py-1">Ativas no Cronograma (Max 8)</p>
              {listaObrasEsquerda.map((obra) => {
                const isSelected = obraSelecionada?.id === obra.id;
                return (
                  <div
                    key={obra.id}
                    onClick={() => setObraSelecionada(obra)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all cursor-pointer flex justify-between items-center group
                      ${isSelected ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-300' : 'hover:bg-white/5 border border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <span className="truncate flex-1 pr-2">{obra.nome}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all text-emerald-400" />
                  </div>
                );
              })}

              {listaObrasEsquerda.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-xs font-medium">Nenhuma obra encontrada.</div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: PAINEL DE ENGENHARIA PREMIUM */}
          <div className="lg:col-span-2 min-h-[440px]">
            {obraSelecionada ? (
              <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950/70 to-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-right-3 duration-300 shadow-2xl shadow-black/60 flex flex-col h-full">
                
                {/* STATUS BAR SUPERIOR E AÇÕES RÁPIDAS */}
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex gap-2 items-center">
                      <span className="text-[8px] font-black bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><HardHat size={10} /> Execução Física</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1
                        ${obraSelecionada.status === 'em_dia' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {obraSelecionada.status === 'em_dia' ? <CheckCircle2 size={10} /> : <ShieldAlert size={10} />}
                        {obraSelecionada.status === 'em_dia' ? 'Operação em Dia' : 'Atenção / Risco'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight truncate mt-2">{obraSelecionada.nome}</h3>
                    <p className="text-xs text-zinc-400 font-bold flex items-center gap-1">👤 Contratante: <span className="text-zinc-200 font-black uppercase">{obraSelecionada.clienteNome}</span></p>
                  </div>

                  {/* LIXEIRA (EXCLUIR OBRA) */}
                  <button 
                    onClick={() => {
                      if(window.confirm('Tem certeza que deseja excluir esta obra e todos os seus lançamentos?')) {
                        deleteObra && deleteObra(obraSelecionada.id);
                        setObraSelecionada(null);
                      }
                    }}
                    className="bg-zinc-900/50 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 p-2.5 rounded-xl border border-white/5 transition-all ml-4 flex-shrink-0"
                    title="Excluir Canteiro"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* LOCALIZAÇÃO */}
                <div className="flex items-center gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><MapPin size={15} /></div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Endereço da Obra</p>
                    <p className="text-xs font-bold text-zinc-200 truncate">{obraSelecionada.endereco || 'Endereço físico não especificado nas notas de contrato.'}</p>
                  </div>
                </div>

                {/* CARDS FINANCEIROS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 p-4 rounded-xl space-y-1 shadow-inner">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1"><DollarSign size={10} /> Orçamento / Propostas</p>
                    <p className="text-xl font-black text-white">{formatCurrency(obraSelecionada.orcamentoTeto)}</p>
                    <span className="text-[8px] text-zinc-500 font-medium block">Teto máximo estipulado ou valor total de propostas</span>
                  </div>

                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 p-4 rounded-xl space-y-1 shadow-inner">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={10} /> Total Investido / Gasto</p>
                    <p className="text-xl font-black text-emerald-400">{formatCurrency(obraSelecionada.gastoRealAcumulado)}</p>
                    <span className="text-[8px] text-zinc-500 font-medium block">Notas e despesas liquidadas via Nibo</span>
                  </div>
                </div>

                {/* BARRA DE CONSUMO */}
                <div className="space-y-2 bg-zinc-950/40 p-4 rounded-xl border border-white/5 mb-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                    <span className="text-zinc-400">Consumo do Teto de Custos</span>
                    <span className={obraSelecionada.porcentagemUso > 85 ? 'text-amber-400' : 'text-emerald-400'}>
                      {obraSelecionada.porcentagemUso.toFixed(1)}% utilizado
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-900 border border-white/5 rounded-full overflow-hidden p-0.5 flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${obraSelecionada.porcentagemUso > 85 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}
                      style={{ width: `${obraSelecionada.porcentagemUso}%` }}
                    />
                  </div>
                </div>

                {/* ✨ BOTÃO DE GESTÃO COMPLETA (NOVIDADE) */}
                <div className="mt-auto pt-4 border-t border-white/5">
                  <button 
                    onClick={() => navigate(`/obras/${obraSelecionada.id}`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    Abrir Painel Completo <ExternalLink size={16} />
                  </button>
                  <p className="text-center text-[9px] text-zinc-500 mt-2 font-bold uppercase">Acesse para lançar propostas, contas e gerenciar o fluxo de caixa.</p>
                </div>

              </div>
            ) : (
              <div className="border border-dashed border-white/10 rounded-2xl h-full flex flex-col items-center justify-center text-center p-8 bg-white/[0.01]">
                <div className="w-14 h-14 bg-zinc-900 border border-white/5 text-xl flex items-center justify-center rounded-2xl mb-4 shadow-inner animate-pulse">🧱</div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Nenhum canteiro selecionado</h3>
                <p className="text-zinc-600 text-xs font-medium max-w-xs mt-1">Clique em uma das obras ativas listadas na lateral alfabética para carregar as métricas de engenharia e custos.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      <BottomNav active="obras" onNavigate={(s) => { const r: Record<string, string> = { 'dashboard': '/', 'lancamento': '/lancamentos', 'clientes': '/clientes', 'obras': '/obras', 'relatorios': '/financeiro' }; if (r[s]) navigate(r[s]); }} onMenuOpen={() => setMenuOpen(true)} permissions={permissions} />
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} active="obras" onNavigate={(s) => { const r: Record<string, string> = { 'dashboard': '/', 'lancamento': '/lancamentos', 'clientes': '/clientes', 'obras': '/obras', 'relatorios': '/financeiro' }; if (r[s]) navigate(r[s]); }} permissions={permissions} userEmail={user?.email || ''} onLogout={handleLogout} />
    </div>
  );
};

export default Obras;