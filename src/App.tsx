import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import ChatWidget from "@/components/ChatWidget";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";

const LojaPage = lazy(() => import("./pages/LojaPage"));
const TelasPage = lazy(() => import("./pages/TelasPage"));
const TelasLandingPage = lazy(() => import("./pages/TelasLandingPage"));
const PrivacidadePage = lazy(() => import("./pages/PrivacidadePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLayout = lazy(() => import("./cms/AdminLayout"));
const LoginPage = lazy(() => import("./cms/pages/LoginPage"));
const DashboardPage = lazy(() => import("./cms/pages/DashboardPage"));
const PostsPage = lazy(() => import("./cms/pages/PostsPage"));
const TaxonomyPage = lazy(() => import("./cms/pages/TaxonomyPage"));
const SettingsPage = lazy(() => import("./cms/pages/SettingsPage"));
const LogsPage = lazy(() => import("./cms/pages/LogsPage"));

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="/loja" element={<LojaPage />} />
              <Route path="/loja/:slug" element={<LojaPage />} />

              <Route path="/telas" element={<TelasPage />} />
              <Route path="/trocas-de-tela" element={<TelasLandingPage />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="categorias" element={<TaxonomyPage kind="category" />} />
                <Route path="tags" element={<TaxonomyPage kind="tag" />} />
                <Route path="configuracoes" element={<SettingsPage />} />
                <Route path="logs" element={<LogsPage />} />
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

export default App;
