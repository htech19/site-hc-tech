/**
 * =============================================================================
 * TIPOS DE DOMÍNIO — MÓDULO /sistema (HC TECH)
 * =============================================================================
 * Fonte de verdade: `Complementos site/hc-tech.html` (9 módulos interligados).
 *
 * DECISÃO DE ARQUITETURA (registrada em revisão):
 * O banco persiste `status` em MINÚSCULO ('pendente', 'concluida', ...) para
 * manter COMPATIBILIDADE TOTAL com os dados já existentes em produção.
 * A camada de apresentação (UI) usa os rótulos MAIÚSCULOS exigidos pelo spec
 * ('PENDENTE', 'CONCLUIDA', ...). O mapeamento acontece exclusivamente nas
 * funções `paraStatusUI` / `paraStatusBanco` — nunca há "vazamento" de um
 * formato para o outro.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// STATUS DE OS
// -----------------------------------------------------------------------------

/** Formato de apresentação (UI). Conforme spec FASE 2. */
export type StatusOS =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "ESTOQUE"
  | "DEVOLUCAO"
  | "CANCELADA";

/**
 * Formato persistido no Postgres (compatível com dados existentes).
 * `aprovado` é um status legado do banco — mapeamos para EM_ANDAMENTO na UI.
 */
export type StatusOSBanco =
  | "pendente"
  | "aprovado"
  | "em_andamento"
  | "concluida"
  | "estoque"
  | "devolucao"
  | "cancelada";

/** Todos os status na ordem de exibição padrão do dashboard/relatórios. */
export const ORDENACAO_STATUS: readonly StatusOS[] = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "ESTOQUE",
  "DEVOLUCAO",
  "CANCELADA",
] as const;

const MAPA_UI_POR_BANCO: Record<StatusOSBanco, StatusOS> = {
  pendente: "PENDENTE",
  aprovado: "EM_ANDAMENTO",
  em_andamento: "EM_ANDAMENTO",
  concluida: "CONCLUIDA",
  estoque: "ESTOQUE",
  devolucao: "DEVOLUCAO",
  cancelada: "CANCELADA",
};

const MAPA_BANCO_POR_UI: Record<StatusOS, StatusOSBanco> = {
  PENDENTE: "pendente",
  EM_ANDAMENTO: "em_andamento",
  CONCLUIDA: "concluida",
  ESTOQUE: "estoque",
  DEVOLUCAO: "devolucao",
  CANCELADA: "cancelada",
};

/** Converte o valor do banco para o formato de UI. Nunca retorna `undefined`. */
export function paraStatusUI(bruto: string | null | undefined): StatusOS {
  return MAPA_UI_POR_BANCO[(bruto ?? "pendente") as StatusOSBanco] ?? "PENDENTE";
}

/** Converte o formato de UI para o valor persistido no banco. */
export function paraStatusBanco(ui: StatusOS): StatusOSBanco {
  return MAPA_BANCO_POR_UI[ui] ?? "pendente";
}

/** Rótulo legível em PT-BR (o que aparece na tela). */
export const ROTULO_STATUS: Record<StatusOS, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA: "Concluída",
  ESTOQUE: "Estoque",
  DEVOLUCAO: "Devolução",
  CANCELADA: "Cancelada",
};

/** Ícone emoji usado no HTML de referência (mantém a identidade visual). */
export const ICONE_STATUS: Record<StatusOS, string> = {
  PENDENTE: "⏳",
  EM_ANDAMENTO: "🔧",
  CONCLUIDA: "✅",
  ESTOQUE: "📦",
  DEVOLUCAO: "↩️",
  CANCELADA: "❌",
};

