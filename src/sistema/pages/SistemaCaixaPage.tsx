import { memo, useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaixa, useOS } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { useSistemaStore } from "@/sistema/store";
import { CaixaFilters } from "@/sistema/components/OSFilters";
import { CaixaForm } from "@/sistema/components/CaixaForm";
import { CaixaMovimentacaoList } from "@/sistema/components/CaixaMovimentacaoList";
import { CaixaSummary } from "@/sistema/components/CaixaSummary";

/**
 * Página Caixa/Financeiro — resumo (entradas/saídas/saldo), filtros por
 * período/tipo e registro de novas movimentações.
 */
const SistemaCaixaPage = memo(function SistemaCaixaPage() {
  const consultaCaixa = useCaixa();
  const { data: movimentos, refetch: recarregarMovimentos } = consultaCaixa;
  // `isPending` (e não `isLoading`) é o que impede a lista de mentir: uma
  // consulta PAUSADA por falta de conexão não é uma lista vazia.
  const { carregando, pausada, erro } = estadoDaConsulta(consultaCaixa);
  const filtro = useSistemaStore((s) => s.filtroCaixa);

  /** Lista de OS para vínculo opcional da movimentação. */
  const { data: os } = useOS();
  const [modalAberto, setModalAberto] = useState(false);

  /** Aplica filtros de busca/tipo/período (memoizado). */
  const linhas = useMemo(() => {
    const q = filtro.busca.trim().toLowerCase();
    return (movimentos ?? []).filter((m) => {
      if (filtro.tipo !== "TODOS" && m.tipo !== filtro.tipo) return false;
      const dia = m.data.slice(0, 10);
      if (filtro.dataInicio && dia < filtro.dataInicio) return false;
      if (filtro.dataFim && dia > filtro.dataFim) return false;
      if (!q) return true;
      return m.descricao.toLowerCase().includes(q);
    });
  }, [movimentos, filtro]);

  const aoNovo = useCallback(() => setModalAberto(true), []);
  const aoFechar = useCallback(() => setModalAberto(false), []);

  return (
    <div className="space-y-4">
      <CaixaSummary movimentos={movimentos ?? []} carregando={carregando} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <CaixaFilters />
        </div>
        <Button onClick={aoNovo} className="shrink-0 bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]">
          <Plus size={16} className="mr-1" /> Nova Movimentação
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>
          Exibindo <strong className="text-zinc-200">{linhas.length}</strong> de{" "}
          {movimentos?.length ?? 0} movimentação(ões)
        </span>
      </div>

      <CaixaMovimentacaoList
        linhas={linhas}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarMovimentos()}
      />

      <CaixaForm
        aberto={modalAberto}
        aoFechar={aoFechar}
        osVinculadas={(os ?? []).map((o) => ({ id: o.id, numero: o.numero }))}
      />
    </div>
  );
});

export default SistemaCaixaPage;
