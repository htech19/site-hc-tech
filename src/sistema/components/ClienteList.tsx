import { Eye, History, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatData } from "@/sistema/os-shared";
import type { ClienteResumo } from "@/sistema/clientes/clientes-utils";
import { maskDoc, waUrl } from "@/sistema/clientes/utils";
import { AvisoSemConexao, EstadoErro } from "./LoadingSpinner";

interface Props {
  linhas: ClienteResumo[];
  carregando: boolean;
  /** A busca está pausada por falta de conexão (avisa em vez de esqueleto mudo). */
  pausada?: boolean;
  /** Erro da consulta — exibido no lugar do estado vazio. */
  erro?: unknown;
  /** Recarrega a consulta. */
  aoTentarNovamente?: () => void;
  selecionados: ReadonlySet<string>;
  todosSelecionados: boolean;
  algunsSelecionados: boolean;
  operando: boolean;
  aoAlternar: (id: string, marcado: boolean) => void;
  aoAlternarPagina: (marcado: boolean) => void;
  aoEditar: (cliente: ClienteResumo) => void;
  aoVisualizar: (cliente: ClienteResumo) => void;
  aoVerHistorico: (cliente: ClienteResumo) => void;
  aoExcluir: (cliente: ClienteResumo) => void;
}

const CLASSE_ACAO = "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

export function ClienteList({
  linhas,
  carregando,
  pausada,
  erro,
  aoTentarNovamente,
  selecionados,
  todosSelecionados,
  algunsSelecionados,
  operando,
  aoAlternar,
  aoAlternarPagina,
  aoEditar,
  aoVisualizar,
  aoVerHistorico,
  aoExcluir,
}: Props) {
  const checkboxState = (() => {
    if (linhas.length === 0) return false;
    if (todosSelecionados) return true;
    if (algunsSelecionados) return "indeterminate" as const;
    return false;
  })();

  return (
    <div className="overflow-hidden rounded-md border border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="bg-zinc-800 text-xs uppercase text-zinc-400">
            <tr>
              <th scope="col" className="w-12 px-4 py-3"><Checkbox disabled={operando} aria-label="Selecionar clientes desta página" checked={checkboxState} onCheckedChange={(marcado) => aoAlternarPagina(marcado === true)} /></th>
              <th scope="col" className="px-4 py-3">Cliente</th><th scope="col" className="px-4 py-3">CPF/CNPJ</th><th scope="col" className="px-4 py-3">Telefone</th><th scope="col" className="px-4 py-3">Cidade</th>
              <th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3 text-center">OS</th><th scope="col" className="px-4 py-3">Última OS</th><th scope="col" className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {carregando ? <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-500">{pausada ? <AvisoSemConexao className="mx-auto max-w-md" /> : "Carregando clientes..."}</td></tr> : erro ? <tr><td colSpan={9} className="p-0"><EstadoErro erro={erro} aoTentarNovamente={aoTentarNovamente} /></td></tr> : linhas.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-500">Nenhum cliente encontrado.</td></tr> : linhas.map((cliente) => (
              <tr key={cliente.id} className="odd:bg-zinc-950 text-zinc-300 hover:bg-zinc-800/50">
                <td className="px-4 py-3"><Checkbox disabled={operando} aria-label={`Selecionar ${cliente.nome}`} checked={selecionados.has(cliente.id)} onCheckedChange={(marcado) => aoAlternar(cliente.id, marcado === true)} /></td>
                <td className="max-w-[240px] px-4 py-3"><span className="block truncate font-semibold text-zinc-100">{cliente.nome}</span>{cliente.email && <span className="block truncate text-xs text-zinc-500">{cliente.email}</span>}</td>
                <td className="whitespace-nowrap px-4 py-3">{cliente.documento ? maskDoc(cliente.documento, cliente.tipo_pessoa) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{cliente.telefone || "—"}</td>
                <td className="max-w-[150px] truncate px-4 py-3">{[cliente.cidade, cliente.uf].filter(Boolean).join(" / ") || "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline" className={cliente.status === "ativo" ? "border-green-400/30 bg-green-400/10 text-green-400" : cliente.status === "bloqueado" ? "border-rose-400/30 bg-rose-400/10 text-rose-400" : "border-zinc-600 bg-zinc-800 text-zinc-400"}>{cliente.status}</Badge></td>
                <td className="px-4 py-3 text-center"><span className="inline-flex min-w-8 justify-center rounded border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-xs font-bold text-green-400">{cliente.totalOS}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatData(cliente.ultimaOS)}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <button type="button" disabled={operando} className={CLASSE_ACAO} title="Visualizar" aria-label={`Visualizar ${cliente.nome}`} onClick={() => aoVisualizar(cliente)}><Eye size={15} /></button>
                  <button type="button" disabled={operando || (!cliente.whatsapp && !cliente.telefone)} className={CLASSE_ACAO} title="Abrir WhatsApp" aria-label={`Conversar com ${cliente.nome} no WhatsApp`} onClick={() => window.open(waUrl(cliente.whatsapp || cliente.telefone || "", `Olá, ${cliente.nome.split(" ")[0]}! Aqui é da HC Tech.`), "_blank", "noopener,noreferrer")}><MessageCircle size={15} /></button>
                  <button type="button" disabled={operando} className={CLASSE_ACAO} title="Histórico de OS" aria-label={`Ver histórico de ${cliente.nome}`} onClick={() => aoVerHistorico(cliente)}><History size={15} /></button>
                  <button type="button" disabled={operando} className={CLASSE_ACAO} title="Editar" aria-label={`Editar ${cliente.nome}`} onClick={() => aoEditar(cliente)}><Pencil size={15} /></button>
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
