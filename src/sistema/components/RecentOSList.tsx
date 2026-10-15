import { memo, useCallback } from "react";
import { List } from "react-window";
import { OSStatusBadge } from "./OSStatusBadge";
import { AvisoSemConexao, EstadoErro, EstadoVazio } from "./LoadingSpinner";
import { osNum } from "@/sistema/os-shared";
import type { StatusOS } from "@/sistema/types";

/** Item leve das últimas OS (shape devolvido por `useUltimasOS`). */
export interface OSRecente {
  id: string;
  numero: number;
  aparelho: string;
  defeito: string;
  status: StatusOS;
  clienteNome: string;
}

interface Props {
  linhas: OSRecente[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  /** Altura do contêiner virtualizado (px). */
  altura?: number;
  aoClicar?: (os: OSRecente) => void;
}

const ALTURA_LINHA = 56;

/**
 * Linha individual renderizada pelo react-window.
 *
 * `index`/`style`/`ariaAttributes` são injetados pela lib — declarados como
 * opcionais para satisfazer o tipo `ExcludeForbiddenKeys` do react-window v2.
 */
function LinhaRecente({
  index,
  style,
  ariaAttributes,
  linhas,
  aoClicar,
}: {
  index?: number;
  style?: React.CSSProperties;
  ariaAttributes?: React.HTMLAttributes<HTMLDivElement>;
  linhas: OSRecente[];
  aoClicar?: (os: OSRecente) => void;
}) {
  const os = linhas[index ?? 0];
  if (!os) return null;
  return (
    <div
      style={style}
      {...ariaAttributes}
      onClick={aoClicar ? () => aoClicar(os) : undefined}
      className={
        "flex items-center gap-3 border-b border-zinc-800/70 px-4 text-sm transition-colors hover:bg-[#00FF88]/[0.04]" +
        (aoClicar ? " cursor-pointer" : "")
      }
    >
      <span className="w-16 shrink-0 font-mono text-[13px] font-bold text-[#00FF88]">
        {osNum(os.numero)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-zinc-100">{os.aparelho}</span>
        <span className="block truncate text-xs text-zinc-500">{os.clienteNome}</span>
      </span>
      <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-zinc-400 sm:block">
        {os.defeito}
      </span>
      <span className="shrink-0">
        <OSStatusBadge status={os.status} compacto />
      </span>
    </div>
  );
}

/**
 * Lista das últimas OS cadastradas com VIRTUALIZAÇÃO (react-window).
 *
 * Mesmo com poucos itens, a virtualização garante custo de render constante
 * conforme a lista cresce (o dashboard pode exibir dezenas de linhas).
 */
export const RecentOSList = memo(function RecentOSList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  altura = 320,
  aoClicar,
}: Props) {
  const handleClicar = useCallback(
    (os: OSRecente) => aoClicar?.(os),
    [aoClicar]
  );

  if (carregando) {
    return (
      <div className="space-y-2 p-4" aria-busy="true">
        {pausada && <AvisoSemConexao className="mb-2" />}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-md bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  // Erro antes do vazio: consulta que falhou não é lista sem registros.
  if (erro) {
    return <EstadoErro erro={erro} aoTentarNovamente={aoTentarNovamente} />;
  }

  if (linhas.length === 0) {
    return (
      <EstadoVazio
        icone="📋"
        titulo="Nenhuma OS ainda"
        descricao="As últimas ordens de serviço cadastradas aparecerão aqui."
      />
    );
  }

  return (
    <List
      rowComponent={LinhaRecente}
      rowCount={linhas.length}
      rowHeight={ALTURA_LINHA}
      rowKey={(index) => linhas[index]?.id ?? String(index)}
      rowProps={{ linhas, aoClicar: handleClicar }}
      style={{ height: Math.min(altura, linhas.length * ALTURA_LINHA) }}
      aria-label="Últimas ordens de serviço"
    />
  );
});

export default RecentOSList;
