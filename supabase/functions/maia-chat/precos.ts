// ──────────────────────────────────────────────────────────────
// BASE DE PREÇOS HC Tech (inicial — modelos populares)
// Edite valores conforme tabela real. Estrutura: marca → modelo → serviço
// ──────────────────────────────────────────────────────────────

export type ServicoKey =
  | "tela"
  | "bateria"
  | "vidro"
  | "tampa"
  | "conector"
  | "audio"
  | "camera"
  | "software"
  | "agua"
  | "naoliga";

export interface PrecoItem {
  preco: number;          // em R$
  peca: string;           // qualidade da peça
  prazo: string;          // ex: "1 hora", "24h"
}

export interface ModeloPrecos {
  apelidos: string[];     // variações de escrita ("iphone 12", "ip 12", "iphone12")
  servicos: Partial<Record<ServicoKey, PrecoItem>>;
}

// Helpers de prazo padrão
const RAPIDO = "1 hora";
const MESMO_DIA = "no mesmo dia";
const DOIS_DIAS = "1 a 2 dias úteis";

export const BASE_PRECOS: ModeloPrecos[] = [
  // ───────────── iPhone ─────────────
  {
    apelidos: ["iphone 11", "ip 11", "iphone11"],
    servicos: {
      tela: { preco: 449.9, peca: "Incell Premium", prazo: RAPIDO },
      bateria: { preco: 219.9, peca: "Original (capacidade 100%)", prazo: RAPIDO },
      conector: { preco: 199.9, peca: "Lightning original", prazo: MESMO_DIA },
      camera: { preco: 289.9, peca: "Original", prazo: MESMO_DIA },
      audio: { preco: 159.9, peca: "Original", prazo: MESMO_DIA },
      vidro: { preco: 299.9, peca: "Vidro frontal Premium", prazo: DOIS_DIAS },
      tampa: { preco: 249.9, peca: "Tampa traseira original", prazo: DOIS_DIAS },
    },
  },
  {
    apelidos: ["iphone 12", "ip 12", "iphone12"],
    servicos: {
      tela: { preco: 499.9, peca: "OLED Premium", prazo: RAPIDO },
      bateria: { preco: 249.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
      conector: { preco: 219.9, peca: "Lightning", prazo: MESMO_DIA },
      camera: { preco: 319.9, peca: "Original", prazo: MESMO_DIA },
      audio: { preco: 169.9, peca: "Original", prazo: MESMO_DIA },
      vidro: { preco: 349.9, peca: "Vidro frontal Premium", prazo: DOIS_DIAS },
      tampa: { preco: 279.9, peca: "Tampa traseira", prazo: DOIS_DIAS },
    },
  },
  {
    apelidos: ["iphone 13", "ip 13", "iphone13"],
    servicos: {
      tela: { preco: 649.9, peca: "OLED Premium", prazo: RAPIDO },
      bateria: { preco: 289.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
      conector: { preco: 229.9, peca: "Lightning", prazo: MESMO_DIA },
      camera: { preco: 379.9, peca: "Original", prazo: MESMO_DIA },
      audio: { preco: 189.9, peca: "Original", prazo: MESMO_DIA },
    },
  },
  {
    apelidos: ["iphone 14", "ip 14", "iphone14"],
    servicos: {
      tela: { preco: 799.9, peca: "OLED Premium", prazo: RAPIDO },
      bateria: { preco: 329.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
      conector: { preco: 249.9, peca: "Lightning", prazo: MESMO_DIA },
    },
  },
  {
    apelidos: ["iphone 15", "ip 15", "iphone15"],
    servicos: {
      tela: { preco: 999.9, peca: "OLED Premium", prazo: MESMO_DIA },
      bateria: { preco: 399.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
      conector: { preco: 279.9, peca: "USB-C", prazo: MESMO_DIA },
    },
  },
  {
    apelidos: ["iphone xr", "ipxr", "xr"],
    servicos: {
      tela: { preco: 379.9, peca: "Incell Premium", prazo: RAPIDO },
      bateria: { preco: 199.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
      conector: { preco: 179.9, peca: "Lightning", prazo: MESMO_DIA },
    },
  },
  {
    apelidos: ["iphone xs max", "xs max"],
    servicos: {
      tela: { preco: 549.9, peca: "OLED Premium", prazo: RAPIDO },
      bateria: { preco: 219.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["iphone xs", "xs"],
    servicos: {
      tela: { preco: 449.9, peca: "OLED Premium", prazo: RAPIDO },
      bateria: { preco: 209.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },

  // ───────────── Samsung Galaxy A ─────────────
  {
    apelidos: ["a10", "samsung a10", "galaxy a10"],
    servicos: {
      tela: { preco: 249.9, peca: "Nacional com aro", prazo: RAPIDO },
      bateria: { preco: 139.9, peca: "Premium", prazo: RAPIDO },
      conector: { preco: 119.9, peca: "Micro USB", prazo: MESMO_DIA },
    },
  },
  {
    apelidos: ["a20", "samsung a20", "galaxy a20"],
    servicos: {
      tela: { preco: 269.9, peca: "Nacional com aro", prazo: RAPIDO },
      bateria: { preco: 149.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["a30", "samsung a30", "galaxy a30"],
    servicos: {
      tela: { preco: 329.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 159.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["a51", "samsung a51", "galaxy a51"],
    servicos: {
      tela: { preco: 369.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 169.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
      conector: { preco: 139.9, peca: "USB-C", prazo: MESMO_DIA },
    },
  },
  {
    apelidos: ["a52", "samsung a52", "galaxy a52"],
    servicos: {
      tela: { preco: 389.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 179.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["a54", "samsung a54", "galaxy a54"],
    servicos: {
      tela: { preco: 449.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 199.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["s20", "galaxy s20"],
    servicos: {
      tela: { preco: 699.9, peca: "OLED Original", prazo: MESMO_DIA },
      bateria: { preco: 229.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["s21", "galaxy s21"],
    servicos: {
      tela: { preco: 799.9, peca: "OLED Original", prazo: MESMO_DIA },
      bateria: { preco: 249.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["s22", "galaxy s22"],
    servicos: {
      tela: { preco: 899.9, peca: "OLED Original", prazo: MESMO_DIA },
      bateria: { preco: 279.9, peca: "Premium 90 dias garantia", prazo: RAPIDO },
    },
  },

  // ───────────── Xiaomi / Redmi ─────────────
  {
    apelidos: ["redmi note 10", "note 10"],
    servicos: {
      tela: { preco: 319.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 149.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["redmi note 11", "note 11"],
    servicos: {
      tela: { preco: 339.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 159.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["redmi note 12", "note 12"],
    servicos: {
      tela: { preco: 369.9, peca: "OLED com aro", prazo: RAPIDO },
      bateria: { preco: 169.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["redmi 9", "xiaomi redmi 9"],
    servicos: {
      tela: { preco: 249.9, peca: "Nacional com aro", prazo: RAPIDO },
      bateria: { preco: 129.9, peca: "Premium", prazo: RAPIDO },
    },
  },

  // ───────────── Motorola ─────────────
  {
    apelidos: ["moto g32", "g32"],
    servicos: {
      tela: { preco: 279.9, peca: "Nacional com aro", prazo: RAPIDO },
      bateria: { preco: 149.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["moto g54", "g54"],
    servicos: {
      tela: { preco: 329.9, peca: "Nacional com aro", prazo: RAPIDO },
      bateria: { preco: 169.9, peca: "Premium", prazo: RAPIDO },
    },
  },
  {
    apelidos: ["moto g60", "g60"],
    servicos: {
      tela: { preco: 349.9, peca: "Nacional com aro", prazo: RAPIDO },
      bateria: { preco: 179.9, peca: "Premium", prazo: RAPIDO },
    },
  },
];

// ───────────── Mapa de palavras → serviço ─────────────
export const SERVICO_KEYWORDS: Record<ServicoKey, string[]> = {
  tela: ["tela", "display", "touch", "trincou", "rachou", "quebrou a tela"],
  bateria: ["bateria", "carga", "descarrega", "estufada", "estufou", "não segura", "nao segura"],
  vidro: ["vidro", "vidro frontal"],
  tampa: ["tampa", "tampa traseira", "traseira"],
  conector: ["conector", "carregador", "não carrega", "nao carrega", "porta de carga", "usb", "tipo c", "tipo-c", "lightning"],
  audio: ["som", "áudio", "audio", "alto-falante", "alto falante", "microfone", "fone", "vibracall", "auto falante"],
  camera: ["câmera", "camera", "lente", "foto borrada", "foco"],
  software: ["lento", "travando", "travado", "loop", "reinicia", "brick", "lentidão", "lentidao", "software"],
  agua: ["molhou", "molhei", "água", "agua", "caiu na agua", "caiu na água", "líquido", "liquido"],
  naoliga: ["não liga", "nao liga", "morreu", "apagou", "não acende", "nao acende"],
};

const SERVICO_LABEL: Record<ServicoKey, string> = {
  tela: "Troca de tela",
  bateria: "Troca de bateria",
  vidro: "Vidro frontal",
  tampa: "Tampa traseira",
  conector: "Conector de carga",
  audio: "Áudio / Alto-falante",
  camera: "Câmera",
  software: "Reparo de software",
  agua: "Dano por líquido",
  naoliga: "Diagnóstico (não liga)",
};

// ───────────── Detectores ─────────────
function normalizar(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function detectarServico(texto: string): ServicoKey | null {
  const t = normalizar(texto);
  for (const [key, kws] of Object.entries(SERVICO_KEYWORDS) as [ServicoKey, string[]][]) {
    if (kws.some((k) => t.includes(normalizar(k)))) return key;
  }
  return null;
}

export function detectarModelo(texto: string): { canonico: string; entry: ModeloPrecos } | null {
  const t = normalizar(texto);
  // Match mais longo primeiro (ex: "iphone 12" antes de "12")
  const candidatos = BASE_PRECOS.flatMap((m) =>
    m.apelidos.map((a) => ({ apelido: normalizar(a), entry: m })),
  ).sort((a, b) => b.apelido.length - a.apelido.length);

  for (const c of candidatos) {
    if (t.includes(c.apelido)) {
      return { canonico: c.entry.apelidos[0], entry: c.entry };
    }
  }
  return null;
}

export function buscarPreco(modeloEntry: ModeloPrecos, servico: ServicoKey): PrecoItem | null {
  return modeloEntry.servicos[servico] ?? null;
}

export function formatarRespostaVenda(
  modeloCanonico: string,
  servico: ServicoKey,
  item: PrecoItem,
): string {
  const preco = item.preco.toFixed(2).replace(".", ",");
  const nomeBonito = modeloCanonico
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return [
    `📱 Aparelho: ${nomeBonito}`,
    `🔧 Serviço: ${SERVICO_LABEL[servico]}`,
    `💰 Valor: R$ ${preco}`,
    `🛠 Qualidade: ${item.peca}`,
    `📅 Prazo: ${item.prazo}`,
    `✅ Garantia HC Tech`,
    ``,
    `👉 Deseja agendar ou tirar alguma dúvida?`,
  ].join("\n");
}

export function rotuloServico(s: ServicoKey): string {
  return SERVICO_LABEL[s];
}
