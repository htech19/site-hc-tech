import { memo, useCallback } from "react";
import { ArrowLeftRight, CheckSquare, Pencil, ShoppingBag, Square, Trash2 } from "lucide-react";
import { DataTable, type Coluna } from "./DataTable";
import { formatData } from "@/sistema/os-shared";
import { useSistemaStore } from "@/sistema/store";
import type { EstoqueItem } from "@/sistema/types";
import { rotuloCategoria } from "@/sistema/data/categoriasEstoque";

const CLASSE_BOTAO =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50";

interface Props {
  linhas: EstoqueItem[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  aoEditar: (item: EstoqueItem) => void;
  aoMovimentar?: (item: EstoqueItem) => void;
  selecionados?: Set<string>;
  aoAlternarSelecao?: (id: string) => void;
  aoSelecionarTodosPagina?: () => void;
  todosPaginaSelecionados?: boolean;
  densidade?: "normal" | "compacta";
  linhasPorPaginaOpcoes?: number[];
}

/**
 * Tabela de estoque avançada (produtos, peças, aparelhos em custódia e Mercado Livre).
 */
export const EstoqueList = memo(function EstoqueList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  aoEditar,
  aoMovimentar,
  selecionados,
  aoAlternarSelecao,
  aoSelecionarTodosPagina,
  todosPaginaSelecionados,
  densidade = "normal",
  linhasPorPaginaOpcoes = [15, 25, 50, 100],
}: Props) {
  const excluirItemEstoque = useSistemaStore((s) => s.excluirItemEstoque);
  const handleEditar = useCallback((i: EstoqueItem) => aoEditar(i), [aoEditar]);
  const handleMovimentar = useCallback((i: EstoqueItem) => aoMovimentar?.(i), [aoMovimentar]);

  const handleExcluir = useCallback(
    (i: EstoqueItem) => {
      if (!window.confirm(`Remover "${i.aparelho}" do estoque?`)) return;
      void excluirItemEstoque(i.id);
    },
    [excluirItemEstoque]
  );

  const colunas: Coluna<EstoqueItem>[] = [
    ...(aoAlternarSelecao
      ? [
          {
            chave: "selecao",
            rotulo: todosPaginaSelecionados ? "☑" : "☐",
            largura: "44px",
            alinhar: "center" as const,
            conteudo: (i: EstoqueItem) => (
              <input
                type="checkbox"
                checked={selecionados?.has(i.id) ?? false}
                onChange={() => aoAlternarSelecao(i.id)}
                aria-label={`Selecionar ${i.aparelho}`}
                className="h-4 w-4 cursor-pointer rounded border-border bg-card text-primary focus:ring-[#00FF88]/20 focus:ring-offset-0"
              />
            ),
          },
        ]
      : []),
    {
      chave: "aparelho",
      rotulo: "Aparelho / Produto",
      ordenavel: true,
      chaveOrdenacao: (i) => i.aparelho,
      conteudo: (i) => (
        <div>
          <span className="font-semibold text-foreground">{i.aparelho}</span>
          {(i.categoria || i.subcategoria) && (
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {rotuloCategoria(i.categoria ?? "")}
              {i.subcategoria ? ` · ${i.subcategoria}` : ""}
            </span>
          )}
        </div>
      ),
    },
    {
      chave: "sku",
      rotulo: "SKU",
      ordenavel: true,
      chaveOrdenacao: (i) => i.sku ?? "",
      largura: "110px",
      ocultarNoMobile: true,
      conteudo: (i) => <span className="font-mono text-xs text-muted-foreground">{i.sku || "—"}</span>,
    },
    {
      chave: "quantidade",
      rotulo: "Saldo",
      ordenavel: true,
      chaveOrdenacao: (i) => i.quantidade,
      alinhar: "center",
      largura: "90px",
      conteudo: (i) => (
        <span
          className={
            i.quantidade <= 0
              ? "inline-flex min-w-8 justify-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-400"
              : i.quantidade === 1
              ? "inline-flex min-w-8 justify-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300"
              : "inline-flex min-w-8 justify-center rounded-md border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-xs font-bold text-green-400"
          }
        >
          {i.quantidade} un.
        </span>
      ),
    },
    {
      chave: "preco_venda",
      rotulo: "Preço Venda",
      ordenavel: true,
      chaveOrdenacao: (i) => i.precoVenda ?? -1,
      largura: "110px",
      alinhar: "right",
      conteudo: (i) => (
        <div>
          <span className="font-semibold text-primary">
            {i.precoVenda != null ? `R$ ${i.precoVenda.toFixed(2)}` : "—"}
          </span>
          {i.custo != null && (
            <span className="block text-[10px] text-muted-foreground">
              Custo: R$ {i.custo.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      chave: "defeito",
      rotulo: "Defeito",
      ordenavel: true,
      chaveOrdenacao: (i) => i.defeito ?? "",
      conteudo: (i) => (
        <span className="block max-w-[220px] truncate text-foreground" title={i.defeito ?? ""}>
          {i.defeito || "—"}
        </span>
      ),
    },
    {
      chave: "condicao",
      rotulo: "Condição",
      ordenavel: true,
      chaveOrdenacao: (i) => i.condicao ?? "",
      largura: "150px",
      ocultarNoMobile: true,
      conteudo: (i) => <span className="text-muted-foreground">{i.condicao || "—"}</span>,
    },
    {
      chave: "observacao",
      rotulo: "Observação",
      ocultarNoMobile: true,
      conteudo: (i) => (
        <span
          className="block max-w-[200px] truncate text-muted-foreground"
          title={i.observacao ?? ""}
        >
          {i.observacao || "—"}
        </span>
      ),
    },
    {
      chave: "proprietario",
      rotulo: "Proprietário",
      ordenavel: true,
      chaveOrdenacao: (i) => i.proprietario,
      largura: "130px",
      conteudo: (i) => {
        const p = i.proprietario || "HC TECH";
        const isML = p.toLowerCase().includes("mercado livre");
        const isHC = p.toLowerCase().includes("hc tech");
        return (
          <span
            className={
              isML
                ? "inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-300"
                : isHC
                ? "inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300"
                : "text-foreground"
            }
          >
            {p}
          </span>
        );
      },
    },
    {
      chave: "canal_de_venda",
      rotulo: "Canal Venda",
      ordenavel: true,
      chaveOrdenacao: (i) => i.canal_de_venda,
      largura: "140px",
      conteudo: (i) => {
        const canal = i.canal_de_venda || "Loja física";
        const isML = canal.toLowerCase().includes("mercado livre");
        return isML ? (
          <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
            🛒 Mercado Livre
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/80 px-2 py-0.5 text-xs text-foreground">
            🏪 {canal}
          </span>
        );
      },
    },
    {
      chave: "defeito",
      rotulo: "Defeito / Obs.",
      ordenavel: true,
      chaveOrdenacao: (i) => i.defeito ?? "",
      conteudo: (i) => (
        <span className="block max-w-[200px] truncate text-muted-foreground" title={i.defeito || i.observacao || ""}>
          {i.defeito || i.observacao || "—"}
        </span>
      ),
    },
    {
      chave: "condicao",
      rotulo: "Condição",
      ordenavel: true,
      chaveOrdenacao: (i) => i.condicao ?? "",
      largura: "120px",
      ocultarNoMobile: true,
      conteudo: (i) => <span className="text-muted-foreground">{i.condicao || "—"}</span>,
    },
    {
      chave: "createdAt",
      rotulo: "Entrada",
      ordenavel: true,
      chaveOrdenacao: (i) => i.createdAt,
      largura: "110px",
      ocultarNoMobile: true,
      conteudo: (i) => <span className="text-muted-foreground">{formatData(i.createdAt)}</span>,
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "130px",
      conteudo: (i) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {aoMovimentar && (
            <button
              type="button"
              className={`${CLASSE_BOTAO} hover:border-primary hover:text-primary`}
              title="Movimentar Entrada / Saída"
              aria-label={`Movimentar ${i.aparelho}`}
              onClick={() => handleMovimentar(i)}
            >
              <ArrowLeftRight size={13} />
            </button>
          )}
          <button
            type="button"
            className={CLASSE_BOTAO}
            title="Editar item"
            aria-label={`Editar ${i.aparelho}`}
            onClick={() => handleEditar(i)}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className={`${CLASSE_BOTAO} hover:border-rose-500 hover:text-rose-400`}
            title="Excluir item"
            aria-label={`Excluir ${i.aparelho}`}
            onClick={() => handleExcluir(i)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <DataTable
        colunas={colunas}
        linhas={linhas}
        keyLinha={(i) => i.id}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        vazioTitulo="Estoque vazio"
        vazioDescricao="Nenhum item encontrado com os filtros selecionados."
        vazioIcone="📦"
        densidade={densidade}
        linhasPorPaginaOpcoes={linhasPorPaginaOpcoes}
      />
    </div>
  );
});

export default EstoqueList;
