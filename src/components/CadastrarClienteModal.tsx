import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus } from 'lucide-react';
import { Cliente } from '@/lib/types';

interface Props {
  onAdd: (c: Omit<Cliente, 'id'>) => Promise<Cliente | null | void>;
  trigger?: React.ReactNode;
}

const sanitizeDocumento = (value: string) => value.replace(/\D/g, '');

export function CadastrarClienteModal({ onAdd, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [contato, setContato] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;
    if (!nome) return;

    const payload = {
      nome: nome.trim(),
      razaoSocial: razaoSocial.trim() || undefined,
      cpfCnpj: sanitizeDocumento(cpfCnpj) || undefined,
      contato: contato.trim() || undefined,
    };

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      console.log('[CadastrarClienteModal] iniciando cadastro de cliente', payload);
      const createdCliente = await onAdd(payload);
      console.log('[CadastrarClienteModal] retorno do cadastro de cliente', createdCliente);

      if (createdCliente === null) {
        setErrorMessage('Nao foi possivel cadastrar o cliente. Confira os logs do console.');
        return;
      }

      setNome('');
      setRazaoSocial('');
      setCpfCnpj('');
      setContato('');
      setOpen(false);
    } catch (error) {
      console.error('[CadastrarClienteModal] erro ao cadastrar cliente', error);
      setErrorMessage('Erro ao cadastrar cliente. Confira os logs do console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(nextOpen);
    if (!nextOpen) setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <Button type="submit" className="w-full py-6 font-bold" disabled={!nome || isSubmitting}>
            {isSubmitting ? 'Gravando...' : 'Cadastrar Cliente'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
