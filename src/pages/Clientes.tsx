import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, User, Briefcase, Star, Menu, Mail, Phone, MapPin, Building2, ArrowRight, Tags, Plus, CheckSquare, Square, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const Clientes = () => {
  const { user, permissions, tenantId, signOut } = useAuth();
  const { clientes = [], obras = [], contas = [], comissoes = [], addCliente, updateCliente, deleteCliente } = useAppStore(tenantId) || {};
  
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [buscaContatos, setBuscaContatos] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<any>(null);
  const [tagAtiva, setTagAtiva] = useState<'todos' | 'cliente' | 'fornecedor_rt'>('cliente');

  // ESTADOS PARA O MODAL DE CADASTRO / EDIÇÃO
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  const [isEdicao, setIsEdicao] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoContato, setNovoContato] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [isClienteTag, setIsClienteTag] = useState(true);
  const [isFornecedorTag, setIsFornecedorTag] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);

  // ESTADOS PARA O MODAL DE EXCLUSÃO
  const [modalExcluirOpen, setModalExcluirOpen] = useState(false);
  const [contatoParaExcluir, setContatoParaExcluir] = useState<any>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleAbrirEdicao = (contato: any) => {
    setIsEdicao(true);
    setIdEmEdicao(contato.id);
    setNovoNome(contato.nome || '');
    setNovoContato(contato.contato || '');
    setNovoEmail(contato.email || '');
    setIsClienteTag(contato.tags.includes('cliente'));
    setIsFornecedorTag(contato.tags.includes('fornecedor_rt') || contato.tags.includes('fornecedores') || contato.tags.includes('fornecedor'));
    setModalCadastroOpen(true);
  };

  const handleAbrirCadastro = () => {
    setIsEdicao(false);
    setIdEmEdicao(null);
    setNovoNome('');
    setNovoContato('');
    setNovoEmail('');
    setIsClienteTag(true);
    setIsFornecedorTag(false);
    setModalCadastroOpen(true);
  };

  const handleSaveContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    setIsSalvando(true);
    
    const tagsSelecionadas: string[] = [];
    if (isClienteTag) tagsSelecionadas.push('cliente');
    if (isFornecedorTag) tagsSelecionadas.push('fornecedor_rt');
    if (tagsSelecionadas.length === 0) tagsSelecionadas.push('cliente');

    const dadosContato = {
      tenant_id: tenantId,
      nome: novoNome.toUpperCase().trim(),
      contato: novoContato.trim(),
      email: novoEmail.trim(),
      tags: tagsSelecionadas
    };

    try {
      if (isEdicao && idEmEdicao && updateCliente) {
        await updateCliente(idEmEdicao, dadosContato);
        setContatoSelecionado({ id: idEmEdicao, ...dadosContato });
      } else if (addCliente) {
        await addCliente(dadosContato);
      }
      setModalCadastroOpen(false);
    } catch (error) {
      console.error('Erro ao processar contato:', error);
    } finally {
      setIsSalvando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!contatoParaExcluir || !deleteCliente) return;
    try {
      await deleteCliente(contatoParaExcluir.id);
      if (contatoSelecionado?.id === contatoParaExcluir.id) {
        setContatoSelecionado(null);
      }
      setModalExcluirOpen(false);
      setContatoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
    }
  };

  // Processamento de métricas por contato
  const contatosComStats = useMemo(() => {
    return (clientes || []).map(c => {
      const obrasComoCliente = (obras || []).filter(o => o.clienteId === c.id || o.cliente_id === c.id);
      const contasDoCliente = (contas || []).filter(cont => 
        obrasComoCliente.some(o => o.id === cont.obraId || o.id === cont.obra_id)
      );
      const totalProposta = contasDoCliente.reduce((sum, cont) => sum + (cont.valor || 0), 0);
      const totalRecebido = contasDoCliente.filter(cont => cont.status === 'pago').reduce((sum, cont) => sum + (cont.valor || 0), 0);
      const totalPendente = totalProposta - totalRecebido;
      const lucroObra = totalProposta - (obrasComoCliente.reduce((sum, o) => sum + (o.gastoAtual || o.gasto_atual || 0), 0));

      const rtsDoFornecedor = (comissoes || []).filter(com => com.fornecedorId === c.id || (com.fornecedor || '').toLowerCase() === (c.nome || '').toLowerCase());
      const totalRtRecebido = rtsDoFornecedor.filter(com => com.status === 'pago').reduce((sum, com) => sum + (com.valorComissao || 0), 0);
      const totalRtPendente = rtsDoFornecedor.filter(com => com.status === 'pendente').reduce((sum, com) => sum + (com.valorComissao || 0), 0);

      // Garante normalização das tags vindas do banco
      const tagsTratadas = c.tags || ['cliente'];

      return {
        ...c,
        tags: tagsTratadas,
        totalObras: obrasComoCliente.length,
        totalRecebido,
        totalPendente,
        lucroPotencial: lucroObra,
        obrasRaw: obrasComoCliente,
        totalRtRecebido,
        totalRtPendente,
      };
    });
  }, [clientes, obras, contas, comissoes]);

  // 🔍 FILTRAGEM COM COBERTURA FLEXÍVEL DE TAGS DA BARRA LATERAL (CORRIGIDO)
  const listaContatosFiltrados = useMemo(() => {
    let resultado = [...contatosComStats];

    if (tagAtiva !== 'todos') {
      resultado = resultado.filter(c => {
        if (tagAtiva === 'fornecedor_rt') {
          // Aceita qualquer uma das variações de escrita de tags para não zerar a lista
          return c.tags.includes('fornecedor_rt') || c.tags.includes('fornecedores') || c.tags.includes('fornecedor');
        }
        return c.tags.includes(tagAtiva);
      });
    }

    if (buscaContatos.trim()) {
      resultado = resultado.filter(c => (c.nome || '').toLowerCase().includes(buscaContatos.toLowerCase()));
    }

    resultado.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    // Limita a exibição horizontal na barra lateral esquerda para manter o visual premium
    return resultado.slice(0, 15);
  }, [contatosComStats, buscaContatos, tagAtiva]);

  // KPIs DO TOPO FLEXIBILIZADOS (CORRIGIDO)
  const totalClientes = useMemo(() => contatosComStats.filter(c => c.tags.includes('cliente')).length, [contatosComStats]);
  
  const totalFornecedores = useMemo(() => 
    contatosComStats.filter(c => 
      c.tags.includes('fornecedor_rt') || c.tags.includes('fornecedores') || c.tags.includes('fornecedor')
    ).length
  , [contatosComStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-4 print:hidden backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl ring-1 ring-emerald-500/30" />
            <h1 className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Zentra-X
            </h1>
          </div>
          <button onClick={() => setMenuOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu size={24} />
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 space-y-6">
        {/* TITULO + BOTÃO DE NOVO CADASTRO */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tighter">Central de Contatos</h2>
            <p className="text-zinc-500 text-xs font-medium">Base unificada de clientes e lojas parceiras</p>
          </div>
          
          <Button 
            onClick={handleAbrirCadastro}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase px-3 py-1.5 h-auto rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
          >
            <Plus size={14} strokeWidth={3} /> Adicionar
          </Button>
        </div>

        {/* 📊 MINI STATS COMPACTOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-2.5 flex justify-between items-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Carteira de Clientes: <span className="text-emerald-400 font-black ml-1">{totalClientes}</span></span>
            <User size={14} className="text-emerald-400" />
          </div>
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-2.5 flex justify-between items-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Lojas Parceiras (RT): <span className="text-purple-400 font-black ml-1">{totalFornecedores}</span></span>
            <Briefcase size={14} className="text-purple-400" />
          </div>
        </div>

        {/* LAYOUT GERAL DUAS COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUNA ESQUERDA */}
          <div className="space-y-3.5">
            <div className="relative group">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={buscaContatos}
                onChange={e => setBuscaContatos(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 group-focus-within:border-emerald-500/20 group-focus-within:bg-white/[0.07] rounded-xl text-xs outline-none transition-all"
              />
            </div>

            {/* SELETORES DE ABAS DE FILTRAGEM */}
            <div className="flex gap-1.5 bg-zinc-900/60 border border-white/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setTagAtiva('cliente'); setContatoSelecionado(null); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                  ${tagAtiva === 'cliente' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Clientes ({totalClientes})
              </button>
              <button
                type="button"
                onClick={() => { setTagAtiva('fornecedor_rt'); setContatoSelecionado(null); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                  ${tagAtiva === 'fornecedor_rt' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Fornecedores ({totalFornecedores})
              </button>
              <button
                type="button"
                onClick={() => { setTagAtiva('todos'); setContatoSelecionado(null); }}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                  ${tagAtiva === 'todos' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                Todos
              </button>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden p-1.5 space-y-1">
              {listaContatosFiltrados.map((contato) => {
                const isSelected = contatoSelecionado?.id === contato.id;
                return (
                  <div
                    key={contato.id}
                    onClick={() => setContatoSelecionado(contato)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all cursor-pointer flex justify-between items-center group
                      ${isSelected 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-300' 
                        : 'hover:bg-white/5 border border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 pr-2">
                      <span className="truncate">{contato.nome}</span>
                      {contato.tags.length > 1 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                    </div>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all text-emerald-400" />
                  </div>
                );
              })}

              {listaContatosFiltrados.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-xs font-medium">Nenhum contato catalogado.</div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="lg:col-span-2 min-h-[420px]">
            {contatoSelecionado ? (
              <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/40 border border-white/10 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-right-3 duration-300 shadow-xl shadow-black/40">
                
                {/* Header Ficha */}
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex gap-1">
                      {contatoSelecionado.tags.map((t: string) => (
                        <span key={t} className={`text-[8px] font-black border px-1.5 py-0.5 rounded uppercase tracking-wider
                          ${t === 'cliente' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {t === 'cliente' ? '👤 Cliente' : '🏬 Fornecedor RT'}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate mt-1.5">{contatoSelecionado.nome}</h3>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 ml-4 flex-shrink-0">
                    <button 
                      type="button"
                      onClick={() => handleAbrirEdicao(contatoSelecionado)}
                      className="bg-zinc-900 border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 p-2 rounded-xl transition-all shadow-inner"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setContatoParaExcluir(contatoSelecionado); setModalExcluirOpen(true); }}
                      className="bg-zinc-900 border border-white/5 hover:border-red-500/40 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 p-2 rounded-xl transition-all shadow-inner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Dados de Cadastro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex items-center gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Phone size={13} /></div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Telefone / Canal</p>
                      <p className="text-xs font-bold text-zinc-200 truncate">{contatoSelecionado.contato || 'Não Cadastrado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Mail size={13} /></div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">E-mail</p>
                      <p className="text-xs font-bold text-zinc-200 truncate">{contatoSelecionado.email || 'Não Mapeado'}</p>
                    </div>
                  </div>
                </div>

                {/* Sub-painel: Se for Cliente */}
                {contatoSelecionado.tags.includes('cliente') && (
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 uppercase tracking-wider"><Building2 size={12} /> Contratos de Obra ({contatoSelecionado.totalObras})</span>
                    {contatoSelecionado.obrasRaw && contatoSelecionado.obrasRaw.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {contatoSelecionado.obrasRaw.map((obra: any) => (
                          <div key={obra.id} onClick={() => navigate(`/obras?id=${obra.id}`)} className="border border-white/5 bg-zinc-950/30 p-2.5 rounded-xl cursor-pointer hover:border-emerald-500/20 transition-all flex justify-between items-center group">
                            <span className="text-xs font-bold text-zinc-300 truncate pr-2 group-hover:text-emerald-400 uppercase">{obra.nome}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-xs italic pl-1">Nenhum contrato ativo associado.</p>
                    )}
                  </div>
                )}

                {/* Sub-painel: Se for Fornecedor */}
                {(contatoSelecionado.tags.includes('fornecedor_rt') || contatoSelecionado.tags.includes('fornecedores') || contatoSelecionado.tags.includes('fornecedor')) && (
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <span className="text-[10px] font-black text-purple-400 flex items-center gap-1 uppercase tracking-wider"><Briefcase size={12} /> Desempenho de Parceria de Comissões (RT)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">RTs Recebidas</p>
                        <p className="text-base font-black text-emerald-400 mt-1">{formatCurrency(contatoSelecionado.totalRtRecebido || 0)}</p>
                      </div>
                      <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Cobranças Pendentes</p>
                        <p className="text-base font-black text-purple-300 mt-1">{formatCurrency(contatoSelecionado.totalRtPendente || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="border border-dashed border-white/10 rounded-2xl h-full flex flex-col items-center justify-center text-center p-8 bg-white/[0.01]">
                <div className="w-14 h-14 bg-zinc-900 border border-white/5 text-xl flex items-center justify-center rounded-2xl mb-4 shadow-inner animate-pulse">👥</div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Nenhum contato selecionado</h3>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL FORM DE CADASTRO / EDIÇÃO */}
      {modalCadastroOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#0b0b14] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-emerald-400">
                  {isEdicao ? 'Atualizar Contato' : 'Novo Registro Corporativo'}
                </h2>
                <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">Mantenha a base unificada atualizada</p>
              </div>
              <button onClick={() => setModalCadastroOpen(false)} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-full text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveContato} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Nome / Razão Social *</label>
                <input 
                  type="text" required placeholder="EX: ARQUITETURA COELHO LIMA" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/40 font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400">Telefone / Canal</label>
                  <input 
                    type="text" placeholder="(51) 99999-9999" value={novoContato} onChange={e => setNovoContato(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400">E-mail</label>
                  <input 
                    type="email" placeholder="financeiro@empresa.com" value={novoEmail} onChange={e => setNovoEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/40 lowercase"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-white/5 py-3 my-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Defina o Papel Comercial:</label>
                <div className="flex gap-4">
                  <div onClick={() => setIsClienteTag(!isClienteTag)} className="flex items-center gap-2 cursor-pointer select-none font-bold text-zinc-200 hover:text-white">
                    {isClienteTag ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} className="text-zinc-600" />}
                    <span>👤 Cliente Final</span>
                  </div>
                  <div onClick={() => setIsFornecedorTag(!isFornecedorTag)} className="flex items-center gap-2 cursor-pointer select-none font-bold text-zinc-200 hover:text-white">
                    {isFornecedorTag ? <CheckSquare size={16} className="text-purple-400" /> : <Square size={16} className="text-zinc-600" />}
                    <span>🏬 Fornecedor de RT</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalCadastroOpen(false)} className="text-xs text-zinc-400 hover:text-white">Cancelar</Button>
                <Button type="submit" disabled={isSalvando} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase px-4 py-2 h-auto rounded-xl">
                  {isSalvando ? 'Processando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SEGURANÇA DE DELEÇÃO */}
      {modalExcluirOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0e0e16] border border-red-500/20 rounded-2xl max-w-sm w-full p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase text-white tracking-tight">Confirmar Deleção?</h3>
              <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                Você tem certeza que deseja remover <span className="text-red-400 font-bold uppercase">{(contatoParaExcluir?.nome || '').substring(0, 25)}</span>? Esta ação é irreversível.
              </p>
            </div>
            <div className="flex gap-2 pt-2 text-xs font-black uppercase">
              <button type="button" onClick={() => { setModalExcluirOpen(false); setContatoParaExcluir(null); }} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 py-2.5 rounded-xl">Voltar</button>
              <button type="button" onClick={handleConfirmarExclusao} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl">Excluir Definitivo</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVS */}
      <BottomNav active="clientes" onNavigate={(s) => { const r: Record<string, string> = { 'dashboard': '/', 'lancamento': '/lancamentos', 'clientes': '/clientes', 'obras': '/obras', 'relatorios': '/financeiro' }; if (r[s]) navigate(r[s]); }} onMenuOpen={() => setMenuOpen(true)} permissions={permissions} />
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} active="clientes" onNavigate={(s) => { const r: Record<string, string> = { 'dashboard': '/', 'lancamento': '/lancamentos', 'clientes': '/clientes', 'obras': '/obras', 'relatorios': '/financeiro' }; if (r[s]) navigate(r[s]); }} permissions={permissions} userEmail={user?.email || ''} onLogout={handleLogout} />
    </div>
  );
};

export default Clientes;