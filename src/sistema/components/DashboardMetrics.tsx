import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  MessageCircle,
  Package,
  RotateCcw,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvisoSemConexao } from "./LoadingSpinner";
import { formatBRL } from "@/sistema/os-shared";
import type { MetricasDashboard } from "@/sistema/types";

interface Cartao {
  rotulo: string;
  valor: string | number;
  icone: LucideIcon;
  /** Classe de destaque do valor (tema escuro + verde neon). */
  tom: string;
  /** Módulo aberto ao clicar no card (um card nunca é decorativo). */
  para: string;
}

interface Props {
  metricas: MetricasDashboard;
  carregando?: boolean;
  /** Busca pausada por falta de conexão (avisa em vez de números desatualizados). */
  pausada?: boolean;
}

/**
 * Cards de métricas em tempo real do dashboard.
 *
 * O array de cartões é memoizado (`useMemo`) para não ser reconstruído a cada
 * render — só muda quando as métricas mudam. Cada card é um componente puro.
 */
export const DashboardMetrics = memo(function DashboardMetrics({
  metricas,
  carregando,
  pausada,
}: Props) {
  const cartoes = useMemo<Cartao[]>(
    () => [
      {
        rotulo: "Total de OS",
        valor: metricas.totalOS,
        icone: ClipboardList,
        tom: "text-zinc-100",
        para: "/sistema/os",
      },
      {
        rotulo: "OS Ativas",
        valor: metricas.pendentes + metricas.emAndamento,
        icone: Wrench,
        tom: "text-sky-300",
        para: "/sistema/os?status=EM_ANDAMENTO",
      },
      {
        rotulo: "Pendentes",
        valor: metricas.pendentes,
        icone: Clock,
        tom: "text-amber-300",
        para: "/sistema/os?status=PENDENTE",
      },
      {
        rotulo: "Concluídas",
        valor: metricas.concluidas,
        icone: CheckCircle2,
        tom: "text-green-400",
        para: "/sistema/os?status=CONCLUIDA",
      },
      {
        rotulo: "Em Estoque",
        valor: metricas.emEstoque,
        icone: Package,
        tom: "text-violet-300",
        para: "/sistema/estoque",
      },
      {
        rotulo: "Devoluções",
        valor: metricas.devolucoes,
        icone: RotateCcw,
        tom: "text-rose-300",
        para: "/sistema/devolucoes",
      },
      {
        rotulo: "Faturamento",
        valor: formatBRL(metricas.faturamento),
        icone: DollarSign,
        tom: "text-green-400",
        para: "/sistema/relatorios",
      },
      {
        rotulo: "Clientes",
        // `null` = contagem não lida: mostramos "—" em vez de um 0 enganoso.
        valor: metricas.totalClientes ?? "—",
        icone: Users,
        tom: "text-zinc-100",para: "/sistema/clientes",
    },
    {
        rotulo: "Solicitações",
        // Vem do painel de solicitações do site
        valor: metricas.solicitacoes ?? "—",
        icone: MessageCircle,
        tom: "text-sky-300",
        para: "/sistema/solicitacoes",
    },
],
    [metricas]
  );

  return (
    <div className="space-y-2">
      {pausada && <AvisoSemConexao />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {cartoes.map((c) => (
          <Link
            key={c.rotulo}
            to={c.para}
            aria-label={`${c.rotulo}: abrir ${c.para}`}
            className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-[#00FF88]/40 hover:bg-zinc-800/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF88]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-300">
                {c.rotulo}
              </span>
              <c.icone size={15} className="shrink-0 text-green-400" aria-hidden />
            </div>
            <div
              className={cn(
                "mt-2 truncate text-xl font-bold tabular-nums",
                carregando ? "animate-pulse text-zinc-700" : c.tom
              )}
              title={typeof c.valor === "string" ? c.valor : undefined}
            >
              {carregando ? "—" : c.valor}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default DashboardMetrics;
