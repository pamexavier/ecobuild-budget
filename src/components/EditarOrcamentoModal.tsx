import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, Trash2, Layers, Save } from 'lucide-react';
import { Obra, OrcamentoCategoria, CATEGORIAS_ORCAMENTO_SUGESTOES } from '@/lib/types';
import { supabase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface Props {
  obra: Obra;
  onUpdated: () => void;
}

export function EditarOrcamentoModal({ obra, onUpdated }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<OrcamentoCategoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoValor, setNovoValor] = useState('');

  useEffect(() => {
    if (open) {
      setCategorias(obra.categorias.map(c => ({ ...c })));
    }
  }, [open, obra.categorias]);

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

  const updateValor = (id: string, valor: string) => {
    const val = parseFloat(valor);
    if (isNaN(val)) return;
    setCategorias(prev => prev.map(c => c.id === id ? { ...c, valorPrevisto: val } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // IDs existentes na obra original
      const idsOriginais = new Set(obra.categorias.map(c => c.id));
      const idsNovos = new Set(categorias.map(c => c.id));

      // Deletar removidas
      const removidas = obra.categorias.filter(c => !idsNovos.has(c.id));
      for (const cat of removidas) {
        await supabase.from('orcamentos_categoria').delete().eq('id', cat.id);
      }

      // Inserir novas
      const novas = categorias.filter(c => !idsOriginais.has(c.id));
      if (novas.length > 0) {
        await supabase.from('orcamentos_categoria').insert(
          novas.map(c => ({ id: c.id, obra_id: obra.id, nome: c.nome, valor_previsto: c.valorPrevisto }))
        );
      }

      // Atualizar existentes
      const existentes = categorias.filter(c => idsOriginais.has(c.id));
      for (const cat of existentes) {
        await supabase.from('orcamentos_categoria')
          .update({ nome: cat.nome, valor_previsto: cat.valorPrevisto })
          .eq('id', cat.id);
      }

      // Atualizar orcamento_limite da obra
      await supabase.from('obras').update({ orcamento_limite: totalOrcamento }).eq('id', obra.id);

      toast({ title: 'Orçamento atualizado', description: obra.nome });
      onUpdated();
      setOpen(false);
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sugestoesFaltantes = CATEGORIAS_ORCAMENTO_SUGESTOES.filter(
    s => !categorias.some(c => c.nome === s)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded" title="Editar orçamento">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Editar Orçamento — {obra.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Categorias existentes */}
          {categorias.length > 0 ? (
            <div className="space-y-2">
              {categorias.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 bg-muted/30 rounded-lg border border-border px-3 py-2">
                  <span className="text-sm font-medium flex-1 truncate">{cat.nome}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cat.valorPrevisto}
                      onChange={e => updateValor(cat.id, e.target.value)}
                      className="w-24 rounded border border-input bg-background px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategoria(cat.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold text-primary">
                  R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>
          )}

          {/* Adicionar nova categoria */}
          <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adicionar Categoria</p>
            <div className="flex gap-2">
              <select
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecionar...</option>
                {sugestoesFaltantes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="text"
                placeholder="ou digitar"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoValor}
                  onChange={e => setNovoValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCategoria}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Orçamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}