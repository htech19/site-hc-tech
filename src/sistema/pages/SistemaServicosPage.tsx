import { memo, useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTiposServico } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { ServicoForm } from "@/sistema/components/ServicoForm";
import { ServicoList } from "@/sistema/components/ServicoList";
import type { TipoServico } from "@/sistema/types";

/**
 * Página Serviços — tipos de serviço cadastráveis com contador de realizações
 * (derivado dos defeitos das OS). Rota: /sistema/tipos-servico.
 */
const SistemaServicosPage = memo(function SistemaServicosPage() {
  const consultaServicos = useTiposServico();
  const { data: servicos, refetch: recarregarServicos } = consultaServicos;
  // `isPending` (e não `isLoading`) é o que impede a lista de mentir: uma
  // consulta PAUSADA por falta de conexão não é uma lista vazia.
  const { carregando, pausada, erro } = estadoDaConsulta(consultaServicos);
  const [modal, setModal] = useState<{ aberto: boolean; editando: TipoServico | null }>({
    aberto: false,
    editando: null,
  });

  const totalRealizados = useMemo(
    () => (servicos ?? []).reduce((s, t) => s + t.quantidadeRealizada, 0),
    [servicos]
  );

  const aoNovo = useCallback(() => setModal({ aberto: true, editando: null }), []);
  const aoFechar = useCallback(() => setModal({ aberto: false, editando: null }), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          <strong className="text-[#00FF88]">{servicos?.length ?? 0}</strong> tipo(s)
          cadastrado(s) ·{" "}
          <strong className="text-[#00FF88]">{totalRealizados}</strong> realização(ões)
          registradas em OS
        </p>
        <Button onClick={aoNovo} className="shrink-0 bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]">
          <Plus size={16} className="mr-1" /> Novo Serviço
        </Button>
      </div>

      <ServicoList
        linhas={servicos ?? []}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarServicos()}
        aoEditar={(servico) => setModal({ aberto: true, editando: servico })}
      />

      <ServicoForm
        aberto={modal.aberto}
        editando={modal.editando}
        aoFechar={aoFechar}
      />
    </div>
  );
});

export default SistemaServicosPage;
