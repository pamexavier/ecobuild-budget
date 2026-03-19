import { FileText, PieChart, BarChart3, Upload, Tag } from 'lucide-react';
import { AppRole } from '@/hooks/useAuth';

interface NavAnchorProps {
  active: string;
  onNavigate: (section: string) => void;
  role?: AppRole | null;
}

const allSections = [
  { id: 'lancamento', label: 'Lançamento', icon: FileText, roles: ['gestor', 'supervisor', 'encarregada'] },
  { id: 'orcamento', label: 'Orçamento', icon: PieChart, roles: ['gestor', 'supervisor'] },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, roles: ['gestor', 'supervisor'] },
  { id: 'categorias', label: 'Categorias', icon: Tag, roles: ['gestor', 'supervisor'] },
  { id: 'importar', label: 'Importar', icon: Upload, roles: ['gestor', 'supervisor'] },
];

export function NavAnchor({ active, onNavigate, role }: NavAnchorProps) {
  const sections = allSections.filter(s => !role || s.roles.includes(role));

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
