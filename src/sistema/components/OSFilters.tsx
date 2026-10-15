import { memo, useEffect, useState } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { FormInput, FormSelect } from "./FormInput";
import { LISTA_STATUS } from "./OSStatusBadge";
import { useSistemaStore, type FiltroCaixa } from "@/sistema/store";
import type { FiltroOS, StatusOS } from "@/sistema/types";

/** Hook de debounce (300ms) — evita filtrar a cada tecla digitada. */
function useDebounce<T>(valor: T, atraso = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setV(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return v;
}

interface Props {
  clientes: { id: string; nome: string }[];
  /** Exibe o seletor de período (usado em relatórios). */
  comPeriodo?: boolean;
}

/**
 * Barra de filtros da listagem de OS: busca (com debounce), status e cliente.
 * O estado vive na store (`filtroOS`) para persistir entre navegações.
 */
export const OSFilters = memo(function OSFilters({ clientes, comPeriodo }: Props) {
  const filtro = useSistemaStore((s) => s.filtroOS);
  const definir = useSistemaStore((s) => s.definirFiltroOS);
  const limpar = useSistemaStore((s) => s.limparFiltroOS);

  const [buscaLocal, setBuscaLocal] = useState(filtro.busca);
  const buscaDebounced = useDebounce(buscaLocal, 300);

  useEffect(() => {
    if (buscaDebounced !== filtro.busca) definir({ busca: buscaDebounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced]);

  const opcoesCliente = [
    { valor: "TODOS", rotulo: "Todos os Clientes" },
    ...clientes.map((c) => ({ valor: c.id, rotulo: c.nome })),
  ];

  const temFiltro =
    filtro.busca !== "" || filtro.status !== "TODOS" || filtro.clienteId !== "TODOS";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 lg:flex-row lg:items-end">
      <div className="flex-1 min-w-[180px]">
        <FormInput
          label="Buscar"
          placeholder="OS, aparelho, cliente, defeito..."
          valor={buscaLocal}
          aoMudar={setBuscaLocal}
          className="[&_label]:sr-only"
        />
        <div className="pointer-events-none -mt-[34px] mb-[6px] ml-2 inline-block">
          <Search size={14} className="text-zinc-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-none">
        <FormSelect
          label="Status"
          valor={filtro.status}
          aoMudar={(v) => definir({ status: v as StatusOS | "TODOS" })}
          opcoes={[{ valor: "TODOS", rotulo: "Todos os Status" }, ...LISTA_STATUS]}
          className="lg:w-48 [&_label]:sr-only"
        />
        <FormSelect
          label="Cliente"
          valor={filtro.clienteId}
          aoMudar={(v) => definir({ clienteId: v })}
          opcoes={opcoesCliente}
          className="lg:w-52 [&_label]:sr-only"
        />
        {comPeriodo && (
          <>
            <FormInput
              label="De"
              tipo="date"
              valor={filtro.dataInicio ?? ""}
              aoMudar={(v) => definir({ dataInicio: v })}
              className="lg:w-40 [&_label]:sr-only"
            />
            <FormInput
              label="Até"
              tipo="date"
              valor={filtro.dataFim ?? ""}
              aoMudar={(v) => definir({ dataFim: v })}
              className="lg:w-40 [&_label]:sr-only"
            />
          </>
        )}
      </div>

      {temFiltro && (
        <button
          type="button"
          onClick={() => {
            setBuscaLocal("");
            limpar();
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88]"
        >
          <RotateCcw size={13} /> Limpar
        </button>
      )}

      <span className="hidden items-center gap-1 text-xs text-zinc-600 lg:flex">
        <Filter size={12} /> filtros ativos
      </span>
    </div>
  );
});

/** Filtros do caixa: busca, tipo e período. */
export const CaixaFilters = memo(function CaixaFilters() {
  const filtro = useSistemaStore((s) => s.filtroCaixa) as FiltroCaixa;
  const definir = useSistemaStore((s) => s.definirFiltroCaixa);
  const [buscaLocal, setBuscaLocal] = useState(filtro.busca);
  const buscaDebounced = useDebounce(buscaLocal, 300);

  useEffect(() => {
    if (buscaDebounced !== filtro.busca) definir({ busca: buscaDebounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 lg:flex-row lg:items-end">
      <div className="flex-1 min-w-[180px]">
        <FormInput
          label="Buscar"
          placeholder="Descrição da movimentação..."
          valor={buscaLocal}
          aoMudar={setBuscaLocal}
          className="[&_label]:sr-only"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormSelect
          label="Tipo"
          valor={filtro.tipo}
          aoMudar={(v) => definir({ tipo: v as FiltroCaixa["tipo"] })}
          opcoes={[
            { valor: "TODOS", rotulo: "Entradas e Saídas" },
            { valor: "ENTRADA", rotulo: "Somente Entradas" },
            { valor: "SAIDA", rotulo: "Somente Saídas" },
          ]}
          className="lg:w-48 [&_label]:sr-only"
        />
        <FormInput
          label="De"
          tipo="date"
          valor={filtro.dataInicio ?? ""}
          aoMudar={(v) => definir({ dataInicio: v })}
          className="lg:w-40 [&_label]:sr-only"
        />
        <FormInput
          label="Até"
          tipo="date"
          valor={filtro.dataFim ?? ""}
          aoMudar={(v) => definir({ dataFim: v })}
          className="lg:w-40 [&_label]:sr-only"
        />
      </div>
    </div>
  );
});

export type { FiltroOS };
