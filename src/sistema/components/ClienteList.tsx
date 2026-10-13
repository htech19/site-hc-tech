import { memo, useCallback } from "react";
import { History, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Coluna } from "./DataTable";
import { formatData } from "@/sistema/os-shared";
import { useSistemaStore } from "@/sistema/store";
import type { Cliente } from "@/sistema/types";

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

const corDoCliente = (nome: string) => CORES[(nome.charCodeAt(0) || 0) % CORES.length];

const CLASSE_BOTAO =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

interface Props {
  linhas: Cliente[];
  carregando?: boolean;
  aoEditar: (cliente: Cliente) => void;
  aoVerHistorico: (cliente: Cliente) => void;
}

/**
 * Tabela de clientes com total de OS, última OS e ações.
 * Memoizada: só re-renderiza quando as linhas/callbacks mudam de referência.
 */
export const ClienteList = memo(function ClienteList({
  linhas,
  carregando,
  aoEditar,
  aoVerHistorico,
}: Props) {
  const excluirCliente = useSistemaStore((s) => s.excluirCliente);
  const notificar = useSistemaStore((s) => s.notificar);

  const handleEditar = useCallback((c: Cliente) => aoEditar(c), [aoEditar]);
  const handleHistorico = useCallback((c: Cliente) => aoVerHistorico(c), [aoVerHistorico]);

  const handleExcluir = useCallback(
    (c: Cliente) => {
      if (c.totalOS > 0) {
        notificar(
          `Não é possível excluir: ${c.nome} possui ${c.totalOS} OS vinculada(s).`,
          "error"
        );
        return;
      }
      if (!window.confirm(`Excluir o cliente "${c.nome}"?`)) return;
      void excluirCliente(c.id);
    },
    [excluirCliente, notificar]
  );

  const colunas: Coluna<Cliente>[] = [
    {
      chave: "nome",
      rotulo: "Cliente",
      ordenavel: true,
      chaveOrdenacao: (c) => c.nome,
      conteudo: (c) => (
        <span className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${corDoCliente(c.nome)}`}
            aria-hidden
          >
            {c.nome.substring(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-zinc-100">{c.nome}</span>
            {c.email && (
              <span className="block truncate text-xs text-zinc-500">{c.email}</span>
            )}
          </span>
        </span>
      ),
    },
    {
      chave: "telefone",
      rotulo: "Telefone",
      ordenavel: true,
      chaveOrdenacao: (c) => c.telefone,
      largura: "160px",
      conteudo: (c) => <span className="text-zinc-300">{c.telefone || "—"}</span>,
    },
    {
      chave: "totalOS",
      rotulo: "Total OS",
      ordenavel: true,
      chaveOrdenacao: (c) => c.totalOS,
      alinhar: "center",
      largura: "100px",
      conteudo: (c) => (
        <span className="inline-flex min-w-8 justify-center rounded-md border border-[#00FF88]/30 bg-[#00FF88]/10 px-2 py-0.5 text-xs font-bold text-[#00FF88]">
          {c.totalOS}
        </span>
      ),
    },
    {
      chave: "ultimaOS",
      rotulo: "Última OS",
      ordenavel: true,
      chaveOrdenacao: (c) => c.ultimaOS ?? "",
      largura: "130px",
      ocultarNoMobile: true,
      conteudo: (c) => (
        <span className="text-zinc-400">{c.ultimaOS ? formatData(c.ultimaOS) : "—"}</span>
      ),
    },
    {
      chave: "acoes",
      rotulo: "Ações",
      alinhar: "right",
      largura: "130px",
      conteudo: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={CLASSE_BOTAO}
            title="Histórico de OS"
            aria-label={`Ver histórico de ${c.nome}`}
            onClick={() => handleHistorico(c)}
          >
            <History size={14} />
          </button>
          <button
            type="button"
            className={CLASSE_BOTAO}
            title="Editar"
            aria-label={`Editar ${c.nome}`}
            onClick={() => handleEditar(c)}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className={`${CLASSE_BOTAO} hover:border-rose-500 hover:text-rose-400`}
            title="Excluir"
            aria-label={`Excluir ${c.nome}`}
            onClick={() => handleExcluir(c)}
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
        keyLinha={(c) => c.id}
        carregando={carregando}
        vazioTitulo="Nenhum cliente encontrado"
        vazioDescricao="Cadastre um cliente para vincular às ordens de serviço."
        vazioIcone="👥"
      />
    </div>
  );
});

export default ClienteList;
