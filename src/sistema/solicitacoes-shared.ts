/**
 * Metadados das solicitações de orçamento recebidas pelo site.
 *
 * Os valores de `status` são os gravados pela edge function
 * `solicitar-orcamento` em `orcamento_solicitacoes` (minúsculos) — a UI usa
 * este mapa para rótulo e cor, mantendo dashboard e tela de Solicitações
 * com o mesmo vocabulário.
 */

export const STATUS_SOLICITACAO = [
  {
    valor: "recebido",
    rotulo: "Recebido",
    classe: "border-sky-600 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-200",
    cor: "bg-sky-600",
  },
  {
    valor: "em_analise",
    rotulo: "Em análise",
    classe: "border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200",
    cor: "bg-amber-500",
  },
  {
    valor: "aguardando_contato",
    rotulo: "Aguardando contato",
    classe: "border-violet-600 bg-violet-50 text-violet-900 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-200",
    cor: "bg-violet-600",
  },
  {
    valor: "orcamento_enviado",
    rotulo: "Orçamento enviado",
    classe: "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200",
    cor: "bg-blue-600",
  },
  {
    valor: "aprovado",
    rotulo: "Aprovado",
    classe: "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200",
    cor: "bg-emerald-600",
  },
  {
    valor: "recusado",
    rotulo: "Recusado",
    classe: "border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200",
    cor: "bg-rose-600",
  },
  {
    valor: "concluido",
    rotulo: "Concluído",
    classe: "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-200",
    cor: "bg-teal-700",
  },
  {
    valor: "cancelada",
    rotulo: "Cancelada",
    classe: "border-zinc-500 bg-zinc-100 text-zinc-800 dark:border-zinc-400 dark:bg-zinc-800 dark:text-zinc-200",
    cor: "bg-zinc-500",
  },
] as const;

export type StatusSolicitacaoSite = (typeof STATUS_SOLICITACAO)[number]["valor"];

export const rotuloStatusSolicitacao = (status: string) =>
  STATUS_SOLICITACAO.find((s) => s.valor === status)?.rotulo ?? status;

export const classeStatusSolicitacao = (status: string) =>
  STATUS_SOLICITACAO.find((s) => s.valor === status)?.classe ??
  "border-zinc-600/40 bg-zinc-600/15 text-zinc-300";

/** Cor sólida (barra de destaque lateral) — reforça a leitura por status. */
export const corStatusSolicitacao = (status: string) =>
  STATUS_SOLICITACAO.find((s) => s.valor === status)?.cor ?? "bg-zinc-500";

/** Data e hora curtas, no fuso do navegador. */
export const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Categorias possíveis de equipamento no pedido do site. */
export const CATEGORIAS_SOLICITACAO = [
  "Celular",
  "iPhone",
  "Tablet",
  "Notebook",
  "Computador",
] as const;
