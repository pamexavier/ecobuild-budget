-- ============================================================
-- 1. LIMPEZA TOTAL DOS DADOS
-- ============================================================
TRUNCATE TABLE public.weekly_reports CASCADE;
TRUNCATE TABLE public.comissoes CASCADE;
TRUNCATE TABLE public.lancamentos CASCADE;
TRUNCATE TABLE public.orcamentos_categoria CASCADE;
TRUNCATE TABLE public.obras CASCADE;
TRUNCATE TABLE public.profissionais CASCADE;
TRUNCATE TABLE public.clientes CASCADE;
TRUNCATE TABLE public.parceiros CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;

-- ============================================================
-- 2. TABELA CENTRAL DE TENANTS (EMPRESAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  documento text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. ADICIONAR tenant_id ONDE FALTA
-- ============================================================
ALTER TABLE public.obras                ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.profissionais        ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.lancamentos          ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.orcamentos_categoria ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.weekly_reports       ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.user_roles           ADD COLUMN IF NOT EXISTS tenant_id uuid;

ALTER TABLE public.obras                ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.profissionais        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.lancamentos          ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.orcamentos_categoria ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.weekly_reports       ALTER COLUMN tenant_id SET NOT NULL;

-- Foreign keys
ALTER TABLE public.clientes               DROP CONSTRAINT IF EXISTS clientes_tenant_fk;
ALTER TABLE public.parceiros              DROP CONSTRAINT IF EXISTS parceiros_tenant_fk;
ALTER TABLE public.comissoes              DROP CONSTRAINT IF EXISTS comissoes_tenant_fk;
ALTER TABLE public.obras                  DROP CONSTRAINT IF EXISTS obras_tenant_fk;
ALTER TABLE public.profissionais          DROP CONSTRAINT IF EXISTS profissionais_tenant_fk;
ALTER TABLE public.lancamentos            DROP CONSTRAINT IF EXISTS lancamentos_tenant_fk;
ALTER TABLE public.orcamentos_categoria   DROP CONSTRAINT IF EXISTS orcamentos_categoria_tenant_fk;
ALTER TABLE public.weekly_reports         DROP CONSTRAINT IF EXISTS weekly_reports_tenant_fk;
ALTER TABLE public.user_roles             DROP CONSTRAINT IF EXISTS user_roles_tenant_fk;

ALTER TABLE public.clientes               ADD CONSTRAINT clientes_tenant_fk               FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.parceiros              ADD CONSTRAINT parceiros_tenant_fk              FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.comissoes              ADD CONSTRAINT comissoes_tenant_fk              FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.obras                  ADD CONSTRAINT obras_tenant_fk                  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.profissionais          ADD CONSTRAINT profissionais_tenant_fk          FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.lancamentos            ADD CONSTRAINT lancamentos_tenant_fk            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.orcamentos_categoria   ADD CONSTRAINT orcamentos_categoria_tenant_fk   FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.weekly_reports         ADD CONSTRAINT weekly_reports_tenant_fk         FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles             ADD CONSTRAINT user_roles_tenant_fk             FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_obras_tenant                ON public.obras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_tenant        ON public.profissionais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tenant          ON public.lancamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_categoria_tenant ON public.orcamentos_categoria(tenant_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_tenant       ON public.weekly_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant           ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant             ON public.clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parceiros_tenant            ON public.parceiros(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_tenant            ON public.comissoes(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_unique ON public.user_roles(user_id);

-- ============================================================
-- 4. SECURITY DEFINER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  EXECUTE format('SELECT COALESCE((SELECT %I FROM public.user_roles WHERE user_id = $1 LIMIT 1), false)', _permission)
    INTO result USING _user_id;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, tenant_id, pode_lancar_despesa)
  VALUES (NEW.id, 'encarregada', NULL, false);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. RLS POLICIES — isolamento por tenant
-- ============================================================

-- TENANTS
DROP POLICY IF EXISTS "Super admin full access tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own tenant"       ON public.tenants;

CREATE POLICY "Super admin full access tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.get_user_tenant(auth.uid()));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own or admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "View roles in same tenant or super admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'))
  );

CREATE POLICY "Super admin or tenant admin can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'))
  );

CREATE POLICY "Super admin or tenant admin can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'))
  );

CREATE POLICY "Super admin or tenant admin can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'))
  );

-- CLIENTES
DROP POLICY IF EXISTS "Authenticated can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert clientes"       ON public.clientes;
DROP POLICY IF EXISTS "Users can update clientes"       ON public.clientes;
DROP POLICY IF EXISTS "Users can delete clientes"       ON public.clientes;

CREATE POLICY "View clientes by tenant" ON public.clientes FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert clientes in own tenant" ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_criar_obra'));
CREATE POLICY "Update clientes in own tenant" ON public.clientes FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_editar_orcamento'));
CREATE POLICY "Delete clientes in own tenant" ON public.clientes FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- OBRAS
DROP POLICY IF EXISTS "Authenticated can view obras" ON public.obras;
DROP POLICY IF EXISTS "Users can insert obras"       ON public.obras;
DROP POLICY IF EXISTS "Users can update obras"       ON public.obras;
DROP POLICY IF EXISTS "Users can delete obras"       ON public.obras;

