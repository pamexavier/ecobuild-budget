import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(155,55%,8%)] via-[hsl(153,60%,14%)] to-[hsl(155,45%,20%)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo placeholder */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/10">
            {/* Logo will be placed here - placeholder */}
            <span className="text-2xl font-black text-white tracking-tighter">ZX</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">ZENTRA-X</h1>
          <p className="text-sm text-white/50 mt-1.5 tracking-wide">Gestão Inteligente de Obras</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-center text-foreground">Acesso ao Sistema</h2>
          
          <div>
            <label className="text-sm font-medium block mb-1.5 text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-foreground">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button type="submit" className="w-full py-5" disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground pt-1">
            Acesso restrito. Contacte o administrador para obter credenciais.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;