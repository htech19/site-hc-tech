import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Boxes,
  CheckSquare,
  DollarSign,
  Download,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEstoque } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { EstoqueAlert } from "@/sistema/components/EstoqueAlert";
import { EstoqueForm } from "@/sistema/components/EstoqueForm";
import { EstoqueList } from "@/sistema/components/EstoqueList";
import { EstoqueMovimentacaoModal, type TipoMovimentacao } from "@/sistema/components/EstoqueMovimentacaoModal";
import { EstoqueAjusteEmMassaModal } from "@/sistema/components/EstoqueAjusteEmMassaModal";
import { CATEGORIAS_ESTOQUE, rotuloCategoria } from "@/sistema/data/categoriasEstoque";
import type { EstoqueItem } from "@/sistema/types";

function useDebounce<T>(valor: T, atraso = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setV(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return v;
}

type AbaTipoEstoque = "TODOS" | "COMERCIAL" | "CUSTODIA" | "MERCADO_LIVRE";

/**
 * Página Estoque — controle de aparelhos em estoque com alerta de estoque
 * baixo, busca, entrada (criação) e edição de itens.
 */
const SistemaEstoquePage = memo(function SistemaEstoquePage() {
  const consultaEstoque = useEstoque();
  const { data: itens, refetch: recarregarItens } = consultaEstoque;
  // `isPending` (e não `isLoading`) é o que impede a lista de mentir: uma
  // consulta PAUSADA por falta de conexão não é uma lista vazia.
  const { carregando, pausada, erro } = estadoDaConsulta(consultaEstoque);

  // Estados de busca e filtros
  const [aba, setAba] = useState<AbaTipoEstoque>("TODOS");
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 250);
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroProprietario, setFiltroProprietario] = useState("TODOS");
  const [filtroCanal, setFiltroCanal] = useState("TODOS");
  const [filtroSaldo, setFiltroSaldo] = useState<"TODOS" | "DISPONIVEL" | "BAIXO" | "ZERADO">("TODOS");
  const [densidade, setDensidade] = useState<"normal" | "compacta">("normal");

  // Seleção em massa (Bulk actions)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modalMassaAberto, setModalMassaAberto] = useState(false);

  // Modais de Cadastro/Edição e Movimentação
  const [modal, setModal] = useState<{ aberto: boolean; editando: EstoqueItem | null }>({
    aberto: false,
    editando: null,
  });

  const [movModal, setMovModal] = useState<{
    aberto: boolean;
    item: EstoqueItem | null;
    tipo: TipoMovimentacao;
  }>({
    aberto: false,
    item: null,
    tipo: "ENTRADA",
  });

  // Lista de proprietários e canais únicos
  const proprietariosDisponiveis = useMemo(() => {
    const set = new Set<string>(["HC TECH", "Mercado Livre", "FASTCELL"]);
    for (const i of itens ?? []) {
      if (i.proprietario) set.add(i.proprietario);
    }
    return Array.from(set).sort();
  }, [itens]);

  const canaisDisponiveis = useMemo(() => {
    const set = new Set<string>(["Loja física", "Mercado Livre"]);
    for (const i of itens ?? []) {
      if (i.canal_de_venda) set.add(i.canal_de_venda);
    }
    return Array.from(set).sort();
  }, [itens]);

  // Filtragem multi-critério
  const linhas = useMemo(() => {
    const lista = itens ?? [];
    const q = buscaDebounced.trim().toLowerCase();

    return lista.filter((i) => {
      // 1. Filtro da Aba superior
      if (aba === "COMERCIAL") {
        if (i.categoria === "aparelho_cliente" || i.categoria === "notebook") return false;
      } else if (aba === "CUSTODIA") {
        if (i.categoria !== "aparelho_cliente" && i.categoria !== "notebook") return false;
      } else if (aba === "MERCADO_LIVRE") {
        const canalML = i.canal_de_venda?.toLowerCase().includes("mercado livre");
        const donoML = i.proprietario?.toLowerCase().includes("mercado livre");
        if (!canalML && !donoML) return false;
      }

      // 2. Filtro de Categoria
      if (filtroCategoria !== "TODAS" && i.categoria !== filtroCategoria) {
        return false;
      }

      // 3. Filtro de Proprietário
      if (filtroProprietario !== "TODOS" && (i.proprietario || "HC TECH") !== filtroProprietario) {
        return false;
      }

      // 4. Filtro de Canal de Venda
      if (filtroCanal !== "TODOS" && (i.canal_de_venda || "Loja física") !== filtroCanal) {
        return false;
      }

      // 5. Filtro de Saldo
      if (filtroSaldo === "DISPONIVEL" && i.quantidade <= 1) return false;
      if (filtroSaldo === "BAIXO" && i.quantidade !== 1) return false;
      if (filtroSaldo === "ZERADO" && i.quantidade > 0) return false;

      // 6. Busca por texto livre
      if (q) {
        const campos = [
          i.aparelho,
          i.sku ?? "",
          i.marca ?? "",
          i.modelo ?? "",
          i.fornecedor ?? "",
          i.subcategoria ?? "",
          i.defeito ?? "",
          i.condicao ?? "",
          i.observacao ?? "",
          i.imeiSn ?? "",
        ];
        if (!campos.some((c) => c.toLowerCase().includes(q))) {
          return false;
        }
      }

      return true;
    });
  }, [itens, aba, filtroCategoria, filtroProprietario, filtroCanal, filtroSaldo, buscaDebounced]);

  // Indicadores / Métricas Operacionais e Financeiras (KPIs ShOficina)
  const metricas = useMemo(() => {
    const base = itens ?? [];
    const totalUnidades = base.reduce((s, i) => s + i.quantidade, 0);
    const totalSkus = base.length;
    const unidadesML = base
      .filter((i) => i.canal_de_venda?.toLowerCase().includes("mercado livre") || i.proprietario?.toLowerCase().includes("mercado livre"))
      .reduce((s, i) => s + i.quantidade, 0);
    const valorCusto = base.reduce((s, i) => s + (i.custo != null ? i.custo * i.quantidade : 0), 0);
    const valorVenda = base.reduce((s, i) => s + (i.precoVenda != null ? i.precoVenda * i.quantidade : 0), 0);
    const estoqueBaixo = base.filter((i) => i.quantidade <= 1).length;

    return {
      totalUnidades,
      totalSkus,
      unidadesML,
      valorCusto,
      valorVenda,
      estoqueBaixo,
    };
  }, [itens]);

  // Handlers de Seleção em Massa
  const alternarSelecao = useCallback((id: string) => {
    setSelecionados((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }, []);

  const selecionarTodosVisiveis = useCallback(() => {
    setSelecionados((prev) => {
      const todosJaEstao = linhas.length > 0 && linhas.every((i) => prev.has(i.id));
      if (todosJaEstao) {
        return new Set();
      }
      return new Set(linhas.map((i) => i.id));
    });
  }, [linhas]);

  const limparSelecao = useCallback(() => setSelecionados(new Set()), []);

  const itensSelecionadosLista = useMemo(() => {
    const mapa = new Map((itens ?? []).map((i) => [i.id, i]));
    return Array.from(selecionados)
      .map((id) => mapa.get(id))
      .filter((i): i is EstoqueItem => Boolean(i));
  }, [itens, selecionados]);

  // Exportação CSV dos itens filtrados
  const exportarCSV = useCallback(() => {
    if (!linhas.length) return;
    const cabecalho = ["ID", "Aparelho/Produto", "SKU", "Categoria", "Subcategoria", "Saldo", "Preco_Venda", "Custo", "Proprietario", "Canal_Venda", "Defeito_Obs"];
    const linhasCSV = linhas.map((i) => [
      `"${i.id}"`,
      `"${(i.aparelho || "").replace(/"/g, '""')}"`,
      `"${(i.sku || "").replace(/"/g, '""')}"`,
      `"${rotuloCategoria(i.categoria || "")}"`,
      `"${(i.subcategoria || "").replace(/"/g, '""')}"`,
      i.quantidade,
      i.precoVenda != null ? i.precoVenda.toFixed(2) : "",
      i.custo != null ? i.custo.toFixed(2) : "",
      `"${(i.proprietario || "").replace(/"/g, '""')}"`,
      `"${(i.canal_de_venda || "").replace(/"/g, '""')}"`,
      `"${(i.defeito || i.observacao || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [cabecalho.join(";"), ...linhasCSV.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estoque-hc-tech-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [linhas]);

  const aoNovo = useCallback(() => setModal({ aberto: true, editando: null }), []);
  const aoFechar = useCallback(() => setModal({ aberto: false, editando: null }), []);

  const aoAbrirMovimentacao = useCallback((item: EstoqueItem, tipo: TipoMovimentacao = "ENTRADA") => {
    setMovModal({ aberto: true, item, tipo });
  }, []);

  const todosVisiveisSelecionados = useMemo(
    () => linhas.length > 0 && linhas.every((i) => selecionados.has(i.id)),
    [linhas, selecionados]
  );

  return (
    <div className="space-y-4">
      {/* 1. Alerta nativo de estoque crítico */}
      <EstoqueAlert itens={itens ?? []} />

      {/* 2. KPI Cards no Topo — Padrão ShOficina / ERP Pro */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Saldo & SKUs */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-sm transition hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Itens</span>
            <Boxes size={18} className="text-[#00FF88]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-100">{metricas.totalUnidades}</span>
            <span className="text-xs text-zinc-400">unidade(s)</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {metricas.totalSkus} produtos/modelos cadastrados
          </div>
        </div>

        {/* Card 2: Mercado Livre */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-sm transition hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mercado Livre</span>
            <ShoppingCart size={18} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">{metricas.unidadesML}</span>
            <span className="text-xs text-zinc-400">un. no canal</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Itens vinculados ao Mercado Livre
          </div>
        </div>

        {/* Card 3: Valor Financeiro */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-sm transition hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Valor em Estoque</span>
            <DollarSign size={18} className="text-[#00FF88]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#00FF88]">
              {metricas.valorVenda > 0 ? `R$ ${metricas.valorVenda.toFixed(2)}` : "—"}
            </span>
            <span className="text-[10px] text-zinc-400">(venda)</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Custo: {metricas.valorCusto > 0 ? `R$ ${metricas.valorCusto.toFixed(2)}` : "A calcular"}
          </div>
        </div>

        {/* Card 4: Atenção / Reposição */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-sm transition hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Reposição Crítica</span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              {metricas.estoqueBaixo} item(ns)
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{metricas.estoqueBaixo}</span>
            <span className="text-xs text-zinc-400">com ≤ 1 un.</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Aparelhos ou peças perto de zerar
          </div>
        </div>
      </div>

      {/* 3. Abas de Classificação (Todas, Comercial, Custódia, Mercado Livre) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAba("TODOS")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              aba === "TODOS"
                ? "bg-[#00FF88] text-zinc-950 font-bold"
                : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todos ({itens?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setAba("COMERCIAL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              aba === "COMERCIAL"
                ? "bg-[#00FF88] text-zinc-950 font-bold"
                : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Peças & Revenda
          </button>
          <button
            type="button"
            onClick={() => setAba("CUSTODIA")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              aba === "CUSTODIA"
                ? "bg-[#00FF88] text-zinc-950 font-bold"
                : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Aparelhos de Clientes (OS)
          </button>
          <button
            type="button"
            onClick={() => setAba("MERCADO_LIVRE")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              aba === "MERCADO_LIVRE"
                ? "bg-amber-400 text-zinc-950 font-bold"
                : "border border-amber-500/20 bg-amber-500/5 text-amber-300 hover:border-amber-500/40"
            }`}
          >
            🛒 Mercado Livre ({metricas.unidadesML})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportarCSV}
            title="Exportar dados filtrados em CSV"
            className="border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:border-[#00FF88] hover:text-[#00FF88]"
          >
            <Download size={14} className="mr-1.5" /> CSV
          </Button>

          <Button
            onClick={aoNovo}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            <Plus size={16} className="mr-1" /> Novo Item
          </Button>
        </div>
      </div>

      {/* 4. Barra de Filtros Completos (Busca, Categoria, Proprietário, Canal, Saldo, Densidade) */}
      <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Busca textual */}
        <div className="relative lg:col-span-2">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, SKU, modelo, defeito..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none"
          />
        </div>

        {/* Categoria */}
        <div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-200 focus:border-[#00FF88] focus:outline-none"
          >
            <option value="TODAS">Todas Categorias</option>
            {CATEGORIAS_ESTOQUE.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </div>

        {/* Proprietário */}
        <div>
          <select
            value={filtroProprietario}
            onChange={(e) => setFiltroProprietario(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-200 focus:border-[#00FF88] focus:outline-none"
          >
            <option value="TODOS">Todos Proprietários</option>
            {proprietariosDisponiveis.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Canal de Venda */}
        <div>
          <select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-200 focus:border-[#00FF88] focus:outline-none"
          >
            <option value="TODOS">Todos Canais</option>
            {canaisDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Saldo / Densidade */}
        <div className="flex items-center gap-1.5">
          <select
            value={filtroSaldo}
            onChange={(e) => setFiltroSaldo(e.target.value as any)}
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-200 focus:border-[#00FF88] focus:outline-none"
          >
            <option value="TODOS">Saldo: Todos</option>
            <option value="DISPONIVEL">Disponível (&gt; 1)</option>
            <option value="BAIXO">Estoque Baixo (= 1)</option>
            <option value="ZERADO">Sem Saldo (= 0)</option>
          </select>

          <button
            type="button"
            onClick={() => setDensidade((d) => (d === "normal" ? "compacta" : "normal"))}
            title={densidade === "normal" ? "Modo compacto (ver mais linhas)" : "Modo normal"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
              densidade === "compacta"
                ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {densidade === "compacta" ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>
      </div>

      {/* 5. Barra Flutuante de Ações em Massa (Bulk Actions) */}
      {selecionados.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00FF88]/40 bg-zinc-900 px-4 py-2.5 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-[#00FF88]" />
            <span className="font-semibold text-zinc-100">
              <strong className="text-[#00FF88]">{selecionados.size}</strong> item(ns) selecionado(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setModalMassaAberto(true)}
              className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
            >
              Ajuste em Massa
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limparSelecao}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Limpar seleção
            </Button>
          </div>
        </div>
      )}

      {/* 6. Listagem Principal */}
      <EstoqueList
        linhas={linhas}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarItens()}
        aoEditar={(item) => setModal({ aberto: true, editando: item })}
        aoMovimentar={(item) => aoAbrirMovimentacao(item, "ENTRADA")}
        selecionados={selecionados}
        aoAlternarSelecao={alternarSelecao}
        aoSelecionarTodosPagina={selecionarTodosVisiveis}
        todosPaginaSelecionados={todosVisiveisSelecionados}
        densidade={densidade}
      />

      {/* 7. Modais */}
      <EstoqueForm
        aberto={modal.aberto}
        editando={modal.editando}
        aoFechar={aoFechar}
      />

      <EstoqueMovimentacaoModal
        aberto={movModal.aberto}
        item={movModal.item}
        tipoInicial={movModal.tipo}
        aoFechar={() => setMovModal({ aberto: false, item: null, tipo: "ENTRADA" })}
      />

      <EstoqueAjusteEmMassaModal
        aberto={modalMassaAberto}
        itensSelecionados={itensSelecionadosLista}
        aoFechar={() => setModalMassaAberto(false)}
        aoConcluir={limparSelecao}
      />
    </div>
  );
});

export default SistemaEstoquePage;
