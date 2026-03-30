import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lancamento, Obra, Profissional } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * useAppStore — todas as queries filtram por tenant_id.
 * Recebe tenantId do useAuth (nunca busca direto do banco).
 */
export function useAppStore(tenantId: string | null) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;

    const { data: o } = await supabase
      .from('obras')
      .select('*, orcamentos_categoria(*)')
      .eq('tenant_id', tenantId);

    const { data: p } = await supabase
      .from('profissionais')
      .select('*')
      .eq('tenant_id', tenantId);

    const { data: l } = await supabase
      .from('lancamentos')
      .select('*, obras(nome)')
      .eq('tenant_id', tenantId);

    if (o) {
      setObras(o.map((obra: any) => ({
        id: obra.id,
        nome: obra.nome,
        orcamentoLimite: obra.orcamento_limite,
        gastoAtual: obra.gasto_atual,
        categorias: obra.orcamentos_categoria?.map((cat: any) => ({
          id: cat.id,
          nome: cat.nome,
          valorPrevisto: cat.valor_previsto,
        })) || [],
      })));
    }

    if (p) {
      setProfissionais(p.map((prof: any) => ({
        id: prof.id,
        nome: prof.nome,
        categoria: prof.categoria,
        chavePix: prof.chave_pix,
        cpf: prof.cpf,
      })));
    }

    if (l) {
      setLancamentos(l.map((item: any) => ({
        ...item,
        obraNome: item.obras?.nome,
      })));
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchData();
    else {
      setObras([]);
      setProfissionais([]);
      setLancamentos([]);
    }
  }, [fetchData, tenantId]);

  // ── LANCAMENTOS ──────────────────────────────────────────────
  const addLancamento = useCallback(async (l: Omit<Lancamento, 'id'>) => {
    if (!tenantId) return;
    await supabase.from('lancamentos').insert([{
      tenant_id: tenantId,
      obra_id: l.obraId,
      profissional_id: l.profissionalId,
      tipo: l.tipo,
      valor: l.valor,
      turnos: l.turnos,
      data: l.data,
    }]);
    fetchData();
  }, [tenantId, fetchData]);

  const addMultipleLancamentos = useCallback(async (items: Omit<Lancamento, 'id'>[]) => {
    if (!tenantId) return;
    const rows = items.map(l => ({
      tenant_id: tenantId,
      obra_id: l.obraId,
      profissional_id: l.profissionalId,
      tipo: l.tipo,
      valor: l.valor,
      turnos: l.turnos,
      data: l.data,
    }));
    if (rows.length > 0) await supabase.from('lancamentos').insert(rows);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteLancamento = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('lancamentos').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── OBRAS ────────────────────────────────────────────────────
  const addObra = useCallback(async (o: Omit<Obra, 'id' | 'gastoAtual'>) => {
    if (!tenantId) return;
    const { data: novaObra } = await supabase
      .from('obras')
      .insert([{ tenant_id: tenantId, nome: o.nome, orcamento_limite: o.orcamentoLimite }])
      .select()
      .single();

    if (novaObra && o.categorias) {
      const cats = o.categorias.map(cat => ({
        tenant_id: tenantId,
        obra_id: novaObra.id,
        nome: cat.nome,
        valor_previsto: cat.valorPrevisto,
      }));
      await supabase.from('orcamentos_categoria').insert(cats);
    }
    fetchData();
  }, [tenantId, fetchData]);

  const deleteObra = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('obras').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const updateObra = useCallback(async (id: string, data: Partial<Obra>) => {
    if (!tenantId) return;
    await supabase.from('obras').update({
      nome: data.nome,
      orcamento_limite: data.orcamentoLimite,
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── PROFISSIONAIS ─────────────────────────────────────────────
  const addProfissional = useCallback(async (p: Omit<Profissional, 'id'>) => {
    if (!tenantId) return;
    await supabase.from('profissionais').insert([{
      tenant_id: tenantId,
      nome: p.nome,
      categoria: p.categoria,
      chave_pix: p.chavePix,
      cpf: p.cpf,
    }]);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteProfissional = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('profissionais').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const updateProfissional = useCallback(async (id: string, data: Partial<Profissional>) => {
    if (!tenantId) return;
    await supabase.from('profissionais').update({
      nome: data.nome,
      categoria: data.categoria,
      chave_pix: data.chavePix,
      cpf: data.cpf,
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── CATEGORIAS (local) ────────────────────────────────────────
  const updateCategorias = useCallback((cats: string[]) => setCategorias(cats), []);

  return {
    lancamentos, obras, profissionais, categorias,
    addLancamento, addObra, addProfissional, updateCategorias, addMultipleLancamentos,
    deleteObra, deleteProfissional, deleteLancamento,
    updateObra, updateProfissional,
    fetchData,
  };
}