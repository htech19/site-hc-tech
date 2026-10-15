import { memo, useMemo } from "react";
import { useClientesLeves, useRelatorioGeral } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { FILTRO_RELATORIO_PADRAO, useSistemaStore } from "@/sistema/store";
import { formatBRL, formatData } from "@/sistema/os-shared";
import { FormInput, FormSelect } from "@/sistema/components/FormInput";
import { LISTA_STATUS } from "@/sistema/components/OSStatusBadge";
import { RelatorioExportButton } from "@/sistema/components/RelatorioExportButton";
import { RelatorioGeral } from "@/sistema/components/RelatorioGeral";
import { RelatorioPrintButton } from "@/sistema/components/RelatorioPrintButton";
import type { FiltroOS, StatusOS } from "@/sistema/types";

/**
 * Página Relatórios — relatório geral completo com filtros avançados
 * (status, cliente, período), exportação CSV e impressão.
 */
const SistemaRelatoriosPage = memo(function SistemaRelatoriosPage() {
  const consultaRelatorio = useRelatorioGeral();
  const { data: base, refetch: recarregarRelatorio } = consultaRelatorio;
  // `isPending` (e não `isLoading`) é o que impede o relatório de mentir: uma
  // consulta PAUSADA por falta de conexão não é "sem dados".
  const { carregando, pausada, erro } = estadoDaConsulta(consultaRelatorio);
  const { data: clientes } = useClientesLeves();

  const filtro = useSistemaStore((s) => s.filtroRelatorio);
  const definir = useSistemaStore((s) => s.definirFiltroRelatorio);

  const linhas = useMemo(() => {
    // Reutiliza o filtro puro do módulo (o relatório usa a mesma estrutura).
    const filtroOS: FiltroOS = {
      busca: "",
      status: filtro.status,
      clienteId: filtro.clienteId,
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
    };
    return (base ?? []).filter((o) => {
      if (filtroOS.status !== "TODOS" && o.status !== filtroOS.status) return false;
      if (filtroOS.clienteId !== "TODOS" && o.clienteId !== filtroOS.clienteId) return false;
      const dia = o.dataEntrada.slice(0, 10);
      if (filtroOS.dataInicio && dia < filtroOS.dataInicio) return false;
      if (filtroOS.dataFim && dia > filtroOS.dataFim) return false;
      return true;
    });
  }, [base, filtro]);

  const resumo = useMemo(() => {
    const concluidas = linhas.filter((o) => o.status === "CONCLUIDA");
    return {
      quantidade: linhas.length,
      faturamento: linhas.reduce((s, o) => s + o.valorOrcado, 0),
      concluidas: concluidas.length,
      ticketMedio: concluidas.length
        ? concluidas.reduce((s, o) => s + o.valorOrcado, 0) / concluidas.length
        : 0,
    };
  }, [linhas]);

  const periodo =
    filtro.dataInicio || filtro.dataFim
      ? `${filtro.dataInicio ? formatData(filtro.dataInicio) : "início"} — ${
          filtro.dataFim ? formatData(filtro.dataFim) : "hoje"
        }`
      : undefined;

  const temFiltro =
    filtro.status !== "TODOS" ||
    filtro.clienteId !== "TODOS" ||
    !!filtro.dataInicio ||
    !!filtro.dataFim;

  return (
    <div className="space-y-4 print:space-y-0">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
        {[
          { rotulo: "OS no período", valor: String(resumo.quantidade), tom: "text-zinc-100" },
          { rotulo: "Faturamento", valor: formatBRL(resumo.faturamento), tom: "text-[#00FF88]" },
          { rotulo: "Concluídas", valor: String(resumo.concluidas), tom: "text-sky-300" },
          { rotulo: "Ticket médio", valor: formatBRL(resumo.ticketMedio), tom: "text-amber-300" },
        ].map((c) => (
          <article key={c.rotulo} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {c.rotulo}
            </span>
            <div className={`mt-1 truncate text-lg font-bold tabular-nums ${c.tom}`}>
              {carregando ? "—" : c.valor}
            </div>
          </article>
        ))}
      </div>

      {/* Filtros avançados + ações */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 print:hidden lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormSelect
            label="Status"
            valor={filtro.status}
            aoMudar={(v) => definir({ status: v as StatusOS | "TODOS" })}
            opcoes={[{ valor: "TODOS", rotulo: "Todos os Status" }, ...LISTA_STATUS]}
          />
          <FormSelect
            label="Cliente"
            valor={filtro.clienteId}
            aoMudar={(v) => definir({ clienteId: v })}
            opcoes={[
              { valor: "TODOS", rotulo: "Todos os Clientes" },
              ...(clientes ?? []).map((c) => ({ valor: c.id, rotulo: c.nome })),
            ]}
          />
          <FormInput
            label="De"
            tipo="date"
            valor={filtro.dataInicio ?? ""}
            aoMudar={(v) => definir({ dataInicio: v })}
          />
          <FormInput
            label="Até"
            tipo="date"
            valor={filtro.dataFim ?? ""}
            aoMudar={(v) => definir({ dataFim: v })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {temFiltro && (
            <button
              type="button"
              onClick={() => definir(FILTRO_RELATORIO_PADRAO)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88]"
            >
              Limpar filtros
            </button>
          )}
          <RelatorioPrintButton disabled={carregando} />
          <RelatorioExportButton linhas={linhas} disabled={carregando} />
        </div>
      </div>

      <RelatorioGeral
        linhas={linhas}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarRelatorio()}
        periodo={periodo}
      />
    </div>
  );
});

export default SistemaRelatoriosPage;
