import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Users2, MapPin, Plus, Edit2, X, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/store';

const ObraDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const { toast } = useToast();
  
  const {
    obras = [], clientes = [], lancamentos = [], contas = [],
    deleteObra, updateObra
  } = useAppStore(tenantId) || {};

  const [activeTab, setActiveTab] = useState('info');
  const [obra, setObra] = useState<any>(null);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [loadingMateriais, setLoadingMateriais] = useState(false);
  
  const [modalEditando, setModalEditando] = useState(false);
  const [enderecoDadoModal, setEnderecoDadoModal] = useState('');
  const [statusDadoModal, setStatusDadoModal] = useState('ativa');
  
  const [materialModal, setMaterialModal] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<any>(null);
  const [formMaterial, setFormMaterial] = useState({
    descricao: '',
    valor: '',
    tipo: 'compra',
    fornecedor: '',
    dataEmissao: ''
  });

  useEffect(() => {
    const found = obras.find(o => o.id === id);
    setObra(found);
  }, [id, obras]);

  useEffect(() => {
    if (!id) return;
    carregarMateriais();
  }, [id]);

  const carregarMateriais = async () => {
    setLoadingMateriais(true);
    try {
      const { data, error } = await supabase
        .from('materiais_notas')
        .select('*')
        .eq('obra_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMateriais(data || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({ title: 'Erro ao carregar materiais' });
    } finally {
      setLoadingMateriais(false);
    }
  };

  const handleSalvarEnderecoStatus = async () => {
    if (!obra) return;

    try {
      await updateObra(obra.id, {
        ...obra,
        endereco: enderecoDadoModal,
        status: statusDadoModal
      });

      setObra(prev => ({
        ...prev,
        endereco: enderecoDadoModal,
        status: statusDadoModal
      }));

      setModalEditando(false);
      toast({ title: '✅ Endereço e status atualizados!' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar', description: String(error) });
    }
  };

  const handleAdicionarMaterial = () => {
    setMaterialEditando(null);
    setFormMaterial({
      descricao: '',
      valor: '',
      tipo: 'compra',
      fornecedor: '',
      dataEmissao: new Date().toISOString().split('T')[0]
    });
    setMaterialModal(true);
  };

  const handleEditarMaterial = (material: any) => {
    setMaterialEditando(material);
    setFormMaterial({
      descricao: material.descricao || '',
      valor: String(material.valor || ''),
      tipo: material.tipo || 'compra',
      fornecedor: material.fornecedor || '',
      dataEmissao: material.data_emissao || ''
    });
    setMaterialModal(true);
  };

  const handleSalvarMaterial = async () => {
    if (!formMaterial.descricao || !formMaterial.valor) {
      toast({ title: 'Preencha descrição e valor' });
      return;
    }

    try {
      const dados = {
        descricao: formMaterial.descricao,
        valor: parseFloat(formMaterial.valor),
        tipo_entrada: 'manual',
        tipo: formMaterial.tipo,
        fornecedor: formMaterial.fornecedor,
        data_emissao: formMaterial.dataEmissao,
        processado: true
      };

      if (materialEditando) {
        const { error } = await supabase
          .from('materiais_notas')
          .update(dados)
          .eq('id', materialEditando.id);

        if (error) throw error;
        toast({ title: '✅ Material atualizado!' });
      } else {
        const { error } = await supabase
          .from('materiais_notas')
          .insert([{
            tenant_id: tenantId,
            obra_id: id,
            ...dados
          }]);

        if (error) throw error;
        toast({ title: '✅ Material adicionado!' });
      }

      setMaterialModal(false);
      carregarMateriais();
    } catch (error) {
      toast({ title: 'Erro ao salvar material', description: String(error) });
    }
  };

  const handleDeletarMaterial = async (materialId: string) => {
    if (!window.confirm('Deletar este material?')) return;

    try {
      const { error } = await supabase
        .from('materiais_notas')
        .delete()
        .eq('id', materialId);

      if (error) throw error;
      toast({ title: '✅ Material deletado!' });
      carregarMateriais();
    } catch (error) {
      toast({ title: 'Erro ao deletar' });
    }
  };

  if (!obra) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-zinc-400">Carregando...</p>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getObraInfo = (obra: any) => {
    const contasObra = (contas || []).filter(c => c.obraId === obra.id);
    const totalProposta = contasObra.reduce((s, c) => s + (c.valor || 0), 0);
    const valorPago = contasObra.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor || 0), 0);
    const aReceber = totalProposta - valorPago;
    return { totalProposta, valorPago, aReceber };
  };

  const clienteNome = clientes.find(c => c.id === obra.clienteId)?.nome || 'Cliente não definido';
  const info = getObraInfo(obra);
  const percGasto = obra.orcamentoLimite ? ((obra.gastoAtual || 0) / obra.orcamentoLimite) * 100 : 0;
  const totalMateriais = materiais.reduce((s, m) => s + (m.valor || 0), 0);
  const isInativa = obra?.status === 'inativa';

  const TabButton = ({ id: tabId, label }: { id: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1e] to-[#0a0a0a] pb-20 text-white">
      <header className="sticky top-0 z-40 px-6 py-5 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button onClick={() => navigate('/obras')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
            <span className="font-semibold">Voltar</span>
          </button>
          <h1 className="text-2xl font-black uppercase">{obra.nome}</h1>
          <button onClick={() => { if(window.confirm('Deletar?')) { deleteObra(obra.id); navigate('/obras'); }}} className="text-zinc-500 hover:text-red-400">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        {/* INFO CARD */}
        <div className={`border rounded-2xl p-6 ${isInativa ? 'bg-red-500/10 border-red-500/20' : 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-white/5'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] font-black text-zinc-400 mb-2">CLIENTE</p>
              <p className="text-lg font-black text-white flex items-center gap-2">
                <Users2 size={16} className="text-emerald-500" /> {clienteNome}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black text-zinc-400 mb-2">LOCALIZAÇÃO</p>
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => {
                setEnderecoDadoModal(obra.endereco || '');
                setStatusDadoModal(obra.status || 'ativa');
                setModalEditando(true);
              }}>
                <p className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500" /> 
                  {obra.endereco || 'Clique para adicionar'}
                </p>
                <Edit2 size={16} className="text-zinc-400 opacity-50 group-hover:opacity-100" />
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-zinc-400 mb-2">STATUS</p>
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => {
                setEnderecoDadoModal(obra.endereco || '');
                setStatusDadoModal(obra.status || 'ativa');
                setModalEditando(true);
              }}>
                <p className="text-lg font-black flex items-center gap-1">
                  {isInativa ? <span className="text-red-400">❌ Inativa</span> : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={16} /> Em Andamento</span>}
                </p>
                <Edit2 size={16} className="text-zinc-400 opacity-50 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </div>

        {isInativa && <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 text-red-200">⚠️ Obra inativa - não aparece na lista</div>}

        <div className="flex gap-2 flex-wrap">
          <TabButton id="info" label="Resumo" />
          <TabButton id="financeiro" label="Financeiro" />
          <TabButton id="materiais" label="Materiais" />
          <TabButton id="lancamentos" label="Lançamentos" />
        </div>

        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-6">
                <p className="text-[9px] font-black text-emerald-300 mb-2">ORÇAMENTO</p>
                <p className="text-2xl font-black">{formatCurrency(obra.orcamentoLimite || 0)}</p>
              </div>
              <div className="bg-orange-500/15 border border-orange-500/30 rounded-2xl p-6">
                <p className="text-[9px] font-black text-orange-300 mb-2">GASTO</p>
                <p className="text-2xl font-black">{formatCurrency(obra.gastoAtual || 0)}</p>
              </div>
              <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl p-6">
                <p className="text-[9px] font-black text-blue-300 mb-2">A RECEBER</p>
                <p className="text-2xl font-black">{formatCurrency(info.aReceber)}</p>
              </div>
              <div className="bg-purple-500/15 border border-purple-500/30 rounded-2xl p-6">
                <p className="text-[9px] font-black text-purple-300 mb-2">MATERIAIS</p>
                <p className="text-2xl font-black">{formatCurrency(totalMateriais)}</p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between mb-4">
                <p className="text-sm font-black text-zinc-300">PROGRESSO DO ORÇAMENTO</p>
                <p className={`text-lg font-black ${percGasto > 100 ? 'text-red-400' : 'text-emerald-400'}`}>{Math.round(percGasto)}%</p>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div className={`h-full ${percGasto > 100 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`} style={{ width: `${Math.min(percGasto, 100)}%` }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-6">
              <p className="text-[9px] font-black text-emerald-300 mb-2">RECEBIDO</p>
              <p className="text-xl font-black">{formatCurrency(info.valorPago)}</p>
            </div>
            <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl p-6">
              <p className="text-[9px] font-black text-blue-300 mb-2">FALTA</p>
              <p className="text-xl font-black">{formatCurrency(info.aReceber)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-[9px] font-black text-zinc-400 mb-2">TOTAL</p>
              <p className="text-xl font-black">{formatCurrency(info.totalProposta)}</p>
            </div>
          </div>
        )}

        {activeTab === 'materiais' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">Materiais & Equipamentos</h3>
              <Button onClick={handleAdicionarMaterial} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus size={14} /> Adicionar
              </Button>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 text-sm font-semibold">
              💡 Dica: Você também pode carregar uma nota fiscal (foto, PDF ou documento) e a IA extrairá os materiais automaticamente!
            </div>

            {materiais.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.02] border border-white/10 rounded-2xl text-zinc-400">Nenhum material adicionado</div>
            ) : (
              <div className="space-y-3">
                {materiais.map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-all">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{m.descricao}</p>
                      <div className="flex gap-4 mt-1 text-xs text-zinc-300">
                        <span>📦 {m.tipo === 'compra' ? 'Compra' : 'Locação'}</span>
                        {m.fornecedor && <span>🏢 {m.fornecedor}</span>}
                        {m.data_emissao && <span>📅 {new Date(m.data_emissao).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-black text-emerald-300 text-lg">{formatCurrency(m.valor || 0)}</p>
                      <button onClick={() => handleEditarMaterial(m)} className="text-zinc-400 hover:text-emerald-400">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeletarMaterial(m.id)} className="text-zinc-400 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lancamentos' && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-black mb-4">Lançamentos</h3>
            {lancamentos.filter(l => l.obraId === obra.id).length === 0 ? (
              <p className="text-zinc-400">Nenhum lançamento</p>
            ) : (
              <div className="space-y-2">
                {lancamentos.filter(l => l.obraId === obra.id).map((l: any) => (
                  <div key={l.id} className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-semibold">{l.descricaoEtapa || l.profissional}</p>
                      <p className="text-xs text-zinc-400">{new Date(l.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <p className="font-black text-emerald-300">{formatCurrency(l.valor)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL EDITAR ENDEREÇO E STATUS */}
      {modalEditando && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6">
            <h2 className="text-2xl font-black text-white">Editar Obra</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-black text-zinc-300 mb-2 block">ENDEREÇO</label>
                <input
                  type="text"
                  value={enderecoDadoModal}
                  onChange={(e) => setEnderecoDadoModal(e.target.value)}
                  placeholder="Digite o endereço..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-400 text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-black text-zinc-300 mb-2 block">STATUS</label>
                <select 
                  value={statusDadoModal} 
                  onChange={(e) => setStatusDadoModal(e.target.value)} 
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                >
                  <option value="ativa">✅ Ativa</option>
                  <option value="inativa">❌ Inativa</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalEditando(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEnderecoStatus}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MATERIAL */}
      {materialModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-black">{materialEditando ? 'Editar' : 'Novo'} Material</h2>
              <button onClick={() => setMaterialModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <input type="text" placeholder="Descrição *" value={formMaterial.descricao} onChange={(e) => setFormMaterial(f => ({...f, descricao: e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="number" placeholder="Valor *" step="0.01" value={formMaterial.valor} onChange={(e) => setFormMaterial(f => ({...f, valor: e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              <select value={formMaterial.tipo} onChange={(e) => setFormMaterial(f => ({...f, tipo: e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="compra">📦 Compra</option>
                <option value="locacao">🔄 Locação</option>
              </select>
              <input type="text" placeholder="Fornecedor" value={formMaterial.fornecedor} onChange={(e) => setFormMaterial(f => ({...f, fornecedor: e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="date" value={formMaterial.dataEmissao} onChange={(e) => setFormMaterial(f => ({...f, dataEmissao: e.target.value}))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMaterialModal(false)} className="flex-1 py-2 bg-white/5 rounded-lg">Cancelar</button>
              <button onClick={handleSalvarMaterial} className="flex-1 py-2 bg-emerald-600 rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObraDetalhePage;