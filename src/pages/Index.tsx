import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, Users2, X, Wallet, Hammer, Box, Info,
  Search, AlertTriangle, ShoppingCart, FileText, Plus
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { FormularioLancamento } from '@/components/FormularioLancamento';
import { DashboardGeral } from '@/components/DashboardGeral';
import { DashboardOrcamento } from '@/components/DashboardOrcamento';
import { ResumoSemana } from '@/components/ResumoSemana';
import { ImportarPlanilha } from '@/components/ImportarPlanilha';
import { CadastrarObraModal } from '@/components/CadastrarObraModal';
import { CadastrarClienteModal } from '@/components/CadastrarClienteModal';
import { RelatoriosObra } from '@/components/RelatoriosObra';
import { GestaoComissoes } from '@/components/GestaoComissoes';
import { CardDashboardContas, GerenciadorContas } from '@/components/SistemaContasAReceber';
import { ModalCriarProposta } from '@/components/SistemaPropostaPagamento'; // Importação da Proposta
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TIPO_CONTRATO_LABELS, TipoContrato } from '@/lib/types';
import logo from '@/assets/logo.png';
import { UploadContratoObra } from '@/components/UploadContratoObra';
import { ServicosContratoChecklist } from '@/components/ServicosContratoChecklist';
import { MateriaisNotaFiscal } from '@/components/MateriaisNotaFiscal';


