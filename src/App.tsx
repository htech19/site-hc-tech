import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, Outlet } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import ChatWidget from "@/components/ChatWidget";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import { getQueryClient } from "./sistema/queryClient";

const LojaPage = lazy(() => import("./pages/LojaPage"));
const ProdutoPage = lazy(() => import("./pages/ProdutoPage"));
const TelasPage = lazy(() => import("./pages/TelasPage"));
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
const SistemaTabelaPrecosPage = lazy(() => import("./sistema/pages/SistemaTabelaPrecosPage"));
const SistemaEstoquePage = lazy(() => import("./sistema/pages/SistemaEstoquePage"));
const SistemaOrcamentosPage = lazy(() => import("./sistema/pages/SistemaOrcamentosPage"));
const SistemaCaixaPage = lazy(() => import("./sistema/pages/SistemaCaixaPage"));
const SistemaDevolucoesPage = lazy(() => import("./sistema/pages/SistemaDevolucoesPage"));
const SistemaRelatoriosPage = lazy(() => import("./sistema/pages/SistemaRelatoriosPage"));
// Vindas da main: orçamentos solicitados pelo site (Lovable).
const SistemaSolicitacoesPage = lazy(() => import("./sistema/pages/SistemaSolicitacoesPage"));
const QuoteDialog = lazy(() => import("@/components/quote/QuoteDialog"));

// QueryClient compartilhado com a store do /sistema (permite invalidação de cache
// a partir das ações CRUD sem dependência circular). Ver src/sistema/queryClient.ts
const queryClient = getQueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GoogleAnalytics />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Navigate to="/telas" replace />} />

              <Route path="/loja" element={<LojaPage />} />
              <Route path="/loja/:slug" element={<LojaPage />} />

              <Route path="/produto/:slug" element={<ProdutoPage />} />

              <Route path="/telas" element={<TelasPage />} />
              {/* Página antiga excluída: /telas absorveu o design e o conteúdo. */}
              <Route path="/trocas-de-tela" element={<Navigate to="/telas" replace />} />
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
                  <Route path="solicitacoes" element={<SistemaSolicitacoesPage />} />
                  <Route path="servicos" element={<SistemaTabelaPrecosPage />} />
                  <Route path="tipos-servico" element={<SistemaServicosPage />} />
                  <Route path="estoque" element={<SistemaEstoquePage />} />
                  <Route path="orcamentos" element={<SistemaOrcamentosPage />} />
                  <Route path="caixa" element={<SistemaCaixaPage />} />
                  <Route path="devolucoes" element={<SistemaDevolucoesPage />} />
                  <Route path="relatorios" element={<SistemaRelatoriosPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Suspense fallback={null}><QuoteDialog /></Suspense>
          <ChatWidget />
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
  );
};

export default App;
