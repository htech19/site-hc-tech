import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { DataTable, type Coluna } from "./DataTable";
import { formatData, osNum } from "@/sistema/os-shared";
import { useSistemaStore } from "@/sistema/store";
import type { Devolucao } from "@/sistema/types";

interface Props {
  linhas: Devolucao[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
}

/** Tabela de devoluções de aparelhos aos clientes (com vínculo à OS). */
export const DevolucaoList = memo(function DevolucaoList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
}: Props) {
  const excluirDevolucao = useSistemaStore((s) => s.excluirDevolucao);

  const handleExcluir = useCallback(
    (d: Devolucao) => {
      if (!window.confirm(`Excluir a devolução de "${d.aparelho}"?`)) return;
      void excluirDevolucao(d.id);
    },
    [excluirDevolucao]
  );

  const colunas: Coluna<Devolucao>[] = [
    {
      chave: "dataDevolucao",
      rotulo: "Data",
      ordenavel: true,
      chaveOrdenacao: (d) => d.dataDevolucao,
      largura: "120px",
      conteudo: (d) => <span className="text-zinc-400">{formatData(d.dataDevolucao)}</span>,
    },
    {
      chave: "os",
      rotulo: "OS",
      ordenavel: true,
      chaveOrdenacao: (d) => d.numeroOS ?? 0,
      largura: "110px",
      conteudo: (d) =>
        d.numeroOS ? (
          <span className="font-mono text-[13px] font-bold text-[#00FF88]">
            {osNum(d.numeroOS)}
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
    },
    {
      chave: "cliente",
      rotulo: "Cliente",
      ordenavel: true,
      chaveOrdenacao: (d) => d.cliente,
      conteudo: (d) => <span className="font-semibold text-zinc-100">{d.cliente}</span>,
    },
    {
      chave: "aparelho",
      rotulo: "Aparelho",
      ordenavel: true,
      chaveOrdenacao: (d) => d.aparelho,
      conteudo: (d) => (
        <span className="min-w-0">
          <span className="block truncate font-semibold text-zinc-100">{d.aparelho}</span>
          <span className="block truncate text-xs text-zinc-500">{d.defeito}</span>
        </span>
      ),
    },
    {
      chave: "observacao",
      rotulo: "Observação",
      ocultarNoMobile: true,
      conteudo: (d) => (
        <span
          className="block max-w-[220px] truncate text-zinc-400"
          title={d.observacao ?? ""}
        >
          {d.observacao || "—"}
        </span>
      ),
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "90px",
      conteudo: (d) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleExcluir(d)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-rose-500 hover:text-rose-400"
            title="Excluir devolução"
            aria-label={`Excluir devolução de ${d.aparelho}`}
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
        keyLinha={(d) => d.id}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        vazioTitulo="Nenhuma devolução"
        vazioDescricao="Registre devoluções de aparelhos aos clientes."
        vazioIcone="↩️"
      />
    </div>
  );
});

export default DevolucaoList;
