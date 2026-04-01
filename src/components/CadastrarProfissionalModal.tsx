import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus } from 'lucide-react';
import { Profissional, CATEGORIAS } from '@/lib/types';

interface Props {
  onAdd: (p: Omit<Profissional, 'id'>) => void;
  trigger?: React.ReactNode;
  defaultValues?: {
    nome?: string;
    categoria?: string;
    documento?: string;
  };
}

const TIPOS_PIX = ['CPF/CNPJ', 'E-mail', 'Telefone', 'Chave Aleatória'];

export function CadastrarProfissionalModal({ onAdd, trigger, defaultValues }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('');
  const [chavePix, setChavePix] = useState('');

  useEffect(() => {
    if (open && defaultValues) {
      if (defaultValues.nome) setNome(defaultValues.nome);
      if (defaultValues.documento) setDocumento(defaultValues.documento);
      if (defaultValues.categoria) {
        const match = CATEGORIAS.find(c =>
          c.toLowerCase().includes(defaultValues.categoria!.toLowerCase())
        );
        if (match) setCategoria(match);
      }
    }
  }, [open, defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoria) return;
    onAdd({
      nome,
      categoria,
      documento: documento || undefined,
      tipoChavePix: tipoChavePix || undefined,
      chavePix: chavePix || undefined,
    });
    setNome(''); setDocumento(''); setCategoria('');
    setTipoChavePix(''); setChavePix('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            Novo Profissional
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {defaultValues?.nome ? 'Vincular Novo Profissional' : 'Cadastrar Profissional'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {defaultValues?.nome && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-xs text-primary mb-2">
              <strong>Dica:</strong> Cadastrando fornecedor da planilha para vincular ao sistema.
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Nome Completo / Empresa</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Carlos Silva" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">CPF ou CNPJ</label>
            <input type="text" value={documento} onChange={e => setDocumento(e.target.value)} placeholder="000.000.000-00" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Categoria / Função</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring" required>
              <option value="">Selecione</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Tipo de PIX</label>
              <select value={tipoChavePix} onChange={e => setTipoChavePix(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Tipo...</option>
                {TIPOS_PIX.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Chave PIX</label>
              <input type="text" value={chavePix} onChange={e => setChavePix(e.target.value)} placeholder="Chave PIX" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <Button type="submit" className="w-full py-6 font-bold">
            {defaultValues?.nome ? 'Confirmar e Vincular' : 'Finalizar Cadastro'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
