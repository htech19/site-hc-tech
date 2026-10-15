import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  Undo2,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSistemaAuth } from "@/sistema/auth";

export interface ItemMenu {
  para: string;
  rotulo: string;
  icone: LucideIcon;
  fim?: boolean;
  /** Badge com contador (ex.: total de OS). */
  contagem?: number;
}

export interface SecaoMenu {
  titulo: string;
  itens: ItemMenu[];
}

/** Estrutura do menu lateral — replica as 4 seções do HTML de referência. */
export const SECOES_MENU: SecaoMenu[] = [
  {
    titulo: "Principal",
    itens: [
      { para: "/sistema", rotulo: "Dashboard", icone: LayoutDashboard, fim: true },
      { para: "/sistema/os", rotulo: "Ordens de Serviço", icone: ClipboardList },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { para: "/sistema/clientes", rotulo: "Clientes", icone: Users },
      { para: "/sistema/estoque", rotulo: "Estoque", icone: Package },
      { para: "/sistema/tipos-servico", rotulo: "Serviços", icone: Wrench },
      { para: "/sistema/servicos", rotulo: "Tabela de Preços", icone: Tags },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { para: "/sistema/solicitacoes", rotulo: "Solicitações (site)", icone: ClipboardList },
      { para: "/sistema/orcamentos", rotulo: "Orçamentos", icone: Wallet },
      { para: "/sistema/caixa", rotulo: "Caixa", icone: CreditCard },
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      { para: "/sistema/devolucoes", rotulo: "Devoluções", icone: Undo2 },
      { para: "/sistema/relatorios", rotulo: "Relatórios", icone: BarChart3 },
    ],
  },
];

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  /** Total de OS — exibido como badge no item "Ordens de Serviço". */
  contagemOS?: number;
}

/**
 * Menu lateral responsivo (mobile-first).
 *
 * No desktop é estático; no mobile desliza por cima do conteúdo. O item ativo
 * recebe destaque em verde neon (#00FF88), conforme spec FASE 6.
 */
export const SistemaSidebar = memo(function SistemaSidebar({ aberto, aoFechar, contagemOS }: Props) {
  const { session, loading } = useSistemaAuth();

  return (
    <>
      {/* Overlay no mobile */}
      {aberto && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={aoFechar}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-zinc-800 bg-zinc-950",
          "transition-transform duration-300 ease-out",
          aberto ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0"
        )}
        aria-label="Navegação principal"
      >
        {/* Cabeçalho da marca */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FF88] to-emerald-600 text-sm font-black text-zinc-950 shadow-[0_4px_20px_rgba(0,255,136,0.25)]">
            HC
          </div>
          <div className="min-w-0">
            <h1 className="truncate bg-gradient-to-r from-zinc-100 to-[#00FF88] bg-clip-text text-lg font-extrabold text-transparent">
              HC TECH
            </h1>
            <span className="block text-[10px] uppercase tracking-[1.5px] text-zinc-500">
              Gestão de Assistência
            </span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECOES_MENU.map((secao) => (
            <div key={secao.titulo} className="mb-5">
              <div className="mb-2 px-3 text-[10px] uppercase tracking-[1.5px] text-zinc-500">
                {secao.titulo}
              </div>
              <ul className="space-y-0.5">
                {secao.itens.map((item) => (
                  <li key={item.para}>
                    <NavLink
                      to={item.para}
                      end={item.fim}
                      onClick={aoFechar}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "border border-[#00FF88]/30 bg-gradient-to-r from-[#00FF88]/15 to-emerald-500/5 text-[#00FF88] shadow-[inset_0_1px_0_rgba(0,255,136,0.1)]"
                            : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                        )
                      }
                    >
                      <item.icone size={18} className="shrink-0" />
                      <span className="truncate">{item.rotulo}</span>
                      {item.contagem !== undefined && (
                        <span className="ml-auto rounded-full bg-[#00FF88] px-2 py-0.5 text-[10px] font-bold text-zinc-950">
                          {item.contagem}
                        </span>
                      )}
                      {item.contagem === undefined && contagemOS !== undefined && item.rotulo === "Ordens de Serviço" && (
                        <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                          {contagemOS}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rodapé: usuário + sair */}
        <div className="border-t border-zinc-800 p-3">
          <div className="mb-2 flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#00FF88] to-emerald-700 text-xs font-bold text-zinc-950">
              HC
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-zinc-100">
                {loading ? "…" : (session?.user.email ?? "Administrador")}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Administrador</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void import("@/integrations/supabase/client").then(({ supabase }) =>
                supabase.auth.signOut()
              );
              window.location.href = "/sistema/login";
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-rose-400"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
});

export default SistemaSidebar;