/** Classe Tailwind do badge — tema slate/zinc escuro com verde neon. */
export const CLASSE_STATUS: Record<StatusOS, string> = {
  PENDENTE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  EM_ANDAMENTO: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  CONCLUIDA: "bg-green-600/20 text-green-400 border-green-400/30",
  ESTOQUE: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  DEVOLUCAO: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  CANCELADA: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

/** Cor sólida usada no gráfico de barras do dashboard. */
export const COR_STATUS: Record<StatusOS, string> = {
  PENDENTE: "#FDCB6E",
  EM_ANDAMENTO: "#74B9FF",
  CONCLUIDA: "#00FF88",
  ESTOQUE: "#A78BFA",
  DEVOLUCAO: "#FB7185",
  CANCELADA: "#71717A",
};

// -----------------------------------------------------------------------------
// ENTIDADES DE DOMÍNIO
// -----------------------------------------------------------------------------

/** Ordem de Serviço — entidade central do sistema. */
export interface OrdemServico {
  id: string;
  numero: number;
  /** `null` quando o cliente foi cadastrado apenas pelo nome digitado na OS. */
  clienteId: string | null;
  aparelho: string;
  marca?: string | null;
  quantidade: number;
  defeito: string;
  status: StatusOS;
  observacao?: string;
  valorOrcado: number;
  dataEntrada: string;
  dataConclusao?: string | null;
  /** Nome do cliente denormalizado (fallback quando `clienteId` é nulo). */
  clienteNome?: string | null;
  telefone?: string | null;
  createdAt: string;
  updatedAt: string;
  // Campos adicionados para Orçamento Inteligente
  tipoEquipamento?: TipoEquipamento;
  imei1?: string | null;
  imei2?: string | null;
  numeroSerie?: string | null;
  servicoSelecionado?: string | null;
  tipoTela?: TipoTela | null;
  protocoloSolicitacao?: string | null;
  valorEstimado?: number | null;
  valorAprovado?: number | null;
  valorFinal?: number | null;
  origemSolicitacao?: OrigemSolicitacao;
}

/** Cliente com totalizadores derivados das OS. */
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  /** Total de OS do cliente — recalculado por trigger/consulta agregada. */
  totalOS: number;
  ultimaOS?: string | null;
  createdAt: string;
}

/** Item de estoque (aparelhos parados/consertados aguardando destino). */
export interface EstoqueItem {
  id: string;
  aparelho: string;
  quantidade: number;
  defeito?: string | null;
  condicao?: string | null;
  observacao?: string | null;
  createdAt: string;
}

/** Tipo de serviço cadastrável com contador de ocorrências. */
export interface TipoServico {
  id: string;
  nome: string;
  /** Quantas vezes este serviço aparece em defeitos de OS. */
  quantidadeRealizada: number;
}

/** Movimentação financeira de caixa. */
export interface CaixaMovimentacao {
  id: string;
  data: string;
  descricao: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  osId?: string | null;
}

// -----------------------------------------------------------------------------
// STATUS DE ORÇAMENTO
// -----------------------------------------------------------------------------
export type StatusOrcamento = "PENDENTE" | "APROVADO" | "REPROVADO";

// -----------------------------------------------------------------------------
// ENUMS — Módulo Nova OS / Orçamento Inteligente (HC TECH)
// -----------------------------------------------------------------------------

/** Tipo de equipamento. */
export enum TipoEquipamento {
  CELULAR = "CELULAR",
  NOTEBOOK = "NOTEBOOK",
}

/**
 * Tipo de tela (qualidade) para substituição.
 * Os valores espelham EXATAMENTE as qualidades gravadas na coluna `qualidade`
 * da Tabela de Telas 08/2026 (fonte da verdade), exceto INC/CHI/NAC/VIVD/CA,
 * que mantêm o código curto histórico.
 */
export enum TipoTela {
  INC = "INC", // INCELL
  CHI = "CHI", // CHINA
  NAC = "NAC", // NACIONAL
  OLED = "OLED", // OLED
  VIVD = "VIVD", // VIVID
  JK = "JK", // JK
  CA = "CA", // C/A - Conjunto com aro
  AMOLED = "AMOLED", // AMOLED
  DIAGNOSTICO = "DIAGNOSTICO", // DIAGNOSTICO
  ORIGINAL = "ORIGINAL", // ORIGINAL
  PADRAO = "PADRAO", // PADRÃO (a Tabela grava "PADRÃO")
  TABLET = "TABLET", // TABLET
}

/** Categoria de equipamento aceitas pelo sistema. */
export type CategoriaEquipamento =
  | "CELULAR"
  | "NOTEBOOK"
  | "DESKTOP"
  | "TABLET"
  | "MONITOR"
  | "IMPRESSORA"
  | "PERIFERICOS"
  | "OUTROS";

/** Modalidades de atendimento. */
export type TipoAtendimento = "PROCEDURAL" | "A_HOME" | "ENTREGA";

/** Níveis de prioridade da OS. */
export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

/** Status de um checklist de entrada. */
export type StatusChecklist = "PENDENTE" | "CONCLUIDO" | "N_A";

/** Origem da solicitação. */
export enum OrigemSolicitacao {
  PUBLICO = "PUBLICO", // Site público
  INTERNO = "INTERNO", // Uso interno
}

/** Status de uma solicitação de orçamento (fluxo do Orçamento Inteligente). */
export enum StatusSolicitacao {
  PENDENTE_AVALIACAO = "PENDENTE_AVALIACAO",
  EM_ANALISE = "EM_ANALISE",
  AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO",
  APROVADO = "APROVADO",
  RECUSADO = "RECUSADO",
  CONVERTIDO_OS = "CONVERTIDO_OS",
}

