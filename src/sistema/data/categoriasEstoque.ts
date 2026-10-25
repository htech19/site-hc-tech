/**============================================================================
 * CATEGORIAS DE ESTOQUE — catálogo completo (HC TECH)
 * ============================================================================
 * Fonte: especificação do ERP de Estoque (§2 e §4.1–§4.12 do documento de
 * evolução do módulo). TODAS as categorias e subcategorias do documento estão
 * aqui — nenhuma foi cortada ou inventada.
 *
 * Regras:
 * - `APARELHO_CLIENTE` é o fluxo atual de conserto (estoque de custódia) e os
 *   "estágios" dele vêm do §2A da especificação.
 * - Os demais 12 grupos são o estoque comercial/técnico (§4).
 * - Nenhum produto ou quantidade fictícia acompanha este catálogo: são apenas
 *   categorias/estrutura (§4, parágrafo final).
 * - Categorias novas poderão ser criadas pelo próprio sistema (Etapa 2 do
 *   plano), mantendo este arquivo como seed inicial.
 *==========================================================================*/

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BatteryCharging,
  Beaker,
  Camera,
  Cable,
  CircuitBoard,
  Fingerprint,
  Layers,
  Monitor,
  ShoppingBag,
  Smartphone,
  Volume2,
  Wrench,
} from "lucide-react";

export interface CategoriaEstoque {
  /** Valor persistido em `estoque.categoria` (slug estável). */
  valor: string;
  /** Rótulo exibido no card. */
  rotulo: string;
  /** Descrição curta exibida sob o rótulo. */
  descricao: string;
  icone: LucideIcon;
  /** `true` quando o item pertence à assistência (não é mercadoria). */
  aparelhoDeCliente?: boolean;
  /** Subcategorias completas do documento (§4.1–§4.12 ou estágios do §2A). */
  subcategorias: string[];
}

