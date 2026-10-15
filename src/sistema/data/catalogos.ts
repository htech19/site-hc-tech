/**
 * =============================================================================
 * CATÁLEGOS — Módulo Orçamento Inteligente (HC TECH)
 * =============================================================================
 * Catálogos de serviços e tipos de tela para orçamentos.
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

/** Serviço disponível para orçamento. */
import { TipoEquipamento } from "../types";

export interface ServicoCatalogo {
  id: string;
  nome: string;
  descricao?: string;
  categoria: "CELULAR" | "NOTEBOOK" | "AMBOS";
}

/** Tipo de tela para substituição. */
export interface TipoTelasCatalogo {
  id: string;
  nome: string;
  descricao: string;
}

// -----------------------------------------------------------------------------
// SERVIÇOS - CELULAR
// -----------------------------------------------------------------------------

export const SERVICOS_CELULAR: ServicoCatalogo[] = [
  {
    id: "tela",
    nome: "Troca de Tela",
    descricao: "Substituição completa da tela do aparelho",
    categoria: "CELULAR",
  },
  {
    id: "bateria",
    nome: "Troca de Bateria",
    descricao: "Substituição da bateria por uma nova",
    categoria: "CELULAR",
  },
  {
    id: "carregador",
    nome: "Troca de Carregador",
    descricao: "Substituição do adaptador de carregamento",
    categoria: "CELULAR",
  },
  {
    id: "som",
    nome: "Reparo de Som",
    descricao: "Reparo do alto-falante ou problema de áudio",
    categoria: "CELULAR",
  },
  {
    id: "camera",
    nome: "Reparo de Câmera",
    descricao: "Reparo ou substituição da câmera",
    categoria: "CELULAR",
  },
  {
    id: "liquid",
    nome: "Limpeza de Líquidos",
    descricao: "Limpeza e recuperação após dano por líquidos",
    categoria: "CELULAR",
  },
  {
    id: "botes",
    nome: "Troca de Botões",
    descricao: "Substituição de botões/fios do aparelho",
    categoria: "CELULAR",
  },
  {
    id: "wifi",
    nome: "Reparo de WiFi/4G",
    descricao: "Reparo de problemas de conectividade",
    categoria: "CELULAR",
  },
  {
    id: "flex",
    nome: "Troca de Flex",
    descricao: "Substituição de flex cables",
    categoria: "CELULAR",
  },
];

// -----------------------------------------------------------------------------
// SERVIÇOS - NOTEBOOK
// -----------------------------------------------------------------------------

export const SERVICOS_NOTEBOOK: ServicoCatalogo[] = [
  {
    id: "tela",
    nome: "Troca de Tela/Display",
    descricao: "Substituição do display do notebook",
    categoria: "NOTEBOOK",
  },
  {
    id: "teclado",
    nome: "Troca de Teclado",
    descricao: "Substituição do teclado do notebook",
    categoria: "NOTEBOOK",
  },
  {
    id: "bateria",
    nome: "Troca de Bateria",
    descricao: "Substituição da bateria do notebook",
    categoria: "NOTEBOOK",
  },
  {
    id: "hd",
    nome: "Troca de HD/SSD",
    descricao: "Substituição ou clone do disco rígido/SSD",
    categoria: "NOTEBOOK",
  },
  {
    id: "ram",
    nome: "Memória RAM",
    descricao: "Análise/primeira instalação de memória RAM",
    categoria: "NOTEBOOK",
  },
  {
    id: "motherboard",
    nome: "Placa-Mãe",
    descricao: "Reparo ou substituição de componentes da placa-mãe",
    categoria: "NOTEBOOK",
  },
  {
    id: "cooling",
    nome: "Sistema de Refrigeração",
    descricao: "Limpeza ou substituição de cooler/fan",
    categoria: "NOTEBOOK",
  },
  {
    id: "usb",
    nome: "Portas USB",
    descricao: "Reparo ou substituição de portas USB",
    categoria: "NOTEBOOK",
  },
  {
    id: "som",
    nome: "Reparo de Som",
    descricao: "Reparo do áudio do notebook",
    categoria: "NOTEBOOK",
  },
  {
    id: "wifi",
    nome: "Reparo de WiFi",
    descricao: "Reparo do módulo WiFi/Bluetooth",
    categoria: "NOTEBOOK",
  },
];

// -----------------------------------------------------------------------------
// TIPOS DE TELA
// -----------------------------------------------------------------------------

