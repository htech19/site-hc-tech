/**
 * =============================================================================
 * SERVIÇO DE PRÇOS — Módulo Orçamento Inteligente (HC TECH)
 * =============================================================================
 * Camada de integração para consulta de preços.
 * Por enquanto implementa lógica mockada simulando futura API Python.
 *
 * REGRAS:
 * - NÃO inventa preços genéricos
 * - Se modelo/serviço não for encontrado, retorna "Sujeito a avaliação"
 * - TODAS AS STRINGS EM PT-BR
 * =============================================================================
 */

import { TipoTela, TipoEquipamento } from "../types";
import {
  consultarPrecoTela,
  getQualidadesDisponiveis,
  telas,
  normalizarTolerante,
  marcasTelaPorEntrada,
  candidatosModelo,
} from "../data/telas";

// -----------------------------------------------------------------------------
// TABELA DE TELAS — FONTE DA VERDADE (FASE 2)
// -----------------------------------------------------------------------------

/** Mensagem OBRIGATÓRIA quando a combinação não é encontrada (regra 3 da spec). */
export const MENSAGEM_AVALIACAO_TECNICA =
  "Solicitação sujeita à avaliação técnica. Nossa equipe confirmará o orçamento.";

/**
 * Mapa: enum TipoTela -> qualidade EXATA gravada na coluna `qualidade` da
 * Tabela de Telas 08/2026. Exportado para que o wizard ofereça exatamente as
 * qualidades que a consulta de preços é capaz de encontrar.
 */
export const MAPA_QUALIDADE_TELA: Record<TipoTela, string> = {
  [TipoTela.INC]: "INCELL",
  [TipoTela.CHI]: "CHINA",
  [TipoTela.NAC]: "NACIONAL",
  [TipoTela.OLED]: "OLED",
  [TipoTela.VIVD]: "VIVID",
  [TipoTela.JK]: "JK",
  [TipoTela.AMOLED]: "AMOLED",
  [TipoTela.DIAGNOSTICO]: "DIAGNOSTICO",
  [TipoTela.ORIGINAL]: "ORIGINAL",
  [TipoTela.PADRAO]: "PADRÃO",
  [TipoTela.TABLET]: "TABLET",
  // ATENÇÃO: a tabela atual não possui qualidade "C/A" na coluna `qualidade`
  // (o C/A aparece como SUFIXO do modelo, ex.: "A01 C/A"). A busca por "C/A"
  // não encontrará linha -> mensagem de avaliação, sem preço inventado.
  [TipoTela.CA]: "C/A",
};

// FASE 2B — normalização robusta, candidatos de modelo e resolução de marca
// (alias/prefixo) vêm de ../data/telas: a MESMA lógica usada pelo autocomplete,
// garantindo que "se o autocomplete sugeriu, a consulta encontra".

/**
 * Gera marcas candidatas: a digitada + sub-marcas deduzidas do prefixo do modelo
 * (ex.: modelo "REDMI 12" -> Redmi e Xiaomi). A marca digitada vem sempre primeiro.
 */
function marcasCandidatas(marcaNorm: string, modeloNorm: string): string[] {
  const lista = [marcaNorm].filter(Boolean);
  const add = (m: string) => {
    if (m && !lista.includes(m)) lista.push(m);
  };
  if (/^(IPHONE|APPLE)\b/.test(modeloNorm)) add("APPLE");
  if (/^(GALAXY|SAMSUNG)\b/.test(modeloNorm)) add("SAMSUNG");
  if (/^(MOTO|MOTOROLA)\b/.test(modeloNorm)) add("MOTOROLA");
  if (/^REDMI\b/.test(modeloNorm)) {
    add("REDMI");
    add("XIAOMI");
  }
  if (/^POCO\b/.test(modeloNorm)) add("POCO");
  return lista;
}

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

export type StatusPreco =
  | "SUCESSO"
  | "SUJEITO_A_AVALIACAO"
  | "NAO_ENCONTRADO"
  | "ERRO_SISTEMA";

export interface ResultadoPreco {
  status: StatusPreco;
  preco?: number | null;
  /** Espelho de `preco` no formato da interface ResultadoPreco (types.ts). */
  total?: number | null;
  mensagem: string;
  observacoes?: string[];
}

export interface ParametrosPreco {
  tipoEquipamento: TipoEquipamento;
  marca: string;
  modelo: string;
  servico: string;
  tipoTela?: TipoTela;
}

