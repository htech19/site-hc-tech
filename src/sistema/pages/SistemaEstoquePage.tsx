import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEstoque } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { EstoqueAlert } from "@/sistema/components/EstoqueAlert";
import { EstoqueForm } from "@/sistema/components/EstoqueForm";
import { EstoqueList } from "@/sistema/components/EstoqueList";
import type { EstoqueItem } from "@/sistema/types";

function useDebounce<T>(valor: T, atraso = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setV(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return v;
}

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

  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 300);
  const [modal, setModal] = useState<{ aberto: boolean; editando: EstoqueItem | null }>({
    aberto: false,
    editando: null,
  });

  const linhas = useMemo(() => {
    const q = buscaDebounced.trim().toLowerCase();
    const lista = itens ?? [];
    if (!q) return lista;
    return lista.filter((i) =>
      [
        i.aparelho,
        i.sku ?? "",
        i.marca ?? "",
        i.modelo ?? "",
        i.fornecedor ?? "",
        i.subcategoria ?? "",
        i.defeito ?? "",
        i.condicao ?? "",
        i.observacao ?? "",
      ].some((c) => c.toLowerCase().includes(q)),
    );
  }, [itens, buscaDebounced]);

  const totalUnidades = useMemo(
    () => (itens ?? []).reduce((s, i) => s + i.quantidade, 0),
    [itens]
  );

  const aoNovo = useCallback(() => setModal({ aberto: true, editando: null }), []);
  const aoFechar = useCallback(() => setModal({ aberto: false, editando: null }), []);

  return (
    <div className="space-y-4">
      <EstoqueAlert itens={itens ?? []} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aparelho, defeito, condição..."
            aria-label="Buscar no estoque"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/20"
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-zinc-500">
            <strong className="text-[#00FF88]">{totalUnidades}</strong> unidade(s) ·{" "}
            {itens?.length ?? 0} registro(s)
          </span>
          <Button onClick={aoNovo} className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]">
            <Plus size={16} className="mr-1" /> Entrada
          </Button>
        </div>
      </div>

      <EstoqueList
        linhas={linhas}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarItens()}
        aoEditar={(item) => setModal({ aberto: true, editando: item })}
      />

      <EstoqueForm
        aberto={modal.aberto}
        editando={modal.editando}
        aoFechar={aoFechar}
      />
    </div>
  );
});

export default SistemaEstoquePage;
