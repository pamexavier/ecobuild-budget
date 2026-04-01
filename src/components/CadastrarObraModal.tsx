import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HardHat, Plus, Trash2, Layers } from 'lucide-react';
import { Obra, OrcamentoCategoria, CATEGORIAS_ORCAMENTO_SUGESTOES, Cliente, TipoContrato, TIPO_CONTRATO_LABELS } from '@/lib/types';

interface Props {
  onAdd: (o: Omit<Obra, 'id' | 'gastoAtual'>) => void;
  clientes?: Cliente[];
  trigger?: React.ReactNode;
  defaultNome?: string;
}

export function CadastrarObraModal({ onAdd, clientes, trigger, defaultNome }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(defaultNome || '');
  const [clienteId, setClienteId] = useState('');
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('obra');
  const [categorias, setCategorias] = useState<OrcamentoCategoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoValor, setNovoValor] = useState('');

  const totalOrcamento = categorias.reduce((sum, c) => sum + c.valorPrevisto, 0);

  const addCategoria = () => {
    if (!novaCategoria || !novoValor) return;
    const val = parseFloat(novoValor);
    if (isNaN(val) || val <= 0) return;
    setCategorias(prev => [...prev, {
      id: crypto.randomUUID(),
      nome: novaCategoria,
      valorPrevisto: val,
    }]);
    setNovaCategoria('');
    setNovoValor('');
  };

  const removeCategoria = (id: string) => {
    setCategorias(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    onAdd({
      nome,
      orcamentoLimite: totalOrcamento,
      categorias,
      clienteId: clienteId || undefined,
      tipoContrato,
    });
    setNome('');
    setClienteId('');
    setTipoContrato('obra');
    setCategorias([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <HardHat className="w-4 h-4" />
            Nova Obra
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Cadastrar Obra / Projeto
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Nome da Obra / Projeto</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Residencial Parque Verde" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {clientes && clientes.length > 0 && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Cliente</label>
              <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sem cliente vinculado</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.cpfCnpj ? ` — ${c.cpfCnpj}` : ''}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5">Tipo de Contrato</label>
            <select value={tipoContrato} onChange={e => setTipoContrato(e.target.value as TipoContrato)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
              {Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Orçamento por Categoria</span>
              <span className="text-xs text-muted-foreground ml-auto">opcional</span>
            </div>

            {categorias.length > 0 && (
              <div className="space-y-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-card rounded-lg border border-border px-3 py-2.5">
                    <span className="text-sm font-medium">{cat.nome}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">R$ {cat.valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <button type="button" onClick={() => removeCategoria(cat.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-semibold">Orçamento Total</span>
                  <span className="text-sm font-bold text-primary">R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Categoria...</option>
                {CATEGORIAS_ORCAMENTO_SUGESTOES.filter(s => !categorias.some(c => c.nome === s)).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" step="0.01" min="0" value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="Valor (R$)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button type="button" variant="outline" size="sm" onClick={addCategoria} className="shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!nome}>Cadastrar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
