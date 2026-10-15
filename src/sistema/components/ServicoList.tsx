import { memo, useCallback } from "react";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { useSistemaStore } from "@/sistema/store";
import type { TipoServico } from "@/sistema/types";
import { AvisoSemConexao, EstadoErro, EstadoVazio } from "./LoadingSpinner";

const CLASSE_BOTAO =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

interface Props {
  linhas: TipoServico[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  aoEditar: (servico: TipoServico) => void;
}

/**
 * Lista de tipos de serviço cadastráveis com contador de realizações.
 * Layout em cards (espelha o módulo "Serviços" do HTML de referência).
 */
export const ServicoList = memo(function ServicoList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  aoEditar,
}: Props) {
  const excluirTipoServico = useSistemaStore((s) => s.excluirTipoServico);
  const handleEditar = useCallback((s: TipoServico) => aoEditar(s), [aoEditar]);

  const handleExcluir = useCallback(
    (s: TipoServico) => {
      if (!window.confirm(`Remover o serviço "${s.nome}"?`)) return;
      void excluirTipoServico(s.id);
    },
    [excluirTipoServico]
  );

  if (carregando) {
    return (
      <div className="space-y-2" aria-busy="true">
        {pausada && <AvisoSemConexao />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      </div>
    );
  }

  // Erro antes do vazio: consulta que falhou não é lista sem registros.
  if (erro) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        <EstadoErro erro={erro} aoTentarNovamente={aoTentarNovamente} />
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        <EstadoVazio
          icone="🔧"
          titulo="Nenhum tipo de serviço"
          descricao="Cadastre os serviços realizados pela assistência."
        />
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {linhas.map((s) => (
        <li
          key={s.id}
          className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-[#00FF88]/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00FF88]/10 text-[#00FF88]">
            <Wrench size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-zinc-100" title={s.nome}>
              {s.nome}
            </p>
            <p className="text-xs text-zinc-500">
              <span className="font-bold text-[#00FF88]">{s.quantidadeRealizada}</span>{" "}
              realização(ões)
            </p>
          </div>
          <div className="flex shrink-0 gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            <button
              type="button"
              className={CLASSE_BOTAO}
              title="Editar"
              aria-label={`Editar ${s.nome}`}
              onClick={() => handleEditar(s)}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className={`${CLASSE_BOTAO} hover:border-rose-500 hover:text-rose-400`}
              title="Excluir"
              aria-label={`Excluir ${s.nome}`}
              onClick={() => handleExcluir(s)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
});

export default ServicoList;