export const ROTULO_ORCAMENTO: Record<StatusOrcamento, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

export const CLASSE_ORCAMENTO: Record<StatusOrcamento, string> = {
  PENDENTE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  APROVADO: "bg-green-600/20 text-green-400 border-green-400/30",
  REPROVADO: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

// -----------------------------------------------------------------------------
// CATÁLOGOS DE REFERÊNCIA RÁPIDA
// -----------------------------------------------------------------------------

/** Rótulos legíveis das categorias de equipamento. */
export const ROTULO_CATEGORIA: Record<CategoriaEquipamento, string> = {
  CELULAR: "Celular",
  NOTEBOOK: "Notebook",
  DESKTOP: "Desktop",
  TABLET: "Tablet",
  MONITOR: "Monitor",
  IMPRESSORA: "Impressora",
  PERIFERICOS: "Periféricos",
  OUTROS: "Outros",
};

/** Rótulos legíveis dos tipos de equipamento. */
export const ROTULO_TIPO_EQUIPAMENTO: Record<TipoEquipamento, string> = {
  CELULAR: "Celular",
  NOTEBOOK: "Notebook",
};

/**
 * Rótulos legíveis dos tipos de tela — usam a nomenclatura EXATA da
 * Tabela de Telas 08/2026 para não exibir nomes genéricos.
 */
export const ROTULO_TIPO_TELA: Record<TipoTela, string> = {
  INC: "INCELL",
  CHI: "CHINA",
  NAC: "NACIONAL",
  OLED: "OLED",
  VIVD: "VIVID",
  JK: "JK",
  CA: "C/A (Cantão)",
  AMOLED: "AMOLED",
  DIAGNOSTICO: "DIAGNOSTICO",
  ORIGINAL: "ORIGINAL",
  PADRAO: "PADRÃO",
  TABLET: "TABLET",
};

/** Descrições técnicas dos tipos de tela (nomenclatura da Tabela de Telas). */
export const DESCRICAO_TIPO_TELA: Record<TipoTela, string> = {
  INC: "Qualidade INCELL da Tabela de Telas",
  CHI: "Qualidade CHINA da Tabela de Telas",
  NAC: "Qualidade NACIONAL da Tabela de Telas",
  OLED: "Qualidade OLED da Tabela de Telas",
  VIVD: "Qualidade VIVID da Tabela de Telas",
  JK: "Qualidade JK da Tabela de Telas",
  CA: "Conjunto com aro (C/A)",
  AMOLED: "Qualidade AMOLED da Tabela de Telas",
  DIAGNOSTICO: "Diagnóstico técnico (avaliação em bancada)",
  ORIGINAL: "Qualidade ORIGINAL da Tabela de Telas",
  PADRAO: "Qualidade PADRÃO da Tabela de Telas",
  TABLET: "Peça para tablet (Tabela de Telas)",
};

/** Rótulos das prioridades. */
export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

/** cores para badges de prioridade. */
export const CLASSE_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  MEDIA: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ALTA: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  URGENTE: "bg-red-500/15 text-red-300 border-red-500/30",
};


// -----------------------------------------------------------------------------
// SOLICITAÇÃO DE ORÇAMENTO — Orçamento Inteligente (HC TECH)
// -----------------------------------------------------------------------------

/** Resultado da consulta de preço (nunca inventa valores: total 0 = sujeito à avaliação). */
export interface ResultadoPreco {
  status: "DISPONIVEL" | "SUJEITO_A_AVALIACAO";
  peca?: number;
  maoObra?: number;
  total: number;
  prazoDias?: number;
  garantiaMeses?: number;
  mensagem?: string;
}

/** Tabela de preço de um serviço (peça + mão de obra). */
export interface PrecoServico {
  peca: number;
  maoObra: number;
  total: number;
  prazoDias: number;
  garantiaMeses: number;
}

/** Solicitação de orçamento registrada pelo wizard (público) ou internamente. */
export interface SolicitacaoOrcamento {
  id: string;
  protocoloSolicitacao: string;
  dataSolicitacao: string;

  // Equipamento
  tipoEquipamento: TipoEquipamento;
  marca: string;
  modelo: string;
  imei1?: string;
  imei2?: string;
  numeroSerie?: string;

  // Serviço
  servicoSelecionado: string;
  tipoTela?: TipoTela;
  descricaoDefeito: string;

  // Cliente
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  quantidade: number;
  observacoes?: string;

