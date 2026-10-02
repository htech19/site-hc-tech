import { NavLink, Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Users, Tags, LogOut, Menu, Package, Wrench, Wallet, CreditCard, Undo2, BarChart3 } from "lucide-react";
import { Suspense } from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSistemaAuth } from "@/sistema/auth";
import { cn } from "@/lib/utils";

const sections = [
  { title: "Principal", items: [
    { to: "/sistema", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/sistema/os", label: "Ordens de Serviço", icon: ClipboardList },
  ]},
  { title: "Cadastros", items: [
    { to: "/sistema/clientes", label: "Clientes", icon: Users },
    { to: "/sistema/estoque", label: "Estoque", icon: Package },
    { to: "/sistema/tipos-servico", label: "Serviços", icon: Wrench },
    { to: "/sistema/servicos", label: "Tabela de Preços", icon: Tags },
  ]},
  { title: "Financeiro", items: [
    { to: "/sistema/orcamentos", label: "Orçamentos", icon: Wallet },
    { to: "/sistema/caixa", label: "Caixa", icon: CreditCard },
  ]},
  { title: "Sistema", items: [
    { to: "/sistema/devolucoes", label: "Devoluções", icon: Undo2 },
    { to: "/sistema/relatorios", label: "Relatórios", icon: BarChart3 },
  ]},
];

const titles: Record<string, string> = {
  "/sistema": "Dashboard",
  "/sistema/os": "Ordens de Serviço",
  "/sistema/clientes": "Clientes",
  "/sistema/servicos": "Tabela de Preços",
  "/sistema/tipos-servico": "Serviços",
  "/sistema/estoque": "Estoque",
  "/sistema/orcamentos": "Orçamentos",
  "/sistema/caixa": "Caixa",
  "/sistema/devolucoes": "Devoluções",
  "/sistema/relatorios": "Relatórios",
};

export default function SistemaLayout() {
  const { session, loading } = useSistemaAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-gray-500">
        Carregando...
      </div>
    );
  }
  if (!session) return <Navigate to="/sistema/login" replace />;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/sistema/login", { replace: true });
  };

  const title = titles[location.pathname] ?? "Sistema";

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1A1A1A] text-gray-200 flex flex-col transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="font-black tracking-tight text-xl text-white">
            HC <span className="text-[#00A651]">TECH</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections.map((sec) => (
            <div key={sec.title} className="pb-2">
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500">{sec.title}</div>
          {sec.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#00A651]/15 text-[#00A651] font-medium"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-gray-500 mb-2 px-1 truncate">{session.user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white flex items-center px-4 md:px-6 gap-3 sticky top-0 z-20">
          <button
            className="lg:hidden text-gray-600"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          {location.pathname !== "/sistema/os" && (
            <NavLink to="/sistema/os?nova=1" className="ml-auto text-sm font-medium bg-[#00A651] hover:bg-[#008c44] text-white rounded-md px-3 py-2">+ Nova OS</NavLink>
          )}
        </header>
        <main className="p-4 md:p-6 flex-1">
          <Suspense fallback={<div className="text-gray-500">Carregando...</div>}><Outlet /></Suspense>
        </main>
      </div>
    </div>
  );
}
