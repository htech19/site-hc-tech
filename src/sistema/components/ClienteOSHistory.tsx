import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatData, osNum } from "@/sistema/os-shared";
import { Modal } from "./Modal";
import { OSStatusBadge } from "./OSStatusBadge";
import { CarregandoArea, EstadoVazio } from "./LoadingSpinner";
import { paraStatusUI, type Cliente } from "@/sistema/types";

function useOSPorCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["sistema", "os", clienteId ? { clienteId } : null],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, aparelho, defeito, status, quantidade, data_entrada")
        .eq("cliente_id", clienteId)
        .order("data_entrada", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((os) => ({
        ...os,
        status: paraStatusUI(os.status),
        dataEntrada: os.data_entrada,
        defeito: os.defeito ?? "-",
      }));
    },
    staleTime: 30_000,
  });
}

interface Props {
  cliente: Cliente | null;
  aoFechar: () => void;
}

/**
 * Histórico de OS de um cliente (modal).
 * Usa `useOS({ clienteId })` — o filtro vai ao servidor e usa o cache de 30s.
 */
export const ClienteOSHistory = memo(function ClienteOSHistory({
  cliente,
  aoFechar,
}: Props) {
  const { data: os, isLoading } = useOSPorCliente(cliente?.id ?? null);

  return (
    <Modal
      aberto={!!cliente}
      aoFechar={aoFechar}
      titulo={`Histórico — ${cliente?.nome ?? ""}`}
      descricao={
        cliente
          ? `${cliente.totalOS} OS · última em ${
              cliente.ultimaOS ? formatData(cliente.ultimaOS) : "—"
            }`
          : undefined
      }
      largura="max-w-3xl"
      rodape={
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88]"
        >
          Fechar
        </button>
      }
    >
      {isLoading ? (
        <CarregandoArea altura="h-48" rotulo="Carregando histórico..." />
      ) : !os || os.length === 0 ? (
        <EstadoVazio
          icone="📋"
          titulo="Nenhuma OS para este cliente"
          descricao="As ordens de serviço vinculadas aparecerão aqui."
        />
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
          {os.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-zinc-900/60 px-4 py-3 text-sm transition-colors hover:bg-[#00FF88]/[0.04]"
            >
              <span className="font-mono text-[13px] font-bold text-[#00FF88]">
                {osNum(o.numero)}
              </span>
              <span className="text-zinc-400">{formatData(o.dataEntrada)}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-zinc-100">
                {o.quantidade > 1 && (
                  <span className="mr-1 text-[#00FF88]">{o.quantidade}x</span>
                )}
                {o.aparelho}
              </span>
              <span className="hidden max-w-[40%] truncate text-xs text-zinc-500 sm:block">
                {o.defeito}
              </span>
              <OSStatusBadge status={o.status} compacto />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
});

export default ClienteOSHistory;
