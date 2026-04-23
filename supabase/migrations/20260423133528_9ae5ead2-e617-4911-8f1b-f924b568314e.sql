CREATE OR REPLACE FUNCTION public.super_admin_create_tenant(
  p_tenant_nome text,
  p_gestor_user_id uuid,
  p_tenant_documento text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Apenas super_admin pode chamar
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode criar empresas';
  END IF;

  -- Cria o tenant
  INSERT INTO public.tenants (nome, documento)
  VALUES (p_tenant_nome, p_tenant_documento)
  RETURNING id INTO v_tenant_id;

  -- Remove qualquer vínculo prévio do usuário (1 user = 1 tenant)
  DELETE FROM public.user_roles WHERE user_id = p_gestor_user_id;

  -- Cria papel de gestor para o usuário com todas as permissões
  INSERT INTO public.user_roles (
    user_id, tenant_id, role,
    pode_criar_obra, pode_editar_orcamento, pode_lancar_despesa,
    pode_cadastrar_profissional, pode_gerenciar_acessos
  ) VALUES (
    p_gestor_user_id, v_tenant_id, 'gestor',
    true, true, true, true, true
  );

  RETURN v_tenant_id;
END;
$$;