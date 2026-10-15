import { memo } from "react";
import { Link } from "react-router-dom";
import {
  useAparelhosMaisAtendidos,
  useMetricasDashboard,
  useOSPorStatus,
  useUltimasOS,
} from "@/integrations/supabase/sistema";
import { DashboardMetrics } from "@/sistema/components/DashboardMetrics";
import { EstadoErroCompacto } from "@/sistema/components/LoadingSpinner";
import { OSByStatusChart } from "@/sistema/components/OSByStatusChart";
import { RecentOSList } from "@/sistema/components/RecentOSList";
import { TopDevicesTable } from "@/sistema/components/TopDevicesTable";

/**
 * Página Dashboard — visão geral em tempo real.
 *
 * Métricas com polling de 60s (hook `useMetricasDashboard`), gráfico de OS por
 * status, últimas OS (lista virtualizada) e ranking de aparelhos.
 */
const SistemaDashboardPage = memo(function SistemaDashboardPage() {
  // Alias `isPending`/`isPaused` no lugar de `isLoading`: uma consulta PAUSADA
  // por falta de conexão precisa continuar contando como "carregando".
  const {
    data: metricas,
    isPending: carregandoMetricas,
    isPaused: pausadaMetricas,
    isError: metricasErro,
    error: metricasErroDetalhe,
    refetch: recarregarMetricas,
  } = useMetricasDashboard();
  const {
    data: porStatus,
    isPending: carregandoStatus,
    isPaused: pausadaStatus,
    isError: statusErro,
    error: statusErroDetalhe,
    refetch: recarregarStatus,
  } = useOSPorStatus();
  const {
    data: ultimas,
    isPending: carregandoUltimas,
    isPaused: pausadaUltimas,
    isError: ultimasErro,
    error: ultimasErroDetalhe,
    refetch: recarregarUltimas,
  } = useUltimasOS(50);
  const {
    data: aparelhos,
    isPending: carregandoAparelhos,
    isPaused: pausadaAparelhos,
    isError: aparelhosErro,
    error: aparelhosErroDetalhe,
    refetch: recarregarAparelhos,
  } = useAparelhosMaisAtendidos(8);

  return (
    <div className="space-y-5">
      <DashboardMetrics
        metricas={
          metricas ?? {
            totalOS: 0,
            concluidas: 0,
            pendentes: 0,
            emEstoque: 0,
            devolucoes: 0,
            canceladas: 0,
            emAndamento: 0,
            faturamento: 0,
            totalClientes: null,
            itensEstoque: null,
          }
        }
        carregando={carregandoMetricas}
        pausada={pausadaMetricas}
      />

      {metricasErro && (
        <EstadoErroCompacto
          erro={metricasErroDetalhe}
          contexto="Métricas do painel"
          aoTentarNovamente={() => void recarregarMetricas()}
        />
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
              📊 OS por Status
            </h3>
            <Link
              to="/sistema/os"
              className="text-xs font-semibold text-[#00FF88] transition hover:underline"
            >
              Ver todas
            </Link>
          </header>
          {statusErro ? (
            <div className="p-4">
              <EstadoErroCompacto
                erro={statusErroDetalhe}
                contexto="OS por Status"
                aoTentarNovamente={() => void recarregarStatus()}
              />
            </div>
          ) : (
            <OSByStatusChart
              dados={porStatus ?? []}
              carregando={carregandoStatus}
              pausada={pausadaStatus}
            />
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
              📱 Aparelhos Mais Atendidos
            </h3>
          </header>
          {aparelhosErro ? (
            <div className="p-4">
              <EstadoErroCompacto
                erro={aparelhosErroDetalhe}
                contexto="Aparelhos Mais Atendidos"
                aoTentarNovamente={() => void recarregarAparelhos()}
              />
            </div>
          ) : (
            <TopDevicesTable
              dados={aparelhos ?? []}
              carregando={carregandoAparelhos}
              pausada={pausadaAparelhos}
            />
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            🕒 Últimas OS
          </h3>
          <Link
            to="/sistema/os"
            className="text-xs font-semibold text-[#00FF88] transition hover:underline"
          >
            Abrir módulo
          </Link>
        </header>
        <RecentOSList
          linhas={ultimas ?? []}
          carregando={carregandoUltimas}
          pausada={pausadaUltimas}
          erro={ultimasErro ? ultimasErroDetalhe : undefined}
          aoTentarNovamente={() => void recarregarUltimas()}
          altura={340}
        />
      </section>
    </div>
  );
});

export default SistemaDashboardPage;
