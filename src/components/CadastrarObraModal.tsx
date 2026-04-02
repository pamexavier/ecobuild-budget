import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HardHat, Plus, Trash2, Layers, UserPlus } from 'lucide-react';
import { Obra, OrcamentoCategoria, CATEGORIAS_ORCAMENTO_SUGESTOES, Cliente, TipoContrato, TIPO_CONTRATO_LABELS } from '@/lib/types';
import { CadastrarClienteModal } from './CadastrarClienteModal';

interface Props {
  onAdd: (o: Omit<Obra, 'id' | 'gastoAtual'>) => void;
  onAddCliente: (c: Omit<Cliente, 'id'>) => void;
  clientes?: Cliente[];
  trigger?: React.ReactNode;
  defaultNome?: string;
}

export function CadastrarObraModal({ onAdd, onAddCliente, clientes, trigger, defaultNome }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(defaultNome || '');
  const [clienteId, setClienteId] = useState('');
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('obra');
  const [categorias, setCategorias] = useState<OrcamentoCategoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoValor, setNovoValor] = useState('');

  useEffect(() => {
    if (defaultNome) setNome(defaultNome);
  }, [defaultNome]);

  const totalOrcamento = categorias.reduce((sum, c) => sum + c.valorPrevisto, 0);

  const addCategoria = () => {
    if (!novaCategoria || !novoValor) return;
    const val = parseFloat(novoValor);
    if (isNaN(val) || val <= 0) return;
    if (categorias.some(c => c.nome === novaCategoria)) return;

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
          <Button variant="outline" size="sm" className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20">
            <HardHat className="w-4 h-4" />
            Nova Obra
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-xl uppercase tracking-tight">
            <HardHat className="w-6 h-6 text-primary" />
            Cadastrar Obra / Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground ml-1">Nome da Obra / Projeto</label>
            <input 
              type="text" 
              required
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Ex: Residencial Parque Verde" 
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black uppercase text-muted-foreground ml-1">Cliente</label>
                <CadastrarClienteModal 
                  onAdd={onAddCliente}
                  trigger={
                    <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> + Novo
                    </button>
                  }
                />
              </div>
              <select 
                value={clienteId} 
                onChange={e => setClienteId(e.target.value)} 
                className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Sem cliente vinculado</option>
                {clientes?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cpfCnpj ? `(${c.cpfCnpj})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground ml-1">Tipo de Contrato</label>
              <select 
                value={tipoContrato} 
                onChange={e => setTipoContrato(e.target.value as TipoContrato)} 
                className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
              >
                {Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider">Orçamento por Categoria</span>
            </div>

            {categorias.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-background rounded-xl border border-border px-3 py-2">
                    <span className="text-xs font-bold uppercase">{cat.nome}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-primary">
                        R$ {cat.valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <button type="button" onClick={() => removeCategoria(cat.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={novaCategoria} 
                  onChange={e => setNovaCategoria(e.target.value)} 
                  className="rounded-lg border border-input bg-background px-3 py-2 text-[11px] font-bold uppercase outline-none"
                >
                  <option value="">Categoria...</option>
                  {CATEGORIAS_ORCAMENTO_SUGESTOES
                    .filter(s => !categorias.some(c => c.nome === s))
                    .map(s => <option key={s} value={s}>{s}</option>)
                  }
                </select>
                <input 
                  type="number" 
                  step="0.01" 
                  value={novoValor} 
                  onChange={e => setNovoValor(e.target.value)} 
                  placeholder="Valor R$" 
                  className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold outline-none" 
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addCategoria} className="w-full font-bold text-[10px] uppercase">
                <Plus className="w-3 h-3 mr-1" /> Adicionar Categoria
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-lg shadow-primary/20" disabled={!nome}>
            Cadastrar {tipoContrato}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}