export const TIPOS_TELA: TipoTelasCatalogo[] = [
  {
    id: "INC",
    nome: "INCELL",
    descricao: "Qualidade INCELL da Tabela de Telas 08/2026.",
  },
  {
    id: "CHI",
    nome: "CHINA",
    descricao: "Qualidade CHINA da Tabela de Telas 08/2026.",
  },
  {
    id: "NAC",
    nome: "NACIONAL",
    descricao: "Qualidade NACIONAL da Tabela de Telas 08/2026.",
  },
  {
    id: "OLED",
    nome: "OLED",
    descricao: "Qualidade OLED da Tabela de Telas 08/2026.",
  },
  {
    id: "VIVD",
    nome: "VIVID",
    descricao: "Qualidade VIVID da Tabela de Telas 08/2026.",
  },
  {
    id: "JK",
    nome: "JK",
    descricao: "Qualidade JK da Tabela de Telas 08/2026.",
  },
  {
    id: "AMOLED",
    nome: "AMOLED",
    descricao: "Qualidade AMOLED da Tabela de Telas 08/2026.",
  },
  {
    id: "DIAGNOSTICO",
    nome: "DIAGNOSTICO",
    descricao: "Diagnóstico técnico realizado em bancada.",
  },
  {
    id: "ORIGINAL",
    nome: "ORIGINAL",
    descricao: "Qualidade ORIGINAL da Tabela de Telas 08/2026.",
  },
  {
    id: "PADRAO",
    nome: "PADRÃO",
    descricao: "Qualidade PADRÃO da Tabela de Telas 08/2026.",
  },
  {
    id: "TABLET",
    nome: "TABLET",
    descricao: "Peça para tablet da Tabela de Telas 08/2026.",
  },
  {
    id: "CA",
    nome: "C/A (Cantão)",
    descricao: "Conjunto com aro (C/A) — quando disponível na Tabela de Telas.",
  },
];

// -----------------------------------------------------------------------------
// FUNÇÕES DE UTILIDADE
// -----------------------------------------------------------------------------

/** Retorna todos os serviços para uma categoria específica. */
export function getServicosPorCategoria(categoria: "CELULAR" | "NOTEBOOK"): ServicoCatalogo[] {
  if (categoria === "CELULAR") {
    return SERVICOS_CELULAR;
  }
  return SERVICOS_NOTEBOOK;
}

/** Retorna o serviço pelo ID. */
export function getServicoPorId(id: string): ServicoCatalogo | undefined {
  const todos = [...SERVICOS_CELULAR, ...SERVICOS_NOTEBOOK];
  return todos.find((s) => s.id === id);
}

/** Retorna o tipo de tela pelo ID. */
export function getTipoTelaPorId(id: string): TipoTelasCatalogo | undefined {
  return TIPOS_TELA.find((t) => t.id === id);
}

/** Verifica se um serviço requer seleção de tipo de tela. */
export function servicoRequerTipoTela(servicoId: string): boolean {
  return servicoId === "tela";
}

// -----------------------------------------------------------------------------
// MARCAS E MODELOS — Autocomplete do Orçamento Inteligente (HC TECH)
// -----------------------------------------------------------------------------

/** Marcas de celular aceitas no formulário de solicitação (nacionais e internacionais). */
export const MARCAS_CELULAR = [
  "Apple",
  "Samsung",
  "Motorola",
  "Xiaomi",
  "Redmi",
  "POCO",
  "LG",
  "ASUS",
  "ROG Phone",
  "Realme",
  "OnePlus",
  "Nokia",
  "Huawei",
  "Honor",
  "Sony",
  "Alcatel",
  "TCL",
  "Infinix",
  "Tecno",
  "Itel",
  "Positivo",
  "Multilaser",
  "Intelbras",
  "Outra",
];

/** Marcas de notebook aceitas no formulário de solicitação. */
export const MARCAS_NOTEBOOK = [
  "Apple",
  "Dell",
  "HP",
  "Lenovo",
  "ASUS",
  "Acer",
  "Samsung",
  "LG",
  "MSI",
  "Razer",
  "Microsoft Surface",
  "Positivo",
  "Vaio",
  "Compaq",
  "Toshiba",
  "Sony VAIO",
  "Outra",
];

/**
 * Mapeamento marca -> modelos para autocomplete (base expansível).
 * IMPORTANTE: o cliente TAMBÉM pode digitar um modelo não listado —
 * as listas abaixo são apenas sugestões, nunca uma imposição.
 */
export const MODELOS_POR_MARCA: Record<string, string[]> = {
  Apple: [
    "iPhone 11",
    "iPhone 12",
    "iPhone 12 Mini",
    "iPhone 12 Pro",
    "iPhone 12 Pro Max",
    "iPhone 13",
    "iPhone 13 Pro",
    "iPhone 14",
    "iPhone 14 Pro",
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone SE",
  ],
  Samsung: [
    "Galaxy A14",
    "Galaxy A54",
    "Galaxy S21",
    "Galaxy S22",
    "Galaxy S23",
    "Galaxy S24",
    "Galaxy Z Flip",
    "Galaxy Z Fold",
  ],
  Motorola: ["Moto G22", "Moto G52", "Moto G82", "Edge 30", "Edge 40", "Razr 40"],
  Xiaomi: ["Redmi 12", "Redmi Note 12", "Redmi Note 13", "POCO X5", "POCO F5", "Mi 13"],
};

/**
 * Retorna os modelos sugeridos para uma marca.
 * A comparação ignora maiúsculas/minúsculas e espaços extras.
 * Retorna lista vazia quando a marca não tem base de modelos (o campo livre continua válido).
 */
export function getModelosPorMarca(marca: string): string[] {
  const normalizar = (v: string) => v.toLowerCase().trim();
  const chave = Object.keys(MODELOS_POR_MARCA).find(
    (k) => normalizar(k) === normalizar(marca ?? "")
  );
  return chave ? MODELOS_POR_MARCA[chave] : [];
}

/** Retorna as marcas sugeridas para o tipo de equipamento selecionado. */
export function getMarcasSugeridas(tipo: TipoEquipamento | null): string[] {
  return tipo === TipoEquipamento.CELULAR ? MARCAS_CELULAR : MARCAS_NOTEBOOK;
}
