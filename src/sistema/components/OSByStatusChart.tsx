import { memo, useMemo } from "react";
import { COR_STATUS, ICONE_STATUS, ROTULO_STATUS, type StatusOS } from "@/sistema/types";
import { AvisoSemConexao, EstadoVazio } from "./LoadingSpinner";

export interface ItemPorStatus {
  status: StatusOS;
  quantidade: number;
}

interface Props {
  dados: ItemPorStatus[];
  carregando?: boolean;
  /** Busca pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
}

/**
 * Gráfico de barras horizontais "OS por Status".
 *
 * Sem dependência de lib de gráficos: barras em CSS puro (mais leve e sem
 * re-render caro). As larguras são memoizadas e normalizadas pelo maior valor.
 */
export const OSByStatusChart = memo(function OSByStatusChart({
  dados,
  carregando,
  pausada,
}: Props) {
  const total = useMemo(() => dados.reduce((s, d) => s + d.quantidade, 0), [dados]);
  const maximo = useMemo(
    () => Math.max(1, ...dados.map((d) => d.quantidade)),
    [dados]
  );

  if (carregando) {
    return (
      <div className="space-y-3 p-5" aria-busy="true">
        {pausada && <AvisoSemConexao className="mb-2" />}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-zinc-800/70" />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <EstadoVazio
        icone="📊"
        titulo="Sem dados ainda"
        descricao="As OS cadastradas aparecerão aqui por status."
      />
    );
  }

  return (
    <ul className="space-y-3 p-5">
      {dados.map(({ status, quantidade }) => (
        <li key={status} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-zinc-300">
            <span className="mr-1" aria-hidden>
              {ICONE_STATUS[status]}
            </span>
            {ROTULO_STATUS[status]}
          </span>
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-valuenow={quantidade}
            aria-valuemin={0}
            aria-valuemax={maximo}
            aria-label={ROTULO_STATUS[status]}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${(quantidade / maximo) * 100}%`,
                backgroundColor: COR_STATUS[status],
              }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-semibold tabular-nums text-zinc-100">
            {quantidade}
            <span className="ml-1 text-xs font-normal text-zinc-500">
              ({Math.round((quantidade / total) * 100)}%)
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
});

export default OSByStatusChart;