export const CATEGORIAS_ESTOQUE: CategoriaEstoque[] = [
  // -------------------------------------------------------------------------
  // §2A — Assistência técnica (custódia)
  // -------------------------------------------------------------------------
  {
    valor: "aparelho_cliente",
    rotulo: "Celular",
    descricao: "Assistência / custódia",
    icone: Smartphone,
    aparelhoDeCliente: true,
    subcategorias: [
      "Aguardando orçamento",
      "Aguardando aprovação",
      "Em manutenção",
      "Aguardando peças",
      "Em teste",
      "Pronto para retirada",
      "Aguardando devolução",
    ],
  },
  {
    valor: "notebook",
    rotulo: "Notebook",
    descricao: "Assistência / custódia",
    icone: Monitor,
    aparelhoDeCliente: true,
    subcategorias: [
      "Aguardando orçamento",
      "Aguardando aprovação",
      "Em manutenção",
      "Aguardando peças",
      "Em teste",
      "Pronto para retirada",
      "Aguardando devolução",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.1 — Acessórios para venda
  // -------------------------------------------------------------------------
  {
    valor: "acessorios",
    rotulo: "Acessórios",
    descricao: "Venda: capas, fones, cabos",
    icone: ShoppingBag,
    subcategorias: [
      "Capas",
      "Capas transparentes",
      "Capas reforçadas",
      "Capas anti-impacto",
      "Capas magnéticas",
      "Capas carteira",
      "Películas de vidro",
      "Películas de privacidade",
      "Películas hidrogel",
      "Películas 3D e 5D",
      "Cabos USB-C",
      "Cabos Lightning",
      "Cabos Micro USB",
      "Carregadores",
      "Fontes",
      "Adaptadores",
      "Fones com fio",
      "Fones Bluetooth",
      "Fones TWS",
      "Headsets",
      "Caixas de som Bluetooth",
      "Smartwatches",
      "Pulseiras de smartwatch",
      "Power banks",
      "Suportes veiculares",
      "Suportes de mesa",
      "Suportes magnéticos",
      "Pop sockets",
      "Adaptadores OTG",
      "Hubs USB",
      "Pendrives",
      "Cartões de memória",
      "Leitores de cartão",
      "Adaptadores HDMI",
      "Acessórios diversos",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.2 — Telas e displays
  // -------------------------------------------------------------------------
  {
    valor: "telas",
    rotulo: "Telas e displays",
    descricao: "LCD, OLED, touchscreen",
    icone: Monitor,
    subcategorias: [
      "LCD",
      "Incell",
      "OLED",
      "Hard OLED",
      "Soft OLED",
      "AMOLED",
      "Super AMOLED",
      "Touchscreen",
      "Frontal completo",
      "Display com aro",
      "Display sem aro",
      "Tela original",
      "Tela OEM",
      "Tela premium",
      "Tela compatível",
      "Tela recondicionada",
      "Polarizadores",
      "OCA",
      "Adesivos de display",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.3 — Baterias e alimentação
  // -------------------------------------------------------------------------
  {
    valor: "baterias",
    rotulo: "Baterias",
    descricao: "Baterias, flex e conectores",
    icone: BatteryCharging,
    subcategorias: [
      "Baterias Apple",
      "Baterias Samsung",
      "Baterias Motorola",
      "Baterias Xiaomi",
      "Baterias Redmi",
      "Baterias POCO",
      "Baterias Realme",
      "Baterias de outras marcas",
      "Baterias originais",
      "Baterias compatíveis",
      "Baterias premium",
      "Flex de bateria",
      "Conectores de bateria",
      "Adesivos de bateria",
      "Fitas de fixação",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.4 — Câmeras e componentes ópticos
  // -------------------------------------------------------------------------
  {
    valor: "cameras",
    rotulo: "Câmeras",
    descricao: "Ópticas e componentes",
    icone: Camera,
    subcategorias: [
      "Câmera frontal",
      "Câmera traseira principal",
      "Câmera ultrawide",
      "Câmera macro",
      "Câmera teleobjetiva",
      "Lentes de câmera",
      "Vidros de proteção",
      "Aros de câmera",
      "Suportes de câmera",
      "Flash LED",
      "Flex de flash",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.5 — Carcaças e estrutura
  // -------------------------------------------------------------------------
  {
    valor: "carcacas",
    rotulo: "Carcaças",
    descricao: "Estrutura, botões, gavetas",
    icone: Layers,
    subcategorias: [
      "Carcaça completa",
      "Chassis intermediário",
      "Aro lateral",
      "Tampa traseira",
      "Tampa traseira com adesivo",
      "Gaveta SIM",
      "Bandeja SIM",
      "Bandeja SIM + microSD",
      "Botão Power",
      "Botão Volume +",
      "Botão Volume -",
      "Botão Power + Volume",
      "Botão Home",
      "Botão lateral de ação",
      "Suportes internos",
      "Malhas de proteção",
      "Adesivos de vedação",
      "Borrachas",
      "Isolantes",
      "Parafusos específicos",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.6 — Flex e conectores
  // -------------------------------------------------------------------------
  {
    valor: "flex_conectores",
    rotulo: "Flex e conectores",
    descricao: "Fitas flex e conectores",
    icone: Cable,
    subcategorias: [
      "Flex Power",
      "Flex Volume",
      "Flex Power + Volume",
      "Flex de carga",
      "Flex LCD",
      "Flex de imagem",
      "Flex FPC",
      "Conector FPC",
      "Flex NFC",
      "Flex Wi-Fi",
      "Flex Bluetooth",
      "Flex de proximidade",
      "Flex auricular",
      "Flex de microfone",
      "Flex de câmera",
      "Flex de flash",
      "Flex de biometria",
      "Flex Home",
      "Flex de antena",
      "Flex de interligação de placas",
      "Placa auxiliar",
      "Dock de carga",
      "Conector USB-C",
      "Conector Lightning",
      "Conector Micro USB",
      "Conector de bateria",
      "Conector de display",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.7 — Áudio e vibração
  // -------------------------------------------------------------------------
  {
    valor: "audio_vibracao",
    rotulo: "Áudio e vibração",
    descricao: "Falantes, mics, vibracall",
    icone: Volume2,
    subcategorias: [
      "Alto-falante principal",
      "Buzzer",
      "Auricular",
      "Speaker superior",
      "Speaker inferior",
      "Microfone principal",
      "Microfone secundário",
      "Microfone de cancelamento de ruído",
      "Microfone de vídeo",
      "Vibracall",
      "Motor de vibração",
      "Flex de áudio",
      "Malhas acústicas",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.8 — Sensores e biometria
  // -------------------------------------------------------------------------
  {
    valor: "sensores_biometria",
    rotulo: "Sensores",
    descricao: "Sensores e biometria",
    icone: Fingerprint,
    subcategorias: [
      "Sensor de proximidade",
      "Sensor de luminosidade",
      "Sensor de impressão digital",
      "Botão Home com biometria",
      "Componentes de Face ID",
      "Sensor Hall",
      "Giroscópio",
      "Acelerômetro",
      "Flex de sensores",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.9 — Componentes eletrônicos e placa
  // -------------------------------------------------------------------------
  {
    valor: "componentes_placa",
    rotulo: "Componentes",
    descricao: "CIs, SMD e placas",
    icone: CircuitBoard,
    subcategorias: [
      "CI de carga",
      "CI de alimentação",
      "PMIC",
      "CI de áudio",
      "CI Wi-Fi",
      "CI Bluetooth",
      "CI de gerenciamento de energia",
      "Capacitores",
      "Resistores",
      "Bobinas",
      "Indutores",
      "Diodos",
      "Transistores",
      "Filtros",
      "Proteções ESD",
      "Conectores",
      "Componentes SMD",
      "Jumpers",
      "Fios esmaltados",
      "Placas doadoras",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.10 — Ferramentas e equipamentos
  // -------------------------------------------------------------------------
  {
    valor: "ferramentas_equipamentos",
    rotulo: "Ferramentas",
    descricao: "Oficina e bancada",
    icone: Wrench,
    subcategorias: [
      "Estação de solda",
      "Estação de ar quente",
      "Fonte assimétrica",
      "Multímetro",
      "Osciloscópio",
      "Microscópio",
      "Manta térmica",
      "Separadora de telas",
      "Laminadora",
      "Máquina de vácuo",
      "Programadores",
      "Gravadores",
      "Testadores",
      "Pinças",
      "Chaves de precisão",
      "Espátulas",
      "Ventosas",
      "Abridores",
      "Suportes de placa",
      "Cabos de teste",
      "Ferramentas de diagnóstico",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.11 — Insumos e consumíveis
  // -------------------------------------------------------------------------
  {
    valor: "insumos_consumiveis",
    rotulo: "Insumos",
    descricao: "Consumíveis e químicos",
    icone: Beaker,
    subcategorias: [
      "Álcool isopropílico",
      "Fluxo de solda",
      "Pasta de solda",
      "Estanho",
      "Malha dessoldadora",
      "Fita Kapton",
      "Fita dupla face",
      "Cola B7000",
      "Cola T7000",
      "Cola UV",
      "Resina UV",
      "Lâminas",
      "Escovas",
      "Panos de limpeza",
      "Luvas",
      "Máscaras",
      "Parafusos",
      "Adesivos",
      "Materiais de isolamento",
    ],
  },

  // -------------------------------------------------------------------------
  // §4.12 — Testes e diagnóstico
  // -------------------------------------------------------------------------
  {
    valor: "testes_diagnostico",
    rotulo: "Testes e diagnóstico",
    descricao: "Testadores, jigs, cabos",
    icone: Activity,
    subcategorias: [
      "Testadores USB",
      "Testadores de bateria",
      "Testadores de display",
      "Testadores de carga",
      "Medidores de corrente",
      "Cabos de acionamento",
      "Jigs",
      "Adaptadores de diagnóstico",
      "Placas de teste",
      "Cabos de programação",
    ],
  },
];

/** Busca uma categoria pelo valor persistido. */
export function categoriaPorValor(valor: string): CategoriaEstoque | undefined {
  return CATEGORIAS_ESTOQUE.find((c) => c.valor === valor);
}

/** Rótulo amigável de um valor de categoria (ou o próprio valor, se vazio). */
export function rotuloCategoria(valor: string | null | undefined): string {
  if (!valor) return "";
  return categoriaPorValor(valor)?.rotulo ?? valor;
}
