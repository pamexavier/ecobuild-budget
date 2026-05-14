import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/hooks/AuthProvider'; // ✅ Adicionado useAuth
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SemTenant from "@/pages/SemTenant";
import SuperAdmin from "@/pages/SuperAdmin";
import Index from "./pages/Index.tsx";
import Enviar from "./pages/Enviar.tsx";
import Login from "./pages/Login.tsx";
import GerenciarAcessos from "./pages/GerenciarAcessos.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

/**
 * TenantGate — só avalia tenant DEPOIS que loading terminou.
 * Como o useAuth agora aguarda fetchRoleAndPermissions antes de
 * setar loading=false, não há mais janela onde tenantId ainda é null.
 */
function TenantGate({ children }: { children: React.ReactNode }) {
  const { user, tenantId, isSuperAdmin, loading } = useAuth(); // ✅ Agora funciona

  // Só mostra SemTenant se loading for false E já tentou buscar tenantId
  if (loading || (user && tenantId === null && !isSuperAdmin)) {
    // Mostra um spinner enquanto carrega, para evitar flicker
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  if (user && !tenantId && !isSuperAdmin) return <SemTenant />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Página pública de lançamento rápido (sem tenant obrigatório) */}
            <Route path="/enviar" element={<Enviar />} />

            {/* Super Admin — EcomindsX only */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute>
                  <SuperAdmin />
                </ProtectedRoute>
              }
            />

            {/* App principal — requer tenant */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Index />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            <Route
              path="/gerenciar-acessos"
              element={
                <ProtectedRoute requiredPermission="podeGerenciarAcessos">
                  <TenantGate>
                    <GerenciarAcessos />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;