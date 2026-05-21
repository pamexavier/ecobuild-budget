import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/hooks/AuthProvider.tsx';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SemTenant from "@/pages/SemTenant";
import SuperAdmin from "@/pages/SuperAdmin";
import Login from "@/pages/Login.tsx";
import NotFound from "@/pages/NotFound.tsx";

// New Pages
import Dashboard from "@/pages/Dashboard.tsx";
import Obras from "@/pages/Obras.tsx";
import Lancamentos from "@/pages/Lancamentos.tsx";
import Projetos from "@/pages/Projetos.tsx";
import Clientes from "@/pages/Clientes.tsx";
import Financeiro from "@/pages/Financeiro.tsx";
import Adm from "@/pages/Adm.tsx";

// Legacy (será descontinuado)
import Index from "./pages/Index.tsx";

const queryClient = new QueryClient();

/**
 * TenantGate — só avalia tenant DEPOIS que loading terminou.
 */
function TenantGate({ children }: { children: React.ReactNode }) {
  const { user, tenantId, isSuperAdmin, loading } = useAuth();

  if (loading || (user && tenantId === null && !isSuperAdmin)) {
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

            {/* Super Admin — EcomindsX only */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute>
                  <SuperAdmin />
                </ProtectedRoute>
              }
            />

            {/* NOVA ESTRUTURA — requer tenant */}
            
            {/* Dashboard — landing page */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Dashboard />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* Obras */}
            <Route
              path="/obras/*"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Obras />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* Lançamentos */}
            <Route
              path="/lancamentos/*"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Lancamentos />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* Projetos */}
            <Route
              path="/projetos/*"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Projetos />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* Clientes */}
            <Route
              path="/clientes/*"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Clientes />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* Financeiro */}
            <Route
              path="/financeiro/*"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Financeiro />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* Administração */}
            <Route
              path="/adm/*"
              element={
                <ProtectedRoute requiredPermission="podeGerenciarAcessos">
                  <TenantGate>
                    <Adm />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* LEGADO — será descontinuado */}
            <Route
              path="/index-old"
              element={
                <ProtectedRoute>
                  <TenantGate>
                    <Index />
                  </TenantGate>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;