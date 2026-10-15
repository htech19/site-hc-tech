/**
 * =============================================================================
 * OPÇÕES DE TIPO DE TELA — Módulo Orçamento Inteligente (HC TECH)
 * =============================================================================
 * Decide QUAIS qualidades de tela o dropdown do Wizard deve oferecer, usando
 * a Tabela de Telas 08/2026 como fonte da verdade.
 *
 * REGRAS:
 * - oferece EXATAMENTE as qualidades que existem na tabela para a marca+modelo;
 * - usa a MESMA tolerância de digitação do autocomplete e da consulta de preços
 *   (marcasTelaPorEntrada + candidatosModelo), garantindo que "se o dropdown
 *   oferece, consultarPreco() encontra";
 * - modelo fora da tabela → catálogo completo (a consulta devolverá "sujeito à
 *   avaliação técnica" e nenhum preço é inventado);
 * - função pura e sem dependência de React/UI (o preço é devolvido em número e
 *   formatado por quem renderiza).
 *
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 * =============================================================================
 */

import { TipoTela } from "../types";
import { TIPOS_TELA } from "../data/catalogos";
import {
  candidatosModelo,
  marcasTelaPorEntrada,
  normalizarTolerante,
  telas,
  type Tela,
} from "../data/telas";
import { MAPA_QUALIDADE_TELA } from "./precosService";

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

/** Uma opção do dropdown de Tipo de Tela. */
export interface OpcaoTipoTela {
  /** Valor do enum, usado no `<SelectItem value>`. */
  id: TipoTela;
  /** Nome da qualidade exatamente como na Tabela de Telas (ex.: "INCELL"). */
  nome: string;
  /** Descrição base da qualidade (texto do catálogo, sem preço). */
  descricao: string;
  /**
   * Preços REAIS da Tabela de Telas para esta qualidade neste modelo.
   * Vazio quando a opção vem do catálogo completo (fallback).
   */
  precos: number[];
}

/** Resultado do cálculo das opções para uma marca+modelo. */
export interface OpcoesTipoTelaDoModelo {
  /** Opções a exibir no dropdown. */
  opcoes: OpcaoTipoTela[];
  /**
   * Linhas reais da Tabela para o modelo. Vazio = modelo não cadastrado
   * (o chamador deve avisar "sujeito à avaliação técnica").
   */
  linhas: Tela[];
}

// -----------------------------------------------------------------------------
// CONSULTA
// -----------------------------------------------------------------------------

/**
 * Retorna as linhas REAIS da Tabela de Telas para a marca + modelo digitados,
 * com a mesma tolerância do autocomplete e da consulta de preços.
 */
export function getTelasDoModelo(marca: string, modelo: string): Tela[] {
  if (!marca.trim() || !modelo.trim()) return [];

  const marcasAlvo = new Set(marcasTelaPorEntrada(marca));
  if (marcasAlvo.size === 0) return [];

  const modelosAlvo = new Set(candidatosModelo(normalizarTolerante(modelo)));

  return telas.filter(
    (t) =>
      marcasAlvo.has(normalizarTolerante(t.marca)) &&
      modelosAlvo.has(normalizarTolerante(t.modelo))
  );
}

/** Catálogo completo (fallback quando não é possível filtrar pelo modelo). */
function catalogoCompleto(): OpcaoTipoTela[] {
  return TIPOS_TELA.map((t) => ({
    id: t.id as TipoTela,
    nome: t.nome,
    descricao: t.descricao,
    precos: [],
  }));
}

const menorPreco = (precos: number[]): number =>
  precos.length > 0 ? Math.min(...precos) : Number.POSITIVE_INFINITY;

/**
 * Monta as opções de Tipo de Tela para uma marca + modelo.
 *
 * - modelo cadastrado → apenas as qualidades existentes, ordenadas pelo menor
 *   preço real da tabela (a ordem natural da Tabela de Telas);
 * - modelo não cadastrado (ou nenhuma qualidade do catálogo correspondendo) →
 *   catálogo completo, para que o cliente ainda possa descrever a peça.
 */
export function construirOpcoesTipoTela(
  marca: string,
  modelo: string
): OpcoesTipoTelaDoModelo {
  const linhas = getTelasDoModelo(marca, modelo);
  if (linhas.length === 0) return { opcoes: catalogoCompleto(), linhas };

  // Agrupa os preços reais da tabela por qualidade (normalizada).
  const precosPorQualidade = new Map<string, number[]>();
  for (const linha of linhas) {
    const qualidade = normalizarTolerante(linha.qualidade);
    precosPorQualidade.set(qualidade, [
      ...(precosPorQualidade.get(qualidade) ?? []),
      linha.preco,
    ]);
  }

  const opcoes: OpcaoTipoTela[] = [];
  for (const tipo of TIPOS_TELA) {
    const qualidadeTabela = MAPA_QUALIDADE_TELA[tipo.id as TipoTela];
    if (!qualidadeTabela) continue;

    const precos = precosPorQualidade.get(normalizarTolerante(qualidadeTabela));
    if (!precos || precos.length === 0) continue;

    opcoes.push({
      id: tipo.id as TipoTela,
      nome: tipo.nome,
      descricao: tipo.descricao,
      precos,
    });
  }

  // Modelo localizado, mas nenhuma qualidade do catálogo correspondeu:
  // volta ao catálogo completo (a consulta devolverá "sujeito à avaliação").
  if (opcoes.length === 0) return { opcoes: catalogoCompleto(), linhas };

  opcoes.sort((a, b) => menorPreco(a.precos) - menorPreco(b.precos));
  return { opcoes, linhas };
}
