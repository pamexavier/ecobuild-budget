
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  semana_inicio date NOT NULL,
  semana_fim date NOT NULL,
  total_semanal numeric NOT NULL DEFAULT 0,
  total_mensal numeric NOT NULL DEFAULT 0,
  total_acumulado numeric NOT NULL DEFAULT 0,
  dados_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(obra_id, semana_fim)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view weekly_reports"
  ON public.weekly_reports FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert weekly_reports"
  ON public.weekly_reports FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update weekly_reports"
  ON public.weekly_reports FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Gestors can delete lancamentos" ON public.lancamentos;
DROP POLICY IF EXISTS "Gestors can update lancamentos" ON public.lancamentos;

CREATE POLICY "Users with permissions can delete lancamentos"
  ON public.lancamentos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_gerenciar_acessos = true
    )
  );

CREATE POLICY "Users with permissions can update lancamentos"
  ON public.lancamentos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_editar_orcamento = true
    )
  );

DROP POLICY IF EXISTS "Gestors can delete obras" ON public.obras;
DROP POLICY IF EXISTS "Gestors can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Gestors can update obras" ON public.obras;

CREATE POLICY "Users can insert obras"
  ON public.obras FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_criar_obra = true
    )
  );

CREATE POLICY "Users can update obras"
  ON public.obras FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_editar_orcamento = true
    )
  );

CREATE POLICY "Users can delete obras"
  ON public.obras FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_gerenciar_acessos = true
    )
  );

DROP POLICY IF EXISTS "Gestors can delete profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Gestors can insert profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Gestors can update profissionais" ON public.profissionais;

CREATE POLICY "Users can insert profissionais"
  ON public.profissionais FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_cadastrar_profissional = true
    )
  );

CREATE POLICY "Users can update profissionais"
  ON public.profissionais FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_cadastrar_profissional = true
    )
  );

CREATE POLICY "Users can delete profissionais"
  ON public.profissionais FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_gerenciar_acessos = true
    )
  );

DROP POLICY IF EXISTS "Gestors can delete orcamentos_categoria" ON public.orcamentos_categoria;
DROP POLICY IF EXISTS "Gestors can insert orcamentos_categoria" ON public.orcamentos_categoria;
DROP POLICY IF EXISTS "Gestors can update orcamentos_categoria" ON public.orcamentos_categoria;

CREATE POLICY "Users can insert orcamentos_categoria"
  ON public.orcamentos_categoria FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_criar_obra = true
    )
  );

CREATE POLICY "Users can update orcamentos_categoria"
  ON public.orcamentos_categoria FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_editar_orcamento = true
    )
  );

CREATE POLICY "Users can delete orcamentos_categoria"
  ON public.orcamentos_categoria FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND pode_gerenciar_acessos = true
    )
  );

DROP POLICY IF EXISTS "Gestors can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestors can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestors can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestors can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Users can view own or admin can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.pode_gerenciar_acessos = true
    )
  );

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.pode_gerenciar_acessos = true
    )
  );

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.pode_gerenciar_acessos = true
    )
  );

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.pode_gerenciar_acessos = true
    )
  );
