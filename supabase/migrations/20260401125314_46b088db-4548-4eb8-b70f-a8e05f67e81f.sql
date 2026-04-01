
-- Tabela de Clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome text NOT NULL,
  razao_social text,
  cpf_cnpj text,
  contato text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_criar_obra = true)
);
CREATE POLICY "Users can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_editar_orcamento = true)
);
CREATE POLICY "Users can delete clientes" ON public.clientes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);

-- Adicionar cliente_id e tipo_contrato em obras
ALTER TABLE public.obras ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;
ALTER TABLE public.obras ADD COLUMN tipo_contrato text NOT NULL DEFAULT 'obra';

-- Tabela de Parceiros
CREATE TABLE public.parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome text NOT NULL,
  comissao_projeto_pct numeric NOT NULL DEFAULT 0,
  comissao_obra_pct numeric NOT NULL DEFAULT 0,
  comissao_rt_pct numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view parceiros" ON public.parceiros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert parceiros" ON public.parceiros FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);
CREATE POLICY "Users can update parceiros" ON public.parceiros FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);
CREATE POLICY "Users can delete parceiros" ON public.parceiros FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);

-- Tabela de Comissões
CREATE TABLE public.comissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  parceiro_id uuid NOT NULL REFERENCES public.parceiros(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'rt',
  descricao text,
  valor_base numeric NOT NULL DEFAULT 0,
  percentual numeric NOT NULL DEFAULT 0,
  valor_comissao numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  data_lancamento date NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento date,
  obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view comissoes" ON public.comissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert comissoes" ON public.comissoes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);
CREATE POLICY "Users can update comissoes" ON public.comissoes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);
CREATE POLICY "Users can delete comissoes" ON public.comissoes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND pode_gerenciar_acessos = true)
);
