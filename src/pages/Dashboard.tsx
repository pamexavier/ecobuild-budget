import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { useState, useMemo } from 'react';
import { Menu } from 'lucide-react';
import logo from '@/assets/logo.png';

// Importando os componentes do Recharts para os gráficos
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

// Importando o modal de detalhes
import { GraficoDetalheObra } from '@/components/GraficoDetalheObra';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, permissions, tenantId, signOut } = useAuth();
  
  const {
    obras = [],
    contas = [],
    contasAPagar = [],
    comissoes = [],
    lancamentos = []
  } = useAppStore(tenantId) || {};

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<any | null>(null);

  // --- SEPARAÇÃO INTERNA DE RAIO-X DAS CONTAS ---
  const movimentacoesEntrada = useMemo(() => 
    contas.filter(c => c.tipo === 'Entrada' || c.tipo === 'Parcela')
  , [contas]);

  const movimentacoesSaida = useMemo(() => 
    contas.filter(c => c.tipo === 'Despesa')
  , [contas]);

  // --- CÁLCULOS DOS STATS ACUMULADOS ---
  const obrasAtivas = useMemo(() => 
    obras.filter(o => o.tipoContrato !== 'projeto' && o.status !== 'inativa').length
  , [obras]);

  const projetosAtivos = useMemo(() => 
    obras.filter(o => o.tipoContrato === 'projeto' && !['inativa', 'transformado_obra'].includes(o.status || '')).length
  , [obras]);
  
  // Mapeamento de Saúde das Obras (Verde, Amarelo, Vermelho)
  const totalEmDia = useMemo(() => obras.filter(o => o.tipoContrato !== 'projeto' && o.status === 'em_dia').length, [obras]);
  const totalEmRisco = useMemo(() => obras.filter(o => o.tipoContrato !== 'projeto' && o.status === 'em_risco').length, [obras]);
  const totalAtrasadas = useMemo(() => obras.filter(o => o.tipoContrato !== 'projeto' && o.status === 'atrasado').length, [obras]);

  // 1. Contas a Receber
  const totalContasReceber = useMemo(() => 
    movimentacoesEntrada
      .filter(c => c.status === 'aberto')
      .reduce((s, c) => s + (c.valor || 0), 0)
  , [movimentacoesEntrada]);

  // 2. Contas a Pagar
  const totalContasPagar = useMemo(() => 
    movimentacoesSaida
      .filter(c => c.status === 'aberto')
      .reduce((s, c) => s + (c.valor || 0), 0)
  , [movimentacoesSaida]);

  // Contas Recebidas (Dinheiro no caixa)
  const totalContasRecebidas = useMemo(() => 
    movimentacoesEntrada
      .filter(c => c.status === 'pago')
      .reduce((s, c) => s + (c.valor || 0), 0)
  , [movimentacoesEntrada]);

  // 3. REGRA DE OURO DAS COMISSÕES
  const isComissaoAReceber = (c: any) => ['fornecedor', 'rt', 'reserva_tecnica'].includes((c.tipo || '').toLowerCase());
  const fornecedorPendentePorObra = useMemo(() => {
    return new Set(
      comissoes
        .filter(c => isComissaoAReceber(c) && c.status !== 'pago' && (c.obraId || c.obra_id))
        .map(c => c.obraId || c.obra_id)
    );
  }, [comissoes]);

  const totalComissoesPagar = useMemo(() => {
    return comissoes
      .filter(c => {
        if (isComissaoAReceber(c)) return false;
        if (c.status !== 'pendente') return false;
        const obraId = c.obraId || c.obra_id;
        if (obraId && fornecedorPendentePorObra.has(obraId)) return false;

        const contaMae = contas.find(conta => conta.id === c.contaId || conta.id === c.lancamentoId);
        if (!contaMae || contaMae.status !== 'pago') return false;

        return true;
      })
      .reduce((s, c) => s + (c.valorComissao || 0), 0);
  }, [comissoes, contas, fornecedorPendentePorObra]);

  const totalComissoesReceber = useMemo(() => {
    return comissoes
      .filter(c => isComissaoAReceber(c) && c.status !== 'pago')
      .reduce((s, c) => s + (c.valorComissao || 0), 0);
  }, [comissoes]);

  // Gasto do mês
  const gastoEsteMes = useMemo(() => 
    lancamentos
      .filter(l => {
        const data = new Date(l.data);
        const agora = new Date();
        return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
      })
      .reduce((s, l) => s + (l.valor || 0), 0)
  , [lancamentos]);

  // Cálculo da Barra
  const porcentagemBarraGasto = useMemo(() => {
    const tetoGlobal = obras.reduce((sum, o) => sum + (o.orcamentoLimite || o.orcamento || 0), 0);
    if (gastoEsteMes === 0 || tetoGlobal === 0) return 0;
    return Math.min((gastoEsteMes / tetoGlobal) * 100, 100);
  }, [gastoEsteMes, obras]);

  // Dados Recharts
  const dadosGastoPorObra = useMemo(() => {
    return obras
      .map((obra) => {
        const gastoTotal = lancamentos
          .filter(l => l.obraId === obra.id || l.obra_id === obra.id)
          .reduce((sum, l) => sum + (l.valor || 0), 0);

        return {
          id: obra.id,
          nome: obra.nome,
          gasto: gastoTotal,
          obraRaw: obra
        };
      })
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 5);
  }, [obras, lancamentos]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  // Componente interno ultra-compactado horizontalmente
  const SplitCard = ({ title1, val1, color1, icon1, route1, title2, val2, color2, icon2, route2, state2 }: any) => {
    const bgColors: Record<string, string> = {
      emerald: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
      purple: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
      blue: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
      orange: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40',
    };

    const textColors: Record<string, string> = {
      emerald: 'text-emerald-400',
      purple: 'text-purple-400',
      blue: 'text-blue-400',
      orange: 'text-orange-400',
    };

    return (
      <div className="flex flex-col gap-2.5">
        {/* Bloco Superior */}
        <div 
          onClick={() => navigate(route1)}
          className={`border rounded-xl p-3 transition-all cursor-pointer flex justify-between items-center ${bgColors[color1]} hover:scale-[1.01]`}
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-0.5">{title1}</p>
            <p className="text-xl font-black text-white">{val1}</p>
          </div>
          <div className={`text-xl opacity-70 ${textColors[color1]}`}>{icon1}</div>
        </div>

        {/* Bloco Inferior */}
        <div 
          onClick={() => navigate(route2, state2 ? { state: state2 } : undefined)}
          className={`border rounded-xl p-3 transition-all cursor-pointer flex justify-between items-center ${bgColors[color2]} hover:scale-[1.01]`}
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-0.5">{title2}</p>
            <p className="text-xl font-black text-white">{val2}</p>
          </div>
          <div className={`text-xl opacity-80 ${textColors[color2]}`}>{icon2}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-4 print:hidden backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl ring-1 ring-emerald-500/30" />
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                Zentra-X
              </h1>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 space-y-6">
        {/* BEM-VINDO */}
        <section className="space-y-0.5">
          <h2 className="text-2xl font-black tracking-tighter">Bem-vindo de volta</h2>
          <p className="text-zinc-500 text-xs font-medium">Acompanhe seu desempenho em tempo real</p>
        </section>

        {/* 🎛️ COORDENAÇÃO DE CARDS COMPACTOS EM COMPRIMENTO */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Coluna 1: Projetos Ativos (Cima) + Obras Ativas (Baixo) */}
          <SplitCard 
            title1="Projetos Ativos" val1={projetosAtivos} color1="purple" icon1="✨" route1="/projetos"
            title2="Obras Ativas" val2={obrasAtivas} color2="emerald" icon2="🏗️" route2="/obras"
          />

          {/* Coluna 2: Contas a Receber (Cima) + Contas a Pagar (Baixo) */}
          <SplitCard 
            title1="Contas a Receber" val1={formatCurrency(totalContasReceber)} color1="blue" icon1="💵" route1="/financeiro" state1={{ tab: 'receber' }}
            title2="Contas a Pagar" val2={formatCurrency(totalContasPagar)} color2="orange" icon2="💰" route2="/financeiro" state2={{ tab: 'pagar' }}
          />

          {/* Coluna 3: Comissões a Receber (Cima) + Comissões a Pagar (Baixo) */}
          <SplitCard 
            title1="Comissões a Receber (Lojas/RT)" val1={formatCurrency(totalComissoesReceber)} color1="emerald" icon1="📥" route1="/financeiro" state1={{ tab: 'comissoes' }}
            title2="Comissões a Pagar (Equipe)" val2={formatCurrency(totalComissoesPagar)} color2="purple" icon2="📤" route2="/financeiro" state2={{ tab: 'comissoes' }}
          />

          {/* Coluna 4: CARD GANHA DESTAQUE - SAÚDE DA OBRA EM EVIDÊNCIA */}
          <div className="border border-emerald-500/20 bg-emerald-950/10 rounded-xl p-3 flex gap-3 items-center justify-between">
            {/* Lado Esquerdo: O Gráfico Maior e Destacado */}
            <div className="flex flex-col items-center justify-center bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 flex-1 max-w-[140px]">
              <span className="text-[9px] font-black tracking-wider text-emerald-400 uppercase mb-2">Saúde das Obras</span>
              <div className="relative w-16 h-16 transition-transform hover:scale-105 duration-300">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eab308" strokeWidth="5" strokeDasharray={`${((totalEmDia + totalEmRisco) / (obrasAtivas || 1)) * 100} ${100 - (((totalEmDia + totalEmRisco) / (obrasAtivas || 1)) * 100)}`} />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="5" strokeDasharray={`${(totalEmDia / (obrasAtivas || 1)) * 100} ${100 - ((totalEmDia / (obrasAtivas || 1)) * 100)}`} />
                </svg>
              </div>
              <div className="text-[9px] font-extrabold mt-2 flex gap-2 justify-center border-t border-white/5 pt-1.5 w-full">
                <span className="text-emerald-400">● {totalEmDia}</span>
                <span className="text-yellow-400">● {totalEmRisco}</span>
                <span className="text-red-400">● {totalAtrasadas}</span>
              </div>
            </div>

            {/* Lado Direito: Caixa de Contas Recebidas Compactada */}
            <div 
              onClick={() => navigate('/financeiro', { state: { tab: 'receber' } })}
              className="flex-1 text-right h-full flex flex-col justify-center py-1 cursor-pointer"
            >
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">Contas Recebidas</p>
              <p className="text-lg font-black text-white leading-tight">{formatCurrency(totalContasRecebidas)}</p>
              <span className="text-[8px] text-zinc-500 font-medium mt-1 block">No Caixa ✅</span>
            </div>
          </div>

        </div>

        {/* GASTO ESTE MÊS */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-black text-zinc-400 mb-2">GASTO ESTE MÊS</p>
          <p className="text-2xl font-black text-emerald-300 mb-3">{formatCurrency(gastoEsteMes)}</p>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out" 
              style={{ width: `${porcentagemBarraGasto}%` }} 
            />
          </div>
        </div>

        {/* GRÁFICOS INTERATIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <p className="text-xs font-black text-zinc-400 mb-4">Gasto por Obra</p>
            <div className="relative h-[250px] w-full">
              {dadosGastoPorObra.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGastoPorObra} layout="vertical" margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                    <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
                    <YAxis dataKey="nome" type="category" stroke="#a1a1aa" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} width={110} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 13)}...` : value} />
                    <ChartTooltip formatter={(value: number) => [formatCurrency(value), 'Gasto Acumulado']} contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="gasto" fill="#10b981" radius={[0, 8, 8, 0]} onClick={(data) => setSelectedObra(data.obraRaw)} className="cursor-pointer hover:opacity-80 transition-opacity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-medium text-zinc-500">Nenhum dado lançado para exibir.</div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-black text-zinc-400 mb-4">Orçamento por Obra</p>
            <div className="space-y-3">
              {obras.slice(0, 5).map((obra) => {
                const orcamento = obra.orcamentoLimite || obra.orcamento || 0;
                return (
                  <div key={obra.id} onClick={() => setSelectedObra(obra)} className="flex justify-between items-center text-xs cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                    <span className="text-white truncate font-semibold">{obra.nome}</span>
                    <span className="text-emerald-300 font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(orcamento)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* RENDERIZAÇÃO DO MODAL DE DETALHES DAS OBRAS */}
      {selectedObra && <GraficoDetalheObra obra={selectedObra} lancamentos={lancamentos} onClose={() => setSelectedObra(null)} />}

      {/* MENUS NAV */}
      <BottomNav active="dashboard" onNavigate={(section) => {
        const routes: Record<string, string> = { 'dashboard': '/', 'lancamento': '/lancamentos', 'obras': '/obras', 'relatorios': '/financeiro' };
        if (routes[section]) navigate(routes[section]);
      }} onMenuOpen={() => setMenuOpen(true)} permissions={permissions} />

      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} active="dashboard" onNavigate={(section) => {
        const routes: Record<string, string> = { 'dashboard': '/', 'lancamento': '/lancamentos', 'obras': '/obras', 'relatorios': '/financeiro' };
        if (routes[section]) navigate(routes[section]);
      }} permissions={permissions} userEmail={user?.email || ''} onLogout={async () => { await signOut(); navigate('/login'); }} />
    </div>
  );
};

export default Dashboard;