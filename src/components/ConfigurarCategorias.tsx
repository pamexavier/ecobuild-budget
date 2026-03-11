import { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIAS_ORCAMENTO_SUGESTOES } from '@/lib/types';

interface Props {
  categorias: string[];
  onUpdate: (categorias: string[]) => void;
}

export function ConfigurarCategorias({ categorias, onUpdate }: Props) {
  const [nova, setNova] = useState('');

  const addCategoria = () => {
    const trimmed = nova.trim();
    if (!trimmed || categorias.includes(trimmed)) return;
    onUpdate([...categorias, trimmed]);
    setNova('');
  };

  const removeCategoria = (cat: string) => {
    onUpdate(categorias.filter(c => c !== cat));
  };

  const sugestoesFaltantes = CATEGORIAS_ORCAMENTO_SUGESTOES.filter(s => !categorias.includes(s));

  return (
    <div className="space-y-4">
      {/* Current categories */}
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => (
          <span
            key={cat}
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-medium"
          >
            <Tag className="w-3.5 h-3.5" />
            {cat}
            <button
              onClick={() => removeCategoria(cat)}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {categorias.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
        )}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={nova}
          onChange={e => setNova(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategoria())}
          placeholder="Nova categoria..."
          className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="button" onClick={addCategoria} size="sm" className="rounded-lg">
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Suggestions */}
      {sugestoesFaltantes.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
          <div className="flex flex-wrap gap-1.5">
            {sugestoesFaltantes.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onUpdate([...categorias, s])}
                className="text-xs bg-secondary text-secondary-foreground rounded-lg px-2.5 py-1 hover:bg-primary/10 hover:text-primary transition-colors border border-border"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
