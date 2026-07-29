// src/data/store-products.ts

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

const IMG = {
  fone:         "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  headphone:    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80",
  headset:      "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&q=80",
  headsetGamer: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&q=80",
  cabo:         "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  caboHdmi:     "https://images.unsplash.com/photo-1601999009162-2459b9d55a86?w=400&q=80",
  carregador:   "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80",
  veicular:     "https://images.unsplash.com/photo-1619641196980-b4c2f2d2765b?w=400&q=80",
  powerbank:    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80",
  caixa:        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80",
  teclado:      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
  mouse:        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80",
  cartao:       "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80",
  pendrive:     "https://images.unsplash.com/photo-1618410320928-25b4b1ed25e9?w=400&q=80",
  suporte:      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&q=80",
  lanterna:     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  somAuto:      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
  drone:        "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&q=80",
  camera:       "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
  smartwatch:   "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  marmita:      "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=400&q=80",
  maquina:      "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&q=80",
};

export const products: Product[] = [
  // == FONES & HEADSETS ==
  { id: 1,  name: "Fone Bluetooth KD-790",          price: "R$ 79,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth KD-790") },
  { id: 2,  name: "Fone Bluetooth KD-788",          price: "R$ 59,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth KD-788") },
  { id: 3,  name: "Fone Bluetooth Knc-4219",        price: "R$ 129,90", category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth Knc-4219") },
  { id: 4,  name: "Fone Bluetooth Knc-5601",        price: "R$ 54,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth Knc-5601") },
  { id: 5,  name: "Fone Bluetooth Knc-5602",        price: "R$ 69,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth Knc-5602") },
  { id: 6,  name: "Fone Bluetooth Knc-5603",        price: "R$ 69,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth Knc-5603") },
  { id: 7,  name: "Headphone Bluetooth KD-750",     price: "R$ 139,00", category: "Fones & Headsets", image: IMG.headphone,    whatsappUrl: generateWaLink("Headphone Bluetooth KD-750") },
  { id: 8,  name: "Headset Bluetooth Kaidi KD-752", price: "R$ 99,90",  category: "Fones & Headsets", image: IMG.headset,      whatsappUrl: generateWaLink("Headset Bluetooth Kaidi KD-752") },
  { id: 9,  name: "Headset Gamer Kaidi KD-632",     price: "R$ 199,00", category: "Fones & Headsets", image: IMG.headsetGamer, whatsappUrl: generateWaLink("Headset Gamer Kaidi KD-632") },
  { id: 10, name: "Fone Bluetooth LE-366B/362/365", price: "R$ 84,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth LE-366B/362/365") },
  { id: 11, name: "Fone Bluetooth LE-391-1",        price: "R$ 64,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth LE-391-1") },
  { id: 12, name: "Fone Bluetooth J-90 Pro",        price: "R$ 79,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth J-90 Pro") },
  { id: 13, name: "Fone de Ouvido Bluetooth P9",    price: "R$ 49,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone de Ouvido Bluetooth P9") },
  { id: 14, name: "Fone Bluetooth St-158/159",      price: "R$ 39,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth St-158/159") },
  { id: 15, name: "Fone Bluetooth ST-160",          price: "R$ 44,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone Bluetooth ST-160") },
  { id: 16, name: "Fone HD Estéreo LEF-1002",       price: "R$ 29,90",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fone HD Estéreo LEF-1002") },
  { id: 17, name: "Fone Gamer LEF-1210",            price: "R$ 139,00", category: "Fones & Headsets", image: IMG.headsetGamer, whatsappUrl: generateWaLink("Fone Gamer LEF-1210") },
  { id: 18, name: "Headset Lehmox LEF-1211",        price: "R$ 94,90",  category: "Fones & Headsets", image: IMG.headset,      whatsappUrl: generateWaLink("Headset Lehmox LEF-1211") },
  { id: 19, name: "Headset de Gatinho LEF-1058",    price: "R$ 59,90",  category: "Fones & Headsets", image: IMG.headset,      whatsappUrl: generateWaLink("Headset de Gatinho LEF-1058") },
  { id: 20, name: "Fones LEF-1217/1030/1057",       price: "R$ 15,00",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fones LEF-1217/1030/1057") },
  { id: 21, name: "Fones LE-295 / St-1020",         price: "R$ 15,00",  category: "Fones & Headsets", image: IMG.fone,         whatsappUrl: generateWaLink("Fones LE-295 / St-1020") },

  // == CABOS ==
  { id: 22, name: "Cabo Usb/V8 (2 Metros)",          price: "R$ 19,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Cabo Usb/V8 (2 Metros)") },
  { id: 23, name: "Usb/V8 Silicone",                 price: "R$ 18,00", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/V8 Silicone") },
  { id: 24, name: "Usb/V8 Comum",                    price: "R$ 15,00", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/V8 Comum") },
  { id: 25, name: "Usb/Micro (3 Metros)",             price: "R$ 24,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/Micro (3 Metros)") },
  { id: 26, name: "Usb/V8 (Reforçado)",              price: "R$ 29,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/V8 (Reforçado)") },
  { id: 27, name: "Usb/Tipo-C Silicone",             price: "R$ 18,00", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/Tipo-C Silicone") },
  { id: 28, name: "Tipo-C/Tipo-C (Simples)",         price: "R$ 18,00", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Tipo-C/Tipo-C (Simples)") },
  { id: 29, name: "Tipo-C/Tipo-C (16,00)",           price: "R$ 39,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Tipo-C/Tipo-C (16,00)") },
  { id: 30, name: "Usb/Tipo-C 2M",                   price: "R$ 24,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/Tipo-C 2M") },
  { id: 31, name: "Usb/Lightning Silicone",           price: "R$ 18,00", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/Lightning Silicone") },
  { id: 32, name: "Tipo-C/Lightning (6W)",            price: "R$ 19,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Tipo-C/Lightning (6W)") },
  { id: 33, name: "Tipo-C/Lightning (12W)",           price: "R$ 29,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Tipo-C/Lightning (12W)") },
  { id: 34, name: "Tipo-C/Lightning (17W)",           price: "R$ 44,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Tipo-C/Lightning (17W)") },
  { id: 35, name: "Usb/Lightning (13W)",              price: "R$ 34,90", category: "Cabos", image: IMG.cabo,     whatsappUrl: generateWaLink("Usb/Lightning (13W)") },
  { id: 36, name: "Cabo HDMI 5M LEY-10",             price: "R$ 39,90", category: "Cabos", image: IMG.caboHdmi, whatsappUrl: generateWaLink("Cabo HDMI 5M LEY-10") },

  // == CARREGADORES & FONTES ==
  { id: 37, name: "Fonte Duplo Usb",                 price: "R$ 24,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Fonte Duplo Usb") },
  { id: 38, name: "Fonte Saída Tipo-C",              price: "R$ 39,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Fonte Saída Tipo-C") },
  { id: 39, name: "Fonte Usb + Tipo-C",              price: "R$ 44,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Fonte Usb + Tipo-C") },
  { id: 40, name: "Carregador Rápido (12W)",         price: "R$ 34,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Carregador Rápido (12W)") },
  { id: 41, name: "Carregador Turbo T-C 17W",        price: "R$ 44,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Carregador Turbo T-C 17W") },
  { id: 42, name: "Carregador Turbo 50W T-C/T-C",    price: "R$ 39,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Carregador Turbo 50W T-C/T-C") },
  { id: 43, name: "Carregador 33W iPhone/Lightning",  price: "R$ 29,90", category: "Carregadores & Fontes", image: IMG.carregador, whatsappUrl: generateWaLink("Carregador 33W iPhone/Lightning") },
  { id: 44, name: "Carregador Veicular KD-501S",     price: "R$ 24,90", category: "Carregadores & Fontes", image: IMG.veicular,   whatsappUrl: generateWaLink("Carregador Veicular KD-501S") },
  { id: 45, name: "Veicular + Cabo Light/T-C",       price: "R$ 49,90", category: "Carregadores & Fontes", image: IMG.veicular,   whatsappUrl: generateWaLink("Veicular + Cabo Light/T-C") },

  // == POWER BANKS ==
  { id: 46, name: "Power Bank 5000mah KD-951",  price: "R$ 79,90",  category: "Power Banks", image: IMG.powerbank, whatsappUrl: generateWaLink("Power Bank 5000mah KD-951") },
  { id: 47, name: "Power Bank 10000mah KD-952", price: "R$ 95,00",  category: "Power Banks", image: IMG.powerbank, whatsappUrl: generateWaLink("Power Bank 10000mah KD-952") },
  { id: 48, name: "Power Bank 20000mah KD-922", price: "R$ 299,00", category: "Power Banks", image: IMG.powerbank, whatsappUrl: generateWaLink("Power Bank 20000mah KD-922") },
  { id: 49, name: "Power Bank 20.000mah KD-955",price: "R$ 139,00", category: "Power Banks", image: IMG.powerbank, whatsappUrl: generateWaLink("Power Bank 20.000mah KD-955") },

  // == CAIXAS DE SOM ==
  { id: 50, name: "Caixa de Som AM-552 3000W", price: "R$ 249,00", category: "Caixas de Som", image: IMG.caixa, whatsappUrl: generateWaLink("Caixa de Som AM-552 3000W") },
  { id: 51, name: "Caixa de Som KD-833",       price: "R$ 449,00", category: "Caixas de Som", image: IMG.caixa, whatsappUrl: generateWaLink("Caixa de Som KD-833") },
  { id: 52, name: "Caixa de Som Al-9999",      price: "R$ 229,00", category: "Caixas de Som", image: IMG.caixa, whatsappUrl: generateWaLink("Caixa de Som Al-9999") },
  { id: 53, name: "Caixinha de Som LES-887",   price: "R$ 29,90",  category: "Caixas de Som", image: IMG.caixa, whatsappUrl: generateWaLink("Caixinha de Som LES-887") },
  { id: 54, name: "Boombox Eletromex 50W",     price: "R$ 219,00", category: "Caixas de Som", image: IMG.caixa, whatsappUrl: generateWaLink("Boombox Eletromex 50W") },

  // == INFORMÁTICA & PERIFÉRICOS ==
  { id: 55, name: "Teclado Mecânico LEY-2080",  price: "R$ 189,00", category: "Informática & Periféricos", image: IMG.teclado,  whatsappUrl: generateWaLink("Teclado Mecânico LEY-2080") },
  { id: 56, name: "Teclado Gamer RGB LEY-2088", price: "R$ 74,90",  category: "Informática & Periféricos", image: IMG.teclado,  whatsappUrl: generateWaLink("Teclado Gamer RGB LEY-2088") },
  { id: 57, name: "Mouse a Pilha LEY-28",        price: "R$ 19,90",  category: "Informática & Periféricos", image: IMG.mouse,    whatsappUrl: generateWaLink("Mouse a Pilha LEY-28") },
  { id: 58, name: "Cartão de Memória 32GB",      price: "R$ 69,90",  category: "Informática & Periféricos", image: IMG.cartao,   whatsappUrl: generateWaLink("Cartão de Memória 32GB") },
  { id: 59, name: "Pendrive 64GB",               price: "R$ 54,90",  category: "Informática & Periféricos", image: IMG.pendrive, whatsappUrl: generateWaLink("Pendrive 64GB") },

  // == ACESSÓRIOS ==
  { id: 60, name: "Suporte Celular Carro LEY-1694", price: "R$ 29,90",  category: "Acessórios", image: IMG.suporte,  whatsappUrl: generateWaLink("Suporte Celular Carro LEY-1694") },
  { id: 61, name: "Suporte Moto LEY-2112",          price: "R$ 44,90",  category: "Acessórios", image: IMG.suporte,  whatsappUrl: generateWaLink("Suporte Moto LEY-2112") },
  { id: 62, name: "Suporte Moto/Bicicleta 1602",    price: "R$ 34,90",  category: "Acessórios", image: IMG.suporte,  whatsappUrl: generateWaLink("Suporte Moto/Bicicleta 1602") },
  { id: 63, name: "Lanterna AL-B1990",              price: "R$ 139,00", category: "Acessórios", image: IMG.lanterna, whatsappUrl: generateWaLink("Lanterna AL-B1990") },

  // == ELETRÔNICOS ==
  { id: 64, name: "Som Automotivo MP3 LEY-1920", price: "R$ 299,00", category: "Eletrônicos", image: IMG.somAuto, whatsappUrl: generateWaLink("Som Automotivo MP3 LEY-1920") },
  { id: 65, name: "Som MP5 Player LEY-2070",     price: "R$ 279,00", category: "Eletrônicos", image: IMG.somAuto, whatsappUrl: generateWaLink("Som MP5 Player LEY-2070") },
  { id: 66, name: "Drone Al-2725",               price: "R$ 279,00", category: "Eletrônicos", image: IMG.drone,   whatsappUrl: generateWaLink("Drone Al-2725") },
  { id: 67, name: "Câmera Altomex 5 Antenas",    price: "R$ 139,00", category: "Eletrônicos", image: IMG.camera,  whatsappUrl: generateWaLink("Câmera Altomex 5 Antenas") },

  // == SMARTWATCHES ==
  { id: 68, name: "Smartwatch Kw62max",      price: "R$ 259,00", category: "Smartwatches", image: IMG.smartwatch, whatsappUrl: generateWaLink("Smartwatch Kw62max") },
  { id: 69, name: "Smartwatch S10 Pro",      price: "R$ 119,00", category: "Smartwatches", image: IMG.smartwatch, whatsappUrl: generateWaLink("Smartwatch S10 Pro") },
  { id: 70, name: "Smartwatch Ultra 4 Pro",  price: "R$ 229,00", category: "Smartwatches", image: IMG.smartwatch, whatsappUrl: generateWaLink("Smartwatch Ultra 4 Pro") },

  // == UTILIDADES ==
  { id: 71, name: "Marmita Elétrica LEY-2200",   price: "R$ 129,00", category: "Utilidades", image: IMG.marmita, whatsappUrl: generateWaLink("Marmita Elétrica LEY-2200") },
  { id: 72, name: "Máquina de Cabelo Al-2927",   price: "R$ 59,90",  category: "Utilidades", image: IMG.maquina, whatsappUrl: generateWaLink("Máquina de Cabelo Al-2927") },
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
