
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS pode_criar_obra boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pode_editar_orcamento boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pode_lancar_despesa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pode_cadastrar_profissional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pode_gerenciar_acessos boolean NOT NULL DEFAULT false;

-- Update existing gestor users to have all permissions
UPDATE public.user_roles SET
  pode_criar_obra = true,
  pode_editar_orcamento = true,
  pode_lancar_despesa = true,
  pode_cadastrar_profissional = true,
  pode_gerenciar_acessos = true
WHERE role = 'gestor';

-- Update existing supervisor users
UPDATE public.user_roles SET
  pode_lancar_despesa = true,
  pode_editar_orcamento = true
WHERE role = 'supervisor';

-- Update handle_new_user to set default permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, pode_lancar_despesa)
  VALUES (NEW.id, 'encarregada', true);
  RETURN NEW;
END;
$$;
