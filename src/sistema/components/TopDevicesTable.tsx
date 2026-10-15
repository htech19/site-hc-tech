import { memo, useMemo } from "react";
import { AvisoSemConexao, EstadoVazio } from "./LoadingSpinner";
import type { AparelhoAgrupado } from "@/sistema/types";

interface Props {
  dados: AparelhoAgrupado[];
  carregando?: boolean;
  /** Busca pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
}

/**
 * Tabela "Aparelhos Mais Atendidos" — ranking com barra de proporção.
 * O máximo é memoizado para normalizar as barras sem recalcular por linha.
 */
export const TopDevicesTable = memo(function TopDevicesTable({
  dados,
  carregando,
  pausada,
}: Props) {
  const maximo = useMemo(
    () => Math.max(1, ...dados.map((d) => d.quantidade)),
    [dados]
  );

  if (carregando) {
    return (
      <div className="space-y-3 p-5" aria-busy="true">
        {pausada && <AvisoSemConexao className="mb-2" />}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-zinc-800/70" />
        ))}
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <EstadoVazio
        icone="📱"
        titulo="Sem dados ainda"
        descricao="O ranking de aparelhos aparece depois das primeiras OS."
      />
    );
  }

  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-800/70">
            <th className="w-10 border-b border-zinc-700 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              #
            </th>
            <th className="border-b border-zinc-700 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Aparelho
            </th>
            <th className="border-b border-zinc-700 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Atendimentos
            </th>
            <th className="border-b border-zinc-700 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Defeito Mais Comum
            </th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item, i) => (
            <tr
              key={item.aparelho}
              className="border-b border-zinc-800/70 transition-colors hover:bg-[#00FF88]/[0.04]"
            >
              <td className="px-3 py-3 font-mono text-xs font-bold text-zinc-500">
                {i + 1}º
              </td>
              <td className="px-3 py-3 font-semibold text-zinc-100">{item.aparelho}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 shrink-0 font-bold tabular-nums text-[#00FF88]">
                    {item.quantidade}
                  </span>
                  <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#00FF88]"
                      style={{ width: `${(item.quantidade / maximo) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              <td
                className="max-w-[220px] truncate px-3 py-3 text-zinc-400"
                title={item.defeitoMaisComum}
              >
                {item.defeitoMaisComum}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TopDevicesTable;
