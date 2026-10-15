import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatData, osNum, StatusBadge, type OS } from "@/sistema/os-shared";
import type { ClienteResumo } from "@/sistema/clientes/clientes-utils";

const PAGE_SIZE = 20;
const STATUS_OS = new Set<OS["status"]>(["pendente", "em_andamento", "aprovado", "concluida", "estoque", "devolucao", "cancelada"]);

interface Props {
  cliente: ClienteResumo | null;
  aoFechar: () => void;
}

export function ClienteOSHistory({ cliente, aoFechar }: Props) {
  const [pagina, setPagina] = useState(0);
  const clienteId = cliente?.id ?? "";
  useEffect(() => setPagina(0), [clienteId]);
  const consulta = useQuery({
    queryKey: ["sistema", "os", "cliente", clienteId, pagina],
    enabled: Boolean(clienteId),
    queryFn: async () => {
      const { data, error, count } = await supabase.from("ordens_servico")
        .select("id, numero, aparelho, defeito, status, quantidade, data_entrada, valor", { count: "exact" })
        .eq("cliente_id", clienteId).order("data_entrada", { ascending: false }).order("id", { ascending: true })
        .range(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { ordens: data ?? [], total: count ?? 0 };
    },
    staleTime: 30_000,
  });
  const totalPaginas = Math.max(1, Math.ceil((consulta.data?.total ?? 0) / PAGE_SIZE));

  return (
    <Dialog open={Boolean(cliente)} onOpenChange={(open) => { if (!open) aoFechar(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-200 bg-white text-zinc-900 sm:max-w-4xl">
        <DialogHeader><DialogTitle>Histórico de OS: {cliente?.nome ?? ""}</DialogTitle>
          <DialogDescription>{cliente?.totalOS ?? 0} OS vinculada(s); última em {formatData(cliente?.ultimaOS)}.</DialogDescription>
        </DialogHeader>
        {/* `isPending` (não `isLoading`) para uma busca PAUSADA não virar "nenhuma OS". */}
        {consulta.isPending ? <p className="py-12 text-center text-sm text-zinc-500">Carregando histórico...</p>
          : consulta.error ? <p role="alert" className="py-12 text-center text-sm text-rose-700">Não foi possível carregar o histórico: {consulta.error.message}</p>
            : consulta.data?.ordens.length ? <div className="overflow-x-auto rounded-md border border-zinc-200"><table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase text-zinc-600"><tr><th className="px-3 py-2.5">OS</th><th className="px-3 py-2.5">Entrada</th><th className="px-3 py-2.5">Aparelho</th><th className="px-3 py-2.5">Defeito</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Valor</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">{consulta.data.ordens.map((os) => {
                const status = STATUS_OS.has(os.status as OS["status"]) ? os.status as OS["status"] : "pendente";
                return <tr key={os.id} className="text-zinc-700"><td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-[#008c44]">{osNum(os.numero)}</td><td className="whitespace-nowrap px-3 py-3 text-zinc-500">{formatData(os.data_entrada)}</td><td className="px-3 py-3 font-medium text-zinc-900">{os.quantidade > 1 ? `${os.quantidade}x ` : ""}{os.aparelho}</td><td className="max-w-[200px] truncate px-3 py-3 text-zinc-500">{os.defeito || "—"}</td><td className="px-3 py-3"><StatusBadge status={status} /></td><td className="whitespace-nowrap px-3 py-3 text-right">{formatBRL(os.valor)}</td></tr>;
              })}</tbody></table></div>
              : <p className="py-12 text-center text-sm text-zinc-500">Nenhuma OS vinculada a este cliente.</p>}
        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <span className="text-xs text-zinc-500">Página {pagina + 1} de {totalPaginas}</span>
          <div className="flex gap-2"><Button type="button" variant="outline" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina((atual) => Math.max(0, atual - 1))}>Anterior</Button><Button type="button" variant="outline" disabled={pagina + 1 >= totalPaginas || consulta.isFetching} onClick={() => setPagina((atual) => atual + 1)}>Próxima</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ClienteOSHistory;
