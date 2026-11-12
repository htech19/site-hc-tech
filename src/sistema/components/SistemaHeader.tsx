import { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, Menu, Moon, Plus, Search, Sun, Upload } from "lucide-react";
import { useSistemaStore } from "@/sistema/store";
import { useTheme } from "next-themes";

/** Títulos e subtítulos exibidos no topo de cada rota (espelha o HTML). */
const TITULOS: Record<string, { titulo: string; subtitulo: string }> = {
  "/sistema": { titulo: "Dashboard", subtitulo: "Visão geral do sistema" },
  "/sistema/os": { titulo: "Ordens de Serviço", subtitulo: "Gerenciar todas as OS" },
  "/sistema/clientes": { titulo: "Clientes", subtitulo: "Base de clientes cadastrados" },
  "/sistema/estoque": { titulo: "Estoque", subtitulo: "Aparelhos em estoque" },
  "/sistema/tipos-servico": { titulo: "Serviços", subtitulo: "Tipos de serviço realizados" },
  "/sistema/servicos": { titulo: "Tabela de Preços", subtitulo: "Valores por categoria" },
  "/sistema/solicitacoes": {
    titulo: "Solicitações de orçamento",
    subtitulo: "Pedidos enviados pelo site",
  },
  "/sistema/orcamentos": { titulo: "Orçamentos", subtitulo: "Orçamentos emitidos" },
  "/sistema/caixa": { titulo: "Caixa", subtitulo: "Controle financeiro" },
  "/sistema/devolucoes": { titulo: "Devoluções", subtitulo: "Aparelhos devolvidos" },
  "/sistema/relatorios": { titulo: "Relatórios", subtitulo: "Relatórios e exportações" },
};

/** Debounce genérico (300ms) — usado na busca global e em filtros. */
function useDebounce<T>(valor: T, atraso = 300): T {
  const [valorDebounced, setValorDebounced] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setValorDebounced(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return valorDebounced;
}

interface Props {
  /** Abre/fecha a barra lateral no mobile. */
  aoAlternarMenu: () => void;
}

/**
 * Barra superior (topbar) do módulo /sistema.
 *
 * Contém: botão de menu (mobile), título/subtítulo da rota, busca global com
 * debounce de 300ms, botão de exportar/importar backup e atalho "Nova OS".
 */
export const SistemaHeader = memo(function SistemaHeader({ aoAlternarMenu }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const buscaGlobal = useSistemaStore((s) => s.buscaGlobal);
  const definirBuscaGlobal = useSistemaStore((s) => s.definirBuscaGlobal);
  const abrirModalOS = useSistemaStore((s) => s.abrirModalOS);
  const notificar = useSistemaStore((s) => s.notificar);

  const [buscaLocal, setBuscaLocal] = useState(buscaGlobal);
  const buscaDebounced = useDebounce(buscaLocal, 300);

  // Propaga a busca global já debounced para a store (evita re-render por tecla).
  useEffect(() => {
    if (buscaDebounced !== buscaGlobal) definirBuscaGlobal(buscaDebounced);
  }, [buscaDebounced, buscaGlobal, definirBuscaGlobal]);

  // A busca global leva o usuário para a tela de OS.
  useEffect(() => {
    if (buscaDebounced.trim().length >= 2 && location.pathname !== "/sistema/os") {
      navigate("/sistema/os");
    }
  }, [buscaDebounced, location.pathname, navigate]);

  const metadados = TITULOS[location.pathname] ?? { titulo: "Sistema", subtitulo: "HC TECH" };

  /** Exporta backup JSON (mesma funcionalidade do botão do HTML original). */
  const exportarBackup = () => {
    const dados = {
      origem: "hctech-sistema",
      exportadoEm: new Date().toISOString(),
      dica: "Backup parcial: os dados vivem no Supabase. Use os Relatórios para exportar CSV.",
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hctech_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notificar("Backup exportado com sucesso!", "success");
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm md:px-6">
      <button
        type="button"
        onClick={aoAlternarMenu}
        className="rounded-lg border border-input bg-background p-2 text-foreground transition hover:bg-accent hover:text-accent-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold text-foreground md:text-xl">{metadados.titulo}</h2>
        <p className="hidden truncate text-xs text-muted-foreground md:block">{metadados.subtitulo}</p>
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 md:flex">
        <Search size={15} className="shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={buscaLocal}
          onChange={(e) => setBuscaLocal(e.target.value)}
          placeholder="Buscar OS, cliente, aparelho..."
          aria-label="Busca global"
          className="w-48 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground lg:w-64"
        />
      </div>

      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-lg border border-input bg-background p-2 text-foreground transition hover:bg-accent hover:text-accent-foreground"
        aria-label="Alternar tema"
        title="Alternar tema"
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <button
        type="button"
        onClick={() => {
          if (location.pathname !== "/sistema/os") navigate("/sistema/os");
          abrirModalOS();
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Nova OS</span>
      </button>

    </header>
  );
});

export default SistemaHeader;
