import { memo, useCallback, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevolucoes, useOS } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { DevolucaoForm } from "@/sistema/components/DevolucaoForm";
import { DevolucaoList } from "@/sistema/components/DevolucaoList";

/**
 * Página Devoluções — lista de devoluções com vínculo à OS, observações e
 * registro de novas devoluções.
 */
const SistemaDevolucoesPage = memo(function SistemaDevolucoesPage() {
  const consultaDevolucoes = useDevolucoes();
  const { data: devolucoes, refetch: recarregarDevolucoes } = consultaDevolucoes;
  // `isPending` (e não `isLoading`) é o que impede a lista de mentir: uma
  // consulta PAUSADA por falta de conexão não é uma lista vazia.
  const { carregando, pausada, erro } = estadoDaConsulta(consultaDevolucoes);
  const consultaOS = useOS();
  const { data: os } = consultaOS;
  const { carregando: carregandoOS } = estadoDaConsulta(consultaOS);

  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = devolucoes ?? [];
    if (!q) return lista;
    return lista.filter((d) =>
      [d.cliente, d.aparelho, d.defeito, d.observacao ?? "", String(d.numeroOS ?? "")].some(
        (campo) => campo.toLowerCase().includes(q)
      )
    );
  }, [devolucoes, busca]);

  const aoNovo = useCallback(() => setModalAberto(true), []);
  const aoFechar = useCallback(() => setModalAberto(false), []);

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
            placeholder="Buscar por cliente, aparelho, OS..."
            aria-label="Buscar devoluções"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/20"
          />
        </div>
        <Button
          onClick={aoNovo}
          disabled={carregandoOS || (os ?? []).length === 0}
          className="shrink-0 bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
        >
          <Plus size={16} className="mr-1" /> Registrar Devolução
        </Button>
      </div>

      <DevolucaoList
        linhas={linhas}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarDevolucoes()}
      />

      <DevolucaoForm
        aberto={modalAberto}
        aoFechar={aoFechar}
        osDisponiveis={os ?? []}
      />
    </div>
  );
});

export default SistemaDevolucoesPage;
