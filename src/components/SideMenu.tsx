import { useNavigate } from 'react-router-dom';
import {
  PieChart, BarChart3, Upload, TrendingUp, Percent,
  Users, Building2, LogOut, Shield
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { UserPermissions } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: string;
  onNavigate: (section: string) => void;
  permissions: UserPermissions;
  isSuperAdmin: boolean;
  tenantNome: string | null;
  userEmail: string;
  onLogout: () => void;
}

const menuSections = [
  {
    title: 'Financeiro',
    items: [
      { id: 'orcamento', label: 'Orçamento', icon: PieChart, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
      { id: 'relatoriosObra', label: 'Relatórios de Obra', icon: TrendingUp, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
      { id: 'relatorios', label: 'Resumo Semanal', icon: BarChart3, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
      { id: 'comissoes', label: 'Comissões', icon: Percent, permKey: 'podeGerenciarAcessos' as keyof UserPermissions },
    ]
  },
  {
    title: 'Dados',
    items: [
      { id: 'importar', label: 'Importar Planilha', icon: Upload, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
    ]
  },
];

export function SideMenu({
  open, onOpenChange, active, onNavigate,
  permissions, isSuperAdmin, tenantNome, userEmail, onLogout
}: SideMenuProps) {
  const navigate = useNavigate();

  const handleNav = (id: string) => {
    onNavigate(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] glass-strong p-0 border-r border-white/[0.06]">
        <SheetHeader className="p-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ZENTRA-X" className="w-9 h-9 rounded-xl object-contain" />
            <div>
              <SheetTitle className="text-base font-extrabold tracking-tight text-foreground">ZENTRA-X</SheetTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tenantNome || userEmail}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-3">
          {menuSections.map(section => {
            const visibleItems = section.items.filter(i => permissions[i.permKey]);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title} className="mb-2">
                <p className="px-5 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{section.title}</p>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'text-primary bg-primary/10 border-l-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border-l-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div className="border-t border-white/[0.06] mt-3 pt-3">
            <p className="px-5 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Administração</p>

            {permissions.podeGerenciarAcessos && (
              <button
                onClick={() => { navigate('/gerenciar-acessos'); onOpenChange(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border-l-2 border-transparent transition-all"
              >
                <Users className="w-4.5 h-4.5" />
                Gestão de Equipe
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => { navigate('/super-admin'); onOpenChange(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border-l-2 border-transparent transition-all"
              >
                <Shield className="w-4.5 h-4.5" />
                Super Admin
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
