export interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  whatsappUrl: string;
}

const SEU_NUMERO = "5511940562933";

const generateWaLink = (productName: string) =>
  `https://wa.me/${SEU_NUMERO}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${productName}`)}`;

// 🔥 Função automática (NÃO PRECISA MAIS ESCREVER MANUAL)
const img = (nome: string) => `/images/produtos/${nome}.jpg`;

export const products: Product[] = [
  // FONES
  { id: 1, name: "Fone Bluetooth KD-790", price: "R$ 79,90", category: "Fones & Headsets", image: img("fone-kd-790"), whatsappUrl: generateWaLink("Fone Bluetooth KD-790") },
  { id: 2, name: "Fone Bluetooth KD-788", price: "R$ 59,90", category: "Fones & Headsets", image: img("fone-kd-788"), whatsappUrl: generateWaLink("Fone Bluetooth KD-788") },
  { id: 3, name: "Fone Bluetooth Knc-4219", price: "R$ 129,90", category: "Fones & Headsets", image: img("fone-knc-4219"), whatsappUrl: generateWaLink("Fone Bluetooth Knc-4219") },
  { id: 4, name: "Fone Bluetooth Knc-5601", price: "R$ 54,90", category: "Fones & Headsets", image: img("fone-knc-5601"), whatsappUrl: generateWaLink("Fone Bluetooth Knc-5601") },
  { id: 5, name: "Fone Bluetooth Knc-5602", price: "R$ 69,90", category: "Fones & Headsets", image: img("fone-knc-5602"), whatsappUrl: generateWaLink("Fone Bluetooth Knc-5602") },

  // CABOS
  { id: 22, name: "Cabo Usb/V8 (2 Metros)", price: "R$ 19,90", category: "Cabos", image: img("cabo-usb-v8-2m"), whatsappUrl: generateWaLink("Cabo Usb/V8 (2 Metros)") },
  { id: 23, name: "Usb/V8 Silicone", price: "R$ 18,00", category: "Cabos", image: img("cabo-usb-v8-silicone"), whatsappUrl: generateWaLink("Usb/V8 Silicone") },
  { id: 24, name: "Usb/V8 Comum", price: "R$ 15,00", category: "Cabos", image: img("cabo-usb-v8-comum"), whatsappUrl: generateWaLink("Usb/V8 Comum") },

  // CARREGADORES
  { id: 40, name: "Carregador Rápido (12W)", price: "R$ 34,90", category: "Carregadores & Fontes", image: img("carregador-12w"), whatsappUrl: generateWaLink("Carregador Rápido (12W)") },
  { id: 41, name: "Carregador Turbo T-C 17W", price: "R$ 44,90", category: "Carregadores & Fontes", image: img("carregador-turbo-17w"), whatsappUrl: generateWaLink("Carregador Turbo T-C 17W") },

  // POWER BANK
  { id: 47, name: "Power Bank 10000mah KD-952", price: "R$ 95,00", category: "Power Banks", image: img("powerbank-10000mah"), whatsappUrl: generateWaLink("Power Bank 10000mah KD-952") },

  // CAIXA DE SOM
  { id: 50, name: "Caixa de Som AM-552 3000W", price: "R$ 249,00", category: "Caixas de Som", image: img("caixa-som-am552"), whatsappUrl: generateWaLink("Caixa de Som AM-552 3000W") },

  // INFORMÁTICA
  { id: 55, name: "Teclado Mecânico LEY-2080", price: "R$ 189,00", category: "Informática & Periféricos", image: img("teclado-ley-2080"), whatsappUrl: generateWaLink("Teclado Mecânico LEY-2080") },

  // SMARTWATCH
  { id: 68, name: "Smartwatch Kw62max", price: "R$ 259,00", category: "Smartwatches", image: img("smartwatch-kw62max"), whatsappUrl: generateWaLink("Smartwatch Kw62max") },

  // UTILIDADES
  { id: 71, name: "Marmita Elétrica LEY-2200", price: "R$ 129,00", category: "Utilidades", image: img("marmita-eletrica"), whatsappUrl: generateWaLink("Marmita Elétrica LEY-2200") },
];

export const categories = [
  "Todos",
  "Fones & Headsets",
  "Cabos",
  "Carregadores & Fontes",
  "Power Banks",
  "Caixas de Som",
  "Informática & Periféricos",
  "Acessórios",
  "Eletrônicos",
  "Smartwatches",
  "Utilidades",
];
