import { useState } from 'react';
import { Zap, UserCheck, DollarSign, CalendarDays } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Profissional, Obra } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissionais: Profissional[];
  obras: Obra[];
  onSubmit: (l: { obraId: string; profissionalId: string; valor: number; tipo: string; data: string; turnos: string[] }) => void;
}

export function AdiantamentoModal({ open, onOpenChange, profissionais, obras, onSubmit }: Props) {
  const { toast } = useToast();
  const hoje = new Date().toISOString().split('T')[0];
  const [profissionalId, setProfissionalId] = useState('');
  const [obraId, setObraId] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(hoje);

  const handleSave = () => {
    if (!profissionalId || !obraId || !valor || Number(valor) <= 0) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    onSubmit({
      obraId,
      profissionalId,
      valor: Number(valor),
      tipo: 'diaria',
      data,
      turnos: ['[ADIANTAMENTO]'],
    });
    toast({ title: 'Adiantamento registrado ✓' });
    setProfissionalId('');
    setObraId('');
    setValor('');
    setData(hoje);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong rounded-3xl max-w-[92vw] sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            Novo Adiantamento
          </DialogTitle>
          <DialogDescription>Registre um adiantamento semanal rápido.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Profissional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Profissional
            </label>
            <select
              value={profissionalId}
              onChange={e => setProfissionalId(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione...</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Obra */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Obra
            </label>
            <select
              value={obraId}
              onChange={e => setObraId(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione...</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Valor (R$)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-2xl border border-input bg-background px-4 py-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Data
            </label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full py-6 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-2"
          >
            <Zap className="w-5 h-5 mr-2" />
            Confirmar Adiantamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
