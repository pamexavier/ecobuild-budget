import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HardHat, Plus } from 'lucide-react';
import { Obra } from '@/lib/types';

interface Props {
  onAdd: (o: Omit<Obra, 'id' | 'gastoAtual'>) => Obra;
}

export function CadastrarObraModal({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [orcamento, setOrcamento] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !orcamento) return;
    const val = parseFloat(orcamento);
    if (isNaN(val) || val <= 0) return;
    onAdd({ nome, orcamentoLimite: val });
    setNome('');
    setOrcamento('');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            Cadastrar Obra
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
          <div>
            <label className="text-sm font-medium block mb-1.5">Orçamento Limite (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={orcamento}
              onChange={e => setOrcamento(e.target.value)}
              placeholder="50000.00"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full">Cadastrar Obra</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