  // Preço
  valorEstimado?: number;
  valorAprovado?: number;
  valorFinal?: number;
  resultadoPreco?: ResultadoPreco;

  // Status
  status: StatusSolicitacao;
  origemSolicitacao: OrigemSolicitacao;

  // Vínculo OS
  osId?: string;

  // Auditoria
  createdAt: string;
  updatedAt: string;
}

/** Orçamento vinculado a uma OS. */
export interface Orcamento {
  id: string;
  osId: string | null;
  numeroOS?: number | null;
  clienteId?: string | null;
  clienteNome?: string | null;
  aparelho?: string | null;
  descricao?: string | null;
  valor: number;
  status: StatusOrcamento;
  dataOrcamento: string;
  createdAt: string;
  updatedAt: string;
}

/** Registro de devolução de aparelho ao cliente. */
export interface Devolucao {
  id: string;
  osId: string;
  numeroOS?: number | null;
  aparelho: string;
  cliente: string;
  defeito: string;
  observacao?: string | null;
  dataDevolucao: string;
}

// -----------------------------------------------------------------------------
// INTERFACES ADICIONAIS — Módulo Nova OS / Orçamento (HC TECH)
// -----------------------------------------------------------------------------

/** Equipamento em análise. */
export interface Equipamento {
  id?: string;
  categoria: CategoriaEquipamento;
  tipoEquipamento?: TipoEquipamento;
  fabricante: string;
  modelo: string;
  quantidade: number;
  serial?: string;
  numeroSerie?: string;
  imei1?: string;
  imei2?: string;
  servicoSelecionado?: string;
  tipoTela?: TipoTela;
  observacao?: string;
}

/** Defeito relatado pelo cliente. */
export interface DefeitoRelatado {
  descricao: string;
  sintomaPrincipal: string;
  dataOcorrencia?: string;
  condicoesUso?: string;
}

/** Item de orçamento (peça ou serviço). */
export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total?: number;
}

/** Checklist de entrada do equipamento. */
export interface ChecklistEntrada {
  itens: ChecklistItem[];
  dataChegada?: string;
}

export interface ChecklistItem {
  nome: string;
  status: StatusChecklist;
  observacao?: string;
}

/** Causa provável sugerida pelo diagnóstico. */
export interface CausaProvavel {
  nome: string;
  componente: string;
  sintomasAssociados: string[];
  testesRecomendados: string[];
  probabilidade?: "ALTA" | "MEDIA" | "BAIXA";
}

/** Diagnóstico técnico gerado. */
export interface DiagnosticoTecnico {
  equipamentoId?: string;
  categoria: CategoriaEquipamento;
  causasSugeridas: CausaProvavel[];
  sintomaPrincipal: string;
  defeitoRelatado: string;
  tecnicoSugestao?: string;
  dataDiagnostico: string;
}

// -----------------------------------------------------------------------------
// LINHAS DE BANCO (persistência) — formato minúsculo existente
// -----------------------------------------------------------------------------

export interface LinhaOrdemServico {
  id: string;
  numero: number;
  user_id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  aparelho: string;
  marca: string | null;
  quantidade: number;
  defeito: string | null;
  status: string;
  observacao: string | null;
  valor: number | null;
  telefone: string | null;
  data_entrada: string;
  data_conclusao: string | null;
  created_at: string;
  updated_at?: string;
}

export interface LinhaCaixa {
  id: string;
  user_id: string;
  data: string;
  descricao: string;
  tipo: string;
  valor: number;
  os_id?: string | null;
  created_at: string;
}

export interface LinhaEstoque {
  id: string;
  user_id: string;
  aparelho: string;
  quantidade: number;
  defeito: string | null;
  condicao: string | null;
  observacao: string | null;
  created_at: string;
}

export interface LinhaOrcamento {
  id: string;
  user_id: string;
  os_id: string | null;
  cliente_id: string | null;
  descricao: string | null;
  valor: number;
  status: string;
  data_orcamento: string;
  created_at: string;
  updated_at: string;
}

export interface LinhaDevolucao {
  id: string;
  user_id: string;
  os_id: string;
  aparelho: string;
  cliente: string;
  defeito: string | null;
  observacao: string | null;
  data_devolucao: string;
  created_at: string;
}

