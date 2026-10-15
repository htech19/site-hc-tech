import { memo, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable, type Coluna } from "./DataTable";
import { OrcamentoStatusBadge } from "./OrcamentoStatusBadge";
import { formatBRL, formatData, osNum } from "@/sistema/os-shared";
import { useSistemaStore } from "@/sistema/store";
import type { Orcamento } from "@/sistema/types";

const CLASSE_BOTAO =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

interface Props {
  linhas: Orcamento[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  aoEditar: (orcamento: Orcamento) => void;
}

/** Tabela de orçamentos vinculados a OS (com status e valor). */
export const OrcamentoList = memo(function OrcamentoList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  aoEditar,
}: Props) {
  const excluirOrcamento = useSistemaStore((s) => s.excluirOrcamento);
  const handleEditar = useCallback((o: Orcamento) => aoEditar(o), [aoEditar]);

  const handleExcluir = useCallback(
    (o: Orcamento) => {
      if (!window.confirm("Excluir este orçamento?")) return;
      void excluirOrcamento(o.id);
    },
    [excluirOrcamento]
  );

  const colunas: Coluna<Orcamento>[] = [
    {
      chave: "os",
      rotulo: "OS",
      ordenavel: true,
      chaveOrdenacao: (o) => o.numeroOS ?? 0,
      largura: "110px",
      conteudo: (o) =>
        o.numeroOS ? (
          <span className="font-mono text-[13px] font-bold text-[#00FF88]">
            {osNum(o.numeroOS)}
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
    },
    {
      chave: "dataOrcamento",
      rotulo: "Data",
      ordenavel: true,
      chaveOrdenacao: (o) => o.dataOrcamento,
      largura: "120px",
      ocultarNoMobile: true,
      conteudo: (o) => <span className="text-zinc-400">{formatData(o.dataOrcamento)}</span>,
    },
    {
      chave: "cliente",
      rotulo: "Cliente",
      ordenavel: true,
      chaveOrdenacao: (o) => o.clienteNome ?? "",
      conteudo: (o) => (
        <span className="min-w-0">
          <span className="block truncate font-semibold text-zinc-100">
            {o.clienteNome ?? "—"}
          </span>
          <span className="block truncate text-xs text-zinc-500">{o.aparelho ?? ""}</span>
        </span>
      ),
    },
    {
      chave: "descricao",
      rotulo: "Descrição",
      conteudo: (o) => (
        <span className="block max-w-[240px] truncate text-zinc-300" title={o.descricao ?? ""}>
          {o.descricao || "—"}
        </span>
      ),
    },
    {
      chave: "valor",
      rotulo: "Valor",
      ordenavel: true,
      chaveOrdenacao: (o) => o.valor,
      alinhar: "right",
      largura: "130px",
      conteudo: (o) => (
        <span className="font-bold tabular-nums text-zinc-100">{formatBRL(o.valor)}</span>
      ),
    },
    {
      chave: "status",
      rotulo: "Status",
      ordenavel: true,
      chaveOrdenacao: (o) => o.status,
      largura: "140px",
      conteudo: (o) => <OrcamentoStatusBadge status={o.status} />,
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "110px",
      conteudo: (o) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={CLASSE_BOTAO}
            title="Editar"
            aria-label="Editar orçamento"
            onClick={() => handleEditar(o)}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className={`${CLASSE_BOTAO} hover:border-rose-500 hover:text-rose-400`}
            title="Excluir"
            aria-label="Excluir orçamento"
            onClick={() => handleExcluir(o)}
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
        keyLinha={(o) => o.id}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={aoTentarNovamente}
        vazioTitulo="Nenhum orçamento"
        vazioDescricao="Crie orçamentos vinculados às ordens de serviço."
        vazioIcone="🧾"
      />
    </div>
  );
});

export default OrcamentoList;
