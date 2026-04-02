import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, Users, UserPlus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface CombinedUser {
  id: string;
  email: string;
  nome: string;
  permissions: UserWithPermissions | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  pode_criar_obra: 'Criar Obra / Projeto',
  pode_editar_orcamento: 'Ver Dashboard e Editar Orçamento',
  pode_lancar_despesa: 'Lançar Diárias e Empreitadas',
  pode_cadastrar_profissional: 'Cadastrar Profissionais',
  pode_gerenciar_acessos: 'Gerenciar Equipe e Acessos (Admin)',
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  pode_criar_obra: 'Pode cadastrar novas obras e clientes',
  pode_editar_orcamento: 'Acessa dashboard financeiro completo',
  pode_lancar_despesa: 'Acessa formulário de diárias e empreitadas',
  pode_cadastrar_profissional: 'Pode adicionar profissionais ao sistema',
  pode_gerenciar_acessos: 'Acessa esta tela e gerencia a equipe',
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

const GerenciarAcessos = () => {
  const { permissions, tenantId, tenantNome, loading: authLoading } = useAuth();
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
    if (!authLoading && !permissions.podeGerenciarAcessos) navigate('/');
  }, [authLoading, permissions.podeGerenciarAcessos, navigate]);

  const fetchUsers = async () => {
    if (!tenantId) return;
    setLoading(true);

    // Buscar auth users via edge function
    const { data: authData, error: authError } = await supabase.functions.invoke('manage-users', {
      body: { action: 'list' },
    });

    // Buscar roles APENAS deste tenant
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role, pode_criar_obra, pode_editar_orcamento, pode_lancar_despesa, pode_cadastrar_profissional, pode_gerenciar_acessos')
      .eq('tenant_id', tenantId);

    const authUsers = authError ? [] : (authData?.users || []);
    const roles = (rolesData || []) as UserWithPermissions[];

    // Apenas usuários vinculados a este tenant
    const tenantUserIds = new Set(roles.map(r => r.user_id));
    const combined: CombinedUser[] = authUsers
      .filter((u: any) => tenantUserIds.has(u.id))
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        nome: u.nome || '',
        permissions: roles.find(r => r.user_id === u.id) || null,
      }));

    setUsers(combined);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [tenantId]);

  const togglePermission = async (userId: string, field: string, currentValue: boolean) => {
    if (!tenantId) return;
    const { error } = await supabase
      .from('user_roles')
      .update({ [field]: !currentValue })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId); // ← isolamento garantido

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(u =>
        u.id === userId && u.permissions
          ? { ...u, permissions: { ...u.permissions, [field]: !currentValue } }
          : u
      ));
    }
  };

  const handleCreateUser = async () => {
    if (!formEmail || !formPassword || !tenantId) return;
    setSaving(true);

    // 1. Criar usuário no auth
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', email: formEmail, password: formPassword, nome: formName },
    });

    if (error || data?.error) {
      setSaving(false);
      toast({ title: 'Erro ao criar usuário', description: data?.error || error?.message, variant: 'destructive' });
      return;
    }

    // 2. Vincular ao tenant via RPC
    const newUserId = data.user?.id;
    if (newUserId) {
      await supabase.rpc('add_user_to_tenant', {
        p_user_id: newUserId,
        p_tenant_id: tenantId,
        p_role: 'encarregada',
      });
    }

    setSaving(false);
    toast({ title: 'Usuário criado e vinculado à empresa' });
    setShowCreateDialog(false);
    resetForm();
    fetchUsers();
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setSaving(true);
    const body: Record<string, any> = { action: 'update', targetUserId: editUser.id };
    if (formName !== editUser.nome) body.nome = formName;
    if (formEmail !== editUser.email) body.email = formEmail;
    if (formPassword) body.password = formPassword;

    const { data, error } = await supabase.functions.invoke('manage-users', { body });
    setSaving(false);

    if (error || data?.error) {
      toast({ title: 'Erro', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário atualizado' });
      setEditUser(null);
      resetForm();
      fetchUsers();
    }
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    if (!tenantId) return;
    if (!confirm(`Remover "${email}" desta empresa?`)) return;

    // Remove só o vínculo com este tenant (não deleta o usuário do auth)
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário removido da empresa' });
      fetchUsers();
    }
  };

  const resetForm = () => { setFormName(''); setFormEmail(''); setFormPassword(''); setShowPassword(false); };
  const openEdit = (u: CombinedUser) => { setEditUser(u); setFormName(u.nome); setFormEmail(u.email); setFormPassword(''); };

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
                {/* Mostra a empresa do tenant — cada gestor vê só a sua */}
                <p className="text-xs text-white/60">{tenantNome} · Controle de Acessos</p>
              </div>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={o => { setShowCreateDialog(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Usuário — {tenantNome}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email *" required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Senha * (mín. 6 caracteres)" required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
        <Dialog open={!!editUser} onOpenChange={o => { if (!o) { setEditUser(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Nova senha (opcional)" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={handleUpdateUser} disabled={saving} className="w-full">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Equipe — {users.length} usuário(s)</h2>
          </div>

          {loading ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado nesta empresa.</p>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveUser(u.id, u.email)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {u.permissions && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PERMISSION_KEYS.map(key => (
                        <div key={key} className="flex flex-col gap-1 rounded-md border border-border bg-muted/20 px-3 py-2">
                          <label className="flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/40 transition-colors rounded">
                            <span className="text-xs font-medium">{PERMISSION_LABELS[key]}</span>
                            <Switch
                              checked={u.permissions![key as keyof UserWithPermissions] as boolean}
                              onCheckedChange={() => togglePermission(u.id, key, u.permissions![key as keyof UserWithPermissions] as boolean)}
                            />
                          </label>
                          <span className="text-[10px] text-muted-foreground">{PERMISSION_DESCRIPTIONS[key]}</span>
                        </div>
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