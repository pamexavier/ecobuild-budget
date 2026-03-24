import { FileText, PieChart, BarChart3, Upload, Tag } from 'lucide-react';
import { UserPermissions } from '@/hooks/useAuth';

interface NavAnchorProps {
  active: string;
  onNavigate: (section: string) => void;
  permissions?: UserPermissions;
  role?: string | null; // kept for backward compat
}

const allSections = [
  { id: 'lancamento', label: 'Lançamento', icon: FileText, permKey: 'podeLancarDespesa' as keyof UserPermissions },
  { id: 'orcamento', label: 'Orçamento', icon: PieChart, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'categorias', label: 'Categorias', icon: Tag, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'importar', label: 'Importar', icon: Upload, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
];

export function NavAnchor({ active, onNavigate, permissions }: NavAnchorProps) {
  const sections = permissions
    ? allSections.filter(s => permissions[s.permKey])
    : allSections;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
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
