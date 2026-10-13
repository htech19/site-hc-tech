import { History, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatData } from "@/sistema/os-shared";
import type { ClienteResumo } from "@/sistema/clientes/clientes-utils";

interface Props {
  linhas: ClienteResumo[];
  carregando: boolean;
  selecionados: ReadonlySet<string>;
  todosSelecionados: boolean;
  algunsSelecionados: boolean;
  operando: boolean;
  aoAlternar: (id: string, marcado: boolean) => void;
  aoAlternarPagina: (marcado: boolean) => void;
  aoEditar: (cliente: ClienteResumo) => void;
  aoVerHistorico: (cliente: ClienteResumo) => void;
  aoExcluir: (cliente: ClienteResumo) => void;
}

const CLASSE_ACAO = "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

export function ClienteList({
  linhas,
  carregando,
  selecionados,
  todosSelecionados,
  algunsSelecionados,
  operando,
  aoAlternar,
  aoAlternarPagina,
  aoEditar,
  aoVerHistorico,
  aoExcluir,
}: Props) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
            <tr>
              <th scope="col" className="w-12 px-4 py-3"><Checkbox aria-label="Selecionar clientes desta página" checked={todosSelecionados ? true : algunsSelecionados ? "indeterminate" : false} onCheckedChange={(marcado) => aoAlternarPagina(marcado === true)} /></th>
              <th scope="col" className="px-4 py-3">Cliente</th><th scope="col" className="px-4 py-3">Telefone</th>
              <th scope="col" className="px-4 py-3 text-center">Total OS</th><th scope="col" className="px-4 py-3">Última OS</th><th scope="col" className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {carregando ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Carregando clientes...</td></tr> : linhas.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Nenhum cliente encontrado.</td></tr> : linhas.map((cliente) => (
              <tr key={cliente.id} className="text-zinc-300 hover:bg-zinc-900/70">
                <td className="px-4 py-3"><Checkbox aria-label={`Selecionar ${cliente.nome}`} checked={selecionados.has(cliente.id)} onCheckedChange={(marcado) => aoAlternar(cliente.id, marcado === true)} /></td>
                <td className="max-w-[280px] px-4 py-3"><span className="block truncate font-semibold text-zinc-100">{cliente.nome}</span>{cliente.email && <span className="block truncate text-xs text-zinc-500">{cliente.email}</span>}</td>
                <td className="whitespace-nowrap px-4 py-3">{cliente.telefone || "—"}</td>
                <td className="px-4 py-3 text-center"><span className="inline-flex min-w-8 justify-center rounded border border-[#00FF88]/30 bg-[#00FF88]/10 px-2 py-0.5 text-xs font-bold text-[#00FF88]">{cliente.totalOS}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatData(cliente.ultimaOS)}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <button type="button" className={CLASSE_ACAO} title="Histórico de OS" aria-label={`Ver histórico de ${cliente.nome}`} onClick={() => aoVerHistorico(cliente)}><History size={15} /></button>
                  <button type="button" className={CLASSE_ACAO} title="Editar" aria-label={`Editar ${cliente.nome}`} onClick={() => aoEditar(cliente)}><Pencil size={15} /></button>
                  <button type="button" disabled={operando} className={`${CLASSE_ACAO} hover:border-rose-500 hover:text-rose-300`} title="Excluir" aria-label={`Excluir ${cliente.nome}`} onClick={() => aoExcluir(cliente)}><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClienteList;