// -----------------------------------------------------------------------------
// BASE DE DADOS MOCK (SIMULA API PYTHON FUTURA)
// -----------------------------------------------------------------------------

/** Preços conhecidos para serviços específicos (somente para testes). */
const PRECOES_CONHECIDOS: Array<{
  tipoEquipamento: TipoEquipamento;
  modelo: string;
  servico: string;
  preco: number;
  observacoes?: string[];
}> = [    // Celular - Troca de Bateria
  // NOTA (FASE 2): as entradas de "tela" foram REMOVIDAS deste mock.
  // Preços de tela vêm exclusivamente da Tabela de Telas (fonte da verdade);
  // nenhum valor de tela é inventado.
  {
    tipoEquipamento: TipoEquipamento.CELULAR,
    modelo: "IPHONE 12",
    servico: "bateria",
    preco: 180.0,
    observacoes: ["Bateria original", "Inclui instalação"],
  },
  {
    tipoEquipamento: TipoEquipamento.CELULAR,
    modelo: "SAMSUNG GALAXY S21",
    servico: "bateria",
    preco: 150.0,
    observacoes: ["Bateria original", "Inclui instalação"],
  },
  // Notebook - Troca de Bateria
  {
    tipoEquipamento: TipoEquipamento.NOTEBOOK,
    modelo: "LENOVO IDEAPAD 3",
    servico: "bateria",
    preco: 280.0,
    observacoes: ["Bateria 42Wh", "Inclui instalação"],
  },
];

// -----------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL
// -----------------------------------------------------------------------------

/**
 * Consulta o preço para um determinado serviço.
 *
 * @param params - Parâmetros da consulta
 * @returns Resultado com preço ou mensagem de "sujeito a avaliação"
 */
