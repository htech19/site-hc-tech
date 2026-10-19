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
    classe: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    cor: "bg-sky-400",
  },
  {
    valor: "em_analise",
    rotulo: "Em análise",
    classe: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    cor: "bg-amber-400",
  },
  {
    valor: "aguardando_contato",
    rotulo: "Aguardando contato",
    classe: "border-violet-500/40 bg-violet-500/15 text-violet-300",
    cor: "bg-violet-400",
  },
  {
    valor: "orcamento_enviado",
    rotulo: "Orçamento enviado",
    classe: "border-blue-500/40 bg-blue-500/15 text-blue-300",
    cor: "bg-blue-400",
  },
  {
    valor: "aprovado",
    rotulo: "Aprovado",
    classe: "border-[#00FF88]/40 bg-[#00FF88]/15 text-[#00FF88]",
    cor: "bg-[#00FF88]",
  },
  {
    valor: "recusado",
    rotulo: "Recusado",
    classe: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    cor: "bg-rose-400",
  },
  {
    valor: "concluido",
    rotulo: "Concluído",
    classe: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    cor: "bg-emerald-400",
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
