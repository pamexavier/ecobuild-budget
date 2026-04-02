import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus, X } from 'lucide-react';
import { Profissional, CATEGORIAS } from '@/lib/types';

interface Props {
  onAdd: (p: Omit<Profissional, 'id'>) => void;
  trigger?: React.ReactNode;
  defaultValues?: {
    nome?: string;
    categoria?: string;
    documento?: string;
  };
  categoriasExtras?: string[];
  onNovaCategoria?: (nova: string) => void;
}

const TIPOS_PIX = ['CPF/CNPJ', 'E-mail', 'Telefone', 'Chave Aleatória'];

const BASE_CATEGORIAS = [...CATEGORIAS];

export function CadastrarProfissionalModal({ onAdd, trigger, defaultValues, categoriasExtras = [], onNovaCategoria }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [adicionandoCategoria, setAdicionandoCategoria] = useState(false);

  const todasCategorias = [...new Set([...BASE_CATEGORIAS, ...categoriasExtras])];

  useEffect(() => {
    if (open && defaultValues) {
      if (defaultValues.nome) setNome(defaultValues.nome);
      if (defaultValues.documento) setDocumento(defaultValues.documento);
      if (defaultValues.categoria) {
        const match = todasCategorias.find(c =>
          c.toLowerCase().includes(defaultValues.categoria!.toLowerCase())
        );
        if (match) setCategoria(match);
      }
    }
  }, [open, defaultValues]);

  const confirmarNovaCategoria = () => {
    const trimmed = novaCategoria.trim();
    if (!trimmed) return;
    onNovaCategoria?.(trimmed);
    setCategoria(trimmed);
    setNovaCategoria('');
    setAdicionandoCategoria(false);
  };

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
    setAdicionandoCategoria(false); setNovaCategoria('');
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
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">CPF ou CNPJ</label>
            <input
              type="text"
              value={documento}
              onChange={e => setDocumento(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Categoria com opção de criar nova */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Categoria / Função</label>
            {!adicionandoCategoria ? (
              <div className="flex gap-2">
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Selecione</option>
                  {todasCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setAdicionandoCategoria(true)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaCategoria}
                  onChange={e => setNovaCategoria(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), confirmarNovaCategoria())}
                  placeholder="Ex: Mestre de Obras"
                  className="flex-1 rounded-lg border border-primary bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={confirmarNovaCategoria}
                  className="flex items-center gap-1 text-xs text-white font-semibold bg-primary rounded-lg px-3 py-2 hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => { setAdicionandoCategoria(false); setNovaCategoria(''); }}
                  className="flex items-center justify-center border border-input rounded-lg px-2 py-2 hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
            {categoria && !adicionandoCategoria && (
              <p className="text-xs text-muted-foreground mt-1">
                Selecionado: <span className="text-primary font-medium">{categoria}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Tipo de PIX</label>
              <select
                value={tipoChavePix}
                onChange={e => setTipoChavePix(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tipo...</option>
                {TIPOS_PIX.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Chave PIX</label>
              <input
                type="text"
                value={chavePix}
                onChange={e => setChavePix(e.target.value)}
                placeholder="Chave PIX"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
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