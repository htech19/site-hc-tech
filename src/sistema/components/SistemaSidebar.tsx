import { memo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  Undo2,
  User,
  UserRound,
  Wallet,
  Wrench,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSistemaAuth } from "@/sistema/auth";
import AlterarSenhaDialog from "@/sistema/components/AlterarSenhaDialog";

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
      { para: "/sistema/clientes", rotulo: "Clientes", icone: User },
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
      { para: "/sistema/usuarios", rotulo: "Usuários", icone: Shield },
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
  const [dialogSenhaAberto, setDialogSenhaAberto] = useState(false);

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
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-border bg-card shadow-sm",
          "transition-transform duration-300 ease-out",
          aberto ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0"
        )}
        aria-label="Navegação principal"
      >
        {/* Cabeçalho da marca */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 cursor-pointer hover:bg-secondary/50 rounded-lg mx-2"
          onClick={() => { window.location.href = "/sistema"; }}
          title="Ir para Dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground shadow-sm">
            HC
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-foreground">
              HC TECH
            </h1>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
              Gestão de Assistência
            </span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECOES_MENU.map((secao) => (
            <div key={secao.titulo} className="mb-4">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {secao.titulo}
              </div>
              <ul className="space-y-1">
                {secao.itens.map((item) => (
                  <li key={item.para}>
                    <NavLink
                      to={item.para}
                      end={item.fim}
                      onClick={aoFechar}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )
                      }
                    >
                      <item.icone size={18} className="shrink-0 opacity-70 group-hover:opacity-100" />
                      <span className="truncate">{item.rotulo}</span>
                      {item.contagem !== undefined && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {item.contagem}
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
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              HC
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {loading ? "…" : (session?.user.email ?? "Admin")}
              </div>
              <div className="text-[10px] text-muted-foreground">Administrador</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDialogSenhaAberto(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <KeyRound size={16} /> Alterar senha
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/sistema/login";
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-destructive"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>

        <AlterarSenhaDialog
          open={dialogSenhaAberto}
          onOpenChange={setDialogSenhaAberto}
        />
      </aside>
    </>
  );
});

export default SistemaSidebar;