CREATE POLICY "View obras by tenant" ON public.obras FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert obras in own tenant" ON public.obras FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_criar_obra'));
CREATE POLICY "Update obras in own tenant" ON public.obras FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_editar_orcamento'));
CREATE POLICY "Delete obras in own tenant" ON public.obras FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- PROFISSIONAIS
DROP POLICY IF EXISTS "Authenticated can view profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Users can insert profissionais"       ON public.profissionais;
DROP POLICY IF EXISTS "Users can update profissionais"       ON public.profissionais;
DROP POLICY IF EXISTS "Users can delete profissionais"       ON public.profissionais;

CREATE POLICY "View profissionais by tenant" ON public.profissionais FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert profissionais in own tenant" ON public.profissionais FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_cadastrar_profissional'));
CREATE POLICY "Update profissionais in own tenant" ON public.profissionais FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_cadastrar_profissional'));
CREATE POLICY "Delete profissionais in own tenant" ON public.profissionais FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- LANCAMENTOS
DROP POLICY IF EXISTS "Authenticated can view lancamentos"             ON public.lancamentos;
DROP POLICY IF EXISTS "Authenticated can insert lancamentos"           ON public.lancamentos;
DROP POLICY IF EXISTS "Users with permissions can delete lancamentos"  ON public.lancamentos;
DROP POLICY IF EXISTS "Users with permissions can update lancamentos"  ON public.lancamentos;

CREATE POLICY "View lancamentos by tenant" ON public.lancamentos FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert lancamentos in own tenant" ON public.lancamentos FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_lancar_despesa'));
CREATE POLICY "Update lancamentos in own tenant" ON public.lancamentos FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_editar_orcamento'));
CREATE POLICY "Delete lancamentos in own tenant" ON public.lancamentos FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- ORCAMENTOS_CATEGORIA
DROP POLICY IF EXISTS "Authenticated can view orcamentos_categoria" ON public.orcamentos_categoria;
DROP POLICY IF EXISTS "Users can insert orcamentos_categoria"       ON public.orcamentos_categoria;
DROP POLICY IF EXISTS "Users can update orcamentos_categoria"       ON public.orcamentos_categoria;
DROP POLICY IF EXISTS "Users can delete orcamentos_categoria"       ON public.orcamentos_categoria;

CREATE POLICY "View orcamentos by tenant" ON public.orcamentos_categoria FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert orcamentos in own tenant" ON public.orcamentos_categoria FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_criar_obra'));
CREATE POLICY "Update orcamentos in own tenant" ON public.orcamentos_categoria FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_editar_orcamento'));
CREATE POLICY "Delete orcamentos in own tenant" ON public.orcamentos_categoria FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- PARCEIROS
DROP POLICY IF EXISTS "Authenticated can view parceiros" ON public.parceiros;
DROP POLICY IF EXISTS "Users can insert parceiros"       ON public.parceiros;
DROP POLICY IF EXISTS "Users can update parceiros"       ON public.parceiros;
DROP POLICY IF EXISTS "Users can delete parceiros"       ON public.parceiros;

CREATE POLICY "View parceiros by tenant" ON public.parceiros FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert parceiros in own tenant" ON public.parceiros FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));
CREATE POLICY "Update parceiros in own tenant" ON public.parceiros FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));
CREATE POLICY "Delete parceiros in own tenant" ON public.parceiros FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- COMISSOES
DROP POLICY IF EXISTS "Authenticated can view comissoes" ON public.comissoes;
DROP POLICY IF EXISTS "Users can insert comissoes"       ON public.comissoes;
DROP POLICY IF EXISTS "Users can update comissoes"       ON public.comissoes;
DROP POLICY IF EXISTS "Users can delete comissoes"       ON public.comissoes;

CREATE POLICY "View comissoes by tenant" ON public.comissoes FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert comissoes in own tenant" ON public.comissoes FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));
CREATE POLICY "Update comissoes in own tenant" ON public.comissoes FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));
CREATE POLICY "Delete comissoes in own tenant" ON public.comissoes FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));

-- WEEKLY_REPORTS
DROP POLICY IF EXISTS "Authenticated can view weekly_reports"   ON public.weekly_reports;
DROP POLICY IF EXISTS "Authenticated can insert weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Authenticated can update weekly_reports" ON public.weekly_reports;

CREATE POLICY "View weekly_reports by tenant" ON public.weekly_reports FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Insert weekly_reports in own tenant" ON public.weekly_reports FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Update weekly_reports in own tenant" ON public.weekly_reports FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()));
CREATE POLICY "Delete weekly_reports in own tenant" ON public.weekly_reports FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()) AND public.user_has_permission(auth.uid(), 'pode_gerenciar_acessos'));