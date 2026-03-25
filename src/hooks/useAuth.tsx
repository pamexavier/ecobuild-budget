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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndPermissions = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role, pode_criar_obra, pode_editar_orcamento, pode_lancar_despesa, pode_cadastrar_profissional, pode_gerenciar_acessos')
      .eq('user_id', userId)
      .single();

    if (data) {
      setRole(data.role as AppRole);
      setPermissions({
        podeCriarObra: data.pode_criar_obra ?? false,
        podeEditarOrcamento: data.pode_editar_orcamento ?? false,
        podeLancarDespesa: data.pode_lancar_despesa ?? false,
        podeCadastrarProfissional: data.pode_cadastrar_profissional ?? false,
        podeGerenciarAcessos: data.pode_gerenciar_acessos ?? false,
      });
    } else {
      setRole(null);
      setPermissions(DEFAULT_PERMISSIONS);
    }
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
          setPermissions(DEFAULT_PERMISSIONS);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndPermissions(session.user.id);
      }
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
    setPermissions(DEFAULT_PERMISSIONS);
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, permissions, loading,
      signIn, signOut,
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