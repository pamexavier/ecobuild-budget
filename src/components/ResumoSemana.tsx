import { useState } from 'react';
import { Lancamento, Obra } from '@/lib/types';

interface Props {
  lancamentos: Lancamento[];
  obras: Obra[];
}

export function ResumoSemana({ lancamentos, obras }: Props) {
  const [filtroObra, setFiltroObra] = useState('');

  const filtered = filtroObra ? lancamentos.filter(l => l.obraId === filtroObra) : lancamentos;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekEntries = filtered.filter(l => new Date(l.data) >= startOfWeek);
  const total = weekEntries.reduce((acc, l) => acc + l.valor, 0);

  return (
    <div className="space-y-4">
      <select
        value={filtroObra}
        onChange={e => setFiltroObra(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todas as obras</option>
        {obras.map(o => (
          <option key={o.id} value={o.id}>{o.nome}</option>
        ))}
      </select>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Data</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Profissional</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Cat. Orçamento</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-left">Tipo</th>
              <th className="text-xs font-medium text-muted-foreground p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {weekEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-sm text-muted-foreground p-4 text-center">
                  Nenhum lançamento nesta semana
                </td>
              </tr>
            ) : (
              weekEntries.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="text-sm p-3">{l.data}</td>
                  <td className="text-sm p-3">{l.profissional}</td>
                  <td className="text-sm p-3">{l.categoriaOrcamentoNome}</td>
                  <td className="text-sm p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      l.tipo === 'diaria' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
                    }`}>
                      {l.tipo === 'diaria' ? 'Diária' : 'Empreitada'}
                    </span>
                  </td>
                  <td className="text-sm p-3 text-right font-medium">R$ {l.valor.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          {weekEntries.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={4} className="text-sm font-semibold p-3">Total</td>
                <td className="text-sm font-semibold p-3 text-right">R$ {total.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
