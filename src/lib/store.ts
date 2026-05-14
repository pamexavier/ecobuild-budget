import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lancamento, LancamentoInsert, Obra, Profissional, Cliente, Parceiro, Comissao, ContaAReceber } from './types';

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
  const [contas, setContas] = useState<ContaAReceber[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;

    const [
      obrasRes, profsRes, lancsRes, clientesRes, parceirosRes, comissoesRes, categoriasRes, contasRes, propostasRes
    ] = await Promise.all([
      supabase.from('obras').select('*, orcamentos_categoria(*), clientes(nome)').eq('tenant_id', tenantId),
      supabase.from('profissionais').select('*').eq('tenant_id', tenantId),
      supabase.from('lancamentos').select('*, obras(nome), profissionais(nome, categoria)').eq('tenant_id', tenantId),
      supabase.from('clientes').select('*').eq('tenant_id', tenantId),
      supabase.from('parceiros').select('*').eq('tenant_id', tenantId),
      supabase.from('comissoes').select('*, parceiros(nome), obras(nome)').eq('tenant_id', tenantId),
      supabase.from('configuracoes_tenant').select('categorias').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('contas_receber').select('*').eq('tenant_id', tenantId),
      supabase.from('propostas_pagamento').select('*').eq('tenant_id', tenantId)
    ]);

    if (categoriasRes.data?.categorias) setCategorias(categoriasRes.data.categorias);

    if (contasRes.data) {
      setContas(contasRes.data.map((c: any) => ({
        id: c.id,
        obraId: c.obra_id,
        descricao: c.descricao,
        valor: Number(c.valor),
        dataVencimento: new Date(c.data_vencimento),
        dataPagamento: c.data_pagamento ? new Date(c.data_pagamento) : undefined,
        status: c.status,
        propostaId: c.proposta_id
      })));
    }

    if (propostasRes.data) setPropostas(propostasRes.data.map((p: any) => ({ ...p.dados })));

    const lancamentosFormatados: Lancamento[] = (lancsRes.data || []).map((item: any) => ({
      ...item,
      valor: Number(item.valor) || 0,
      obraId: item.obra_id,
      profissionalId: item.profissional_id,
      obraNome: item.obras?.nome,
      profissional: item.profissionais?.nome,
      categoria: item.profissionais?.categoria,
      categoriaOrcamentoId: item.categoria_orcamento_id || '',
      categoriaOrcamentoNome: item.categoria_orcamento_nome || item.profissionais?.categoria || 'Geral',
      descricaoEtapa: item.descricao_etapa || undefined,
    }));

    setLancamentos(lancamentosFormatados);

    if (obrasRes.data) {
      setObras(obrasRes.data.map((obra: any) => ({
        id: obra.id,
        nome: obra.nome,
        orcamentoLimite: obra.orcamento_limite,
        gastoAtual: lancamentosFormatados.filter(l => l.obraId === obra.id).reduce((s, l) => s + l.valor, 0),
        clienteId: obra.cliente_id,
        clienteNome: obra.clientes?.nome,
        tipoContrato: obra.tipo_contrato || 'obra',
        categorias: obra.orcamentos_categoria?.map((cat: any) => ({
          id: cat.id,
          nome: cat.nome,
          valor_previsto: cat.valor_previsto,
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
        cpf: p.cpf, // Adicionado
        telefone: p.telefone, // Adicionado
        endereco: p.endereco, // Adicionado
        comissaoProjetoPct: p.comissao_projeto_pct,
        comissaoObraPct: p.comissao_obra_pct,
        comissaoRtPct: p.comissao_rt_pct,
        fotoUrl: p.foto_url, // Adicionado
        documentoPdfUrl: p.documento_pdf_url // Adicionado
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
      setContas([]); setPropostas([]);
    }
  }, [fetchData, tenantId]);

  // ── FUNÇÕES DE CONTAS A RECEBER ──
  const addConta = useCallback(async (c: Omit<ContaAReceber, 'id'>) => {
    if (!tenantId) return;
    await supabase.from('contas_receber').insert([{ tenant_id: tenantId, obra_id: c.obraId, descricao: c.descricao, valor: c.valor, data_vencimento: c.dataVencimento.toISOString().split('T')[0], status: c.status, proposta_id: c.propostaId }]);
    fetchData();
  }, [tenantId, fetchData]);

  const updateConta = useCallback(async (c: ContaAReceber) => {
    if (!tenantId) return;
    await supabase.from('contas_receber').update({ descricao: c.descricao, valor: c.valor, data_vencimento: typeof c.dataVencimento === 'string' ? c.dataVencimento : c.dataVencimento.toISOString().split('T')[0], data_pagamento: c.dataPagamento ? (typeof c.dataPagamento === 'string' ? c.dataPagamento : c.dataPagamento.toISOString().split('T')[0]) : null, status: c.status }).eq('id', c.id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteConta = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('contas_receber').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE PROPOSTAS ──
  const salvarProposta = useCallback(async (p: any) => {
    if (!tenantId) return;
    await supabase.from('propostas_pagamento').upsert([{ id: p.id, tenant_id: tenantId, obra_id: p.obraId, dados: p }]);
    const novasContas = p.parcelas.map((parc: any) => ({ tenant_id: tenantId, obra_id: p.obraId, descricao: `Parcela ${parc.numero} - ${p.obraNome}`, valor: parc.valor, data_vencimento: parc.dataVencimento.toISOString().split('T')[0], status: 'pendente', proposta_id: p.id }));
    if (novasContas.length > 0) await supabase.from('contas_receber').insert(novasContas);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE LANÇAMENTOS ──
  const addLancamento = useCallback(async (l: Omit<Lancamento, 'id'>) => {
    if (!tenantId) return;
    await supabase.from('lancamentos').insert([{ tenant_id: tenantId, obra_id: l.obraId, profissional_id: l.profissionalId, tipo: l.tipo, valor: l.valor, turnos: l.turnos, data: l.data, descricao_etapa: l.descricaoEtapa }]);
    fetchData();
  }, [tenantId, fetchData]);

  const addMultipleLancamentos = useCallback(async (items: LancamentoInsert[]) => {
    if (!tenantId) return;
    const rows = items.map(l => ({ tenant_id: tenantId, obra_id: l.obraId, profissional_id: l.profissionalId, tipo: l.tipo, valor: l.valor, turnos: l.turnos, data: l.data }));
    if (rows.length > 0) await supabase.from('lancamentos').insert(rows);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteLancamento = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('lancamentos').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE OBRAS ──
  const addObra = useCallback(async (o: Omit<Obra, 'id' | 'gastoAtual'>) => {
    if (!tenantId) return;
    const { data: novaObra } = await supabase.from('obras').insert([{ tenant_id: tenantId, nome: o.nome, orcamento_limite: o.orcamentoLimite, cliente_id: o.clienteId || null, tipo_contrato: o.tipoContrato || 'obra' }]).select().single();
    if (novaObra && o.categorias) {
      const cats = o.categorias.map(cat => ({ tenant_id: tenantId, obra_id: novaObra.id, nome: cat.nome, valor_previsto: cat.valorPrevisto }));
      await supabase.from('orcamentos_categoria').insert(cats);
    }
    fetchData();
  }, [tenantId, fetchData]);

  const updateObra = useCallback(async (id: string, data: Partial<Obra>) => {
    if (!tenantId) return;
    await supabase.from('obras').update({ nome: data.nome, orcamento_limite: data.orcamentoLimite, cliente_id: data.clienteId || null, tipo_contrato: data.tipoContrato }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteObra = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('obras').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE PROFISSIONAIS ──
  const addProfissional = useCallback(async (p: Omit<Profissional, 'id'>) => {
    if (!tenantId) return;
    await supabase.from('profissionais').insert([{ tenant_id: tenantId, nome: p.nome, categoria: p.categoria, chave_pix: p.chavePix, cpf: p.documento }]);
    fetchData();
  }, [tenantId, fetchData]);

  const updateProfissional = useCallback(async (id: string, data: Partial<Profissional>) => {
    if (!tenantId) return;
    await supabase.from('profissionais').update({ nome: data.nome, categoria: data.categoria, chave_pix: data.chavePix, cpf: data.documento }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteProfissional = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('profissionais').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE CLIENTES ──
  const addCliente = useCallback(async (c: Omit<Cliente, 'id'>) => {
    if (!tenantId) return null;
    const { data } = await supabase.from('clientes').insert([{ tenant_id: tenantId, nome: c.nome.trim(), razao_social: c.razaoSocial?.trim() || null, cpf_cnpj: sanitizeDocumento(c.cpfCnpj) || null, contato: c.contato?.trim() || null }]).select('*').single();
    fetchData();
    return data;
  }, [tenantId, fetchData]);

  const updateCliente = useCallback(async (id: string, data: Partial<Cliente>) => {
    if (!tenantId) return;
    await supabase.from('clientes').update({ nome: data.nome, razao_social: data.razaoSocial, cpf_cnpj: sanitizeDocumento(data.cpfCnpj), contato: data.contato }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteCliente = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('clientes').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE PARCEIROS (COLABORADORES) ──
  const addParceiro = useCallback(async (p: any) => {
    if (!tenantId) return;
    await supabase.from('parceiros').insert([{ 
      tenant_id: tenantId, 
      nome: p.nome, 
      cpf: p.cpf,
      telefone: p.telefone,
      endereco: p.endereco,
      comissao_projeto_pct: p.comissaoProjetoPct, 
      comissao_obra_pct: p.comissaoObraPct, 
      comissao_rt_pct: p.comissaoRtPct,
      foto_url: p.fotoUrl,
      documento_pdf_url: p.documentoPdfUrl 
    }]);
    fetchData();
  }, [tenantId, fetchData]);

  const updateParceiro = useCallback(async (id: string, data: any) => {
    if (!tenantId) return;
    await supabase.from('parceiros').update({ 
      nome: data.nome, 
      cpf: data.cpf,
      telefone: data.telefone,
      endereco: data.endereco,
      comissao_projeto_pct: data.comissaoProjetoPct, 
      comissao_obra_pct: data.comissaoObraPct, 
      comissao_rt_pct: data.comissaoRtPct,
      foto_url: data.fotoUrl,
      documento_pdf_url: data.documentoPdfUrl 
    }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteParceiro = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('parceiros').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  // ── FUNÇÕES DE COMISSÕES ──
  const addComissao = useCallback(async (c: Omit<Comissao, 'id' | 'parceiroNome' | 'obraNome'>) => {
    if (!tenantId) return;
    await supabase.from('comissoes').insert([{ tenant_id: tenantId, parceiro_id: c.parceiroId, tipo: c.tipo, descricao: c.descricao, valor_base: c.valorBase, percentual: c.percentual, valor_comissao: c.valorComissao, status: c.status, data_lancamento: c.dataLancamento, obra_id: c.obraId || null }]);
    fetchData();
  }, [tenantId, fetchData]);

  const updateComissaoStatus = useCallback(async (id: string, status: 'pendente' | 'pago') => {
    if (!tenantId) return;
    await supabase.from('comissoes').update({ status, data_pagamento: status === 'pago' ? new Date().toISOString().split('T')[0] : null }).eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const deleteComissao = useCallback(async (id: string) => {
    if (!tenantId) return;
    await supabase.from('comissoes').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  }, [tenantId, fetchData]);

  const updateCategorias = useCallback(async (cats: string[]) => {
    if (!tenantId) return;
    setCategorias(cats);
    await supabase.from('configuracoes_tenant').upsert({ tenant_id: tenantId, categorias: cats }, { onConflict: 'tenant_id' });
  }, [tenantId]);

  return {
    // Listas de Dados
    lancamentos, obras, profissionais, clientes, parceiros, comissoes, categorias, contas, propostas,
    
    // Funções de Criação
    addLancamento, addMultipleLancamentos, addObra, addProfissional, addCliente, addParceiro, addComissao, addConta, salvarProposta,
    
    // Funções de Edição
    updateObra, updateProfissional, updateCliente, updateParceiro, updateComissaoStatus, updateConta, updateCategorias,
    
    // Funções de Exclusão
    deleteObra, deleteProfissional, deleteLancamento, deleteCliente, deleteParceiro, deleteComissao, deleteConta,
    
    // Sincronização
    fetchData,
  };
}