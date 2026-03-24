import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface UserWithPermissions {
  user_id: string;
  role: string;
  pode_criar_obra: boolean;
  pode_editar_orcamento: boolean;
  pode_lancar_despesa: boolean;
  pode_cadastrar_profissional: boolean;
  pode_gerenciar_acessos: boolean;
}

const PERMISSION_LABELS: Record<string, string> = {
  pode_criar_obra: '🏗️ Criar Obra',
  pode_editar_orcamento: '💰 Editar Orçamento',
  pode_lancar_despesa: '📝 Lançar Despesa',
  pode_cadastrar_profissional: '👷 Cadastrar Profissional',
  pode_gerenciar_acessos: '🔑 Gerenciar Acessos',
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[];

const GerenciarAcessos = () => {
  const { permissions, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !permissions.podeGerenciarAcessos) {
      navigate('/');
    }
  }, [authLoading, permissions.podeGerenciarAcessos, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role, pode_criar_obra, pode_editar_orcamento, pode_lancar_despesa, pode_cadastrar_profissional, pode_gerenciar_acessos');

    if (data) {
      setUsers(data as UserWithPermissions[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const togglePermission = async (userId: string, field: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ [field]: !currentValue })
      .eq('user_id', userId);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, [field]: !currentValue } : u
      ));
      toast({ title: 'Permissão atualizada!' });
    }
  };

  if (authLoading || !permissions.podeGerenciarAcessos) return null;

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
              <p className="text-xs text-primary-foreground/70">Controle granular de permissões</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="rounded-lg border border-border bg-card p-5 space-y-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Usuários Cadastrados</h2>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.user_id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium font-mono truncate">{u.user_id}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PERMISSION_KEYS.map(key => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-sm">{PERMISSION_LABELS[key]}</span>
                        <Switch
                          checked={u[key as keyof UserWithPermissions] as boolean}
                          onCheckedChange={() => togglePermission(u.user_id, key, u[key as keyof UserWithPermissions] as boolean)}
                        />
                      </label>
                    ))}
                  </div>
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
