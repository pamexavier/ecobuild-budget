
-- Create base tables first
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  orcamento_limite NUMERIC NOT NULL DEFAULT 0,
  gasto_atual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.orcamentos_categoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  valor_previsto NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  chave_pix TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'diaria',
  valor NUMERIC NOT NULL DEFAULT 0,
  turnos TEXT[] DEFAULT '{}',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('gestor', 'supervisor', 'encarregada');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'encarregada',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_categoria ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- user_roles RLS
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Gestors can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- obras RLS
CREATE POLICY "Authenticated can view obras" ON public.obras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestors can insert obras" ON public.obras FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can update obras" ON public.obras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can delete obras" ON public.obras FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- profissionais RLS
CREATE POLICY "Authenticated can view profissionais" ON public.profissionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestors can insert profissionais" ON public.profissionais FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can update profissionais" ON public.profissionais FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can delete profissionais" ON public.profissionais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- lancamentos RLS
CREATE POLICY "Authenticated can view lancamentos" ON public.lancamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert lancamentos" ON public.lancamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Gestors can update lancamentos" ON public.lancamentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can delete lancamentos" ON public.lancamentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- orcamentos_categoria RLS
CREATE POLICY "Authenticated can view orcamentos_categoria" ON public.orcamentos_categoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestors can insert orcamentos_categoria" ON public.orcamentos_categoria FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can update orcamentos_categoria" ON public.orcamentos_categoria FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestors can delete orcamentos_categoria" ON public.orcamentos_categoria FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- Trigger to auto-assign 'encarregada' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'encarregada');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
