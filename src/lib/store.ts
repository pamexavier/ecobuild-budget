import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lancamento, Obra, Profissional } from './types';

// Conexão com o seu banco
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export function useAppStore() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']);

  // Puxa os dados do Supabase
  const fetchData = useCallback(async () => {
    // Busca as obras e suas categorias de orçamento
    const { data: o } = await supabase.from('obras').select('*, orcamentos_categoria(*)');
    const { data: p } = await supabase.from('profissionais').select('*');
    const { data: l } = await supabase.from('lancamentos').select('*, obras(nome)');
    
    if (o) {
      // Formata os nomes do banco (snake_case) para o React (camelCase)
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
    if (p) setProfissionais(p);
    if (l) setLancamentos(l.map((item: any) => ({ ...item, obraNome: item.obras?.nome })));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Salva Lançamento
  const addLancamento = useCallback(async (l: Omit<Lancamento, 'id'>) => {
    await supabase.from('lancamentos').insert([{
      obra_id: l.obraId,
      profissional_id: l.profissionalId,
      tipo: l.tipo,
      valor: l.valor,
      turnos: l.turnos,
      data: l.data
    }]);
    fetchData(); // Atualiza a tela
  }, [fetchData]);

  // Salva Obra + Categorias de Orçamento
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
    return novaObra;
  }, [fetchData]);

  // Salva Profissional com PIX
  const addProfissional = useCallback(async (p: Omit<Profissional, 'id'>) => {
    const { data } = await supabase.from('profissionais').insert([{
      nome: p.nome,
      categoria: p.categoria,
      chave_pix: p.chavePix
    }]).select().single();
    fetchData();
    return data;
  }, [fetchData]);

  // Funções secundárias da tela
  const updateCategorias = useCallback((cats: string[]) => setCategorias(cats), []);
  const addMultipleLancamentos = useCallback(async (items: any[]) => {}, []);

  return { 
    lancamentos, obras, profissionais, categorias, 
    addLancamento, addObra, addProfissional, updateCategorias, addMultipleLancamentos, 
    fetchData 
  };
}