/**
 * =============================================================================
 * COMPONENTE WIZARD — Nova OS / Orçamento (HC TECH)
 * Modal em tela cheia com fluxo de 2 etapas e diagnóstico inteligente.
 * =============================================================================
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ArrowLeft, ArrowRight, Check, Trash2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useOrcamentoStore, podeAvancarEtapa, type RascunhoOrcamento } from "@/sistema/store/useOrcamentoStore";
import { baseConhecimentoCausas, buscarCausasSugeridas, getSintomasComuns } from "@/sistema/data/baseConhecimentoCausas";
import type { CategoriaEquipamento, CausaProvavel, CategoriaEquipamento as Categoria } from "@/sistema/types";
import { ROTULO_CATEGORIA } from "@/sistema/types";
import { formatBRL } from "@/sistema/os-shared";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface PropsWizardNovaOS {
  onClose: () => void;
}

// -----------------------------------------------------------------------------
// CONSTANTES
// -----------------------------------------------------------------------------

const CATEGORIAS: CategoriaEquipamento[] = [
  "CELULAR",
  "NOTEBOOK",
  "DESKTOP",
  "TABLET",
  "MONITOR",
  "IMPRESSORA",
  "PERIFERICOS",
  "OUTROS",
];

// -----------------------------------------------------------------------------
// COMPONENTE WIZARD (MODAL EM TELa CHEIA)
// -----------------------------------------------------------------------------

const WizardNovaOS = ({ onClose }: PropsWizardNovaOS) => {
  const {
    etapaAtual,
    rascunho,
    avancarEtapa,
    voltarEtapa,
    setCategoria,
    setFabricante,
    setModelo,
    setQuantidade,
    setSerial,
    setObservacao,
    setDefeitoRelatado,
    setSintomaPrincipal,
    setCausaSelecionada,
    addItemOrcamento,
    updateItemOrcamento,
    removeItemOrcamento,
    setValorMaoObra,
    calcularTotalPecas,
    calcularTotalGeral,
    limparRascunho,
  } = useOrcamentoStore();

  // Controle de fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Causas sugeridas baseadas no sintoma principal
  const causasSugeridas = useMemo(() => {
    if (!rascunho.sintomaPrincipal || !rascunho.categoria) return [];
    return buscarCausasSugeridas(rascunho.categoria, rascunho.sintomaPrincipal);
  }, [rascunho.sintomaPrincipal, rascunho.categoria]);

  // Sintomas comuns para a categoria selecionada
  const sintomasDisponiveis = useMemo(() => {
    if (!rascunho.categoria) return [];
    return getSintomasComuns(rascunho.categoria);
  }, [rascunho.categoria]);

  // Total de peças
  const totalPecas = useMemo(() => calcularTotalPecas(), [rascunho.itens, calcularTotalPecas]);
  const totalGeral = useMemo(() => calcularTotalGeral(), [totalPecas, rascunho.valorMaoObra, calcularTotalGeral]);

  // Handlers para itens do orçamento
  const handleAddItem = useCallback(() => {
    addItemOrcamento({
      descricao: "",
      quantidade: 1,
      precoUnitario: 0,
    });
  }, [addItemOrcamento]);

  const handleUpdateItem = useCallback((id: string, campo: "descricao" | "quantidade" | "precoUnitario", valor: string | number) => {
    if (campo === "quantidade" || campo === "precoUnitario") {
      const num = typeof valor === "number" ? valor : parseFloat(String(valor)) || 0;
      updateItemOrcamento(id, { [campo]: num });
    } else {
      updateItemOrcamento(id, { [campo]: valor as string });
    }
  }, [updateItemOrcamento]);

  // Formata moeda para input
  const formatCurrencyInput = (value: number): string => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse moeda do input
  const parseCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/\./g, "").replace(",", ".").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // -----------------------------------------------------------------------------
  // RENDERIZAÇÃO
  // -----------------------------------------------------------------------------

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl border-2 border-[#00FF88]/20 bg-zinc-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF88]/10">
              <AlertCircle className="h-5 w-5 text-[#00FF88]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                {etapaAtual === 1 ? "Nova OS — Dados do Equipamento" : "Nova OS — Diagnóstico e Orçamento"}
              </h2>
              <p className="text-xs text-zinc-500">
                Etapa {etapaAtual} de 2
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-6 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${etapaAtual >= 1 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${etapaAtual >= 2 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
        </div>

        {/* ============================================ */}
        {/* ETAPA 1: DADOS DO EQUIPAMENTO */}
        {/* ============================================ */}
        {etapaAtual === 1 && (
          <div className="space-y-6">
            {/* 1. Categoria */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Categoria do Equipamento *
              </label>
              <Select value={rascunho.categoria ?? ""} onValueChange={(v) => setCategoria(v as CategoriaEquipamento)}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-zinc-200">
                      {ROTULO_CATEGORIA[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Fabricante e Modelo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Fabricante / Marca *
                </label>
                <Input
                  type="text"
                  value={rascunho.fabricante}
                  onChange={(e) => setFabricante(e.target.value)}
                  placeholder="Ex: Samsung, Apple, Dell..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Modelo *
                </label>
                <Input
                  type="text"
                  value={rascunho.modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: Galaxy S23, iPhone 15..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
              </div>
            </div>

            {/* 3. Quantidade e Número de Série */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Quantidade *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={rascunho.quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 1)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Número de Série (opcional)
                </label>
                <Input
                  type="text"
                  value={rascunho.serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="Ex: ABC123XYZ"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
              </div>
            </div>

            {/* 4. Observação */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Observação adicional
              </label>
              <Textarea
                value={rascunho.observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Informações adicionais sobre o equipamento..."
                className="min-h-[80px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
              />
            </div>

            {/* 5. Defeito Relatado */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Defeito Relatado *
              </label>
              <Textarea
                value={rascunho.defeito?.descricao ?? ""}
                onChange={(e) => setDefeitoRelatado({ descricao: e.target.value })}
                placeholder="Descreva o problema relatado pelo cliente..."
                className="min-h-[100px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
              />
            </div>

            {/* 6. Sintoma Principal (chips) */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-zinc-300">
                Sintoma Principal *
              </label>
              <p className="mb-3 text-xs text-zinc-500">
                Selecione o sintoma que melhor descreve o problema.
              </p>
              <div className="flex flex-wrap gap-2">
                {sintomasDisponiveis.map((sintoma, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSintomaPrincipal(sintoma)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      rascunho.sintomaPrincipal === sintoma
                        ? "bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                  >
                    {sintoma}
                  </button>
                ))}
                {sintomasDisponiveis.length === 0 && (
                  <span className="text-sm text-zinc-500">Selecione uma categoria para ver sintomas.</span>
                )}
              </div>
            </div>

            {/* Validação visual */}
            {!podeAvancarEtapa(rascunho as unknown as RascunhoOrcamento) && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Preencha todos os campos obrigatórios (*) para continuar.
                </p>
              </div>
            )}

            {/* Botões da Etapa 1 */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={avancarEtapa}
                disabled={!podeAvancarEtapa(rascunho as unknown as RascunhoOrcamento)}
                className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="mr-1 h-4 w-4" />
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ETAPA 2: DIAGNÓSTICO E ORÇAMENTO */}
        {/* ============================================ */}
        {etapaAtual === 2 && (
          <div className="space-y-6">
            {/* 1. Causas Prováveis Sugeridas */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-sm font-semibold text-zinc-300">
                  Causas Prováveis Sugeridas
                </label>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                  Diagnóstico inteligente
                </Badge>
              </div>
              <p className="mb-4 text-xs text-zinc-500">
                Selecione a causa mais provável para documentar no orçamento.
              </p>

              {causasSugeridas.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4 text-center text-sm text-zinc-500">
                  Nenhuma causa sugerida para o sintoma selecionado. Selecione um sintoma válido.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {causasSugeridas.map((causa, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCausaSelecionada(causa)}
                      className={`relative rounded-xl border p-4 text-left transition-all ${
                        rascunho.causaSelecionada?.nome === causa.nome
                          ? "border-[#00FF88]/50 bg-[#00FF88]/10 shadow-[0_0_20px_-5px_rgba(0,255,136,0.3)]"
                          : "border-zinc-800 bg-zinc-800/50 hover:border-[#00FF88]/20 hover:bg-zinc-800"
                      }`}
                    >
                      {rascunho.causaSelecionada?.nome === causa.nome && (
                        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#00FF88] text-zinc-950 text-xs font-bold shadow">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#00FF88]">
                        {causa.probabilidade}
                      </div>

                      <h4 className="font-bold text-zinc-100">{causa.nome}</h4>
                      <p className="mt-1 text-xs text-zinc-400">
                        Componente: <span className="text-zinc-300">{causa.componente}</span>
                      </p>

                      <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
                        <span className="font-medium">Testes:</span>
                        <span className="truncate">{causa.testesRecomendados[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Itens do Orçamento */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-300">
                  Itens do Orçamento
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>

              {rascunho.itens.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-6 text-center">
                  <p className="text-sm text-zinc-500">Nenhum item adicionado.</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Clique em "Adicionar Item" para incluir peças ou serviços.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-800">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          # 
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Qtd
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Preço Unit.
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {rascunho.itens.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-800/30">
                          <td className="px-4 py-2 text-xs text-zinc-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => handleUpdateItem(item.id, "descricao", e.target.value)}
                              placeholder="Descrição do item"
                              className="bg-transparent border-0 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-0 focus:ring-0"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantidade}
                              onChange={(e) => handleUpdateItem(item.id, "quantidade", parseInt(e.target.value, 10) || 1)}
                              className="w-20 bg-zinc-800 border-zinc-700 text-center text-sm text-zinc-100 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-zinc-500">R$</span>
                              <Input
                                type="text"
                                value={formatCurrencyInput(item.precoUnitario)}
                                onChange={(e) => handleUpdateItem(item.id, "precoUnitario", parseCurrencyInput(e.target.value))}
                                className="w-24 bg-zinc-800 border-zinc-700 text-right text-sm text-zinc-100 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-zinc-200">
                            {formatBRL(item.total)}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItemOrcamento(item.id)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Valores do Orçamento */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-semibold text-zinc-300">
                    Mão de Obra (R$)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">R$</span>
                    <Input
                      type="text"
                      value={formatCurrencyInput(rascunho.valorMaoObra)}
                      onChange={(e) => setValorMaoObra(parseCurrencyInput(e.target.value))}
                      className="bg-zinc-800 border-zinc-700 text-right text-sm text-zinc-100 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20 w-40"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 sm:min-w-[180px]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Total Peças:</span>
                    <span className="font-semibold text-zinc-200">{formatBRL(totalPecas)}</span>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div className="flex items-center justify-between text-base">
                    <span className="text-zinc-300 font-semibold">Total Geral:</span>
                    <span className="text-lg font-bold text-[#00FF88]">{formatBRL(totalGeral)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões da Etapa 2 */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={voltarEtapa}
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    if (rascunho.causaSelecionada) {
                      alert(`OS Finalizada!\n\nEquipamento: ${rascunho.fabricante} ${rascunho.modelo}\nCausa: ${rascunho.causaSelecionada.nome}\nTotal: ${formatBRL(totalGeral)}`);
                      limparRascunho();
                      onClose();
                    } else {
                      alert("Selecione uma causa provável antes de finalizar.");
                    }
                  }}
                  className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] font-bold"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Finalizar OS
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardNovaOS;
