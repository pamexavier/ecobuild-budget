import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lancamento, LancamentoInsert, Obra, Profissional, Cliente, Parceiro, Comissao } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sanitizeDocumento = (value?: string) => value?.replace(/\D/g, '') || undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function useAppStore(tenantId: string | null) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;

    const [obrasRes, profsRes, lancsRes, clientesRes, parceirosRes, comissoesRes] = await Promise.all([
      supabase.from('obras').select('*, orcamentos_categoria(*), clientes(nome)').eq('tenant_id', tenantId),
      supabase.from('profissionais').select('*').eq('tenant_id', tenantId),
      supabase.from('lancamentos').select('*, obras(nome)').eq('tenant_id', tenantId),
      supabase.from('clientes').select('*').eq('tenant_id', tenantId),
      supabase.from('parceiros').select('*').eq('tenant_id', tenantId),
      supabase.from('comissoes').select('*, parceiros(nome), obras(nome)').eq('tenant_id', tenantId),
    ]);

    if (obrasRes.data) {
      setObras(obrasRes.data.map((obra: any) => ({
        id: obra.id,
        nome: obra.nome,
        orcamentoLimite: obra.orcamento_limite,
        gastoAtual: obra.gasto_atual,
        clienteId: obra.cliente_id,
        clienteNome: obra.clientes?.nome,
        tipoContrato: obra.tipo_contrato || 'obra',
        categorias: obra.orcamentos_categoria?.map((cat: any) => ({
          id: cat.id,
          nome: cat.nome,
          valorPrevisto: cat.valor_previsto,
        })) || [],
      })));
    }

    if (profsRes.data) {
      setProfissionais(profsRes.data.map((prof: any) => ({
        id: prof.id,
        nome: prof.nome,
        categoria: prof.categoria,
        chavePix: prof.chave_pix,
        documento: prof.cpf,
      })));
    }

    if (lancsRes.data) {
      setLancamentos(lancsRes.data.map((item: any) => ({
        ...item,
        obraId: item.obra_id,
        profissionalId: item.profissional_id,
        obraNome: item.obras?.nome,
      })));
    }

    if (clientesRes.data) {
      setClientes(clientesRes.data.map((c: any) => ({
        id: c.id,
        nome: c.nome,
        razaoSocial: c.razao_social,
        cpfCnpj: c.cpf_cnpj,
        contato: c.contato,
      })));
    }

    if (parceirosRes.data) {
      setParceiros(parceirosRes.data.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        comissaoProjetoPct: p.comissao_projeto_pct,
        comissaoObraPct: p.comissao_obra_pct,
        comissaoRtPct: p.comissao_rt_pct,
      })));
    }

    if (comissoesRes.data) {
      setComissoes(comissoesRes.data.map((c: any) => ({
        id: c.id,
        parceiroId: c.parceiro_id,
        parceiroNome: c.parceiros?.nome,
        tipo: c.tipo,
        descricao: c.descricao,
        valorBase: c.valor_base,
        percentual: c.percentual,
        valorComissao: c.valor_comissao,
        status: c.status,
        dataLancamento: c.data_lancamento,
        dataPagamento: c.data_pagamento,
        obraId: c.obra_id,
        obraNome: c.obras?.nome,
      })));
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchData();
    else {
      setObras([]); setProfissionais([]); setLancamentos([]);
      setClientes([]); setParceiros([]); setComissoes([]);
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

  const addMultipleLancamentos = useCallback(async (items: LancamentoInsert[]) => {
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
      .insert([{
        tenant_id: tenantId,
        nome: o.nome,
        orcamento_limite: o.orcamentoLimite,
        cliente_id: o.clienteId || null,
        tipo_contrato: o.tipoContrato || 'obra',
      }])
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
      cliente_id: data.clienteId || null,
      tipo_contrato: data.tipoContrato,
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
      cpf: p.documento,
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
      cpf: data.documento,
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── CLIENTES ──────────────────────────────────────────────────
  const addCliente = useCallback(async (c: Omit<Cliente, 'id'>) => {
    if (!tenantId) {
      console.error('[useAppStore.addCliente] tenantId ausente ao tentar cadastrar cliente');
      return null;
    }

    const payload = {
      tenant_id: tenantId,
      nome: c.nome.trim(),
      razao_social: c.razaoSocial?.trim() || null,
      cpf_cnpj: sanitizeDocumento(c.cpfCnpj) || null,
      contato: c.contato?.trim() || null,
    };

    console.log('[useAppStore.addCliente] enviando insert para Supabase', payload);

    const { data, error } = await supabase
      .from('clientes')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('[useAppStore.addCliente] erro no Supabase ao cadastrar cliente', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });
      return null;
    }

    console.log('[useAppStore.addCliente] cliente criado no Supabase', data);

    const clienteFormatado: Cliente = {
      id: data.id,
      nome: data.nome,
      razaoSocial: data.razao_social || undefined,
      cpfCnpj: data.cpf_cnpj || undefined,
      contato: data.contato || undefined,
    };

    setClientes(prev => [...prev, clienteFormatado]);
    return clienteFormatado;
  }, [tenantId]);

  const deleteCliente = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('clientes').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const updateCliente = useCallback(async (id: string, data: Partial<Cliente>) => {
    if (!tenantId) return;
    await supabase.from('clientes').update({
      nome: data.nome,
      razao_social: data.razaoSocial,
      cpf_cnpj: data.cpfCnpj,
      contato: data.contato,
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── PARCEIROS ─────────────────────────────────────────────────
  const addParceiro = useCallback(async (p: Omit<Parceiro, 'id'>) => {
    if (!tenantId) return;
    await supabase.from('parceiros').insert([{
      tenant_id: tenantId,
      nome: p.nome,
      comissao_projeto_pct: p.comissaoProjetoPct,
      comissao_obra_pct: p.comissaoObraPct,
      comissao_rt_pct: p.comissaoRtPct,
    }]);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteParceiro = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('parceiros').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const updateParceiro = useCallback(async (id: string, data: Partial<Parceiro>) => {
    if (!tenantId) return;
    await supabase.from('parceiros').update({
      nome: data.nome,
      comissao_projeto_pct: data.comissaoProjetoPct,
      comissao_obra_pct: data.comissaoObraPct,
      comissao_rt_pct: data.comissaoRtPct,
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── COMISSÕES ─────────────────────────────────────────────────
  const addComissao = useCallback(async (c: Omit<Comissao, 'id' | 'parceiroNome' | 'obraNome'>) => {
    if (!tenantId) return;
    await supabase.from('comissoes').insert([{
      tenant_id: tenantId,
      parceiro_id: c.parceiroId,
      tipo: c.tipo,
      descricao: c.descricao,
      valor_base: c.valorBase,
      percentual: c.percentual,
      valor_comissao: c.valorComissao,
      status: c.status,
      data_lancamento: c.dataLancamento,
      data_pagamento: c.dataPagamento || null,
      obra_id: c.obraId || null,
    }]);
    fetchData();
  }, [tenantId, fetchData]);

  const updateComissaoStatus = useCallback(async (id: string, status: 'pendente' | 'pago', dataPagamento?: string) => {
    if (!tenantId) return;
    await supabase.from('comissoes').update({
      status,
      data_pagamento: status === 'pago' ? (dataPagamento || new Date().toISOString().split('T')[0]) : null,
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteComissao = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('comissoes').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── CATEGORIAS (local) ────────────────────────────────────────
  const updateCategorias = useCallback((cats: string[]) => setCategorias(cats), []);

  return {
    lancamentos, obras, profissionais, clientes, parceiros, comissoes, categorias,
    addLancamento, addObra, addProfissional, addCliente, addParceiro, addComissao,
    updateCategorias, addMultipleLancamentos,
    deleteObra, deleteProfissional, deleteLancamento, deleteCliente, deleteParceiro, deleteComissao,
    updateObra, updateProfissional, updateCliente, updateParceiro, updateComissaoStatus,
    fetchData,
  };
}