export interface LinhaServicoTipo {
  id: string;
  user_id: string;
  nome: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// ADAPTERS (banco -> domínio)
// -----------------------------------------------------------------------------

/** Adaptador de OS: banco (minúsculo) -> domínio (UI maiúsculo). */
export function adaptarOS(l: LinhaOrdemServico): OrdemServico {
  return {
    id: l.id,
    numero: l.numero,
    clienteId: l.cliente_id,
    aparelho: l.aparelho,
    marca: l.marca,
    quantidade: l.quantidade ?? 1,
    defeito: l.defeito ?? "-",
    status: paraStatusUI(l.status),
    observacao: l.observacao ?? undefined,
    valorOrcado: Number(l.valor ?? 0),
    dataEntrada: l.data_entrada,
    dataConclusao: l.data_conclusao,
    clienteNome: l.cliente_nome,
    telefone: l.telefone,
    createdAt: l.created_at,
    updatedAt: l.updated_at ?? l.created_at,
  };
}

/** Adaptador de caixa: `entrada`/`saida` -> `ENTRADA`/`SAIDA`. */
export function adaptarCaixa(l: LinhaCaixa): CaixaMovimentacao {
  return {
    id: l.id,
    data: l.data,
    descricao: l.descricao,
    tipo: l.tipo === "saida" ? "SAIDA" : "ENTRADA",
    valor: Number(l.valor ?? 0),
    osId: l.os_id ?? undefined,
  };
}

export function adaptarEstoque(l: LinhaEstoque): EstoqueItem {
  return {
    id: l.id,
    aparelho: l.aparelho,
    quantidade: l.quantidade ?? 0,
    defeito: l.defeito,
    condicao: l.condicao,
    observacao: l.observacao,
    createdAt: l.created_at,
  };
}

const MAPA_STATUS_ORCAMENTO: Record<string, StatusOrcamento> = {
  pendente: "PENDENTE",
  aprovado: "APROVADO",
  reprovado: "REPROVADO",
};

export function adaptarOrcamento(
  l: LinhaOrcamento,
  extra?: { numeroOS?: number | null; clienteNome?: string | null; aparelho?: string | null }
): Orcamento {
  return {
    id: l.id,
    osId: l.os_id,
    numeroOS: extra?.numeroOS ?? null,
    clienteId: l.cliente_id,
    clienteNome: extra?.clienteNome ?? null,
    aparelho: extra?.aparelho ?? null,
    descricao: l.descricao,
    valor: Number(l.valor ?? 0),
    status: MAPA_STATUS_ORCAMENTO[l.status] ?? "PENDENTE",
    dataOrcamento: l.data_orcamento,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

export function adaptarDevolucao(
  l: LinhaDevolucao,
  extra?: { numeroOS?: number | null }
): Devolucao {
  return {
    id: l.id,
    osId: l.os_id,
    numeroOS: extra?.numeroOS ?? null,
    aparelho: l.aparelho,
    cliente: l.cliente,
    defeito: l.defeito ?? "-",
    observacao: l.observacao,
    dataDevolucao: l.data_devolucao,
  };
}

// -----------------------------------------------------------------------------
// FORMULÁRIOS / FILTROS
// -----------------------------------------------------------------------------

/** Payload de criação/edição de OS (campos do formulário). */
export interface FormularioOS {
  aparelho: string;
  marca: string;
  clienteId: string;
  clienteNome: string;
  telefone: string;
  defeito: string;
  status: StatusOS;
  observacao: string;
  valorOrcado: string;
  quantidade: string;
  dataEntrada: string;
}

/** Filtros aplicáveis à listagem de OS. */
export interface FiltroOS {
  busca: string;
  status: StatusOS | "TODOS";
  clienteId: string | "TODOS";
  /** ISO `YYYY-MM-DD` — filtragem por período de entrada. */
  dataInicio?: string;
  dataFim?: string;
}

export const FILTRO_OS_PADRAO: FiltroOS = {
  busca: "",
  status: "TODOS",
  clienteId: "TODOS",
};

/** Resumo de métricas exibido no dashboard. */
export interface MetricasDashboard {
  totalOS: number;
  concluidas: number;
  pendentes: number;
  emEstoque: number;
  devolucoes: number;
  canceladas: number;
  emAndamento: number;
  faturamento: number;
  /**
   * Contagens lidas em tabelas próprias (via `head: true`).
   *
   * `null` significa LEITURA FALHOU (ex.: migração pendente) — é diferente de
   * `0`, que é um resultado lido e verdadeiro. Sem essa distinção o painel
   * exibiria "0" como se fosse um número real.
   */
  totalClientes: number | null;
  itensEstoque: number | null;
}

/** Linha agregada "aparelhos mais atendidos". */
export interface AparelhoAgrupado {
  aparelho: string;
  quantidade: number;
  defeitoMaisComum: string;
}

/** Item de cabeçalho de exportação CSV. */
export interface ColunaRelatorio {
  chave: string;
  rotulo: string;
}
