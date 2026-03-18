import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus } from 'lucide-react';
import { Profissional, CATEGORIAS } from '@/lib/types';

interface Props {
  onAdd: (p: Omit<Profissional, 'id'>) => Profissional;
}

export function CadastrarProfissionalModal({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [chavePix, setChavePix] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoria) return;
    onAdd({ nome, categoria, chavePix: chavePix || undefined });
    setNome('');
    setCategoria('');
    setChavePix('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="w-4 h-4" />
          Novo Profissional
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Cadastrar Profissional
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Categoria</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full">Cadastrar Profissional</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
