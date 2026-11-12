/**
 * =============================================================================
 * BASE DE CONHECIMENTO — Causas Prováveis por Categoria + Sintoma
 * Módulo Nova OS / Orçamento (HC TECH)
 * =============================================================================
 * Base de conhecimento técnica para diagnóstico inteligente.
 * Mapeia CategoriaEquipamento + Sintoma -> array de CausaProvavel.
 *
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 * =============================================================================
 */

import type { CategoriaEquipamento, CausaProvavel } from "../types";

// -----------------------------------------------------------------------------
// TYPES ADICIONAIS PARA A BASE DE CONHECIMENTO
// -----------------------------------------------------------------------------

/** Entry da base de conhecimento: categoria -> sintomas comuns + causas por sintoma. */
export interface EntradaBaseConhecimento {
  sintomasComuns: string[];
  causasPorSintoma: Record<string, CausaProvavel[]>;
}

// -----------------------------------------------------------------------------
// BASE DE CONHECIMENTO
// -----------------------------------------------------------------------------

/**
 * Base de conhecimento técnica para diagnóstico inteligente.
 * Usada pelo WizardNovaOS para sugerir causas prováveis baseadas no
 * sintoma principal selecionado pelo usuário.
 */
export const baseConhecimentoCausas: Record<CategoriaEquipamento, EntradaBaseConhecimento> = {
  CELULAR: {
    sintomasComuns: [
      "Tela azulada / não liga",
      "Bateria dura pouco",
      "Tela queimada / manchas",
      "Câmera com imagens borradas",
      "Áudio baixo / sem som",
      "WiFi / dados instáveis",
      "Muitas mensagens SPAM",
      "Muitos anúncios pop-up",
    ],
    causasPorSintoma: {
      "Tela azulada / não liga": [
        {
          nome: "Falha na memória de armazenamento (IMPR)",
          componente: "Chip de armazenamento (UFS/eMMC)",
          sintomasAssociados: ["Tela azulada", "Reinicializações repentinas", "Arquivos corrompidos"],
          testesRecomendados: [
            "Executar diagnóstico de armazenamento",
            "Tentar boot em modo safe",
            "Verificar integridade de sistema com ferramenta OEM",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Curto circuito na placa-mãe",
          componente: "Placa principal (PCB)",
          sintomasAssociados: ["Liga e desliga", "Não reconhece carregador", "Cheiro de queimado"],
          testesRecomendados: [
            "Inspecionar visualmente por danos em componentes",
            "Testar com bateria e carregador conhecidos",
            "Medir continuidade nos traces principais",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Problema no conector de carregador (USB-C/Lightning)",
          componente: "Conector de energia / port USB",
          sintomasAssociados: ["Não carrega", "Carrega apenas em posição específica", "Calor na porta"],
          testesRecomendados: [
            "Limpar conector com haste isolada",
            "Testar carregamento com cabo e adaptador conhecidos",
            "Verificar se o device reconhece carga em modo airplane",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Dano na IC de energia (PMIC)",
          componente: "Gerenciador de energia (Power Management IC)",
          sintomasAssociados: ["Não liga", "Bateria não carrega", "Aquece ao ligar"],
          testesRecomendados: [
            "Verificar tensão de entrada do PMIC",
            "Testar com bateria desconectada",
            "Análise térmica com câmera infravermelha",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Falha na comunicação entre modem e processador",
          componente: "Módulo de conectividade (RF/baseband)",
          sintomasAssociados: ["Sem sinal", "Dados instáveis", "APN não salva"],
          testesRecomendados: [
            "Resetar configurações de rede",
            "Testar com SIM de outra operadora",
            "Executar diagnóstico de radiofrequência",
          ],
          probabilidade: "BAIXA",
        },
      ],
      "Bateria dura pouco": [
        {
          nome: "Degradação química da bateria (envelhecimento)",
          componente: "Bateria de íon/lítio",
          sintomasAssociados: ["Duração curta", "Inchaço", "Desliga com 20%"],
          testesRecomendados: [
            "Verificar saúde da bateria no diagnosticador",
            "Comparar ciclos de carga",
            "Medir capacidade real com carga controlada",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Falha no circuito de carregamento (charger IC)",
          componente: "Circuito de carregamento / PMIC",
          sintomasAssociados: ["Carrega devagar", "Não reconhece carregador", "Limite de carga baixo"],
          testesRecomendados: [
            "Teste com carregador original e cabo novo",
            "Verificar comunicação PMIC-bateria",
            "Monitorar consumo em repouso",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Aplicativo em segundo plano consumindo recursos",
          componente: "Software / sistema operacional",
          sintomasAssociados: ["Bateria baixa rápida", "Calor excessivo", "Desempenho lento"],
          testesRecomendados: [
            "Verificar uso de bateria nas configurações",
            "Encerrar apps em background suspeitos",
            "Reiniciar em modo safe",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Dispositivo com jailbreak/root modificado",
          componente: "Software / kernel modificado",
          sintomasAssociados: ["Bateria baixa", "Instabilidade", "Apps não conseguem acesso"],
          testesRecomendados: [
            "Verificar se o device possui unlock de bootloader",
            "Checar apps de root/jailbreak",
            "Restaurar firmware oficial",
          ],
          probabilidade: "BAIXA",
        },
        {
          nome: "Bateria com defeito de fabricação",
          componente: "Bateria (lote defeituoso)",
          sintomasAssociados: ["Balança entre alta e baixa carga", "Inchaço súbito", "Desliga em uso"],
          testesRecomendados: [
            "Comparar com outra bateria do mesmo modelo",
            "Verificar lote de fabricação",
            "Tentar bateria de reserva para teste",
          ],
          probabilidade: "MEDIA",
        },
      ],
      "Tela queimada / manchas": [
        {
          nome: "Queima por pressão excessiva (pocket burn-in)",
          componente: "LCD/OLED (painel de exibição)",
          sintomasAssociados: ["Manchas cinzas", "Pixels mortos", "Brilho irregular"],
          testesRecomendados: [
            "Executar teste de cores solidárias (white/red/black)",
            "Verificar se dano é temporário (image retention) ou permanente",
            "Testar com o fito de proteção (se houver)",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Falha no driver/controlador de tela (T-Con/LVDS)",
          componente: "Controlador de vídeo (T-Con ou flex cable)",
          sintomasAssociados: ["Distorção", "Linhas verticais", "Tela dividida em faixas"],
          testesRecomendados: [
            "Verificar flex cables de vídeo",
            "Testar com outro painel compatível",
            "Inspecionar soldas do conector de tela",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Dano mecânico por queda (impacto na área da tela)",
          componente: "Painel + vidro de proteção",
          sintomasAssociados: ["Cracks visíveis", "Tocar em pontos não funciona", "Áreas pretas"],
          testesRecomendados: [
            "Testar capacidade de toque em todas as áreas",
            "Verificar se a traseira ou estrutura também foi afetada",
            "Avaliar se há dano no digitizer",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Mancha por umidade penetrada (vazamento de condensado)",
          componente: "Painel + camada interna de adesivo",
          sintomasAssociados: ["Manchas brancas/marrom", "Empolamento", "Gotas internas"],
          testesRecomendados: [
            "Verificar selagem e caixa do dispositivo",
            "Secar pelo tempo necessário",
            "Verificar se há corrosão nas conexões",
          ],
          probabilidade: "BAIXA",
        },
      ],
      "Câmera com imagens borradas": [
        {
          nome: "Sujeira ou grime na lente externa",
          componente: "Lente de câmera (vidro externo)",
          sintomasAssociados: ["Imagens turvas", "Manchas fixas", "Brilho anormal"],
          testesRecomendados: [
            "Limpar lente com algodão e álcool isopropílico",
            "Testar tirando foto em diferentes condições de luz",
            "Comparar com outra câmera próxima",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Falha no sensor de imagem (CMOS)",
          componente: "Sensor de câmera (CMOS/CCD)",
          sintomasAssociados: ["Azul completamente", "Manchas escuras", "Câmera não abre"],
          testesRecomendados: [
            "Tentar acessar a câmera em modo seguro",
            "Verificar se o erro aparece em todas as apps",
            "Inspecionar conector do flex do sensor",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Foco automático com defeito (OIS/AF motor)",
          componente: "Mecanismo de foco (OIS/VCM)",
          sintomasAssociados: ["Foco não trava", "Zoom jitter", "Configurações de foco ignoradas"],
          testesRecomendados: [
            "Teste de foco automático em objetos estáticos",
            "Verificar se AF trava em macro",
            "Testar com app de terceiros (Camera FV-5 etc.)",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Dano por impacto na área da câmera",
          componente: "Módulo da câmera (lóbulos) + flex",
          sintomasAssociados: ["Câmera não abre", "Imagem com linhas", "Ziguezague no zoom"],
          testesRecomendados: [
            "Inspecionar visualmente por trincas na área da câmera",
            "Testar flex de camera com teste de continuidade",
            "Comparar com câmera posterior (se houver)",
          ],
          probabilidade: "BAIXA",
        },
      ],
      "Áudio baixo / sem som": [
        {
          nome: "Community speaker (caixa de som) danificada",
          componente: "Speaker interno / caixa de som",
          sintomasAssociados: ["Som baixo", "Som com chiado", "Som só de um lado"],
          testesRecomendados: [
            "Tocar áudio de teste em várias frequências",
            "Verificar se o speaker está solto ou retido na posição",
            "Comparar com outro device do mesmo modelo",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Falha no AMP de áudio (codec de som)",
          componente: "Codec de áudio / amplificador",
          sintomasAssociados: ["Sem som", "Som muito baixo", "Som distorcido"],
          testesRecomendados: [
            "Testar headset Bluetooth (se funciona, problema no speaker)",
            "Verificar driver de áudio no OS",
            "Inspecionar flex do codec",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Cabo flex da speaker/earpiece rompido ou solto",
          componente: "Flex de áudio (speaker/earpiece)",
          sintomasAssociados: ["Som intermitente", "Som ao pressionar tela", "Baixo volume do earpiece"],
          testesRecomendados: [
            "Verificar conexão do flex com pressão controlada",
            "Testar com outro flex compatível",
            "Inspecionar vias e trilhas do flex",
          ],
          probabilidade: "ALTA",
        },
      ],
      "WiFi / dados instáveis": [
        {
          nome: "Antena de radio com dano mecânico ou desconexão",
          componente: "Antena de RF (WiFi/4G/5G)",
          sintomasAssociados: ["Sinal fraco", "Perda constante", "Modem não reconhecido"],
          testesRecomendados: [
            "Verificar conexão do flex da antena",
            "Testar em diferentes posições",
            "Comparar com outro device na mesma área",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Falha na estação base / módulo de conectividade",
          componente: "Módulo RF/baseband",
          sintomasAssociados: ["Dados instáveis", "APN não salva", "Sem reconhecimento de operadora"],
          testesRecomendados: [
            "Resetar modem (power cycle)",
            "Testar com operadora diferente",
            "Executar AT commands de diagnóstico",
          ],
          probabilidade: "MEDIA",
        },
      ],
    },
  },

  NOTEBOOK: {
    sintomasComuns: [
      "Não liga / LED pisca",
      "Tela preta mas fan liga",
      "Bateria não carrega",
      "Overheat / desliga sozinho",
      "WiFi não conecta",
      "Teclado com teclas soltas",
      "USB/memória não reconhece",
      "Som de bateria/ruído no HD",
    ],
    causasPorSintoma: {
      "Não liga / LED pisca": [
        {
          nome: "Falha na fonte de alimentação (carregador/adapter)",
          componente: "Fonte / adapter DC",
          sintomasAssociados: ["Não liga na rede", "Só liga na bateria", "Bateria não carrega"],
          testesRecomendados: [
            "Testar com adaptador de especificação idêntica",
            "Medir saída do adapter com multímetro",
            "Verificar indicador de carga do notebook",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "Curto na placa-mãe (mosfet/VRM)",
          componente: "Placa principal (VRM/conexões)",
          sintomasAssociados: ["LED pisca padrão", "Cheiro de queimado", "Calor no VRM"],
          testesRecomendados: [
            "Inspecionar visual e olfativo por componentes danificados",
            "Testar com bateria desconectada",
            "Medir corrente de consumo em standby",
          ],
          probabilidade: "MEDIA",
        },
        {
          nome: "Dano no BIOS/UEFI (corrupção firmware)",
          componente: "Chip de BIOS / firmware",
          sintomasAssociados: ["LED pisca em padrão específico", "Sem POST", "Não reconhece RAM"],
          testesRecomendados: [
            "Resetar CMOS (pilha/bateria CR2032)",
            "Tentar update de BIOS via jumper/USB",
            "Verificar se o padrão de pisca é documentado pelo fabricante",
          ],
          probabilidade: "MEDIA",
        },
      ],
      "Tela preta mas fan liga": [
        {
          nome: "Falha no módulo de vídeo integrado (iGPU)",
          componente: "GPU integrada / controlador de vídeo",
          sintomasAssociados: ["Fan alta", "Sem sinal de vídeo", "Teste de memória com erro"],
          testesRecomendados: [
            "Conectar a um monitor externo (HDMI/DP)",
            "Verificar se há sinal debug (beep/LED)",
            "Testar com menos RAM (remover módulos)",
          ],
          probabilidade: "ALTA",
        },
        {
          nome: "RAM com defeito (módulo específico)",
          componente: "Módulo de memória RAM",
          sintomasAssociados: ["POST falha", "Nem sequer tenta boot", "Som de beep de memória"],
          testesRecomendados: [
            "Testar com um módulo de cada vez",
            "Tentar slots diferentes",
            "Verificar se o módulo é reconhecido no BIOS",
          ],
          probabilidade: "ALTA",
        },
      ],
      "Bateria não carrega": [
        {
          nome: "Falha no circuito de carga do EC/BCM",
          componente: "Embedded Controller / Battery Controller",
          sintomasAssociados: ["Bateria não aparece no OS", "Carrega e para", "LED de bateria off"],
          testesRecomendados: [
            "Verificar se a bateria está fisicamente conectada",
            "Testar com bateria de reserva",
            "Executar diagnóstico de bateria (fabricante)",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },

  DESKTOP: {
    sintomasComuns: [
      "Não liga (sem LED)",
      "Liga e apaga (boot loop)",
      "Tela preta / sem sinal",
      "Muitos erros de BSOD",
      "Som de beep ao ligar",
      "CPU overheating",
      "USB não funciona",
      "Soquete de memória errado",
    ],
    causasPorSintoma: {
      "Não liga (sem LED)": [
        {
          nome: "Fonte com defeito (sem saída de energia)",
          componente: "Fonte de alimentação (PSU)",
          sintomasAssociados: ["Sem LED no PC", "Sem voltagem", "Adapter quente"],
          testesRecomendados: [
            "Testar com multímetro as saídas (+12V, +5V)",
            "Tentar ATX PSU jumper test",
            "Comparar com outra fonte idêntica",
          ],
          probabilidade: "ALTA",
        },
      ],
      "Tela preta / sem sinal": [
        {
          nome: "Problema na placa de vídeo (GPU dedicada)",
          componente: "Placa de vídeo (GPU dedicada)",
          sintomasAssociados: ["Fan da GPU roda mas sem vídeo", "Sem sinal no monitor", "Erro de display"],
          testesRecomendados: [
            "Testar com VGA/DisplayPort diferente",
            "Tentar usar GPU integrada (se houver)",
            "Verificar slot PCIe e energia da placa",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },

  TABLET: {
    sintomasComuns: [
      "Tela que não responde ao toque",
      "Bateria descarrega rápido",
      "WiFi só conecta em 2.4GHz",
      "Câmera com som sem vídeo",
      "Carregamento lento",
      "Energia baixa / fan lenta",
      "Touch com áreas intermitentes",
      "Apps fecha sozinho",
    ],
    causasPorSintoma: {
      "Tela que não responde ao toque": [
        {
          nome: "Digitizer com defeito (touch layer)",
          componente: "Camada touch / digitizer",
          sintomasAssociados: ["Áreas sem resposta", "Toque fantasma", "Função de desenhar não funciona"],
          testesRecomendados: [
            "Testar com stylus ativo (caso tenha)",
            "Executar teste de touch via diagnóstico",
            "Comparar com outro tablet",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },

  MONITOR: {
    sintomasComuns: [
      "Sem imagem (preto)",
      "Imagem tremida / artefatos",
      "Backlight apagado",
      "Cores distorcidas",
      "Botões não respondem",
      "Power LED pisca",
    ],
    causasPorSintoma: {
      "Sem imagem (preto)": [
        {
          nome: "Falha no inversor/backlight (CCFL/LED)",
          componente: "Conversor de backlight / driver LED",
          sintomasAssociados: ["Imagem fraca", "Brilho zero", "Apenas reflexo"],
          testesRecomendados: [
            "Aumentar brilho máximo e verificar se há imagem",
            "Testar com outro cabo",
            "Inspecionar conector de backlight",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },

  IMPRESSORA: {
    sintomasComuns: [
      "Não comunica com PC",
      "Falta de tinta/injetora",
      "Papel preso / erro de feed",
      "Cópias com barras",
      "Headblocked (cabeçote preso)",
      "WiFi da impressora fora",
    ],
    causasPorSintoma: {
      "Não comunica com PC": [
        {
          nome: "Driver corrompido ou incompatível",
          componente: "Software / driver",
          sintomasAssociados: ["Dispositivo sem status", "PDF não imprime", "App de impressão travar"],
          testesRecomendados: [
            "Reinstalar driver oficial",
            "Testar impressão de teste via painel",
            "Verificar porta USB/porta TCP",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },

  PERIFERICOS: {
    sintomasComuns: [
      "Mouse não move",
      "Teclado com teclas travadas",
      "Webcam sem imagem",
      "Headset sem som",
      "Hub USB sem energia",
      "Extrator/leitor de cartão não lê",
    ],
    causasPorSintoma: {
      "Mouse não move": [
        {
          nome: "Falha na porta USB (porta danificada)",
          componente: "Port USB do PC/motherboard",
          sintomasAssociados: ["Mouse não reconhecido", "Outros USB também não", "Port visivelmente danificada"],
          testesRecomendados: [
            "Testar em outra porta",
            "Testar com outro mouse",
            "Verificar se a porta tem energia",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },

  OUTROS: {
    sintomasComuns: [
      "Problema elétrico / surto",
      "Dano físico por impacto",
      "Vazamento de umidade",
      "Superaquecimento",
      "Usura natural",
      "Falha de armazenamento",
      "Erro de software persistente",
      "Não especificado",
    ],
    causasPorSintoma: {
      "Problema elétrico / surto": [
        {
          nome: "Dano por surto elétrico (overvoltage)",
          componente: "Qualquer placa/circuito",
          sintomasAssociados: ["Exposto a surto", "Queda repentina", "Múltiplos componentes com dano"],
          testesRecomendados: [
            "Inspecionar todos os componentes por sinais de surto",
            "Testar com multímetro cada rail",
            "Verificar fusíveis internos",
          ],
          probabilidade: "ALTA",
        },
      ],
    },
  },
};

// -----------------------------------------------------------------------------
// FUNÇÕES DE UTILIDADE
// -----------------------------------------------------------------------------

/**
 * Busca causas prováveis sugeridas baseadas na categoria e sintoma principal.
 * Retorna no máximo 5 causas ordenadas por probabilidade.
 */
export function buscarCausasSugeridas(
  categoria: CategoriaEquipamento,
  sintoma: string
): CausaProvavel[] {
  const entrada = baseConhecimentoCausas[categoria];
  if (!entrada) return [];

  const causas = entrada.causasPorSintoma[sintoma];
  if (!causas || causas.length === 0) {
    return [];
  }

  // Ordena por probabilidade: ALTA > MEDIA > BAIXA
  const ordemProbabilidade: Record<string, number> = {
    ALTA: 3,
    MEDIA: 2,
    BAIXA: 1,
  };

  return [...causas]
    .sort((a, b) => (ordemProbabilidade[b.probabilidade ?? "BAIXA"] ?? 0) - (ordemProbabilidade[a.probabilidade ?? "BAIXA"] ?? 0))
    .slice(0, 5);
}

/**
 * Retorna os sintomas comuns para uma categoria específica.
 */
export function getSintomasComuns(categoria: CategoriaEquipamento): string[] {
  return baseConhecimentoCausas[categoria]?.sintomasComuns ?? [];
}
