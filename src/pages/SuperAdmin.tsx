import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, Plus, Loader2, CheckCircle2, Mail } from 'lucide-react';
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

const SuperAdmin = () => {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formTenantNome, setFormTenantNome] = useState('');
  const [formGestorEmail, setFormGestorEmail] = useState('');
  const [formGestorSenha, setFormGestorSenha] = useState('');
  const [formGestorNome, setFormGestorNome] = useState('');
  const [createdTenant, setCreatedTenant] = useState<{ nome: string; email: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) navigate('/');
  }, [authLoading, isSuperAdmin, navigate]);

  const fetchTenants = async () => {
    setLoading(true);
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (data) setTenants(data);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = async () => {
    if (!formTenantNome || !formGestorEmail || !formGestorSenha) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
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
      headers: { Authorization: `Bearer ${token}` }
    });

    if (userError || newUser?.error) {
      setSaving(false);
      toast({
        title: 'Erro ao criar gestor',
        description: newUser?.error || userError?.message,
        variant: 'destructive',
      });
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
    toast({ title: `Empresa "${formTenantNome}" solicitada!` });
    fetchTenants();
    setSaving(false);
  };

  const resetForm = () => {
    setFormTenantNome(''); setFormGestorEmail(''); setFormGestorSenha(''); setFormGestorNome('');
  };

  if (authLoading || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[#0f2d1f] shadow-lg border-b border-primary/20 italic">
        <div className="container py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">Super Admin <span className="text-primary">EcomindsX</span></h1>
          </div>

          <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) { resetForm(); setCreatedTenant(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="font-bold uppercase tracking-widest"><Plus className="w-4 h-4 mr-1" /> Nova Empresa</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-black uppercase italic tracking-tighter text-[#0f2d1f]">Cadastrar Empresa</DialogTitle></DialogHeader>

              {createdTenant ? (
                <div className="space-y-4 pt-2 text-center">
                  <div className="flex flex-col items-center gap-2 text-blue-600 font-bold uppercase text-xs">
                    <Mail className="w-8 h-8 mb-2" /> 
                    <span>E-mail de Confirmação Enviado!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O gestor da <strong>{createdTenant.nome}</strong> recebeu um link no e-mail <strong>{createdTenant.email}</strong>. Ele precisa clicar no link para ativar o acesso.
                  </p>
                  <Button onClick={() => { setCreatedTenant(null); setShowDialog(false); resetForm(); }} className="w-full font-bold uppercase">Fechar</Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <input value={formTenantNome} onChange={e => setFormTenantNome(e.target.value)} placeholder="Nome da Empresa" className="w-full rounded-lg border p-2.5 text-sm" />
                  <div className="p-3 bg-muted/50 rounded-lg space-y-3 border border-dashed text-left">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Gestor Principal</p>
                    <input value={formGestorNome} onChange={e => setFormGestorNome(e.target.value)} placeholder="Nome Completo" className="w-full rounded border p-2 text-sm" />
                    <input type="email" value={formGestorEmail} onChange={e => setFormGestorEmail(e.target.value)} placeholder="Email de Login" className="w-full rounded border p-2 text-sm" />
                    <input type="text" value={formGestorSenha} onChange={e => setFormGestorSenha(e.target.value)} placeholder="Senha Inicial" className="w-full rounded border p-2 text-sm" />
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full font-bold uppercase py-6">{saving ? 'Processando...' : 'Criar Empresa'}</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <h2 className="text-sm font-black uppercase mb-6 text-[#0f2d1f] italic tracking-widest px-2">Empresas Cadastradas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map(t => (
            <div key={t.id} className="rounded-xl border bg-card p-5 flex items-center justify-between hover:border-primary transition-all shadow-sm">
              <div className="space-y-1 text-left">
                <p className="text-sm font-black text-[#0f2d1f] uppercase tracking-tighter">{t.nome}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.ativo ? 'Ativa' : 'Inativa'}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SuperAdmin;