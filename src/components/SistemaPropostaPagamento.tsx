import { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, Trash2, Lock, Unlock, Wand2 } from 'lucide-react';
import { Obra } from '@/lib/types';

// ============================================
// TIPOS
// ============================================
export interface Parcela {
  id: string;
  numero: number;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: 'aberto' | 'pago' | 'atrasado';
  observacoes?: string;
}

export interface PropostaPagamento {
  id: string;
  obraId: string;
  obraNome: string;
  dataPropostaCliente?: Date;
  dataProposta: Date;
  valor: number;
  entrada: {
    percentual: number;
    valor: number;
    dataPagamento?: Date;
    status: 'aberto' | 'pago' | 'atrasado';
  };
  parcelas: Parcela[];
  saldoFinal: {
    valor: number;
    descricao: string;
    dataPagamento?: Date;
    status: 'aberto' | 'pago' | 'atrasado';
  };
  status: 'rascunho' | 'enviada' | 'aceita' | 'finalizada';
}

export interface Aditivo {
  id: string;
  propostaPagamentoId: string;
  obraId: string;
  descricao: string;
  valor: number;
  dataProposta: Date;
  status: 'proposto' | 'aceito' | 'rejeitado';
  dataPagamento?: Date;
  observacoes?: string;
}

export interface Recebimento {
  id: string;
  propostaPagamentoId: string;
  parcelaId?: string;
  aditivoId?: string;
  valor: number;
  dataPagamento: Date;
  descricao: string;
  metodoPagamento: 'dinheiro' | 'cheque' | 'transferencia' | 'cartao';
  observacoes?: string;
}

// Tipo estendido para o form de edição
interface ParcelaEditavel extends Partial<Parcela> {
  isLocked?: boolean;
}

// ============================================
// MODAL: Criar Proposta de Pagamento 
// ============================================
export interface ModalPropostaProps {
  obra: Obra;
  onClose: () => void;
  onSave: (proposta: PropostaPagamento) => void;
}

