import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HardHat, Plus, Trash2, Layers } from 'lucide-react';
import { Obra, OrcamentoCategoria, CATEGORIAS_ORCAMENTO_SUGESTOES } from '@/lib/types';

interface Props {
  onAdd: (o: Omit<Obra, 'id' | 'gastoAtual'>) => Obra;
}

export function CadastrarObraModal({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
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
    if (!nome || categorias.length === 0) return;
    onAdd({ nome, orcamentoLimite: totalOrcamento, categorias });
    setNome('');
    setCategorias([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HardHat className="w-4 h-4" />
          Nova Obra
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Cadastrar Obra
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Nome da Obra</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Residencial Parque Verde"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Categorias de Orçamento */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Definição de Orçamento por Categoria</span>
            </div>

            {/* Lista de categorias adicionadas */}
            {categorias.length > 0 && (
              <div className="space-y-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-card rounded-lg border border-border px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{cat.nome}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">
                        R$ {cat.valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCategoria(cat.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-semibold">Orçamento Total</span>
                  <span className="text-sm font-bold text-primary">
                    R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Adicionar nova categoria */}
            <div className="flex flex-col gap-3">
              <div className="flex-1">
                <select
                  value={novaCategoria}
                  onChange={e => setNovaCategoria(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Categoria...</option>
                  {CATEGORIAS_ORCAMENTO_SUGESTOES
                    .filter(s => !categorias.some(c => c.nome === s))
                    .map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                </select>
              </div>
              <div className="w-full">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoValor}
                  onChange={e => setNovoValor(e.target.value)}
                  placeholder="Valor (R$)"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCategoria} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione as categorias e seus valores orçados. O total será o limite da obra.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!nome || categorias.length === 0}>
            Cadastrar Obra
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