export async function consultarPreco(
  params: ParametrosPreco
): Promise<ResultadoPreco> {
  const { tipoEquipamento, marca, modelo, servico, tipoTela } = params;

  // Normaliza para busca no mock (uppercase, sem acentos/pontuação)
  const modeloNormalizado = modelo.toUpperCase().trim().replace(/[^A-Z0-9]/g, " ");

  try {
    // ---------------------------------------------------------------------
    // SERVIÇO "TELA" — FONTE DA VERDADE: Tabela de Telas 08/2026
    // Nunca inventa preço: combinação não encontrada -> mensagem exata de
    // "sujeito a avaliação".
    // ---------------------------------------------------------------------
    if (servico === "tela") {
      if (!tipoTela) {
        return {
          status: "SUJEITO_A_AVALIACAO",
          mensagem: MENSAGEM_AVALIACAO_TECNICA,
          observacoes: ["Selecione o tipo de tela para consultar a tabela de preços."],
        };
      }

      const qualidadeTabela = MAPA_QUALIDADE_TELA[tipoTela];
      const modeloNorm = normalizarTolerante(modelo);
      // Candidatos de marca: a MESMA resolução do autocomplete (FASE 2A/2B:
      // alias "Moto"→Motorola, "Galaxy"→Samsung, prefixo etc.), somada à
      // inferência pelo prefixo digitado no modelo. Garante que tudo que o
      // autocomplete sugeriu é também encontrado aqui, sem inventar valor.
      const marcas = Array.from(
        new Set([
          ...marcasTelaPorEntrada(marca),
          ...marcasCandidatas(normalizarTolerante(marca), modeloNorm),
        ])
      );
      const modelos = candidatosModelo(modeloNorm);

      for (const marcaCandidata of marcas) {
        for (const modeloCandidato of modelos) {
          const preco = consultarPrecoTela(marcaCandidata, modeloCandidato, qualidadeTabela);
          if (preco !== null) {
            return {
              status: "SUCESSO",
              preco,
              total: preco,
              mensagem: "Preço consultado na Tabela de Telas 08/2026.",
              observacoes: [
                `Tabela de Telas 08/2026 — ${marcaCandidata} ${modeloCandidato} (${qualidadeTabela})`,
                "Valor da peça; instalação conforme política da loja.",
              ],
            };
          }
        }
      }

      // -------------------------------------------------------------------------
      // FASE 3A — sufixo C/A (conjunto com aro)
      // Na tabela, o C/A aparece como SUFIXO DO MODELO (ex.: "E13 C/A") e não
      // como valor da coluna `qualidade`. Quando o usuário escolhe C/A, além
      // da busca normal, tentamos o modelo com o sufixo " C/A". Só retornamos
      // preço quando a combinação é INEQUÍVOCA na tabela (linha real única);
      // havendo preços distintos para o mesmo "X C/A", não escolhemos por conta
      // própria -> avaliação técnica, sem inventar valor.
      if (tipoTela === TipoTela.CA) {
        // Candidatos: "E13" -> "E13 C/A"; se o cliente já digitou "E13 C/A",
        // usamos o modelo como está.
        const modelosCA = Array.from(
          new Set(modelos.flatMap((m) => (m.endsWith("C/A") ? [m] : [`${m} C/A`])))
        );
        for (const marcaCandidata of marcas) {
          for (const modeloCA of modelosCA) {
            const linhas = telas.filter(
              (t) =>
                normalizarTolerante(t.marca) === marcaCandidata &&
                normalizarTolerante(t.modelo) === modeloCA
            );
            if (linhas.length === 0) continue;

            const precosDistintos = Array.from(new Set(linhas.map((l) => l.preco)));
            if (precosDistintos.length === 1) {
              const preco = precosDistintos[0];
              return {
                status: "SUCESSO",
                preco,
                total: preco,
                mensagem: "Preço consultado na Tabela de Telas 08/2026.",
                observacoes: [
                  "Modelo com conjunto (C/A) identificado na Tabela de Telas.",
                  `Tabela de Telas: ${marcaCandidata} ${modeloCA} — ${Array.from(new Set(linhas.map((l) => l.qualidade))).join(", ")}.`,
                  "Valor da peça; instalação conforme política da loja.",
                ],
              };
            }

            // Múltiplos preços reais para o mesmo modelo C/A: impossível
            // escolher sem inventar -> lista as opções reais e avalia.
            return {
              status: "SUJEITO_A_AVALIACAO",
              mensagem: MENSAGEM_AVALIACAO_TECNICA,
              observacoes: [
                `Modelo com conjunto (C/A) localizado (${marcaCandidata} ${modeloCA}) com qualidades distintas: ${linhas
                  .map((l) => `${l.qualidade}: R$ ${l.preco.toFixed(2)}`)
                  .join("; ")}.`,
                "Nossa equipe confirmará a qualidade exata no orçamento final.",
              ],
            };
          }
        }
      }

      // Não encontrado -> mensagem EXATA, sem inventar valor.
      const disponiveis = getQualidadesDisponiveis(marca, modelo);
      return {
        status: "SUJEITO_A_AVALIACAO",
        mensagem: MENSAGEM_AVALIACAO_TECNICA,
        observacoes: [
          `Combinação "${marca}" + "${modelo}" + "${qualidadeTabela}" não localizada na Tabela de Telas.`,
          disponiveis.length > 0
            ? `Qualidades disponíveis para este modelo: ${disponiveis.join(", ")}.`
            : "Modelo não localizado na Tabela de Telas.",
        ].filter(Boolean),
      };
    }

    // ---------------------------------------------------------------------
    // Demais serviços — banco mock (simula futura API Python)
    // ---------------------------------------------------------------------
    // Busca no banco de dados mock
    const encontrado = PRECOES_CONHECIDOS.find(
      (p) =>
        p.tipoEquipamento === tipoEquipamento &&
        p.modelo.toUpperCase() === modeloNormalizado &&
        p.servico === servico
    );

    if (encontrado) {
      return {
        status: "SUCESSO",
        preco: encontrado.preco,
        total: encontrado.preco,
        mensagem: "Preço consultado com sucesso.",
        observacoes: encontrado.observacoes,
      };
    }

    // Modelo/serviço não encontrado - devolve sujeito a avaliação
    return {
      status: "SUJEITO_A_AVALIACAO",
      mensagem: MENSAGEM_AVALIACAO_TECNICA,
      observacoes: [
        `Modelo "${modelo}" não encontrado no catálogo de preços.`,
        `Marca "${marca}" - tipo "${tipoEquipamento}" - serviço "${servico}"`,
        tipoTela ? `Tipo de tela: ${MAPA_QUALIDADE_TELA[tipoTela]}` : undefined,
      ].filter(Boolean),
    };
  } catch (erro) {
    return {
      status: "ERRO_SISTEMA",
      mensagem: "Erro ao consultar preço. Tente novamente mais tarde.",
    };
  }
}

/**
 * Gera um protocolo de solicitação único.
 * Formato: ORC-{timestamp}
 */
export function gerarProtocoloSolicitacao(): string {
  const timestamp = Date.now();
  return `ORC-${timestamp}`;
}
