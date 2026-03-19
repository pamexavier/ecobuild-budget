import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Shield, ChevronLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { supabase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  user_id: string;
  email: string;
  role: AppRole;
}

const ROLE_LABELS: Record<AppRole, string> = {
  gestor: '🔑 Gestor (Acesso Total)',
  supervisor: '📊 Supervisor (Intermediário)',
  encarregada: '📝 Encarregada (Lançamentos)',
};

const GerenciarAcessos = () => {
  const { isGestor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isGestor) {
      navigate('/');
    }
  }, [authLoading, isGestor, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (data) {
      // Get emails from auth - we use the user_id to show what we can
      const usersWithEmail: UserWithRole[] = data.map((d: any) => ({
        user_id: d.user_id,
        email: d.user_id.substring(0, 8) + '...',
        role: d.role,
      }));
      setUsers(usersWithEmail);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Permissão atualizada!' });
      fetchUsers();
    }
  };

  if (authLoading || !isGestor) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-[hsl(158,64%,32%)] to-[hsl(160,50%,42%)] shadow-lg">
        <div className="container py-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Shield className="w-5 h-5 text-primary-foreground" />
            <div>
              <h1 className="text-lg font-extrabold text-primary-foreground">Gerenciar Acessos</h1>
              <p className="text-xs text-primary-foreground/70">Controle de permissões do sistema</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Usuários Cadastrados</h2>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono truncate">{u.user_id}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[u.role]}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={e => updateRole(u.user_id, e.target.value as AppRole)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="gestor">Gestor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="encarregada">Encarregada</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GerenciarAcessos;
