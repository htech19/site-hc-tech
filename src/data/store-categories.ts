import { categories } from "./store-products";

export interface CategoryMeta {
  name: string;
  slug: string;
  title: string;
  description: string;
}

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const descriptions: Record<string, string> = {
  Todos: "Confira todos os produtos da HC Tech Store: acessórios, fones, carregadores, gadgets e mais, com compra rápida pelo WhatsApp.",
  "Fones & Headsets": "Fones Bluetooth e headsets com ótimo custo-benefício na HC Tech Store. Compre pelo WhatsApp com entrega para todo o Brasil.",
  Cabos: "Cabos USB, V8, Tipo-C e Lightning reforçados na HC Tech Store. Preços diretos e atendimento rápido pelo WhatsApp.",
  "Carregadores & Fontes": "Carregadores rápidos, turbo e fontes originais na HC Tech Store. Compre pelo WhatsApp em São Bernardo do Campo.",
  "Power Banks": "Power banks de 10000mAh e mais para carregar seu celular em qualquer lugar. Compra rápida pelo WhatsApp.",
  "Caixas de Som": "Caixas de som Bluetooth potentes para festas e uso diário. Confira os preços da HC Tech Store.",
  "Informática & Periféricos": "Teclados, mouses, hubs e periféricos de informática com preço justo na HC Tech Store.",
  Acessórios: "Acessórios para celular: suportes, capas, adaptadores e itens úteis do dia a dia na HC Tech Store.",
  Eletrônicos: "Eletrônicos e gadgets selecionados pela HC Tech Store, com compra simples pelo WhatsApp.",
  Smartwatches: "Smartwatches modernos com várias funções e ótimo preço na HC Tech Store. Compre pelo WhatsApp.",
  Utilidades: "Utilidades e itens práticos para casa e trabalho na HC Tech Store, com atendimento pelo WhatsApp.",
  "SSDs & Armazenamento": "SSDs SATA e NVMe de 120GB a 2TB para acelerar seu notebook ou PC. Instalação e venda na HC Tech.",
};

export const categoryList: CategoryMeta[] = categories.map((name) => ({
  name,
  slug: slugify(name),
  title:
    name === "Todos"
      ? "HC Tech Store — Acessórios, Fones e Gadgets"
      : `${name} — HC Tech Store`,
  description:
    descriptions[name] ??
    `${name} com os melhores preços na HC Tech Store. Compre pelo WhatsApp.`,
}));

export const findCategoryBySlug = (slug?: string) =>
  categoryList.find((c) => c.slug === slug);

export const getCategorySlug = (name: string) =>
  categoryList.find((c) => c.name === name)?.slug ?? slugify(name);
