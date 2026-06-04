import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, PieChart, BarChart3, Upload, TrendingUp, Percent, WalletCards,
  Users, Building2, LogOut, Shield, Zap, ChevronDown, ChevronRight, Receipt, ClipboardList
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { UserPermissions } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

// ── DEFINIÇÃO DOS MENUS ──
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
      { id: 'projetos', label: 'Projetos', icon: ClipboardList },
      { id: 'obras', label: 'Obras', icon: Building2 },
      { id: 'orcamento', label: 'Orçamento', icon: PieChart, permKey: 'podeEditarOrcamento' },
      { id: 'relatoriosObra', label: 'Relatórios', icon: TrendingUp, permKey: 'podeEditarOrcamento' },
    ]
  },
  {
    title: 'Financeiro',
    icon: '💰',
    items: [
      { id: 'contasReceber', label: 'Contas a Receber', icon: WalletCards, permKey: 'podeEditarOrcamento' },
      { id: 'contasPagar', label: 'Contas a Pagar', icon: Receipt, permKey: 'podeEditarOrcamento' },
      { id: 'comissoes', label: 'Comissões', icon: Percent, permKey: 'podeEditarOrcamento' },
      { id: 'relatorios', label: 'Resumo Semanal', icon: BarChart3, permKey: 'podeEditarOrcamento' },
    ]
  },
  {
    title: 'Dados',
    icon: '📊',
    items: [
      { id: 'importar', label: 'Importar Planilha', icon: Upload, permKey: 'podeEditarOrcamento' },
    ]
  },
];

const adminSections: MenuItem[] = [
  { id: 'acessos', label: 'Gestão de Equipe', icon: Users, permKey: 'podeGerenciarAcessos' },
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

  const navigate = useNavigate(); // INTELIGÊNCIA CENTRALIZADA AQUI

  // Controle de quais sanfonas estão abertas
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Principal': true,
    'Gestão de Obras': false,
    'Financeiro': false,
    'Dados': false,
    'Admin': false
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // NOVA NAVEGAÇÃO QUE SUBSTITUI A DAS PÁGINAS INDIVIDUAIS
  const handleNavigation = (id: string, external?: boolean) => {
    const rotasInteligentes: Record<string, { path: string, state?: any }> = {
      'dashboard': { path: '/' },
      'lancamento': { path: '/lancamentos' },
      'clientes': { path: '/clientes' },
      'projetos': { path: '/projetos' },
      'obras': { path: '/obras' }, 
      'orcamento': { path: '/obras' }, 
      'relatoriosObra': { path: '/obras' }, 
      'contasReceber': { path: '/financeiro', state: { tab: 'receber' } },
      'contasPagar': { path: '/financeiro', state: { tab: 'pagar' } },
      'comissoes': { path: '/financeiro', state: { tab: 'comissoes' } },
      'relatorios': { path: '/financeiro', state: { tab: 'receber' } },
      'importar': { path: '/lancamentos' },
      'acessos': { path: '/acessos' },
      'super-admin': { path: '/super-admin' }
    };

    const destino = rotasInteligentes[id];
    
    if (destino) {
      navigate(destino.path, { state: destino.state });
    } else {
      // Fallback de segurança caso a rota não esteja mapeada
      onNavigate(id); 
    }
    
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
        className="w-[300px] glass-strong p-0 border-r border-white/5 flex flex-col h-full bg-gradient-to-b from-[#0f0f1e] to-[#0a0a0a]"
      >
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent shrink-0">
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
        <div className="flex-1 overflow-y-auto py-4 space-y-1 px-3 custom-scrollbar">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permKey || permissions[item.permKey as keyof UserPermissions]
            );

            if (visibleItems.length === 0) return null;
            const isOpen = openSections[section.title];

            return (
              <div key={section.title} className="mb-2">
                {/* BOTÃO DA SANFONA */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-3 text-xs font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors group rounded-xl hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">{section.icon}</span>
                    {section.title}
                  </div>
                  {isOpen ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                </button>

                {/* ITENS DA SEÇÃO COM ANIMAÇÃO */}
                <div 
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out", 
                    isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}
                >
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id, item.external)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-[11px] uppercase tracking-wider pl-10",
                          isActive
                            ? "text-emerald-400 bg-white/[0.03] font-bold"
                            : "text-zinc-500 font-semibold hover:text-zinc-300 hover:bg-white/5"
                        )}
                      >
                        <Icon size={14} className={cn("flex-shrink-0", isActive ? "text-emerald-400" : "opacity-70")} />
                        <span className="text-left flex-1 truncate">{item.label}</span>
                        {isActive && (
                          <div className="w-1 h-1 bg-emerald-400 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
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
              <Separator className="my-3 bg-white/5 mx-3 w-auto" />
              
              <div className="mb-2">
                <button
                  onClick={() => toggleSection('Admin')}
                  className="w-full flex items-center justify-between px-3 py-3 text-xs font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors group rounded-xl hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">⚙️</span>
                    Administração
                  </div>
                  {openSections['Admin'] ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                </button>

                <div 
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out", 
                    openSections['Admin'] ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}
                >
                  {adminSections.map((item) => {
                    if (item.permKey && !permissions[item.permKey as keyof UserPermissions]) return null;
                    if (item.id === 'super-admin' && !isSuperAdmin) return null;

                    const Icon = item.icon;
                    const isActive = active === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id, item.external)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-[11px] uppercase tracking-wider pl-10",
                          isActive
                            ? "text-purple-400 bg-white/[0.03] font-bold"
                            : "text-zinc-500 font-semibold hover:text-purple-300 hover:bg-white/5"
                        )}
                      >
                        <Icon size={14} className={cn("flex-shrink-0", isActive ? "text-purple-400" : "opacity-70")} />
                        <span className="text-left flex-1 truncate">{item.label}</span>
                        {isActive && (
                          <div className="w-1 h-1 bg-purple-400 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
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
        <div className="p-4 border-t border-white/5 space-y-3 bg-gradient-to-t from-white/[0.02] to-transparent shrink-0">
          <p className="text-[10px] font-semibold text-zinc-500 px-2 flex justify-between items-center">
            <span>Sessão Ativa</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
          <Button
            onClick={handleLogoutClick}
            variant="ghost"
            className="w-full gap-2 rounded-xl font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 justify-start"
          >
            <LogOut size={16} />
            Sair do Sistema
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
