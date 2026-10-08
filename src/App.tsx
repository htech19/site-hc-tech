import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import ChatWidget from "@/components/ChatWidget";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";

const LojaPage = lazy(() => import("./pages/LojaPage"));
const ProdutoPage = lazy(() => import("./pages/ProdutoPage"));
const TelasPage = lazy(() => import("./pages/TelasPage"));
const TelasLandingPage = lazy(() => import("./pages/TelasLandingPage"));
const PrivacidadePage = lazy(() => import("./pages/PrivacidadePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const SistemaAuthProvider = lazy(() =>
  import("./sistema/auth").then((m) => ({ default: m.SistemaAuthProvider }))
);
const SistemaLayout = lazy(() => import("./sistema/SistemaLayout"));
const SistemaLoginPage = lazy(() => import("./sistema/pages/SistemaLoginPage"));
const SistemaDashboardPage = lazy(() => import("./sistema/pages/SistemaDashboardPage"));
const SistemaOsPage = lazy(() => import("./sistema/pages/SistemaOsPage"));
const SistemaClientesPage = lazy(() => import("./sistema/pages/SistemaClientesPage"));
const SistemaServicosPage = lazy(() => import("./sistema/pages/SistemaServicosPage"));
const SistemaGestaoPage = lazy(() => import("./sistema/pages/SistemaGestaoPage"));

const queryClient = new QueryClient();

const GitHubPagesRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get("redirect");

    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      // Verifica se já estamos na rota correta para evitar loop
      if (location.pathname !== redirect) {
        // Limpa completamente a URL (remove ?redirect=)
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, "", cleanUrl);

        // Navega para a rota correta
        navigate(redirect, { replace: true });
      }
    }
  }, [navigate, location.search, location.pathname]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GitHubPagesRedirect />
          <GoogleAnalytics />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Navigate to="/telas" replace />} />

              <Route path="/loja" element={<LojaPage />} />
              <Route path="/loja/:slug" element={<LojaPage />} />

              <Route path="/produto/:slug" element={<ProdutoPage />} />

              <Route path="/telas" element={<TelasPage />} />
              <Route path="/trocas-de-tela" element={<TelasLandingPage />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />
              <Route
                path="/sistema"
                element={
                  <SistemaAuthProvider>
                    <Outlet />
                  </SistemaAuthProvider>
                }
              >
                <Route path="login" element={<SistemaLoginPage />} />
                <Route element={<SistemaLayout />}>
                  <Route index element={<SistemaDashboardPage />} />
                  <Route path="os" element={<SistemaOsPage />} />
                  <Route path="clientes" element={<SistemaClientesPage />} />
                  <Route path="servicos" element={<SistemaServicosPage />} />
                  <Route path="tipos-servico" element={<SistemaGestaoPage kind="tipos" />} />
                  <Route path="estoque" element={<SistemaGestaoPage kind="estoque" />} />
                  <Route path="orcamentos" element={<SistemaGestaoPage kind="orcamentos" />} />
                  <Route path="caixa" element={<SistemaGestaoPage kind="caixa" />} />
                  <Route path="devolucoes" element={<SistemaGestaoPage kind="devolucoes" />} />
                  <Route path="relatorios" element={<SistemaGestaoPage kind="relatorios" />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <ChatWidget />
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
  );
};

export default App;
