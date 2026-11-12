import { Badge } from "@/components/ui/badge";

export type OS = {
  id: string;
  numero: number;
  aparelho: string;
  marca: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  defeito: string | null;
  status: "pendente" | "em_andamento" | "aprovado" | "concluida" | "estoque" | "devolucao" | "cancelada";
  valor: number | null;
  observacao: string | null;
  quantidade: number;
  telefone: string | null;
  data_entrada: string;
  created_at: string;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string;
  tipo_pessoa: "PF" | "PJ";
  documento: string | null;
  rg_ie: string | null;
  nome_fantasia: string | null;
  data_nascimento: string | null;
  telefone2: string | null;
  whatsapp: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  tags: string[];
  classificacao: string | null;
  status: "ativo" | "inativo" | "bloqueado";
  motivo_bloqueio: string | null;
  consentimento_lgpd: boolean;
  consentimento_data: string | null;
  aceita_whatsapp: boolean;
  aceita_email: boolean;
  aceita_sms: boolean;
  aceita_marketing: boolean;
  limite_credito: number;
  updated_at: string;
};

export const STATUS_LABEL: Record<OS["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  aprovado: "Aprovado",
  concluida: "Concluída",
  estoque: "Estoque",
  devolucao: "Devolução",
  cancelada: "Cancelada",
};

const STATUS_CLASS: Record<OS["status"], string> = {
  pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  em_andamento: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  estoque: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  devolucao: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  aprovado: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  concluida: "bg-green-600/20 text-green-400 border-green-400/30",
  cancelada: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export function StatusBadge({ status }: { status: OS["status"] }) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export const formatBRL = (v: number | null | undefined) =>
  (Number(v ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const whatsappOsUrl = (o: OS) =>
  `https://wa.me/5511977934634?text=${encodeURIComponent(
    `Olá, sou da HC Tech. Sua OS ${o.numero} do ${o.aparelho} está com status ${STATUS_LABEL[o.status]}.`
  )}`;

export const osNum = (n: number) => `#${String(n).padStart(4, "0")}`;
export const formatData = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—";

/**
 * Formata valor em Real brasileiro com 2 casas decimais
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Formata porcentagem
 */
export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(2)}%`;
}

/**
 * Gera mensagem para o cliente sem dados financeiros internos
 */
export function gerarMensagemCliente(params: {
  nomeCliente: string;
  aparelho: string;
  descricaoServico: string;
  valorFinal: number;
  prazoEstimado?: string;
  garantia?: string;
}): string {
  const valorFormatado = formatarMoeda(params.valorFinal);

  return `Olá, ${params.nomeCliente}!

A HC Tech Infocell concluiu a análise do seu aparelho ${params.aparelho}.

Serviço proposto: ${params.descricaoServico}.

Valor total do orçamento: ${valorFormatado}.

Prazo estimado: ${params.prazoEstimado || "A definir"}.

Garantia: ${params.garantia || "90 dias"}.

Para aprovar o orçamento, responda a esta mensagem.

HC Tech Infocell — Assistência Técnica Especializada.`;
}

// =============================================================================
// TIPOS FINANCEIROS
// =============================================================================

/** Interface para item de orçamento (peça ou serviço) - banco de dados */
export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  tipo: "PECA" | "SERVICO";
  descricao: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  valor_venda: number;
  valor_total: number;
  fornecedor?: string | null;
  criado_em: string;
}

/** Interface para item de orçamento (formulário) */
export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total?: number;
}

/** Tipo unificado para cálculo */
type ItemCalculo = OrcamentoItem | ItemOrcamento;

/** Interface para dados de entrada do cálculo */
export interface DadosCalculoFinanceiro {
  itens?: ItemCalculo[];
  frete?: number;
  custosAdicionais?: number;
  valorMaoObra?: number;
  desconto?: number;
  acrescimo?: number;
  valorFinalCustom?: number;
}

/** Interface para resultados do cálculo */
export interface ResultadosCalculoFinanceiro {
  custo_pecas: number;
  frete_aquisicao: number;
  custos_adicionais: number;
  custo_total_operacao: number;
  valor_venda_pecas: number;
  valor_mao_obra: number;
  desconto: number;
  acrescimo: number;
  valor_final: number;
  lucro_bruto: number;
  margem_lucro: number;
}

/**
 * Calcula todos os valores financeiros do orçamento
 */
export function calcularValoresFinanceiros(params: DadosCalculoFinanceiro): ResultadosCalculoFinanceiro {
  const itens = params.itens ?? [];
  const frete = params.frete ?? 0;
  const custosAdicionais = params.custosAdicionais ?? 0;
  const valorMaoObra = params.valorMaoObra ?? 0;
  const desconto = params.desconto ?? 0;
  const acrescimo = params.acrescimo ?? 0;
  const valorFinalCustom = params.valorFinalCustom;

  // Custo total das peças (suporta ambos os formatos)
  const custo_pecas = itens.reduce((acc, item) => {
    if ('custo_total' in item) return acc + (item.custo_total ?? 0);
    if ('precoUnitario' in item) return acc + (item.precoUnitario * item.quantidade) * 0.6; // estimativa
    return acc;
  }, 0);

  // Valor total de venda das peças (suporta ambos os formatos)
  const valor_venda_pecas = itens.reduce((acc, item) => {
    if ('valor_total' in item) return acc + (item.valor_total ?? 0);
    if ('total' in item) return acc + (item.total ?? 0);
    if ('precoUnitario' in item) return acc + (item.precoUnitario * item.quantidade);
    return acc;
  }, 0);

  // Custo total da operação
  const custo_total_operacao = custo_pecas + frete + custosAdicionais;

  // Valor final do orçamento
  const valor_final = valorFinalCustom ?? (valor_venda_pecas + valorMaoObra + acrescimo - desconto);

  // Lucro bruto
  const lucro_bruto = valor_final - custo_total_operacao;

  // Margem de lucro
  const margem_lucro = valor_final !== 0 ? (lucro_bruto / valor_final) * 100 : 0;

  return {
    custo_pecas,
    frete_aquisicao: frete,
    custos_adicionais: custosAdicionais,
    custo_total_operacao,
    valor_venda_pecas,
    valor_mao_obra: valorMaoObra,
    desconto,
    acrescimo,
    valor_final,
    lucro_bruto,
    margem_lucro: Math.round(margem_lucro * 100) / 100,
  };
}


