import { LayoutDashboard, FileText, Building2, Menu, HardHat } from 'lucide-react';
import { UserPermissions } from '@/hooks/useAuth';

interface BottomNavProps {
  active: string;
  onNavigate: (section: string) => void;
  onMenuOpen: () => void;
  permissions: UserPermissions;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
  { id: 'lancamento', label: 'Lançar', icon: FileText, permKey: 'podeLancarDespesa' as keyof UserPermissions },
  { id: 'clientes', label: 'Obras', icon: HardHat, permKey: 'podeCriarObra' as keyof UserPermissions },
];

export function BottomNav({ active, onNavigate, onMenuOpen, permissions }: BottomNavProps) {
  const visibleItems = navItems.filter(item => permissions[item.permKey]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/[0.08] safe-area-bottom print:hidden">
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/15' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 text-muted-foreground active:text-foreground transition-all"
        >
          <div className="p-1.5 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold tracking-wide">Menu</span>
        </button>
      </div>
    </nav>
  );
}
