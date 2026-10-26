import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvisoSemConexao, EstadoErro, EstadoVazio } from "./LoadingSpinner";

export interface Coluna<T> {
  /** Identificador da coluna (usado como key e para ordenação). */
  chave: string;
  rotulo: string;
  /** Renderizador da célula. */
  conteudo: (linha: T) => ReactNode;
  /** Permite ordenar por esta coluna (via `chaveOrdenacao`). */
  ordenavel?: boolean;
  /** Função que extrai o valor comparável; padrão usa `conteudo` como string. */
  chaveOrdenacao?: (linha: T) => string | number;
  /** Alinhamento do conteúdo. */
  alinhar?: "left" | "center" | "right";
  /** Largura CSS da coluna (ex.: "120px", "15%"). */
  largura?: string;
  /** Oculta a coluna em telas pequenas. */
  ocultarNoMobile?: boolean;
}

interface Props<T> {
  colunas: Coluna<T>[];
  linhas: T[];
  /** Key estável de cada linha. */
  keyLinha: (linha: T) => string;
  /**
   * A consulta ainda NÃO assentou (repassar `isPending`, nunca `isLoading`).
   * Enquanto true a tabela mostra esqueleto — jamais o estado vazio.
   */
  carregando?: boolean;
  /**
   * A busca está parada por falta de conexão (React Query pausado). Mostra o
   * aviso junto do esqueleto, para o usuário saber que é rede, não lentidão.
   */
  pausada?: boolean;
  /**
   * Erro da consulta. Quando presente, tem precedência sobre o estado vazio:
   * uma consulta que falhou NÃO é uma lista sem registros.
   */
  erro?: unknown;
  /** Recarrega a consulta (botão "Tentar novamente" do estado de erro). */
  aoTentarNovamente?: () => void;
  /** Mensagem do estado vazio. */
  vazioTitulo?: string;
  vazioDescricao?: string;
  vazioIcone?: string;
  /** Ação exibida no estado vazio. */
  vazioAcao?: ReactNode;
  /** Ativa/desativa a paginação client-side. */
  paginar?: boolean;
  linhasPorPagina?: number;
  /** Opções de quantidade de linhas por página selecionáveis pelo usuário. */
  linhasPorPaginaOpcoes?: number[];
  /** Densidade da tabela: "compacta" diminui espaçamentos para ver mais itens. */
  densidade?: "normal" | "compacta";
  /** Callback opcional quando o usuário troca o tamanho da página. */
  onMudarLinhasPorPagina?: (linhas: number) => void;
  /** Número total (quando a paginação é server-side, a página controla externamente). */
  totalLinhas?: number;
  /** Classe extra do container. */
  className?: string;
  /** Callback ao clicar na linha. */
  aoClicarLinha?: (linha: T) => void;
}

type Direcao = "asc" | "desc";

/**
 * Tabela genérica com ordenação e paginação.
 *
 * - `React.memo` + listas memoizadas evitam re-render ao digitar em filtros.
 * - Ordenação e paginação são puras (`useMemo`), recalculadas só quando as
 *   dependências mudam.
 */
