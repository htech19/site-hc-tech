import { memo, useMemo } from "react";
import { formatBRL, formatData, osNum } from "@/sistema/os-shared";
import { ROTULO_STATUS, type OrdemServico } from "@/sistema/types";
import { AvisoSemConexao, CarregandoArea, EstadoErro, EstadoVazio } from "./LoadingSpinner";

interface Props {
  linhas: OrdemServico[];
  carregando?: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  /** Período exibido no cabeçalho de impressão. */
  periodo?: string;
}

/**
 * Relatório geral em tabela (imprimível).
 *
 * Totais memoizados; estilos `print:*` garantem fundo branco e texto preto
 * na impressão sem alterar a aparência na tela.
 */
export const RelatorioGeral = memo(function RelatorioGeral({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  periodo,
}: Props) {
  const totais = useMemo(
    () => ({
      quantidade: linhas.reduce((s, o) => s + o.quantidade, 0),
      valor: linhas.reduce((s, o) => s + o.valorOrcado, 0),
      concluidas: linhas.filter((o) => o.status === "CONCLUIDA").length,
    }),
    [linhas]
  );

  if (carregando) {
    return (
      <div className="space-y-2">
        {pausada && <AvisoSemConexao />}
        <CarregandoArea altura="h-80" rotulo="Gerando relatório..." />
      </div>
    );
  }

  // Erro antes do vazio: consulta que falhou não é "sem dados".
  if (erro) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 print:border-gray-300 print:bg-white">
        <EstadoErro erro={erro} aoTentarNovamente={aoTentarNovamente} />
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 print:border-gray-300 print:bg-white">
        <EstadoVazio
          icone="📊"
          titulo="Sem dados para o relatório"
          descricao="Ajuste os filtros ou aguarde novas ordens de serviço."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 print:border-gray-300 print:bg-white">
      {/* Cabeçalho visível apenas na impressão */}
      <header className="hidden print:block print:px-0 print:py-2">
        <h1 className="text-lg font-bold print:text-black">HC TECH — Relatório Geral</h1>
        <p className="text-sm print:text-black">
          Emitido em {formatData(new Date().toISOString())}
          {periodo ? ` · Período: ${periodo}` : ""}
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm print:text-black">
          <thead className="print:table-header-group">
            <tr className="bg-zinc-800 print:bg-gray-200">
              {["OS", "Data", "Cliente", "Aparelho", "Defeito", "Status", "Qtd.", "Valor"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-zinc-700 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 print:border-gray-300 print:text-black"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {linhas.map((o) => (
              <tr
                key={o.id}
                className="border-b border-zinc-800/70 print:border-gray-200"
              >
                <td className="px-3 py-2 font-mono text-xs font-bold text-[#00FF88] print:text-black">
                  {osNum(o.numero)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-zinc-400 print:text-black">
                  {formatData(o.dataEntrada)}
                </td>
                <td className="max-w-[160px] truncate px-3 py-2 text-zinc-200 print:text-black">
                  {o.clienteNome ?? "—"}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2 font-medium text-zinc-100 print:text-black">
                  {o.quantidade > 1 && (
                    <span className="mr-1 text-[#00FF88] print:text-black">{o.quantidade}x</span>
                  )}
                  {o.aparelho}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-zinc-400 print:text-black">
                  {o.defeito}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-zinc-300 print:text-black">
                  {ROTULO_STATUS[o.status]}
                </td>
                <td className="px-3 py-2 text-center tabular-nums print:text-black">
                  {o.quantidade}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums print:text-black">
                  {formatBRL(o.valorOrcado)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-800/80 font-bold print:bg-gray-200 print:text-black">
              <td colSpan={6} className="px-3 py-3 text-right text-zinc-300 print:text-black">
                Totais ({linhas.length} OS)
              </td>
              <td className="px-3 py-3 text-center tabular-nums print:text-black">
                {totais.quantidade}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-[#00FF88] print:text-black">
                {formatBRL(totais.valor)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

export default RelatorioGeral;
