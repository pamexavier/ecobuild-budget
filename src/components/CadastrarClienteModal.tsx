import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus } from 'lucide-react';
import { Cliente } from '@/lib/types';

interface Props {
  onAdd: (c: Omit<Cliente, 'id'>) => void;
  trigger?: React.ReactNode;
}

export function CadastrarClienteModal({ onAdd, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [contato, setContato] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    onAdd({
      nome,
      razaoSocial: razaoSocial || undefined,
      cpfCnpj: cpfCnpj || undefined,
      contato: contato || undefined,
    });
    setNome(''); setRazaoSocial(''); setCpfCnpj(''); setContato('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            Novo Cliente
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Cadastrar Cliente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">Nome / Razão Social</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João Silva ou Empresa ABC Ltda" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Razão Social (se PJ)</label>
            <input type="text" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Razão social completa" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">CPF / CNPJ</label>
            <input type="text" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00 ou 00.000.000/0000-00" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Contato (telefone/email)</label>
            <input type="text" value={contato} onChange={e => setContato(e.target.value)} placeholder="(11) 99999-0000" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Button type="submit" className="w-full py-6 font-bold" disabled={!nome}>Cadastrar Cliente</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
