import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/store';

export type AppRole = 'gestor' | 'supervisor' | 'encarregada';

export interface UserPermissions {
  podeCriarObra: boolean;
  podeEditarOrcamento: boolean;
  podeLancarDespesa: boolean;
  podeCadastrarProfissional: boolean;
  podeGerenciarAcessos: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  podeCriarObra: false,
  podeEditarOrcamento: false,
  podeLancarDespesa: false,
  podeCadastrarProfissional: false,
  podeGerenciarAcessos: false,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  permissions: UserPermissions;
  tenantId: string | null;
  tenantNome: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantNome, setTenantNome] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndPermissions = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select(`
        role,
        tenant_id,
        is_super_admin,
        pode_criar_obra,
        pode_editar_orcamento,
        pode_lancar_despesa,
        pode_cadastrar_profissional,
        pode_gerenciar_acessos,
        tenants ( id, nome )
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (data) {
      setRole(data.role as AppRole);
      setTenantId(data.tenant_id ?? null);
      setIsSuperAdmin(data.is_super_admin ?? false);
      // @ts-ignore
      setTenantNome(data.tenants?.nome ?? null);
      setPermissions({
        podeCriarObra: data.pode_criar_obra ?? false,
        podeEditarOrcamento: data.pode_editar_orcamento ?? false,
        podeLancarDespesa: data.pode_lancar_despesa ?? false,
        podeCadastrarProfissional: data.pode_cadastrar_profissional ?? false,
        podeGerenciarAcessos: data.pode_gerenciar_acessos ?? false,
      });
    } else {
      // Usuário sem role ainda — aguarda super admin configurar
      setRole(null);
      setTenantId(null);
      setTenantNome(null);
      setIsSuperAdmin(false);
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  const refreshAuth = async () => {
    if (user) await fetchRoleAndPermissions(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoleAndPermissions(session.user.id), 0);
        } else {
          setRole(null);
          setTenantId(null);
          setTenantNome(null);
          setIsSuperAdmin(false);
          setPermissions(DEFAULT_PERMISSIONS);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchRoleAndPermissions(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setTenantId(null);
    setTenantNome(null);
    setIsSuperAdmin(false);
    setPermissions(DEFAULT_PERMISSIONS);
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, permissions,
      tenantId, tenantNome, isSuperAdmin,
      loading,
      signIn, signOut, refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}