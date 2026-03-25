import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, Users, UserPlus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  nome: string;
  created_at: string;
}

interface UserWithPermissions {
  user_id: string;
  role: string;
  pode_criar_obra: boolean;
  pode_editar_orcamento: boolean;
  pode_lancar_despesa: boolean;
  pode_cadastrar_profissional: boolean;
  pode_gerenciar_acessos: boolean;
}

interface CombinedUser {
  id: string;
  email: string;
  nome: string;
  permissions: UserWithPermissions | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  pode_criar_obra: 'Criar Obra',
  pode_editar_orcamento: 'Editar Orçamento',
  pode_lancar_despesa: 'Lançar Despesa',
  pode_cadastrar_profissional: 'Cadastrar Profissional',
  pode_gerenciar_acessos: 'Gerenciar Acessos',
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

const GerenciarAcessos = () => {
  const { permissions, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editUser, setEditUser] = useState<CombinedUser | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !permissions.podeGerenciarAcessos) {
      navigate('/');
    }
  }, [authLoading, permissions.podeGerenciarAcessos, navigate]);

  const fetchUsers = async () => {
    setLoading(true);

    // Fetch auth users via edge function
    const { data: authData, error: authError } = await supabase.functions.invoke('manage-users', {
      body: { action: 'list' },
    });

    // Fetch permissions
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role, pode_criar_obra, pode_editar_orcamento, pode_lancar_despesa, pode_cadastrar_profissional, pode_gerenciar_acessos');

    const authUsers: AuthUser[] = authError ? [] : (authData?.users || []);
    const roles = (rolesData || []) as UserWithPermissions[];

    const combined: CombinedUser[] = authUsers.map(u => ({
      id: u.id,
      email: u.email,
      nome: u.nome || '',
      permissions: roles.find(r => r.user_id === u.id) || null,
    }));

    setUsers(combined);
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
        u.id === userId && u.permissions
          ? { ...u, permissions: { ...u.permissions, [field]: !currentValue } }
          : u
      ));
      toast({ title: 'Permissão atualizada' });
    }
  };

  const handleCreateUser = async () => {
    if (!formEmail || !formPassword) return;
    setSaving(true);

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', email: formEmail, password: formPassword, nome: formName },
    });

    setSaving(false);
    if (error || data?.error) {
      toast({ title: 'Erro ao criar usuário', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário criado com sucesso' });
      setShowCreateDialog(false);
      resetForm();
      fetchUsers();
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setSaving(true);

    const body: Record<string, any> = { action: 'update', targetUserId: editUser.id };
    if (formName && formName !== editUser.nome) body.nome = formName;
    if (formEmail && formEmail !== editUser.email) body.email = formEmail;
    if (formPassword) body.password = formPassword;

    const { data, error } = await supabase.functions.invoke('manage-users', { body });

    setSaving(false);
    if (error || data?.error) {
      toast({ title: 'Erro ao atualizar', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário atualizado' });
      setEditUser(null);
      resetForm();
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Remover o usuário "${email}"? Esta ação é irreversível.`)) return;

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete', targetUserId: userId },
    });

    if (error || data?.error) {
      toast({ title: 'Erro ao remover', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário removido' });
      fetchUsers();
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setShowPassword(false);
  };

  const openEdit = (user: CombinedUser) => {
    setEditUser(user);
    setFormName(user.nome);
    setFormEmail(user.email);
    setFormPassword('');
  };

  if (authLoading || !permissions.podeGerenciarAcessos) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-[hsl(155,55%,12%)] via-[hsl(153,60%,18%)] to-[hsl(153,45%,25%)] shadow-lg">
        <div className="container py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Shield className="w-5 h-5 text-white" />
              <div>
                <h1 className="text-lg font-extrabold text-white">Gestão de Equipe</h1>
                <p className="text-xs text-white/60">ZENTRA-X · Controle de Acessos</p>
              </div>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nome</label>
                    <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome completo" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Email *</label>
                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@exemplo.com" required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Senha *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleCreateUser} disabled={saving || !formEmail || !formPassword} className="w-full">
                    {saving ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {/* Edit Dialog */}
        <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium block mb-1">Nome</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nova Senha (opcional)</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Deixe vazio para manter" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleUpdateUser} disabled={saving} className="w-full">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Usuários ({users.length})</h2>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{u.nome || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteUser(u.id, u.email)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {u.permissions && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PERMISSION_KEYS.map(key => (
                        <label
                          key={key}
                          className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <span className="text-xs font-medium">{PERMISSION_LABELS[key]}</span>
                          <Switch
                            checked={u.permissions![key as keyof UserWithPermissions] as boolean}
                            onCheckedChange={() => togglePermission(u.id, key, u.permissions![key as keyof UserWithPermissions] as boolean)}
                          />
                        </label>
                      ))}
                    </div>
                  )}
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