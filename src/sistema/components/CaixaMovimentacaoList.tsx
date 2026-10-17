import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { DataTable, type Coluna } from "./DataTable";
import { formatBRL, formatData } from "@/sistema/os-shared";
import { useSistemaStore } from "@/sistema/store";
import type { CaixaMovimentacao } from "@/sistema/types";

interface Props {
  linhas: CaixaMovimentacao[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
}

/** Badge de tipo (ENTRADA/SAIDA) no tema escuro. */
function BadgeTipo({ tipo }: { tipo: CaixaMovimentacao["tipo"] }) {
  const entrada = tipo === "ENTRADA";
  return (
    <span
      className={
        entrada
          ? "inline-flex items-center gap-1 rounded-md border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[11px] font-bold text-green-400"
          : "inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-300"
      }
    >
      <span aria-hidden>{entrada ? "↑" : "↓"}</span>
      {entrada ? "Entrada" : "Saída"}
    </span>
  );
}

/**
 * Tabela de movimentações do caixa (data, descrição, tipo, valor, ações).
 * Ordenável e paginada via `DataTable`.
 */
export const CaixaMovimentacaoList = memo(function CaixaMovimentacaoList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
}: Props) {
  const excluirMovimentacao = useSistemaStore((s) => s.excluirMovimentacao);

  const handleExcluir = useCallback(
    (m: CaixaMovimentacao) => {
      if (!window.confirm(`Excluir a movimentação "${m.descricao}"?`)) return;
      void excluirMovimentacao(m.id);
    },
    [excluirMovimentacao]
  );

  const colunas: Coluna<CaixaMovimentacao>[] = [
    {
      chave: "data",
      rotulo: "Data",
      ordenavel: true,
      chaveOrdenacao: (m) => m.data,
      largura: "120px",
      conteudo: (m) => <span className="text-zinc-400">{formatData(m.data)}</span>,
    },
    {
      chave: "descricao",
      rotulo: "Descrição",
      ordenavel: true,
      chaveOrdenacao: (m) => m.descricao,
      conteudo: (m) => (
        <span className="font-medium text-zinc-100" title={m.descricao}>
          {m.descricao}
        </span>
      ),
    },
    {
      chave: "os",
      rotulo: "OS",
      largura: "110px",
      ocultarNoMobile: true,
      conteudo: (m) =>
        m.osId ? (
          <span className="font-mono text-xs text-zinc-400">vinculada</span>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
    },
    {
      chave: "tipo",
      rotulo: "Tipo",
      ordenavel: true,
      chaveOrdenacao: (m) => m.tipo,
      alinhar: "center",
      largura: "120px",
      conteudo: (m) => <BadgeTipo tipo={m.tipo} />,
    },
    {
      chave: "valor",
      rotulo: "Valor",
      ordenavel: true,
      chaveOrdenacao: (m) => m.valor,
      alinhar: "right",
      largura: "140px",
      conteudo: (m) => (
        <span
          className={
            m.tipo === "ENTRADA"
              ? "font-bold tabular-nums text-green-400"
              : "font-bold tabular-nums text-rose-300"
          }
        >
          {m.tipo === "ENTRADA" ? "+" : "−"} {formatBRL(m.valor)}
        </span>
      ),
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "90px",
      conteudo: (m) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleExcluir(m)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-rose-500 hover:text-rose-400"
            title="Excluir movimentação"
            aria-label={`Excluir ${m.descricao}`}
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
        keyLinha={(m) => m.id}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        vazioTitulo="Nenhuma movimentação"
        vazioDescricao="Registre a primeira entrada ou saída do caixa."
        vazioIcone="💸"
        linhasPorPagina={12}
      />
    </div>
  );
});

export default CaixaMovimentacaoList;
