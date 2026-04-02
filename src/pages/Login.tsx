import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

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
      toast({ title: 'Erro ao entrar', description: 'Credenciais inválidas ou acesso não autorizado.', variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(155,55%,8%)] via-[hsl(153,60%,14%)] to-[hsl(155,45%,20%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logo} alt="EcomindsX Logo" className="w-28 h-auto mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">ZENTRA-X</h1>
          <p className="text-sm text-emerald-400/80 mt-2 font-medium tracking-[0.2em] uppercase">Gestão Inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-emerald-950/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-9 space-y-6">
          <h2 className="text-xl font-extrabold text-white text-center mb-8 tracking-tight">Acesso Restrito</h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest ml-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-white/20" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest ml-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-white/20" />
          </div>

          <Button type="submit" className="w-full py-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95 text-base" disabled={loading}>
            {loading ? 'Autenticando...' : <><LogIn className="w-5 h-5 mr-2" /> ENTRAR NO SISTEMA</>}
          </Button>

          <p className="text-[10px] text-center text-white/30 uppercase tracking-[0.3em] pt-4">Powered by EcomindsX</p>
        </form>
      </div>
    </div>
  );
};

export default Login;
