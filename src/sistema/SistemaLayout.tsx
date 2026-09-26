import { NavLink, Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Users, Tags, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSistemaAuth } from "@/sistema/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/sistema", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sistema/os", label: "Ordens de Serviço", icon: ClipboardList },
  { to: "/sistema/clientes", label: "Clientes", icon: Users },
  { to: "/sistema/servicos", label: "Tabela de Preços", icon: Tags },
];

const titles: Record<string, string> = {
  "/sistema": "Dashboard",
  "/sistema/os": "Ordens de Serviço",
  "/sistema/clientes": "Clientes",
  "/sistema/servicos": "Tabela de Preços",
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
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
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
          <h1 className="text-lg font-semibold">{title}</h1>
        </header>
        <main className="p-4 md:p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
