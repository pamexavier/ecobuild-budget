import { FileText, PieChart, BarChart3, Upload, TrendingUp, Users2, Percent, LayoutDashboard } from 'lucide-react';
import { UserPermissions } from '@/hooks/useAuth';

interface NavAnchorProps {
  active: string;
  onNavigate: (section: string) => void;
  permissions?: UserPermissions;
}

const allSections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'lancamento', label: 'Lançamento', icon: FileText, permKey: 'podeLancarDespesa' as keyof UserPermissions },
  { id: 'clientes', label: 'Clientes', icon: Users2, permKey: 'podeCriarObra' as keyof UserPermissions },
  { id: 'orcamento', label: 'Orçamento', icon: PieChart, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'relatoriosObra', label: 'Relatórios', icon: TrendingUp, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'comissoes', label: 'Comissões', icon: Percent, permKey: 'podeGerenciarAcessos' as keyof UserPermissions },
  { id: 'relatorios', label: 'Resumo', icon: BarChart3, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'importar', label: 'Importar', icon: Upload, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
];

export function NavAnchor({ active, onNavigate, permissions }: NavAnchorProps) {
  const sections = permissions
    ? allSections.filter(s => permissions[s.permKey])
    : allSections;

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex overflow-x-auto">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className={`flex-shrink-0 py-3 px-3 flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                active === s.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
