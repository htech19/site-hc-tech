/**
 * =============================================================================
 * STORE DE ESTADO — Módulo Nova OS / Orçamento (HC TECH)
 * Zustand com persistência em localStorage para rascunho.
 * =============================================================================
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 * =============================================================================
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CategoriaEquipamento,
  CausaProvavel,
  DefeitoRelatado,
  Equipamento,
  ItemOrcamento,
  Prioridade,
} from "../types";

// -----------------------------------------------------------------------------
// INTERFACE DO RASCRO DEMO ORÇAMENTO
// -----------------------------------------------------------------------------

export interface RascunhoOrcamento {
  // Etapa 1: Dados do equipamento
  categoria: CategoriaEquipamento | null;
  fabricante: string;
  modelo: string;
  quantidade: number;
  serial: string;
  observacao: string;

  // Defeito relatado
  defeito: DefeitoRelatado | null;

  // Diagnóstico
  sintomaPrincipal: string;
  causaSelecionada: CausaProvavel | null;

  // Itens do orçamento
  itens: ItemOrcamento[];

  // Valores
  valorMaoObra: number;
}

// -----------------------------------------------------------------------------
// ESTADO INICIAL (rascunho vazio)
// -----------------------------------------------------------------------------

const RASCRO_VAZIO: RascunhoOrcamento = {
  categoria: null,
  fabricante: "",
  modelo: "",
  quantidade: 1,
  serial: "",
  observacao: "",
  defeito: null,
  sintomaPrincipal: "",
  causaSelecionada: null,
  itens: [],
  valorMaoObra: 0,
};

// -----------------------------------------------------------------------------
// FUNÇÕES AUXILIARES
// -----------------------------------------------------------------------------

/** Gera ID único para itens do orçamento. */
const gerarIdItem = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// -----------------------------------------------------------------------------
// STORE
// -----------------------------------------------------------------------------

interface EstadoOrcamento {
  // Estado atual
  etapaAtual: 1 | 2;
  rascunho: RascunhoOrcamento;

  // Ações - Navegação
  avancarEtapa: () => void;
  voltarEtapa: () => void;

  // Ações - Equipamento
  setEquipamento: (equipamento: Partial<Equipamento>) => void;
  setFabricante: (valor: string) => void;
  setModelo: (valor: string) => void;
  setQuantidade: (valor: number) => void;
  setSerial: (valor: string) => void;
  setObservacao: (valor: string) => void;
  setCategoria: (valor: CategoriaEquipamento | null) => void;

  // Ações - Defeito
  setDefeitoRelatado: (defeito: Partial<DefeitoRelatado>) => void;
  setSintomaPrincipal: (sintoma: string) => void;

  // Ações - Diagnóstico
  setCausaSelecionada: (causa: CausaProvavel | null) => void;

  // Ações - Itens do orçamento
  addItemOrcamento: (item: Omit<ItemOrcamento, "id">) => void;
  updateItemOrcamento: (id: string, atualizacao: Partial<ItemOrcamento>) => void;
  removeItemOrcamento: (id: string) => void;

  // Ações - Valores
  setValorMaoObra: (valor: number) => void;
  calcularTotalPecas: () => number;
  calcularTotalGeral: () => number;

  // Ações - Persistência
  salvarRascunho: () => void;
  limparRascunho: () => void;
}

