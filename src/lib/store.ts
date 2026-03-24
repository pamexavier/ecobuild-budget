import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lancamento, Obra, Profissional } from './types';

export { supabase };

export function useAppStore() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']);

  const fetchData = useCallback(async () => {
    const { data: o } = await supabase.from('obras').select('*, orcamentos_categoria(*)');
    const { data: p } = await supabase.from('profissionais').select('*');
    const { data: l } = await supabase.from('lancamentos').select('*, obras(nome)');
    
    if (o) {
      const obrasFormatadas = o.map((obra: any) => ({
        id: obra.id,
        nome: obra.nome,
        orcamentoLimite: obra.orcamento_limite,
        gastoAtual: obra.gasto_atual,
        categorias: obra.orcamentos_categoria?.map((cat: any) => ({
          id: cat.id,
          nome: cat.nome,
          valorPrevisto: cat.valor_previsto
        })) || []
      }));
      setObras(obrasFormatadas);
    }
    if (p) setProfissionais(p.map((prof: any) => ({
      id: prof.id,
      nome: prof.nome,
      categoria: prof.categoria,
      chavePix: prof.chave_pix,
      cpf: prof.cpf,
    })));
    if (l) setLancamentos(l.map((item: any) => ({ ...item, obraNome: item.obras?.nome })));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addLancamento = useCallback(async (l: Omit<Lancamento, 'id'>) => {
    await supabase.from('lancamentos').insert([{
      obra_id: l.obraId,
      profissional_id: l.profissionalId,
      tipo: l.tipo,
      valor: l.valor,
      turnos: l.turnos,
      data: l.data
    }]);
    fetchData();
  }, [fetchData]);

  const addObra = useCallback(async (o: Omit<Obra, 'id' | 'gastoAtual'>) => {
    const { data: novaObra } = await supabase.from('obras').insert([{
      nome: o.nome,
      orcamento_limite: o.orcamentoLimite
    }]).select().single();

    if (novaObra && o.categorias) {
      const categoriasBanco = o.categorias.map(cat => ({
        obra_id: novaObra.id,
        nome: cat.nome,
        valor_previsto: cat.valorPrevisto
      }));
      await supabase.from('orcamentos_categoria').insert(categoriasBanco);
    }
    fetchData();
  }, [fetchData]);

  const addProfissional = useCallback(async (p: Omit<Profissional, 'id'>) => {
    await supabase.from('profissionais').insert([{
      nome: p.nome,
      categoria: p.categoria,
      chave_pix: p.chavePix
    }]);
    fetchData();
  }, [fetchData]);

  // Delete functions
  const deleteObra = useCallback(async (id: string) => {
    await supabase.from('obras').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  const deleteProfissional = useCallback(async (id: string) => {
    await supabase.from('profissionais').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  const deleteLancamento = useCallback(async (id: string) => {
    await supabase.from('lancamentos').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  // Update functions
  const updateObra = useCallback(async (id: string, data: Partial<Obra>) => {
    await supabase.from('obras').update({
      nome: data.nome,
      orcamento_limite: data.orcamentoLimite,
    }).eq('id', id);
    fetchData();
  }, [fetchData]);

  const updateProfissional = useCallback(async (id: string, data: Partial<Profissional>) => {
    await supabase.from('profissionais').update({
      nome: data.nome,
      categoria: data.categoria,
      chave_pix: data.chavePix,
    }).eq('id', id);
    fetchData();
  }, [fetchData]);

  const updateCategorias = useCallback((cats: string[]) => setCategorias(cats), []);
  const addMultipleLancamentos = useCallback(async (items: Omit<Lancamento, 'id'>[]) => {
    const rows = items.map(l => ({
      obra_id: l.obraId,
      profissional_id: l.profissionalId,
      tipo: l.tipo,
      valor: l.valor,
      turnos: l.turnos,
      data: l.data
    }));
    if (rows.length > 0) await supabase.from('lancamentos').insert(rows);
    fetchData();
  }, [fetchData]);

  return { 
    lancamentos, obras, profissionais, categorias, 
    addLancamento, addObra, addProfissional, updateCategorias, addMultipleLancamentos, 
    deleteObra, deleteProfissional, deleteLancamento,
    updateObra, updateProfissional,
    fetchData 
  };
}
