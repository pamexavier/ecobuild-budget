import { FileText, PieChart, BarChart3, Upload } from 'lucide-react';

interface NavAnchorProps {
  active: string;
  onNavigate: (section: string) => void;
}

const sections = [
  { id: 'lancamento', label: 'Lançamento', icon: FileText },
  { id: 'orcamento', label: 'Orçamento', icon: PieChart },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'importar', label: 'Importar', icon: Upload },
];

export function NavAnchor({ active, onNavigate }: NavAnchorProps) {
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
