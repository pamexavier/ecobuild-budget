import {
  Home, PieChart, BarChart3, Upload, TrendingUp, Percent, WalletCards,
  Users, Building2, LogOut, Shield, FileText, Package, LogIn, Zap
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { UserPermissions } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: string;
  onNavigate: (section: string) => void;
  permissions: UserPermissions;
  userEmail: string;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  permKey?: keyof UserPermissions;
  external?: boolean;
}

interface MenuSection {
  title: string;
  icon?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Principal',
    icon: '🏠',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'lancamento', label: 'Lançamentos', icon: Zap },
      { id: 'clientes', label: 'Clientes', icon: Users },
    ]
  },
  {
    title: 'Gestão de Obras',
    icon: '🏗️',
    items: [
      { id: 'obras', label: 'Obras', icon: Building2 },
      { id: 'orcamento', label: 'Orçamento', icon: PieChart, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
      { id: 'relatoriosObra', label: 'Relatórios', icon: TrendingUp, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
    ]
  },
  {
    title: 'Financeiro',
    icon: '💰',
    items: [
      { id: 'contasReceber', label: 'Contas a Receber', icon: WalletCards, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
      { id: 'comissoes', label: 'Comissões', icon: Percent, permKey: 'podeGerenciarAcessos' as keyof UserPermissions },
      { id: 'relatorios', label: 'Resumo Semanal', icon: BarChart3, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
    ]
  },
  {
    title: 'Dados',
    icon: '📊',
    items: [
      { id: 'importar', label: 'Importar Planilha', icon: Upload, permKey: 'podeEditarOrcamento' as keyof UserPermissions },
    ]
  },
];

const adminSections: MenuItem[] = [
  { id: 'acessos', label: 'Gestão de Equipe', icon: Users, permKey: 'podeGerenciarAcessos' as keyof UserPermissions },
  { id: 'super-admin', label: 'Super Admin', icon: Shield, external: true },
];

export function SideMenu({
  open,
  onOpenChange,
  active,
  onNavigate,
  permissions,
  userEmail,
  onLogout
}: SideMenuProps) {

  const handleNavigation = (id: string, external?: boolean) => {
    onNavigate(id);
    onOpenChange(false);
  };

  const handleLogoutClick = async () => {
    await onLogout();
    onOpenChange(false);
  };

  const isSuperAdmin = permissions?.isSuperAdmin || false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[300px] glass-strong p-0 border-r border-white/5 flex flex-col h-full bg-gradient-to-b from-white/[0.02] to-white/[0.01] backdrop-blur-xl"
      >
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="ZENTRA-X" className="w-10 h-10 rounded-xl object-contain ring-1 ring-emerald-500/20" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                ZENTRA-X
              </SheetTitle>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1 truncate">{userEmail}</p>
            </div>
          </div>
        </SheetHeader>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2 px-3">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permKey || permissions[item.permKey]
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5">
                {/* SECTION HEADER */}
                <div className="px-3 py-2.5">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <span>{section.icon}</span>
                    {section.title}
                  </p>
                </div>

                {/* SECTION ITEMS */}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id, item.external)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500'
                            : 'text-zinc-400 hover:text-emerald-400 border-l-2 border-transparent hover:bg-white/5'
                        }`}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="text-left flex-1 truncate">{item.label}</span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ADMIN SECTION */}
          {(permissions.podeGerenciarAcessos || isSuperAdmin) && (
            <>
              <Separator className="my-3 bg-white/5" />
              
              <div className="space-y-1.5">
                <div className="px-3 py-2.5">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <span>⚙️</span>
                    Administração
                  </p>
                </div>

                <div className="space-y-1">
                  {adminSections.map((item) => {
                    if (item.permKey && !permissions[item.permKey]) return null;
                    if (item.id === 'super-admin' && !isSuperAdmin) return null;

                    const Icon = item.icon;
                    const isActive = active === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id, item.external)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-purple-300 border-l-2 border-purple-500'
                            : 'text-zinc-400 hover:text-purple-400 border-l-2 border-transparent hover:bg-white/5'
                        }`}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="text-left flex-1 truncate">{item.label}</span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 space-y-2 bg-gradient-to-t from-white/[0.02] to-transparent">
          <p className="text-[10px] font-semibold text-zinc-600 px-2">
            📧 {userEmail.split('@')[0]}
          </p>
          <Button
            onClick={handleLogoutClick}
            variant="destructive"
            className="w-full gap-2 rounded-xl font-semibold"
          >
            <LogOut size={16} />
            Sair do Sistema
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}