export function ModalCriarProposta({ obra, onClose, onSave }: ModalPropostaProps) {
  const [formData, setFormData] = useState({
    valor: obra.orcamentoLimite || 0,
    percentualEntrada: 10,
    totalParcelas: 5,
    periodoParcelasDias: 15,
    dataEntrada: new Date().toISOString().split('T')[0] 
  });

  const [parcelasEditaveis, setParcelasEditaveis] = useState<ParcelaEditavel[]>([]);

  // Gera as parcelas iniciais
  useEffect(() => {
    const valorEntrada = (formData.valor * formData.percentualEntrada) / 100;
    const saldoAposEntrada = formData.valor - valorEntrada;
    const valorBaseParcela = formData.totalParcelas > 0 ? saldoAposEntrada / formData.totalParcelas : 0;
    
    const dataBase = new Date(formData.dataEntrada + 'T12:00:00');
    const novasParcelas: ParcelaEditavel[] = [];
    let currentDate = new Date(dataBase);

    for (let i = 0; i < formData.totalParcelas; i++) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + formData.periodoParcelasDias);
      
      novasParcelas.push({
        id: `temp-${i}`,
        numero: i + 1,
        valor: Number(valorBaseParcela.toFixed(2)),
        dataVencimento: new Date(currentDate),
        status: 'aberto',
        isLocked: false 
      });
    }
    setParcelasEditaveis(novasParcelas);
  }, [formData.valor, formData.percentualEntrada, formData.totalParcelas, formData.periodoParcelasDias, formData.dataEntrada]);

  const handleUpdateParcela = (index: number, campo: keyof ParcelaEditavel, valor: any) => {
    const novas = [...parcelasEditaveis];
    
    if (campo === 'dataVencimento') {
      const newDate = new Date(valor + 'T12:00:00');
      novas[index][campo] = newDate;

      let currentDate = new Date(newDate);
      for (let i = index + 1; i < novas.length; i++) {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + formData.periodoParcelasDias);
        novas[i].dataVencimento = new Date(currentDate);
      }
    } else if (campo === 'valor') {
      novas[index].valor = valor;
      novas[index].isLocked = true; 
    } else {
      novas[index][campo] = valor;
    }
    setParcelasEditaveis(novas);
  };

  const toggleLock = (index: number) => {
    const novas = [...parcelasEditaveis];
    novas[index].isLocked = !novas[index].isLocked;
    setParcelasEditaveis(novas);
  };

  const adicionarParcelaExtra = () => {
    const ultimoVenc = parcelasEditaveis.length > 0 
      ? new Date(parcelasEditaveis[parcelasEditaveis.length - 1].dataVencimento!)
      : new Date(formData.dataEntrada + 'T12:00:00');
    
    const novoVenc = new Date(ultimoVenc);
    novoVenc.setDate(ultimoVenc.getDate() + formData.periodoParcelasDias);

    setParcelasEditaveis([...parcelasEditaveis, {
      id: `extra-${Date.now()}`,
      numero: parcelasEditaveis.length + 1,
      valor: 0,
      dataVencimento: novoVenc,
      status: 'aberto',
      isLocked: false
    }]);
  };

  const totalParcelado = parcelasEditaveis.reduce((sum, p) => sum + (p.valor || 0), 0);
  const valorEntrada = (formData.valor * formData.percentualEntrada) / 100;
  const diferenca = formData.valor - (valorEntrada + totalParcelado);

  const ratearRestante = () => {
    const lockedTotal = parcelasEditaveis.filter(p => p.isLocked).reduce((sum, p) => sum + (p.valor || 0), 0);
    const unlockedCount = parcelasEditaveis.filter(p => !p.isLocked).length;

    if (unlockedCount === 0) {
      alert("Todas as parcelas estão trancadas! Destrave o cadeado de alguma para poder ratear.");
      return;
    }

    const saldoParaRatear = formData.valor - valorEntrada - lockedTotal;
    const valorRateado = saldoParaRatear / unlockedCount;

    const novas = parcelasEditaveis.map(p => {
      if (p.isLocked) return p;
      return { ...p, valor: Number(valorRateado.toFixed(2)) };
    });

    setParcelasEditaveis(novas);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(diferenca) > 1) {
      alert("O total das parcelas não bate com o valor do contrato! Use a Varinha Mágica para ratear o restante.");
      return;
    }

    const proposta: PropostaPagamento = {
      id: `proposta-${Date.now()}`,
      obraId: obra.id,
      obraNome: obra.nome,
      dataProposta: new Date(),
      valor: formData.valor,
      entrada: { percentual: formData.percentualEntrada, valor: valorEntrada, status: 'aberto' },
      parcelas: parcelasEditaveis.map((p, i) => ({
        id: p.id || `parcela-${Date.now()}-${i}`,
        numero: i + 1,
        descricao: p.descricao || `${i + 1}ª parcela`,
        valor: p.valor || 0,
        dataVencimento: p.dataVencimento || new Date(),
        status: p.status || 'aberto'
      })) as Parcela[],
      saldoFinal: { valor: 0, descricao: 'Diluído', status: 'aberto' },
      status: 'rascunho'
    };

    onSave(proposta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-[32px] p-8 w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Proposta de Pagamento</h2>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-[0.2em]">{obra.nome}</p>
          </div>
          <button onClick={onClose} className="bg-white/5 p-2 rounded-full text-zinc-500 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto pr-4 custom-scrollbar">
          {/* Configurações Base */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Valor do Contrato</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">R$</span>
                {/* SOLUÇÃO: value={... === 0 ? '' : ...} permite apagar totalmente */}
                <input
                  type="number"
                  placeholder="0,00"
                  value={formData.valor === 0 ? '' : formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-10 py-4 text-white font-black text-lg focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Entrada ({formData.percentualEntrada}%)</label>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-4 flex flex-col justify-center h-[62px]">
                <input
                  type="range" min="0" max="100" step="5"
                  value={formData.percentualEntrada}
                  onChange={(e) => setFormData({ ...formData, percentualEntrada: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between mt-1">
                   <span className="text-[9px] text-zinc-600 font-bold">0%</span>
                   <span className="text-emerald-400 font-black text-xs">R$ {valorEntrada.toLocaleString('pt-BR')}</span>
                   <span className="text-[9px] text-zinc-600 font-bold">100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest ml-1">Data da Entrada</label>
              <input
                type="date"
                value={formData.dataEntrada}
                onChange={(e) => setFormData({ ...formData, dataEntrada: e.target.value })}
                className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-4 text-emerald-100 font-bold outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 block mb-1.5">Nº de Parcelas</label>
              <input
                type="number" min="1" max="100"
                placeholder="Ex: 5"
                value={formData.totalParcelas === 0 ? '' : formData.totalParcelas}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, totalParcelas: isNaN(val) ? 0 : val });
                }}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 block mb-1.5">Intervalo</label>
              <select
                value={formData.periodoParcelasDias}
                onChange={(e) => setFormData({ ...formData, periodoParcelasDias: parseInt(e.target.value) })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none"
              >
                <option value={7} className="bg-zinc-900">Semanal (7 dias)</option>
                <option value={15} className="bg-zinc-900">Quinzenal (15 dias)</option>
                <option value={30} className="bg-zinc-900">Mensal (30 dias)</option>
              </select>
            </div>
          </div>

          {/* Grid de Parcelas Editáveis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Cronograma Detalhado</h3>
               <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold ${Math.abs(diferenca) < 0.1 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {Math.abs(diferenca) < 0.1 ? '✓ Valores Conferem' : `Diferença: R$ ${diferenca.toLocaleString('pt-BR')}`}
                  </span>
                  
                  {Math.abs(diferenca) > 0.1 && (
                    <button type="button" onClick={ratearRestante} className="text-[10px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg uppercase hover:bg-blue-500 transition-colors flex items-center gap-1">
                      <Wand2 size={12}/> Ratear Restante
                    </button>
                  )}

                  <button type="button" onClick={adicionarParcelaExtra} className="text-[10px] font-black text-white bg-emerald-600 px-3 py-1.5 rounded-lg uppercase hover:bg-emerald-500 transition-colors">
                    + Parcela
                  </button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parcelasEditaveis.map((p, index) => (
                <div key={index} className={`bg-white/[0.02] border rounded-2xl p-4 space-y-3 group transition-all ${p.isLocked ? 'border-orange-500/30' : 'border-white/5 hover:border-emerald-500/30'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-600 uppercase">{p.numero}ª Parcela</span>
                    <button type="button" onClick={() => setParcelasEditaveis(parcelasEditaveis.filter((_, i) => i !== index))} className="text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-zinc-500 uppercase ml-1">Valor</span>
                      <div className="flex items-center gap-2">
                        {/* SOLUÇÃO: p.valor === 0 ? '' : p.valor */}
                        <input 
                          type="number"
                          placeholder="0,00"
                          value={p.valor === 0 ? '' : p.valor}
                          onChange={(e) => handleUpdateParcela(index, 'valor', parseFloat(e.target.value) || 0)}
                          className={`w-full bg-white/5 border rounded-lg px-3 py-2 font-bold text-sm outline-none transition-colors ${p.isLocked ? 'border-orange-500/50 text-orange-200' : 'border-white/10 text-white focus:border-emerald-500/50'}`}
                        />
                        <button type="button" onClick={() => toggleLock(index)} className="text-zinc-500 hover:text-white transition-colors">
                          {p.isLocked ? <Lock size={16} className="text-orange-500" /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-zinc-500 uppercase ml-1">Vencimento</span>
                      <input 
                        type="date"
                        value={p.dataVencimento?.toISOString().split('T')[0]}
                        onChange={(e) => handleUpdateParcela(index, 'dataVencimento', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-emerald-100 font-bold text-[11px] focus:border-emerald-500/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 rounded-2xl bg-zinc-900 text-zinc-500 font-bold hover:bg-zinc-800 transition-all uppercase text-xs tracking-widest">Cancelar</button>
            <button type="submit" disabled={Math.abs(diferenca) > 5} className="flex-1 py-5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all uppercase text-xs tracking-widest disabled:opacity-20">Confirmar Proposta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// CARD: Dashboard da Proposta
// ============================================
export function CardPropostaPagamento({ proposta, recebimentos, aditivos, onAdicionarAditivo, onLancarRecebimento }: any) {
  const totalRecebido = recebimentos.reduce((sum: number, r: any) => sum + r.valor, 0);
  const valorAditivos = aditivos.filter((a: any) => a.status === 'aceito').reduce((sum: number, a: any) => sum + a.valor, 0);
  const valorTotalFinal = proposta.valor + valorAditivos;
  const percentualProgresso = (totalRecebido / valorTotalFinal) * 100;

  return (
    <div className="bg-zinc-950/40 border border-emerald-500/10 rounded-[32px] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tighter">Fluxo de Recebimento</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{proposta.parcelas.length} parcelas programadas</p>
          </div>
        </div>
        <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
          {proposta.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Progresso Total</span>
          <span className="text-sm font-black text-emerald-500">{percentualProgresso.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-1 border border-white/5">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${percentualProgresso}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5">
          <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Já Recebido</p>
          <p className="text-xl font-black text-white">R$ {totalRecebido.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5">
          <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Saldo Devedor</p>
          <p className="text-xl font-black text-emerald-500">R$ {(valorTotalFinal - totalRecebido).toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onLancarRecebimento} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20">Lançar Recebimento</button>
        <button onClick={onAdicionarAditivo} className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Novo Aditivo</button>
      </div>
    </div>
  );
}

// ============================================
// Modais Auxiliares
// ============================================
export function ModalLancarRecebimento({ proposta, onClose, onSave }: any) {
  const [formData, setFormData] = useState({ parcelaId: '', valor: 0, dataPagamento: new Date().toISOString().split('T')[0] });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black text-white uppercase">Confirmar Recebimento</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({...formData, id: `rec-${Date.now()}`, propostaPagamentoId: proposta.id, dataPagamento: new Date(formData.dataPagamento)}); }} className="space-y-5">
          <select value={formData.parcelaId} onChange={(e) => setFormData({ ...formData, parcelaId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none">
            <option value="" className="bg-zinc-900">Selecionar Parcela...</option>
            <option value="entrada" className="bg-zinc-900">Entrada (R$ {proposta.entrada.valor})</option>
            {proposta.parcelas.map((p: any) => <option key={p.id} value={p.id} className="bg-zinc-900">{p.numero}ª Parcela - {new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</option>)}
          </select>
          <input type="number" placeholder="Valor" value={formData.valor === 0 ? '' : formData.valor} onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black" required />
          <input type="date" value={formData.dataPagamento} onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-bold" required />
          <button type="submit" className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs tracking-widest mt-4">Confirmar</button>
        </form>
      </div>
    </div>
  );
}

export function ModalAditivo({ obraId, propostaPagamentoId, onClose, onSave }: any) {
  const [formData, setFormData] = useState({ descricao: '', valor: 0 });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black text-white uppercase">Novo Aditivo</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({...formData, id: `ad-${Date.now()}`, obraId, propostaPagamentoId, status: 'aceito', dataProposta: new Date()}); }} className="space-y-5">
          <input type="text" placeholder="Descrição" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-bold" required />
          <input type="number" placeholder="Valor" value={formData.valor === 0 ? '' : formData.valor} onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black" required />
          <button type="submit" className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs tracking-widest mt-4">Adicionar</button>
        </form>
      </div>
    </div>
  );
}