function DataTableInterna<T>({
  colunas,
  linhas,
  keyLinha,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  vazioTitulo = "Nenhum registro encontrado",
  vazioDescricao,
  vazioIcone,
  vazioAcao,
  paginar = true,
  linhasPorPagina = 15,
  linhasPorPaginaOpcoes,
  densidade = "normal",
  onMudarLinhasPorPagina,
  className,
  aoClicarLinha,
}: Props<T>) {
  const [ordenacao, setOrdenacao] = useState<{ chave: string; direcao: Direcao } | null>(null);
  const [pagina, setPagina] = useState(0);
  const [tamanhoPagina, setTamanhoPagina] = useState(linhasPorPagina);

  useEffect(() => {
    setTamanhoPagina(linhasPorPagina);
  }, [linhasPorPagina]);

  const alternarOrdenacao = (col: Coluna<T>) => {
    if (!col.ordenavel) return;
    setOrdenacao((atual) => {
      if (atual?.chave !== col.chave) return { chave: col.chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave: col.chave, direcao: "desc" };
      return null; // cicla: asc -> desc -> sem ordenação
    });
    setPagina(0);
  };

  const linhasOrdenadas = useMemo(() => {
    if (!ordenacao) return linhas;
    const col = colunas.find((c) => c.chave === ordenacao.chave);
    if (!col?.chaveOrdenacao) return linhas;
    const extrair = col.chaveOrdenacao;
    const fator = ordenacao.direcao === "asc" ? 1 : -1;
    return [...linhas].sort((a, b) => {
      const va = extrair(a);
      const vb = extrair(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * fator;
      return String(va).localeCompare(String(vb), "pt-BR") * fator;
    });
  }, [linhas, ordenacao, colunas]);

  const totalPaginas = Math.max(1, Math.ceil(linhasOrdenadas.length / tamanhoPagina));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);

  const linhasVisiveis = useMemo(
    () =>
      paginar
        ? linhasOrdenadas.slice(paginaAtual * tamanhoPagina, (paginaAtual + 1) * tamanhoPagina)
        : linhasOrdenadas,
    [linhasOrdenadas, paginaAtual, tamanhoPagina, paginar]
  );

  const alinhamento = (a?: Coluna<T>["alinhar"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const classePaddingCabecalho = densidade === "compacta" ? "px-3 py-2 text-[10px]" : "px-4 py-3 text-[11px]";
  const classePaddingCelula = densidade === "compacta" ? "px-3 py-1.5 text-xs" : "px-4 py-3 text-sm";

  if (carregando) {
    return (
      <div className="space-y-2 p-4" aria-busy="true">
        {pausada && <AvisoSemConexao className="mb-2" />}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-md bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  // Erro ANTES do vazio: se a consulta falhou, dizer "nenhum registro" seria mentira.
  // O título é sempre o genérico de erro — reaproveitar `vazioTitulo` (ex.:
  // "Nenhum orçamento") contradiria a própria mensagem de falha.
  if (erro) {
    return <EstadoErro erro={erro} aoTentarNovamente={aoTentarNovamente} />;
  }

  if (linhasOrdenadas.length === 0) {
    return <EstadoVazio icone={vazioIcone} titulo={vazioTitulo} descricao={vazioDescricao} acao={vazioAcao} />;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-800/70">
              {colunas.map((col) => (
                <th
                  key={col.chave}
                  scope="col"
                  style={col.largura ? { width: col.largura } : undefined}
                  className={cn(
                    "whitespace-nowrap border-b border-zinc-700 font-semibold uppercase tracking-wide text-zinc-400",
                    classePaddingCabecalho,
                    alinhamento(col.alinhar),
                    col.ocultarNoMobile && "hidden md:table-cell"
                  )}
                >
                  {col.ordenavel ? (
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao(col)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-[#00FF88]",
                        ordenacao?.chave === col.chave && "text-[#00FF88]"
                      )}
                    >
                      {col.rotulo}
                      {ordenacao?.chave === col.chave &&
                        (ordenacao.direcao === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </button>
                  ) : (
                    col.rotulo
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhasVisiveis.map((linha) => (
              <tr
                key={keyLinha(linha)}
                onClick={aoClicarLinha ? () => aoClicarLinha(linha) : undefined}
                className={cn(
                  "border-b border-zinc-800/70 transition-colors hover:bg-[#00FF88]/[0.04]",
                  aoClicarLinha && "cursor-pointer"
                )}
              >
                {colunas.map((col) => (
                  <td
                    key={col.chave}
                    className={cn(
                      "align-middle text-zinc-200",
                      classePaddingCelula,
                      alinhamento(col.alinhar),
                      col.ocultarNoMobile && "hidden md:table-cell"
                    )}
                  >
                    {col.conteudo(linha)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginar && (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3"
          aria-label="Paginação"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-zinc-500">
              Página {paginaAtual + 1} de {totalPaginas} · {linhasOrdenadas.length} registro(s)
            </span>
            {linhasPorPaginaOpcoes && linhasPorPaginaOpcoes.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Exibir:</span>
                <select
                  value={tamanhoPagina}
                  onChange={(e) => {
                    const novo = Number(e.target.value);
                    setTamanhoPagina(novo);
                    setPagina(0);
                    onMudarLinhasPorPagina?.(novo);
                  }}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-[#00FF88] focus:outline-none"
                  aria-label="Itens por página"
                >
                  {linhasPorPaginaOpcoes.map((op) => (
                    <option key={op} value={op}>
                      {op} por página
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={paginaAtual === 0}
                className="rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={paginaAtual >= totalPaginas - 1}
                className="rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

/** Tabela genérica memoizada (compara props superficialmente). */
export const DataTable = memo(DataTableInterna) as typeof DataTableInterna;

export default DataTable;
