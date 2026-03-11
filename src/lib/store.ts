import { useState, useCallback } from 'react';
import { Lancamento, Obra, Profissional, OBRAS_MOCK, PROFISSIONAIS_MOCK, CATEGORIAS_ORCAMENTO_SUGESTOES } from './types';

let globalLancamentos: Lancamento[] = [];
let globalObras: Obra[] = [...OBRAS_MOCK];
let globalProfissionais: Profissional[] = [...PROFISSIONAIS_MOCK];
let globalCategorias: string[] = [...CATEGORIAS_ORCAMENTO_SUGESTOES];
export function useAppStore() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(globalLancamentos);
  const [obras, setObras] = useState<Obra[]>(globalObras);
  const [profissionais, setProfissionais] = useState<Profissional[]>(globalProfissionais);

  const addLancamento = useCallback((l: Omit<Lancamento, 'id'>) => {
    const newL: Lancamento = { ...l, id: crypto.randomUUID() };
    globalLancamentos = [newL, ...globalLancamentos];
    setLancamentos([...globalLancamentos]);

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

  const addObra = useCallback((o: Omit<Obra, 'id' | 'gastoAtual'>) => {
    const newO: Obra = { ...o, id: crypto.randomUUID(), gastoAtual: 0 };
    globalObras = [...globalObras, newO];
    setObras([...globalObras]);
    return newO;
  }, []);

  const addProfissional = useCallback((p: Omit<Profissional, 'id'>) => {
    const newP: Profissional = { ...p, id: crypto.randomUUID() };
    globalProfissionais = [...globalProfissionais, newP];
    setProfissionais([...globalProfissionais]);
    return newP;
  }, []);

  const [categorias, setCategorias] = useState<string[]>(globalCategorias);

  const updateCategorias = useCallback((cats: string[]) => {
    globalCategorias = cats;
    setCategorias([...globalCategorias]);
  }, []);

  return { lancamentos, obras, profissionais, categorias, addLancamento, addMultipleLancamentos, addObra, addProfissional, updateCategorias };
}
