import { memo, useCallback } from "react";
import { DataTable, type Coluna } from "./DataTable";
import { OSStatusBadge } from "./OSStatusBadge";
import { OSActions } from "./OSActions";
import { formatData, osNum, type OS } from "@/sistema/os-shared";
import type { OrdemServico } from "@/sistema/types";

/** Paleta de avatares de cliente (mesma do HTML original). */
const CORES = [
  "bg-[#6C5CE7]",
  "bg-[#00CEC9]",
  "bg-[#FD79A8]",
  "bg-[#FDCB6E]",
  "bg-[#E17055]",
  "bg-[#00B894]",
  "bg-[#74B9FF]",
  "bg-[#A29BFE]",
];

const corDoCliente = (nome: string) =>
  CORES[(nome.charCodeAt(0) || 0) % CORES.length];

interface Props {
  linhas: OrdemServico[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  aoVisualizar: (os: OrdemServico) => void;
  aoEditar: (os: OrdemServico) => void;
  /** Título exibido no estado vazio. */
  vazioTitulo?: string;
  vazioDescricao?: string;
}

/**
 * Tabela de Ordens de Serviço.
 *
 * Estrutura de colunas idêntica ao HTML de referência (OS#, Data, Aparelho,
 * Cliente, Defeito, Status, Observação, Ações), com ordenação, paginação e
 * memoização — só re-renderiza quando a lista de linhas muda de referência.
 */
export const OSList = memo(function OSList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  aoVisualizar,
  aoEditar,
  vazioTitulo = "Nenhuma OS encontrada",
  vazioDescricao = "Crie uma nova ordem de serviço para começar.",
}: Props) {
  const handleVisualizar = useCallback((os: OrdemServico) => aoVisualizar(os), [aoVisualizar]);
  const handleEditar = useCallback((os: OrdemServico) => aoEditar(os), [aoEditar]);

  const colunas: Coluna<OrdemServico>[] = [
    {
      chave: "numero",
      rotulo: "OS #",
      ordenavel: true,
      chaveOrdenacao: (o) => o.numero,
      largura: "90px",
      conteudo: (o) => (
        <span className="font-mono text-[13px] font-bold text-[#00FF88]">{osNum(o.numero)}</span>
      ),
    },
    {
      chave: "dataEntrada",
      rotulo: "Data",
      ordenavel: true,
      chaveOrdenacao: (o) => o.dataEntrada,
      largura: "110px",
      ocultarNoMobile: true,
      conteudo: (o) => <span className="text-zinc-400">{formatData(o.dataEntrada)}</span>,
    },
    {
      chave: "aparelho",
      rotulo: "Aparelho",
      ordenavel: true,
      chaveOrdenacao: (o) => o.aparelho,
      conteudo: (o) => (
        <span className="font-semibold text-zinc-100">
          {o.quantidade > 1 && <span className="mr-1 text-[#00FF88]">{o.quantidade}x</span>}
          {o.aparelho}
          {o.marca && <span className="ml-1.5 text-xs font-normal text-zinc-500">· {o.marca}</span>}
        </span>
      ),
    },
    {
      chave: "cliente",
      rotulo: "Cliente",
      ordenavel: true,
      chaveOrdenacao: (o) => o.clienteNome ?? "",
      conteudo: (o) => {
        const nome = o.clienteNome ?? "—";
        return (
          <span className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${corDoCliente(nome)}`}
              aria-hidden
            >
              {nome.substring(0, 2).toUpperCase()}
            </span>
            <span className="truncate text-zinc-200">{nome}</span>
          </span>
        );
      },
    },
    {
      chave: "defeito",
      rotulo: "Defeito",
      ordenavel: true,
      chaveOrdenacao: (o) => o.defeito,
      conteudo: (o) => <span className="text-zinc-300">{o.defeito}</span>,
    },
    {
      chave: "status",
      rotulo: "Status",
      ordenavel: true,
      chaveOrdenacao: (o) => o.status,
      largura: "150px",
      conteudo: (o) => <OSStatusBadge status={o.status} />,
    },
    {
      chave: "observacao",
      rotulo: "Observação",
      ocultarNoMobile: true,
      conteudo: (o) => (
        <span
          className="block max-w-[200px] truncate text-zinc-400"
          title={o.observacao ?? ""}
        >
          {o.observacao || "—"}
        </span>
      ),
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "150px",
      conteudo: (o) => <OSActions os={o} aoVisualizar={handleVisualizar} aoEditar={handleEditar} />,
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
        vazioTitulo={vazioTitulo}
        vazioDescricao={vazioDescricao}
        vazioIcone="📋"
        linhasPorPagina={15}
      />
    </div>
  );
});

export type { OS };
export default OSList;
