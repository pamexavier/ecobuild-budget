import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Lancamento, Obra } from '@/lib/types';

interface Props {
  lancamentos: Lancamento[];
  obras: Obra[];
}

export function ResumoSemana({ lancamentos, obras }: Props) {
  const [filtroObra, setFiltroObra] = useState('');

  const filtered = filtroObra
    ? lancamentos.filter(l => l.obraId === filtroObra)
    : lancamentos;

  // Filter for this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekEntries = filtered.filter(l => new Date(l.data) >= startOfWeek);
  const total = weekEntries.reduce((acc, l) => acc + l.valor, 0);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="relative">
        <select
          value={filtroObra}
          onChange={e => setFiltroObra(e.target.value)}
          className="w-full bg-background border-2 border-foreground p-3 font-mono text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">TODAS AS OBRAS</option>
          {obras.map(o => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 pointer-events-none" />
      </div>

      {/* Table */}
      <div className="border-2 border-foreground overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="font-mono text-[10px] font-bold tracking-wider p-2 text-left">DATA</th>
              <th className="font-mono text-[10px] font-bold tracking-wider p-2 text-left">PROFISSIONAL</th>
              <th className="font-mono text-[10px] font-bold tracking-wider p-2 text-left">CAT.</th>
              <th className="font-mono text-[10px] font-bold tracking-wider p-2 text-right">VALOR</th>
            </tr>
          </thead>
          <tbody>
            {weekEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="font-mono text-xs text-muted-foreground p-3">
                  NENHUM DADO DISPONÍVEL
                </td>
              </tr>
            ) : (
              weekEntries.map(l => (
                <tr key={l.id} className="border-b border-input">
                  <td className="font-mono text-xs p-2">{l.data}</td>
                  <td className="font-mono text-xs p-2">{l.profissional}</td>
                  <td className="font-mono text-xs p-2">{l.categoria}</td>
                  <td className="font-mono text-xs p-2 text-right">R$ {l.valor.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          {weekEntries.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground">
                <td colSpan={3} className="font-mono text-xs font-bold p-2">TOTAL</td>
                <td className="font-mono text-xs font-bold p-2 text-right">R$ {total.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
