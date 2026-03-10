import { useState, useCallback } from 'react';
import { Lancamento, Obra, OBRAS_MOCK } from './types';

// Simple in-memory store for MVP
let globalLancamentos: Lancamento[] = [];
let globalObras: Obra[] = [...OBRAS_MOCK];

export function useAppStore() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(globalLancamentos);
  const [obras, setObras] = useState<Obra[]>(globalObras);

  const addLancamento = useCallback((l: Omit<Lancamento, 'id'>) => {
    const newL: Lancamento = { ...l, id: crypto.randomUUID() };
    globalLancamentos = [newL, ...globalLancamentos];
    setLancamentos([...globalLancamentos]);

    // Update obra gasto
    globalObras = globalObras.map(o =>
      o.id === l.obraId ? { ...o, gastoAtual: o.gastoAtual + l.valor } : o
    );
    setObras([...globalObras]);
    return newL;
  }, []);

  const addMultipleLancamentos = useCallback((items: Omit<Lancamento, 'id'>[]) => {
    const newItems = items.map(l => ({ ...l, id: crypto.randomUUID() }));
    globalLancamentos = [...newItems, ...globalLancamentos];
    setLancamentos([...globalLancamentos]);

    items.forEach(l => {
      globalObras = globalObras.map(o =>
        o.id === l.obraId ? { ...o, gastoAtual: o.gastoAtual + l.valor } : o
      );
    });
    setObras([...globalObras]);
  }, []);

  return { lancamentos, obras, addLancamento, addMultipleLancamentos };
}
