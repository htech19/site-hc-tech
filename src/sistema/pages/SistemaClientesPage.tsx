import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/integrations/supabase/sistema";
import { ClienteList } from "@/sistema/components/ClienteList";
import { ClienteForm } from "@/sistema/components/ClienteForm";
import { ClienteOSHistory } from "@/sistema/components/ClienteOSHistory";
import type { Cliente } from "@/sistema/types";

/** Debounce local de 300ms para a busca da lista. */
function useDebounce<T>(valor: T, atraso = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setV(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return v;
}

/**
 * Página Clientes — lista com busca, total de OS, última OS,
 * modal de cadastro/edição e histórico de OS.
 */
const SistemaClientesPage = memo(function SistemaClientesPage() {
  const { data: clientes, isLoading } = useClientes();

  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 300);

  const [modal, setModal] = useState<{ aberto: boolean; editando: Cliente | null }>({
    aberto: false,
    editando: null,
  });
  const [historico, setHistorico] = useState<Cliente | null>(null);

  const linhas = useMemo(() => {
    const q = buscaDebounced.trim().toLowerCase();
    const lista = clientes ?? [];
    if (!q) return lista;
    return lista.filter((c) =>
      [c.nome, c.telefone, c.email ?? ""].some((campo) => campo.toLowerCase().includes(q))
    );
  }, [clientes, buscaDebounced]);

  const aoEditar = useCallback(
    (cliente: Cliente) => setModal({ aberto: true, editando: cliente }),
    []
  );
  const aoNovo = useCallback(() => setModal({ aberto: true, editando: null }), []);
  const aoFechar = useCallback(() => setModal({ aberto: false, editando: null }), []);

  return (
    <div className="space-y-4">
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
            placeholder="Buscar por nome, telefone, e-mail..."
            aria-label="Buscar clientes"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/40"
          />
        </div>
        <Button onClick={aoNovo} className="shrink-0 bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]">
          <Plus size={16} className="mr-1" /> Novo Cliente
        </Button>
      </div>

      <ClienteList
        linhas={linhas}
        carregando={isLoading}
        aoEditar={aoEditar}
        aoVerHistorico={setHistorico}
      />

      <ClienteForm
        aberto={modal.aberto}
        editando={modal.editando}
        aoFechar={aoFechar}
      />

      <ClienteOSHistory cliente={historico} aoFechar={() => setHistorico(null)} />
    </div>
  );
});

export default SistemaClientesPage;
