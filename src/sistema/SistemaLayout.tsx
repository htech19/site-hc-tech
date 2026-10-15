import { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSistemaAuth } from "@/sistema/auth";
import { useSistemaStore } from "@/sistema/store";
import { SistemaSidebar } from "@/sistema/components/SistemaSidebar";
import { SistemaHeader } from "@/sistema/components/SistemaHeader";
import { ToastNotification } from "@/sistema/components/ToastNotification";
import { LoadingSpinner } from "@/sistema/components/LoadingSpinner";

/**
 * Layout do módulo /sistema.
 *
 * - Preserva a autenticação existente (`useSistemaAuth`): sem sessão redireciona
 *   para /sistema/login.
 * - Tema escuro profissional (slate/zinc) com destaque verde neon (#00FF88).
 * - Menu lateral responsivo + topbar com busca global e atalho "Nova OS".
 * - Notificações (toast) globais do módulo.
 */
export default function SistemaLayout() {
  const { session, loading } = useSistemaAuth();

  const barraAberta = useSistemaStore((s) => s.barraLateralAberta);
  const alternarBarra = useSistemaStore((s) => s.alternarBarraLateral);
  const fecharBarra = useSistemaStore((s) => s.fecharBarraLateral);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <LoadingSpinner tamanho={28} rotulo="Carregando sistema..." />
      </div>
    );
  }

  if (!session) return <Navigate to="/sistema/login" replace />;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <SistemaSidebar aberto={barraAberta} aoFechar={fecharBarra} />

      <div className="flex min-w-0 flex-1 flex-col">
        <SistemaHeader aoAlternarMenu={alternarBarra} />

        <main className="flex-1 p-4 md:p-6">
          <Suspense
            fallback={
              <LoadingSpinner
                className="h-64"
                rotulo="Carregando página..."
              />
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ToastNotification />
    </div>
  );
}
