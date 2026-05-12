import { useState, useMemo } from 'react';
import { Plus, X, Check, Clock, AlertCircle, TrendingUp, Download } from 'lucide-react';
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

// ============================================
// MODAL: Criar Proposta de Pagamento
// ============================================
export interface ModalPropostaProps {
  obra: Obra;
  onClose: () => void;
  onSave: (proposta: PropostaPagamento) => void;
}

function ModalCriarProposta({ obra, onClose, onSave }: ModalPropostaProps) {
  const [formData, setFormData] = useState({
    valor: obra.orcamento || 0,
    percentualEntrada: 10,
    totalParcelas: 5,
    periodoParcelasDias: 15 // quinzenal
  });

  const valorEntrada = (formData.valor * formData.percentualEntrada) / 100;
  const saldoAposEntrada = formData.valor - valorEntrada;
  const valorParcela = saldoAposEntrada / formData.totalParcelas;
  const saldoFinal = saldoAposEntrada - valorParcela * (formData.totalParcelas - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hoje = new Date();
    
    // Criar parcelas
    const parcelas: Parcela[] = [];
    for (let i = 1; i <= formData.totalParcelas; i++) {
      const dataVencimento = new Date(hoje);
      dataVencimento.setDate(dataVencimento.getDate() + formData.periodoParcelasDias * i);

      parcelas.push({
        id: `parcela-${Date.now()}-${i}`,
        numero: i,
        descricao: `${i}ª parcela`,
        valor: i === formData.totalParcelas ? saldoFinal : valorParcela,
        dataVencimento,
        status: 'aberto'
      });
    }

    const proposta: PropostaPagamento = {
      id: `proposta-${Date.now()}`,
      obraId: obra.id,
      obraNome: obra.nome,
      dataProposta: hoje,
      valor: formData.valor,
      entrada: {
        percentual: formData.percentualEntrada,
        valor: valorEntrada,
        status: 'aberto'
      },
      parcelas,
      saldoFinal: {
        valor: saldoFinal,
        descricao: 'Saldo final',
        status: 'aberto'
      },
      status: 'rascunho'
    };

    onSave(proposta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Criar Proposta de Pagamento</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-emerald-400">
            <strong>{obra.nome}</strong> - Total: R$ {formData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Valor Total */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Valor Total da Obra (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Percentual Entrada */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Percentual de Entrada (%)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.percentualEntrada}
                onChange={(e) => setFormData({ ...formData, percentualEntrada: parseInt(e.target.value) })}
                className="flex-1"
              />
              <div className="text-right min-w-24">
                <p className="text-sm font-bold text-white">{formData.percentualEntrada}%</p>
                <p className="text-xs text-zinc-400">R$ {valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Total de Parcelas */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Número de Parcelas
            </label>
            <select
              value={formData.totalParcelas}
              onChange={(e) => setFormData({ ...formData, totalParcelas: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              {[3, 4, 5, 6, 8, 10, 12].map(n => (
                <option key={n} value={n}>{n} parcelas</option>
              ))}
            </select>
          </div>

          {/* Período entre parcelas */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Período entre Parcelas (dias)
            </label>
            <select
              value={formData.periodoParcelasDias}
              onChange={(e) => setFormData({ ...formData, periodoParcelasDias: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={7}>Semanal (7 dias)</option>
              <option value={15}>Quinzenal (15 dias)</option>
              <option value={30}>Mensal (30 dias)</option>
            </select>
          </div>

          {/* Resumo */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <h3 className="text-sm font-bold text-white mb-4">Resumo da Proposta</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Entrada</p>
                <p className="text-lg font-black text-emerald-400">
                  R$ {valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Valor/Parcela</p>
                <p className="text-lg font-black text-blue-400">
                  R$ {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Saldo Final</p>
                <p className="text-lg font-black text-amber-400">
                  R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total</p>
                <p className="text-lg font-black text-white">
                  R$ {formData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
            >
              Criar Proposta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// CARD: Proposta de Pagamento
// ============================================
interface CardPropostaProps {
  proposta: PropostaPagamento;
  recebimentos: Recebimento[];
  aditivos: Aditivo[];
  onMarcarPago: (parcelaId?: string) => void;
  onAdicionarAditivo: () => void;
  onLancarRecebimento: () => void;
}

export function CardPropostaPagamento({
  proposta,
  recebimentos,
  aditivos,
  onMarcarPago,
  onAdicionarAditivo,
  onLancarRecebimento
}: CardPropostaProps) {
  
  const totaisRecebidos = useMemo(() => {
    let entrada = 0;
    let parcelas = 0;
    let saldoFinal = 0;
    let aditivosRecebidos = 0;

    recebimentos.forEach(rec => {
      if (!rec.parcelaId && !rec.aditivoId) {
        entrada = rec.valor;
      } else if (rec.parcelaId) {
        parcelas += rec.valor;
      } else if (rec.aditivoId) {
        aditivosRecebidos += rec.valor;
      }
    });

    return { entrada, parcelas, saldoFinal, aditivosRecebidos };
  }, [recebimentos]);

  const valorTotalComAditivos = useMemo(() => {
    const aditivosAceitos = aditivos
      .filter(a => a.status === 'aceito')
      .reduce((sum, a) => sum + a.valor, 0);
    return proposta.valor + aditivosAceitos;
  }, [proposta, aditivos]);

  const totalRecebido = totaisRecebidos.entrada + totaisRecebidos.parcelas + totaisRecebidos.saldoFinal + totaisRecebidos.aditivosRecebidos;
  const percentualRecebido = (totalRecebido / valorTotalComAditivos) * 100;

  return (
    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Proposta de Pagamento
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {proposta.obraNome} • Data: {new Date(proposta.dataProposta).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 uppercase font-bold">Status</p>
          <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 mt-1">
            {proposta.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-2">
        <div className="w-full bg-white/[0.08] rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            style={{ width: `${Math.min(percentualRecebido, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">
            R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-zinc-500">
            {percentualRecebido.toFixed(1)}% de R$ {valorTotalComAditivos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Grid: Entrada, Parcelas, Saldo */}
      <div className="grid grid-cols-3 gap-3">
        {/* Entrada */}
        <div className={`rounded-lg p-3 border ${
          proposta.entrada.status === 'pago'
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Entrada {proposta.entrada.percentual}%</p>
          <p className={`text-lg font-black ${
            proposta.entrada.status === 'pago' ? 'text-emerald-400' : 'text-yellow-400'
          }`}>
            R$ {proposta.entrada.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] text-zinc-600 mt-1">{proposta.entrada.status === 'pago' ? '✓ Pago' : 'Aberto'}</p>
        </div>

        {/* Parcelas */}
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{proposta.parcelas.length} Parcelas</p>
          <p className="text-lg font-black text-blue-400">
            R$ {(proposta.parcelas[0]?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] text-zinc-600 mt-1">{proposta.parcelas.filter(p => p.status === 'pago').length}/{proposta.parcelas.length} pagas</p>
        </div>

        {/* Saldo Final */}
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Saldo Final</p>
          <p className="text-lg font-black text-amber-400">
            R$ {proposta.saldoFinal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] text-zinc-600 mt-1">{proposta.saldoFinal.status === 'pago' ? '✓ Pago' : 'Aberto'}</p>
        </div>
      </div>

      {/* Lista de Parcelas */}
      <div className="border-t border-white/10 pt-4 space-y-2">
        <h4 className="text-sm font-bold text-white mb-3">Parcelas</h4>
        {proposta.parcelas.map(parcela => (
          <div
            key={parcela.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              parcela.status === 'pago'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : parcela.status === 'atrasado'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-white/[0.03] border-white/[0.05]'
            }`}
          >
            <div>
              <p className="text-sm font-bold text-white">{parcela.numero}ª Parcela</p>
              <p className="text-xs text-zinc-500">
                Vence: {new Date(parcela.dataVencimento).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black ${
                parcela.status === 'pago'
                  ? 'text-emerald-400'
                  : parcela.status === 'atrasado'
                  ? 'text-red-400'
                  : 'text-white'
              }`}>
                R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-zinc-600 mt-1">
                {parcela.status === 'pago' ? '✓ Pago' : parcela.status === 'atrasado' ? '⚠ Atrasado' : 'Aberto'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Aditivos */}
      {aditivos.length > 0 && (
        <div className="border-t border-white/10 pt-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">Aditivos</h4>
            <button
              onClick={onAdicionarAditivo}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          {aditivos.map(aditivo => (
            <div
              key={aditivo.id}
              className={`p-3 rounded-lg border ${
                aditivo.status === 'aceito'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : aditivo.status === 'proposto'
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{aditivo.descricao}</p>
                  <p className="text-xs text-zinc-500 mt-1">{aditivo.status}</p>
                </div>
                <p className="text-sm font-black text-white">
                  R$ {aditivo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="border-t border-white/10 pt-4 flex gap-2">
        <button
          onClick={onLancarRecebimento}
          className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" /> Lançar Recebimento
        </button>
        <button
          onClick={onAdicionarAditivo}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Aditivo
        </button>
      </div>
    </div>
  );
}

// ============================================
// MODAL: Lançar Recebimento
// ============================================
interface ModalLancarRecebimentoProps {
  proposta: PropostaPagamento;
  onClose: () => void;
  onSave: (recebimento: Recebimento) => void;
}

export function ModalLancarRecebimento({ proposta, onClose, onSave }: ModalLancarRecebimentoProps) {
  const [formData, setFormData] = useState({
    parcelaId: '',
    valor: 0,
    dataPagamento: new Date().toISOString().split('T')[0],
    metodoPagamento: 'transferencia' as const,
    observacoes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recebimento: Recebimento = {
      id: `rec-${Date.now()}`,
      propostaPagamentoId: proposta.id,
      parcelaId: formData.parcelaId || undefined,
      valor: parseFloat(formData.valor.toString()),
      dataPagamento: new Date(formData.dataPagamento),
      descricao: formData.parcelaId ? 'Parcela' : 'Recebimento',
      metodoPagamento: formData.metodoPagamento,
      observacoes: formData.observacoes
    };

    onSave(recebimento);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Lançar Recebimento</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parcela */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Parcela (opcional)
            </label>
            <select
              value={formData.parcelaId}
              onChange={(e) => setFormData({ ...formData, parcelaId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Selecione uma parcela...</option>
              <option value="entrada">Entrada ({proposta.entrada.percentual}%)</option>
              {proposta.parcelas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.numero}ª Parcela - R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              ))}
              <option value="saldo">Saldo Final</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              required
            />
          </div>

          {/* Data de Pagamento */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Data de Pagamento
            </label>
            <input
              type="date"
              value={formData.dataPagamento}
              onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              required
            />
          </div>

          {/* Método */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Método de Pagamento
            </label>
            <select
              value={formData.metodoPagamento}
              onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value as any })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="transferencia">Transferência</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cheque">Cheque</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Depósito na conta..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MODAL: Adicionar Aditivo
// ============================================
interface ModalAditivoProps {
  obraId: string;
  propostaPagamentoId: string;
  onClose: () => void;
  onSave: (aditivo: Aditivo) => void;
}

export function ModalAditivo({ obraId, propostaPagamentoId, onClose, onSave }: ModalAditivoProps) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: 0,
    observacoes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const aditivo: Aditivo = {
      id: `aditivo-${Date.now()}`,
      propostaPagamentoId,
      obraId,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor.toString()),
      dataProposta: new Date(),
      status: 'proposto',
      observacoes: formData.observacoes
    };

    onSave(aditivo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Adicionar Aditivo</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Descrição do Aditivo
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Pintura de fachada"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              required
            />
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Valor Adicional (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              required
            />
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Justificativa ou detalhes..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600"
            >
              Propor Aditivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}