const TabsObra = ({ active, onChange }: { active: string, onChange: (id: string) => void }) => (
  <div className="flex bg-white/[0.03] p-1.5 rounded-2xl mb-8 border border-white/5 overflow-x-auto">
    {[
      { id: 'info', label: 'Resumo', icon: Info },
      { id: 'contrato', label: 'Contrato', icon: FileText },
      { id: 'financeiro', label: 'Financeiro', icon: Wallet },
      { id: 'servicos', label: 'Execução', icon: Hammer },
      { id: 'materiais', label: 'Materiais', icon: Box },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
          active === tab.id 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
            : 'text-zinc-500 hover:text-white'
        }`}
      >
        <tab.icon size={16} />
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </div>
);

const Index = () => {
  const { user, permissions, tenantId, tenantNome, signOut } = useAuth();
  
  const {
    lancamentos = [], obras = [], profissionais = [], clientes = [], parceiros = [], comissoes = [], categorias = [], contas = [],
    addLancamento, addMultipleLancamentos, addObra, addCliente, addParceiro, updateParceiro, deleteParceiro,
    updateLancamento, deleteLancamento,
    addComissao, addConta, updateConta, deleteConta, updateComissaoStatus, deleteComissao, updateCategorias, deleteObra
  } = useAppStore(tenantId) || {};

  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('lancamento');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTabObra, setActiveTabObra] = useState('info');
  const [buscaObras, setBuscaObras] = useState('');
  const [mostrarApenasAtraso, setMostrarApenasAtraso] = useState(false);
  const [obraDetalheSelecionada, setObraDetalheSelecionada] = useState<any>(null);
  
  // States do Modal de Proposta
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false);

  const [matNome, setMatNome] = useState('');
  const [matValor, setMatValor] = useState('');
  
  const [contratoObra, setContratoObra] = useState<any>(null);
  const [servicosContrato, setServicosContrato] = useState<any[]>([]);
  const [materiaisContrato, setMateriaisContrato] = useState<any[]>([]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getObraInfo = (obra: any) => {
    if (!obra) return { totalProposta: 0, valorPago: 0, aReceber: 0, temAtraso: false, contasObra: [] };
    const contasObra = (contas || []).filter(c => c.obraId === obra.id);
    const totalProposta = contasObra.reduce((s, c) => s + (c.valor || 0), 0);
    const valorPago = contasObra.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor || 0), 0);
    const aReceber = totalProposta - valorPago;
    const temAtraso = contasObra.some(c => c.status !== 'pago' && new Date(c.dataVencimento) < new Date());
    return { totalProposta, valorPago, aReceber, temAtraso, contasObra };
  };

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
    setMatNome(''); setMatValor('');
    toast({ title: "Material registado!" });
  };

  const obrasOrdenadas = useMemo(() => {
    let res = (obras || []).filter(o => (o.nome || '').toLowerCase().includes((buscaObras || '').toLowerCase()));
    if (mostrarApenasAtraso) res = res.filter(o => getObraInfo(o).temAtraso);
    return res.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [obras, buscaObras, mostrarApenasAtraso, contas]);

  return (
    <div className="min-h-screen bg-background pb-20 text-white">
      <header className="glass-strong border-b border-white/[0.06] sticky top-0 z-40 px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex gap-1 sm:gap-1.5">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-xl" />
          <h1 className="text-sm font-extrabold tracking-tight uppercase">Zentra-X</h1>
        </div>
        <div className="flex gap-1.5">
          <CadastrarClienteModal onAdd={addCliente} />
          <CadastrarObraModal onAdd={addObra} clientes={clientes} onAddCliente={addCliente} />
        </div>
      </header>

      <main className="px-4 pb-8 space-y-6">
        {activeSection === 'dashboard' && (
          <section className="pt-4 space-y-6 animate-in fade-in">
            <DashboardGeral obras={obras || []} lancamentos={lancamentos || []} profissionais={profissionais || []} comissoes={comissoes || []} />
            <CardDashboardContas contas={contas || []} obras={obras || []} />
          </section>
        )}

        {activeSection === 'lancamento' && (
          <section className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in">
            <div className="glass rounded-3xl p-5">
              <FormularioLancamento obras={obras || []} profissionais={profissionais || []} onSubmit={addLancamento} />
            </div>
            <div className="glass rounded-3xl p-5 overflow-hidden">
              <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4">Lançamentos Recentes</h3>
              <RelatoriosObra lancamentos={lancamentos || []} profissionais={profissionais || []} onDelete={deleteLancamento} onUpdate={updateLancamento}/>
            </div>
          </section>
        )}

        {activeSection === 'clientes' && (
  <section className="pt-4 space-y-6 animate-in fade-in">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
        Obras e Projetos
      </h2>
      
      <div className="relative flex-1 max-w-md ml-8">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Procurar registro..." 
          value={buscaObras} 
          onChange={e => setBuscaObras(e.target.value)} 
          className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-purple-500/50 transition-all" 
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {obrasOrdenadas.map(o => {
        const { totalProposta, aReceber, temAtraso } = getObraInfo(o);
        const percGasto = o.orcamentoLimite ? ((o.gastoAtual || 0) / o.orcamentoLimite) * 100 : 0;
        
        const isProjeto = o.tipoContrato === 'projeto';
        
        // Estilo Neon Lilás ou Verde
        const glowClass = isProjeto 
          ? 'shadow-[0_0_25px_rgba(168,85,247,0.15)] border-purple-500/30 bg-purple-500/[0.02]' 
          : 'shadow-[0_0_25px_rgba(16,185,129,0.15)] border-emerald-500/30 bg-emerald-500/[0.02]';

        return (
          <div 
            key={o.id} 
            onClick={() => { setObraDetalheSelecionada(o); setActiveTabObra('info'); }} 
            className={`glass rounded-[32px] p-6 cursor-pointer border transition-all hover:scale-[1.01] ${glowClass} ${temAtraso ? 'border-red-500/50' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg mb-2 inline-block ${
                  isProjeto ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {TIPO_CONTRATO_LABELS[o.tipoContrato]}
                </span>
                <h3 className="text-lg font-black uppercase text-white tracking-tight">
                  {o.nome || 'Sem Nome'}
                </h3>
                <p className="text-xs text-zinc-400 font-bold mt-1">{o.clienteNome}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteObra(o.id); }} className="text-zinc-600 hover:text-red-500"><Trash2 size={18} /></button>
            </div>

            {/* ENDEREÇO - CORRIGIDO: Cores claras para não "apagar" no fundo */}
            <div className="mb-5 flex items-center gap-2">
              <p className={`text-[11px] font-bold truncate ${isProjeto ? 'text-purple-200' : 'text-emerald-200'}`}>
                📍 {o.endereco || 'Endereço não informado'}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Progresso</span>
                <span className={`text-[10px] font-black ${isProjeto ? 'text-purple-400' : 'text-emerald-400'}`}>{Math.round(percGasto)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    percGasto > 100 ? 'bg-red-500' : (isProjeto ? 'bg-purple-500 shadow-[0_0_15px_#a855f7]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]')
                  }`} 
                  style={{ width: `${Math.min(percGasto, 100)}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-white/10 pt-5">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase">Investido</p>
                <p className="text-sm font-black text-white">{formatCurrency(o.gastoAtual || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-zinc-500 uppercase">Contrato</p>
                <p className="text-sm font-black text-white">{formatCurrency(totalProposta)}</p>
              </div>

              <div className={`col-span-2 mt-5 p-4 rounded-2xl flex justify-between items-center border ${
                isProjeto ? 'bg-purple-500/10 border-purple-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <p className={`text-[10px] font-black uppercase ${isProjeto ? 'text-purple-400' : 'text-emerald-400'}`}>Saldo Pendente</p>
                <p className={`text-lg font-black ${isProjeto ? 'text-purple-300' : 'text-emerald-300'}`}>{formatCurrency(aReceber)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
        {activeSection === 'orcamento' && (
          <section className="pt-4 animate-in fade-in">
            <DashboardOrcamento obras={obras || []} lancamentos={lancamentos || []} categorias={categorias || []} updateCategorias={updateCategorias} />
          </section>
        )}

        {activeSection === 'relatorios' && (
          <section className="pt-4 animate-in fade-in">
            <ResumoSemana lancamentos={lancamentos || []} obras={obras || []} profissionais={profissionais || []} />
          </section>
        )}

        {activeSection === 'relatoriosObra' && (
          <section className="pt-4 animate-in fade-in">
            <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl">
              <RelatoriosObra lancamentos={lancamentos || []} profissionais={profissionais || []} onDelete={deleteLancamento} onUpdate={updateLancamento} />
            </div>
          </section>
        )}

        {activeSection === 'importar' && (
           <section className="pt-4 animate-in fade-in">
             <div className="glass rounded-3xl p-5 border border-white/10">
               <ImportarPlanilha onImport={addMultipleLancamentos} />
             </div>
          </section>
        )}

        {activeSection === 'contasReceber' && (
          <section className="pt-4 animate-in fade-in">
            <GerenciadorContas contas={contas || []} obras={obras || []} onAdicionarConta={addConta} onAtualizarConta={updateConta} onDeletarConta={deleteConta} />
          </section>
        )}
        
        {activeSection === 'comissoes' && (
          <section className="pt-4 animate-in fade-in">
            <GestaoComissoes 
              comissoes={comissoes || []} parceiros={parceiros || []} obras={obras || []} contas={contas || []}
              onAddParceiro={addParceiro} onUpdateParceiro={updateParceiro} onDeleteParceiro={deleteParceiro}
              onAddComissao={addComissao} onUpdateStatus={updateComissaoStatus} onDeleteComissao={deleteComissao}
            />
          </section>
        )}
      </main>

      {/* MODAL DETALHES OBRA */}
      {obraDetalheSelecionada && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-white/5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{obraDetalheSelecionada?.nome || 'Sem Nome'}</h2>
                <p className="text-sm text-zinc-500 font-bold flex items-center gap-2"><Users2 size={14} className="text-emerald-500" /> {obraDetalheSelecionada?.clienteNome || 'Cliente não definido'}</p>
              </div>
              <button onClick={() => setObraDetalheSelecionada(null)} className="bg-white/5 p-3 rounded-full text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <TabsObra active={activeTabObra} onChange={setActiveTabObra} />

              {/* TAB: CONTRATO */}
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
                            <p className="text-[10px] text-zinc-500 font-bold mt-1">
                              {contratoObra.dados?.data_inicio_prevista} até {contratoObra.dados?.data_termino_prevista}
                            </p>
                          </div>
                          <button onClick={() => setContratoObra(null)} className="text-zinc-600 hover:text-red-500 transition-all"><X size={20} /></button>
                        </div>
                      </div>
                      <div className="flex gap-2 bg-white/[0.02] p-2 rounded-2xl border border-white/5">
                        <button onClick={() => setActiveTabObra('contrato-servicos')} className="flex-1 py-2 px-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase">Serviços</button>
                        <button onClick={() => setActiveTabObra('contrato-materiais')} className="flex-1 py-2 px-3 text-zinc-500 rounded-xl text-[9px] font-black uppercase hover:text-white">Materiais</button>
                      </div>
                      {activeTabObra === 'contrato-servicos' && <ServicosContratoChecklist servicos={servicosContrato} valorTotal={contratoObra.dados?.valor_total || 0} />}
                      {activeTabObra === 'contrato-materiais' && <MateriaisNotaFiscal materiais={materiaisContrato} notaFiscalUrl={contratoObra.url_arquivo} />}
                    </>
                  )}
                </div>
              )}

              {/* TAB: INFO */}
              {activeTabObra === 'info' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Orçamento Previsto</p><p className="text-xl font-black text-white">{formatCurrency(obraDetalheSelecionada.orcamentoLimite || 0)}</p></div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Total Gasto</p><p className="text-xl font-black text-orange-500">{formatCurrency(obraDetalheSelecionada.gastoAtual || 0)}</p></div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Saldo em Caixa</p><p className="text-xl font-black text-emerald-500">{formatCurrency((obraDetalheSelecionada.orcamentoLimite || 0) - (obraDetalheSelecionada.gastoAtual || 0))}</p></div>
                </div>
              )}

              {/* TAB: FINANCEIRO (INTEGRADO COM PROPOSTA) */}
              {activeTabObra === 'financeiro' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase text-zinc-400">Fluxo de Pagamentos</h3>
                    <Button 
                      onClick={() => setModalPropostaAberto(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase px-4"
                    >
                      <Plus size={14} className="mr-2" /> Gerar Proposta / Parcelas
                    </Button>
                  </div>
                  {(() => {
                    const info = getObraInfo(obraDetalheSelecionada);
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-emerald-500/10 p-5 rounded-2xl"><p className="text-[9px] font-black text-emerald-600 uppercase">Recebido</p><p className="text-lg font-black text-white">{formatCurrency(info.valorPago)}</p></div>
                          <div className="bg-blue-500/10 p-5 rounded-2xl"><p className="text-[9px] font-black text-blue-600 uppercase">Falta</p><p className="text-lg font-black text-white">{formatCurrency(info.aReceber)}</p></div>
                          <div className="bg-white/5 p-5 rounded-2xl"><p className="text-[9px] font-black text-zinc-500 uppercase">Total</p><p className="text-lg font-black text-white">{formatCurrency(info.totalProposta)}</p></div>
                        </div>
                        <div className="space-y-3">
                          {info.contasObra.length === 0 ? (
                            <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-zinc-500 font-bold uppercase">Sem movimentos financeiros</div>
                          ) : (
                            info.contasObra.map(p => (
                              <div key={p.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div><p className={`text-sm font-bold ${p.status === 'pago' ? 'text-zinc-500 line-through' : 'text-white'}`}>{p.descricao}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</p></div>
                                <p className={`text-sm font-black ${p.status === 'pago' ? 'text-zinc-600' : 'text-emerald-500'}`}>{formatCurrency(p.valor)}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB: MATERIAIS */}
              {activeTabObra === 'materiais' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[32px] space-y-4">
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><ShoppingCart size={16} /> Lançar Compra / Nota</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <input type="text" value={matNome} onChange={e => setMatNome(e.target.value)} placeholder="O que comprou?" className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" />
                      <input type="number" value={matValor} onChange={e => setMatValor(e.target.value)} placeholder="Valor R$" className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white" />
                      <Button onClick={handleAddMaterial} disabled={!matNome || !matValor} className="bg-emerald-600 font-black uppercase text-[10px] h-full rounded-xl">Lançar</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(lancamentos || []).filter(l => l.obraId === obraDetalheSelecionada.id && l.tipo === 'material').map(m => (
                      <div key={m.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center"><div className="flex items-center gap-4"><Box className="text-emerald-500" size={18} /><div><p className="text-sm font-bold text-white uppercase">{m.descricaoEtapa}</p><p className="text-[10px] text-zinc-600 font-black">{new Date(m.data).toLocaleDateString('pt-BR')}</p></div></div><p className="text-sm font-black text-white">{formatCurrency(m.valor)}</p></div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SERVIÇOS/EXECUÇÃO */}
              {activeTabObra === 'servicos' && (
                <div className="space-y-6 animate-in fade-in">
                  {contratoObra ? (
                    <ServicosContratoChecklist servicos={servicosContrato} valorTotal={contratoObra.dados?.valor_total || 0} />
                  ) : (
                    <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-zinc-500 font-bold uppercase">Importe um contrato para ver os serviços</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/5 bg-zinc-950/50 flex gap-3">
               <button className="flex-1 py-4 bg-white/5 text-zinc-400 rounded-2xl text-[10px] font-black uppercase">Exportar PDF</button>
               <button onClick={() => setObraDetalheSelecionada(null)} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase">Fechar Central</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PROPOSTA INTELIGENTE */}
      {modalPropostaAberto && obraDetalheSelecionada && (
        <ModalCriarProposta 
          obra={obraDetalheSelecionada} 
          onClose={() => setModalPropostaAberto(false)}
          onSave={(proposta) => {
            // Lançar Entrada
            addConta({
              obraId: obraDetalheSelecionada.id,
              descricao: "Entrada Contrato",
              valor: proposta.entrada.valor,
              dataVencimento: new Date(),
              status: 'aberto',
              tipo: 'Entrada'
            });

            // Lançar Parcelas
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
            toast({ title: "Proposta salva!", description: "Entrada e parcelas geradas." });
          }}
        />
      )}
  <div className="print:hidden">
      <BottomNav active={activeSection} onNavigate={setActiveSection} onMenuOpen={() => setMenuOpen(true)} permissions={permissions} />
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} active={activeSection} onNavigate={setActiveSection} permissions={permissions} userEmail={user?.email || ''} onLogout={async () => { await signOut(); navigate('/login'); }} />
    </div>
    </div>
  );
};

export default Index;