export const useOrcamentoStore = create<EstadoOrcamento>()(
  persist(
    (set, get) => ({
      // ---------------------------------------------------------------------------------
      // ESTADO INICIAL
      // ---------------------------------------------------------------------------------
      etapaAtual: 1,
      rascunho: { ...RASCRO_VAZIO },

      // ---------------------------------------------------------------------------------
      // NAVEGAÇÃO
      // ---------------------------------------------------------------------------------
      avancarEtapa: () =>
        set((s) => ({
          etapaAtual: s.etapaAtual === 1 ? 2 : s.etapaAtual,
        })),

      voltarEtapa: () =>
        set((s) => ({
          etapaAtual: s.etapaAtual === 2 ? 1 : s.etapaAtual,
        })),

      // ---------------------------------------------------------------------------------
      // EQUIPAMENTO
      // ---------------------------------------------------------------------------------
      setEquipamento: (parcial) =>
        set((s) => ({
          rascunho: {
            ...s.rascunho,
            ...parcial,
            // Garante que valores numéricos são tratados corretamente
            quantidade: parcial.quantidade ?? s.rascunho.quantidade,
          },
        })),

      setCategoria: (valor) =>
        set((s) => ({
          rascunho: { ...s.rascunho, categoria: valor },
        })),

      setFabricante: (valor) =>
        set((s) => ({
          rascunho: { ...s.rascunho, fabricante: valor },
        })),

      setModelo: (valor) =>
        set((s) => ({
          rascunho: { ...s.rascunho, modelo: valor },
        })),

      setQuantidade: (valor) =>
        set((s) => ({
          rascunho: {
            ...s.rascunho,
            quantidade: Math.max(1, valor),
          },
        })),

      setSerial: (valor) =>
        set((s) => ({
          rascunho: { ...s.rascunho, serial: valor },
        })),

      setObservacao: (valor) =>
        set((s) => ({
          rascunho: { ...s.rascunho, observacao: valor },
        })),

      // ---------------------------------------------------------------------------------
      // DEFEITO RELATADO
      // ---------------------------------------------------------------------------------
      setDefeitoRelatado: (parcial) =>
        set((s) => {
          const defeitoAtual = s.rascunho.defeito ?? {
            descricao: "",
            sintomaPrincipal: "",
            dataOcorrencia: "",
            condicoesUso: "",
          };

          return {
            rascunho: {
              ...s.rascunho,
              defeito: {
                ...defeitoAtual,
                ...parcial,
                descricao: parcial.descricao ?? defeitoAtual.descricao,
              },
            },
          };
        }),

      setSintomaPrincipal: (sintoma) =>
        set((s) => ({
          rascunho: { ...s.rascunho, sintomaPrincipal: sintoma },
        })),

      // ---------------------------------------------------------------------------------
      // DIAGNÓSTICO
      // ---------------------------------------------------------------------------------
      setCausaSelecionada: (causa) =>
        set((s) => ({
          rascunho: { ...s.rascunho, causaSelecionada: causa },
        })),

      // ---------------------------------------------------------------------------------
      // ITENS DO ORÇAMENTO
      // ---------------------------------------------------------------------------------
      addItemOrcamento: (item) =>
        set((s) => ({
          rascunho: {
            ...s.rascunho,
            itens: [
              ...s.rascunho.itens,
              {
                ...item,
                id: gerarIdItem(),
                total: item.quantidade * item.precoUnitario,
              },
            ],
          },
        })),

      updateItemOrcamento: (id, atualizacao) =>
        set((s) => ({
          rascunho: {
            ...s.rascunho,
            itens: s.rascunho.itens.map((item) => {
              if (item.id !== id) return item;
              const novoTotal = (atualizacao.quantidade ?? item.quantidade) * (atualizacao.precoUnitario ?? item.precoUnitario);
              return {
                ...item,
                ...atualizacao,
                total: novoTotal,
              };
            }),
          },
        })),

      removeItemOrcamento: (id) =>
        set((s) => ({
          rascunho: {
            ...s.rascunho,
            itens: s.rascunho.itens.filter((item) => item.id !== id),
          },
        })),

      // ---------------------------------------------------------------------------------
      // VALORES
      // ---------------------------------------------------------------------------------
      setValorMaoObra: (valor) =>
        set((s) => ({
          rascunho: { ...s.rascunho, valorMaoObra: Math.max(0, valor) },
        })),

      calcularTotalPecas: () => {
        const itens = get().rascunho.itens;
        return itens.reduce((total, item) => total + (item.total ?? 0), 0);
      },

      calcularTotalGeral: () => {
        const totalPecas = get().calcularTotalPecas();
        const valorMaoObra = get().rascunho.valorMaoObra;
        return totalPecas + valorMaoObra;
      },

      // ---------------------------------------------------------------------------------
      // PERSISTÊNCIA
      // ---------------------------------------------------------------------------------
      salvarRascunho: () => {
        // O persist já salva automaticamente, mas podemos adicionar lógica extra aqui
        const estado = get();
        console.log("[Orcamento] Rascunho salvo:", estado.rascunho);
      },

      limparRascunho: () =>
        set({
          etapaAtual: 1,
          rascunho: { ...RASCRO_VAZIO },
        }),
    }),

    {
      name: "hc-tech-orcamento-rascunho",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        etapaAtual: state.etapaAtual,
        rascunho: state.rascunho,
      }),
    }
  )
);

// -----------------------------------------------------------------------------
// SELECTORES AUXILIARES
// -----------------------------------------------------------------------------

/** Retorna true se o rascunho tiver dados válidos para avançar de etapa. */
export function podeAvancarEtapa(rascunho: RascunhoOrcamento): boolean {
  // Etapa 1: valida campo mínimo
  if (!rascunho.categoria) return false;
  if (!rascunho.fabricante.trim()) return false;
  if (!rascunho.modelo.trim()) return false;
  if (!rascunho.defeito?.descricao.trim()) return false;
  if (!rascunho.sintomaPrincipal) return false;
  return true;
}

/** Retorna true se o rascunho tiver dados válidos para finalização. */
export function podeFinalizarOS(rascunho: RascunhoOrcamento): boolean {
  return podeAvancarEtapa(rascunho) && rascunho.itens.length > 0;
}
