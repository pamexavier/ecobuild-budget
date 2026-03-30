import { Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

/**
 * SemTenant — exibido quando o usuário está autenticado
 * mas ainda não foi vinculado a nenhuma empresa pela EcomindsX.
 *
 * Diferente do fluxo anterior (onboarding onde o usuário criava a empresa),
 * aqui o controle é da EcomindsX: o usuário simplesmente aguarda.
 */
const SemTenant = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(155,55%,8%)] via-[hsl(153,60%,14%)] to-[hsl(155,45%,20%)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
          <Clock className="w-10 h-10 text-white/70" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white">Acesso Pendente</h1>
          <p className="text-white/60 text-sm mt-2">
            Sua conta ainda não foi vinculada a nenhuma empresa.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <Mail className="w-4 h-4 shrink-0" />
            <p className="text-sm">
              Entre em contato com a <strong className="text-white">EcomindsX</strong> para liberar seu acesso.
            </p>
          </div>
          <p className="text-xs text-white/40 font-mono">{user?.email}</p>
        </div>

        <Button
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
          onClick={signOut}
        >
          Sair
        </Button>
      </div>
    </div>
  );
};

export default SemTenant;