import { memo, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable, type Coluna } from "./DataTable";
import { formatData } from "@/sistema/os-shared";
import { useSistemaStore } from "@/sistema/store";
import type { EstoqueItem } from "@/sistema/types";

const CLASSE_BOTAO =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

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
}

/**
 * Tabela de estoque (aparelhos em estoque com defeito/condição).
 * Colunas espelham o módulo Estoque do HTML de referência.
 */
export const EstoqueList = memo(function EstoqueList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  aoEditar,
}: Props) {
  const excluirItemEstoque = useSistemaStore((s) => s.excluirItemEstoque);
  const handleEditar = useCallback((i: EstoqueItem) => aoEditar(i), [aoEditar]);

  const handleExcluir = useCallback(
    (i: EstoqueItem) => {
      if (!window.confirm(`Remover "${i.aparelho}" do estoque?`)) return;
      void excluirItemEstoque(i.id);
    },
    [excluirItemEstoque]
  );

  const colunas: Coluna<EstoqueItem>[] = [
    {
      chave: "aparelho",
      rotulo: "Aparelho",
      ordenavel: true,
      chaveOrdenacao: (i) => i.aparelho,
      conteudo: (i) => <span className="font-semibold text-zinc-100">{i.aparelho}</span>,
    },
    {
      chave: "quantidade",
      rotulo: "Qtd.",
      ordenavel: true,
      chaveOrdenacao: (i) => i.quantidade,
      alinhar: "center",
      largura: "90px",
      conteudo: (i) => (
        <span
          className={
            i.quantidade <= 1
              ? "inline-flex min-w-8 justify-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300"
              : "inline-flex min-w-8 justify-center rounded-md border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-xs font-bold text-green-400"
          }
        >
          {i.quantidade}
        </span>
      ),
    },
    {
      chave: "defeito",
      rotulo: "Defeito",
      ordenavel: true,
      chaveOrdenacao: (i) => i.defeito ?? "",
      conteudo: (i) => (
        <span className="block max-w-[220px] truncate text-zinc-300" title={i.defeito ?? ""}>
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
      conteudo: (i) => <span className="text-zinc-400">{i.condicao || "—"}</span>,
    },
    {
      chave: "observacao",
      rotulo: "Observação",
      ocultarNoMobile: true,
      conteudo: (i) => (
        <span
          className="block max-w-[200px] truncate text-zinc-500"
          title={i.observacao ?? ""}
        >
          {i.observacao || "—"}
        </span>
      ),
    },
    {
      chave: "createdAt",
      rotulo: "Entrada",
      ordenavel: true,
      chaveOrdenacao: (i) => i.createdAt,
      largura: "120px",
      ocultarNoMobile: true,
      conteudo: (i) => <span className="text-zinc-400">{formatData(i.createdAt)}</span>,
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "110px",
      conteudo: (i) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={CLASSE_BOTAO}
            title="Editar"
            aria-label={`Editar ${i.aparelho}`}
            onClick={() => handleEditar(i)}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className={`${CLASSE_BOTAO} hover:border-rose-500 hover:text-rose-400`}
            title="Excluir"
            aria-label={`Excluir ${i.aparelho}`}
            onClick={() => handleExcluir(i)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <DataTable
        colunas={colunas}
        linhas={linhas}
        keyLinha={(i) => i.id}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        vazioTitulo="Estoque vazio"
        vazioDescricao="Registre a entrada de um aparelho para começar."
        vazioIcone="📦"
      />
    </div>
  );
});

export default EstoqueList;
