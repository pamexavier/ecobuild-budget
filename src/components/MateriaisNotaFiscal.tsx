import { useState } from 'react';
import { Package, ShoppingCart, AlertCircle } from 'lucide-react';

interface ItemMaterial {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  status: 'nao_comprado' | 'encomendado' | 'recebido';
}

interface MateriaisNotaFiscalProps {
  materiais: ItemMaterial[];
  notaFiscalUrl?: string;
  onAtualizarStatus?: (materialId: string, status: string) => void;
}

export function MateriaisNotaFiscal({
  materiais,
  notaFiscalUrl,
  onAtualizarStatus
}: MateriaisNotaFiscalProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const recebidos = materiais.filter(m => m.status === 'recebido').length;
  const encomendados = materiais.filter(m => m.status === 'encomendado').length;
  const naoComprados = materiais.filter(m => m.status === 'nao_comprado').length;

  const valorTotal = materiais.reduce((acc, m) => acc + (m.quantidade * m.valor_unitario), 0);
  const valorRecebido = materiais
    .filter(m => m.status === 'recebido')
    .reduce((acc, m) => acc + (m.quantidade * m.valor_unitario), 0);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'recebido': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'encomendado': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      default: return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'recebido': return '✓';
      case 'encomendado': return '⏳';
      default: return '○';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* RESUMO */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Recebidos</p>
          <p className="text-xl font-black text-emerald-500">{recebidos}/{materiais.length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Encomendados</p>
          <p className="text-xl font-black text-blue-400">{encomendados}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">A Comprar</p>
          <p className="text-xl font-black text-yellow-500">{naoComprados}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Valor Total</p>
          <p className="text-sm font-black text-white">{formatCurrency(valorTotal)}</p>
        </div>
      </div>

      {/* BARRA DE PROGRESSO */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 flex">
              <div
                className="bg-emerald-500"
                style={{ width: `${materiais.length > 0 ? (recebidos / materiais.length) * 100 : 0}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${materiais.length > 0 ? (encomendados / materiais.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <p className="text-[9px] font-black text-zinc-500">{formatCurrency(valorRecebido)}</p>
        </div>
      </div>

      {/* NOTA FISCAL */}
      {notaFiscalUrl && (
        <a
          href={notaFiscalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/15 transition-all"
        >
          <ShoppingCart size={18} className="text-blue-500" />
          <div className="flex-1">
            <p className="text-sm font-black text-blue-400">Visualizar Nota Fiscal</p>
            <p className="text-[9px] text-blue-300/60 font-bold">PDF do fornecedor</p>
          </div>
          <div className="text-blue-400">→</div>
        </a>
      )}

      {/* LISTA DE MATERIAIS */}
      <div className="space-y-2">
        {materiais.map((material, idx) => (
          <div
            key={material.id}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* CHECKBOX STATUS */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-lg ${getStatusColor(material.status)}`}
                >
                  {getStatusIcon(material.status)}
                </div>
              </div>

              {/* DETALHES */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white uppercase truncate">
                  {material.descricao}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg font-bold text-zinc-400 uppercase">
                    {material.quantidade} {material.unidade}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">
                    {formatCurrency(material.valor_unitario)} cada
                  </span>
                  <span className="text-[10px] font-bold text-white ml-auto">
                    {formatCurrency(material.quantidade * material.valor_unitario)}
                  </span>
                </div>
              </div>

              {/* BOTÕES STATUS */}
              <div className="flex-shrink-0 flex gap-2">
                {material.status !== 'recebido' && (
                  <button
                    onClick={() => onAtualizarStatus?.(material.id, 'recebido')}
                    className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500/20 transition-all"
                  >
                    ✓ Receber
                  </button>
                )}
                {material.status === 'nao_comprado' && (
                  <button
                    onClick={() => onAtualizarStatus?.(material.id, 'encomendado')}
                    className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500/20 transition-all"
                  >
                    ⏳ Encomendar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {materiais.length === 0 && (
        <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
          <Package size={32} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-500 font-bold uppercase text-sm">Nenhum material registrado</p>
        </div>
      )}
    </div>
  );
}