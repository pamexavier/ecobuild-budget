import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ChevronLeft, Plus, Mail,
  Pencil, Trash2, AlertTriangle, X, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

interface TenantGestor {
  tenantId: string;
  userId: string;
  email: string;
  nome: string;
}

const SuperAdmin = () => {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [gestors, setGestors] = useState<TenantGestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Criar empresa ──────────────────────────────────────────────
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formTenantNome, setFormTenantNome] = useState('');
  const [formGestorEmail, setFormGestorEmail] = useState('');
  const [formGestorSenha, setFormGestorSenha] = useState('');
  const [formGestorNome, setFormGestorNome] = useState('');
  const [createdTenant, setCreatedTenant] = useState<{ nome: string; email: string } | null>(null);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  // ── Editar empresa ─────────────────────────────────────────────
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editGestor, setEditGestor] = useState<TenantGestor | null>(null);
  const [editTenantNome, setEditTenantNome] = useState('');
  const [editGestorEmail, setEditGestorEmail] = useState('');
  const [editGestorNome, setEditGestorNome] = useState('');
  const [editGestorSenha, setEditGestorSenha] = useState('');
  const [showEditPwd, setShowEditPwd] = useState(false);

  // ── Excluir empresa ────────────────────────────────────────────
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate('/');
  }, [authLoading, isSuperAdmin, navigate]);

  // ── Buscar tenants + gestores ──────────────────────────────────
  const fetchTenants = async () => {
    setLoading(true);
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsData) setTenants(tenantsData);

    // Buscar gestores de cada tenant via user_roles
    if (tenantsData && tenantsData.length > 0) {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, tenant_id, pode_gerenciar_acessos')
        .in('tenant_id', tenantsData.map((t: Tenant) => t.id))
        .eq('pode_gerenciar_acessos', true);

      if (rolesData && rolesData.length > 0) {
        // Buscar dados de auth via edge function
        const { data: authData } = await supabase.functions.invoke('manage-users', {
          body: { action: 'list' },
        });

        const authUsers: any[] = authData?.users || [];
        const mapped: TenantGestor[] = rolesData.map((r: any) => {
          const authUser = authUsers.find((u: any) => u.id === r.user_id);
          return {
            tenantId: r.tenant_id,
            userId: r.user_id,
            email: authUser?.email || '—',
            nome: authUser?.nome || '',
          };
        });
        setGestors(mapped);
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  // ── Criar empresa ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formTenantNome || !formGestorEmail || !formGestorSenha) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const { data: newUser, error: userError } = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'create',
        email: formGestorEmail,
        password: formGestorSenha,
        nome: formGestorNome || formGestorEmail,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (userError || newUser?.error) {
      setSaving(false);
      toast({ title: 'Erro ao criar gestor', description: newUser?.error || userError?.message, variant: 'destructive' });
      return;
    }

    const { error: rpcError } = await supabase.rpc('super_admin_create_tenant', {
      p_tenant_nome: formTenantNome,
      p_gestor_user_id: newUser.user?.id,
    });

    if (rpcError) {
      setSaving(false);
      toast({ title: 'Erro ao vincular empresa', description: rpcError.message, variant: 'destructive' });
      return;
    }

    setCreatedTenant({ nome: formTenantNome, email: formGestorEmail });
    toast({ title: `Empresa "${formTenantNome}" criada!` });
    fetchTenants();
    setSaving(false);
  };

  const resetCreateForm = () => {
    setFormTenantNome(''); setFormGestorEmail(''); setFormGestorSenha('');
    setFormGestorNome(''); setCreatedTenant(null); setShowCreatePwd(false);
  };

  // ── Abrir modal de edição ──────────────────────────────────────
  const openEdit = (tenant: Tenant) => {
    const gestor = gestors.find(g => g.tenantId === tenant.id) || null;
    setEditTenant(tenant);
    setEditGestor(gestor);
    setEditTenantNome(tenant.nome);
    setEditGestorEmail(gestor?.email || '');
    setEditGestorNome(gestor?.nome || '');
    setEditGestorSenha('');
    setShowEditPwd(false);
  };

  // ── Salvar edição ──────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editTenant) return;
    setSaving(true);

    // 1. Atualizar nome do tenant
    if (editTenantNome !== editTenant.nome) {
      const { error } = await supabase
        .from('tenants')
        .update({ nome: editTenantNome })
        .eq('id', editTenant.id);
      if (error) {
        toast({ title: 'Erro ao atualizar nome da empresa', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    // 2. Atualizar dados do gestor se houver
    if (editGestor?.userId) {
      const body: Record<string, any> = { action: 'update', targetUserId: editGestor.userId };
      if (editGestorEmail && editGestorEmail !== editGestor.email) body.email = editGestorEmail;
      if (editGestorNome && editGestorNome !== editGestor.nome) body.nome = editGestorNome;
      if (editGestorSenha) body.password = editGestorSenha;

      if (Object.keys(body).length > 2) {
        const { data, error } = await supabase.functions.invoke('manage-users', { body });
        if (error || data?.error) {
          toast({ title: 'Erro ao atualizar gestor', description: data?.error || error?.message, variant: 'destructive' });
          setSaving(false);
          return;
        }
      }
    }

    toast({ title: 'Empresa atualizada com sucesso!' });
    setEditTenant(null);
    fetchTenants();
    setSaving(false);
  };

  // ── Excluir empresa ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTenant || deleteConfirmText !== deleteTenant.nome) return;
    setSaving(true);

    try {
      // 1. Buscar todos os user_ids vinculados a este tenant
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('tenant_id', deleteTenant.id);

      const userIds: string[] = roles?.map((r: any) => r.user_id) || [];

      // 2. Deletar dados do tenant em cascata
      // (lancamentos, profissionais, orcamentos_categoria, obras — se houver FK com tenant_id)
      // Deletar vínculos de user_roles primeiro
      await supabase.from('user_roles').delete().eq('tenant_id', deleteTenant.id);

      // 3. Deletar o tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', deleteTenant.id);

      if (tenantError) {
        toast({ title: 'Erro ao excluir empresa', description: tenantError.message, variant: 'destructive' });
        setSaving(false);
        return;
      }

      // 4. Deletar usuários do auth (um a um via edge function)
      for (const userId of userIds) {
        await supabase.functions.invoke('manage-users', {
          body: { action: 'delete', targetUserId: userId },
        });
      }

      toast({ title: `Empresa "${deleteTenant.nome}" excluída`, description: `${userIds.length} usuário(s) removido(s) do sistema.` });
      setDeleteTenant(null);
      setDeleteConfirmText('');
      fetchTenants();
    } catch (err) {
      toast({ title: 'Erro inesperado', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#0f2d1f] shadow-lg border-b border-primary/20">
        <div className="container py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter italic">
              Super Admin <span className="text-primary">EcomindsX</span>
            </h1>
          </div>

          {/* Criar empresa */}
          <Dialog open={showCreateDialog} onOpenChange={(o) => { setShowCreateDialog(o); if (!o) resetCreateForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="font-bold uppercase tracking-widest">
                <Plus className="w-4 h-4 mr-1" /> Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-black uppercase italic tracking-tighter text-[#0f2d1f]">
                  Cadastrar Empresa
                </DialogTitle>
              </DialogHeader>

              {createdTenant ? (
                <div className="space-y-4 pt-2 text-center">
                  <div className="flex flex-col items-center gap-2 text-blue-600 font-bold uppercase text-xs">
                    <Mail className="w-8 h-8 mb-2" />
                    <span>E-mail de Confirmação Enviado!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O gestor da <strong>{createdTenant.nome}</strong> recebeu um link no e-mail{' '}
                    <strong>{createdTenant.email}</strong>. Ele precisa clicar no link para ativar o acesso.
                  </p>
                  <Button onClick={() => { setCreatedTenant(null); setShowCreateDialog(false); resetCreateForm(); }} className="w-full font-bold uppercase">
                    Fechar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <input
                    value={formTenantNome}
                    onChange={e => setFormTenantNome(e.target.value)}
                    placeholder="Nome da Empresa"
                    className="w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="p-3 bg-muted/50 rounded-lg space-y-3 border border-dashed text-left">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Gestor Principal</p>
                    <input value={formGestorNome} onChange={e => setFormGestorNome(e.target.value)} placeholder="Nome Completo" className="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <input type="email" value={formGestorEmail} onChange={e => setFormGestorEmail(e.target.value)} placeholder="Email de Login" className="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <div className="relative">
                      <input
                        type={showCreatePwd ? 'text' : 'password'}
                        value={formGestorSenha}
                        onChange={e => setFormGestorSenha(e.target.value)}
                        placeholder="Senha Inicial"
                        className="w-full rounded border p-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button type="button" onClick={() => setShowCreatePwd(!showCreatePwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showCreatePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full font-bold uppercase py-6">
                    {saving ? 'Processando...' : 'Criar Empresa'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-8 max-w-4xl space-y-6">
        <h2 className="text-sm font-black uppercase text-[#0f2d1f] italic tracking-widest px-1">
          Empresas Cadastradas — {tenants.length}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground text-sm">
            Nenhuma empresa cadastrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map(t => {
              const gestor = gestors.find(g => g.tenantId === t.id);
              return (
                <div key={t.id} className="rounded-xl border bg-card p-5 space-y-3 hover:border-primary/50 transition-all shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-sm font-black text-[#0f2d1f] uppercase tracking-tighter truncate">{t.nome}</p>
                      </div>
                      {gestor && (
                        <p className="text-[11px] text-muted-foreground pl-6 truncate">
                          👤 {gestor.nome || gestor.email} · {gestor.email}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-muted-foreground pl-6 uppercase tracking-widest">
                        {t.ativo ? '✅ Ativa' : '⏸ Inativa'}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary"
                        title="Editar empresa"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        title="Excluir empresa"
                        onClick={() => { setDeleteTenant(t); setDeleteConfirmText(''); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal EDITAR ─────────────────────────────────────── */}
      <Dialog open={!!editTenant} onOpenChange={o => { if (!o) setEditTenant(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic tracking-tighter text-[#0f2d1f]">
              Editar Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Nome da Empresa</label>
              <input
                value={editTenantNome}
                onChange={e => setEditTenantNome(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {editGestor && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-3 border border-dashed">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Gestor Principal</p>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nome</label>
                  <input
                    value={editGestorNome}
                    onChange={e => setEditGestorNome(e.target.value)}
                    className="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    value={editGestorEmail}
                    onChange={e => setEditGestorEmail(e.target.value)}
                    className="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nova Senha (deixe em branco para manter)</label>
                  <div className="relative">
                    <input
                      type={showEditPwd ? 'text' : 'password'}
                      value={editGestorSenha}
                      onChange={e => setEditGestorSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded border p-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button type="button" onClick={() => setShowEditPwd(!showEditPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showEditPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditTenant(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 font-bold" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal EXCLUIR ─────────────────────────────────────── */}
      <Dialog open={!!deleteTenant} onOpenChange={o => { if (!o) { setDeleteTenant(null); setDeleteConfirmText(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black uppercase tracking-tighter">
              <AlertTriangle className="w-5 h-5" />
              Excluir Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 space-y-2">
              <p className="text-sm font-semibold text-destructive">⚠️ Ação irreversível!</p>
              <p className="text-xs text-muted-foreground">
                Isso irá excluir permanentemente a empresa <strong>"{deleteTenant?.nome}"</strong>,
                todos os dados vinculados (obras, lançamentos, profissionais) e
                <strong> remover todos os usuários das autorizações</strong>, liberando os e-mails para novo cadastro.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                Digite o nome da empresa para confirmar:
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTenant?.nome}
                className="w-full rounded-lg border border-destructive/40 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setDeleteTenant(null); setDeleteConfirmText(''); }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold"
                disabled={deleteConfirmText !== deleteTenant?.nome || saving}
                onClick={handleDelete}
              >
                {saving ? 'Excluindo...' : 'Excluir Definitivamente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;