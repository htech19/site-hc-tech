import { ExternalLink, History, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatData } from "@/sistema/os-shared";
import type { ClienteResumo } from "@/sistema/clientes/clientes-utils";
import { maskDoc, waUrl } from "@/sistema/clientes/utils";

interface Props {
  cliente: ClienteResumo | null;
  aoFechar: () => void;
  aoEditar: (cliente: ClienteResumo) => void;
  aoVerHistorico: (cliente: ClienteResumo) => void;
}

function Item({ rotulo, valor }: { rotulo: string; valor: string | number | null | undefined }) {
  const vazio = valor === null || valor === undefined || valor === "";
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase text-zinc-500">{rotulo}</dt><dd className="mt-1 break-words text-sm text-zinc-900">{vazio ? "—" : valor}</dd></div>;
}

export function ClienteDetailsDialog({ cliente, aoFechar, aoEditar, aoVerHistorico }: Props) {
  const endereco = cliente ? [cliente.endereco, cliente.numero, cliente.complemento, cliente.bairro].filter(Boolean).join(", ") : "";
  const cidade = cliente ? [cliente.cidade, cliente.uf, cliente.cep].filter(Boolean).join(" / ") : "";

  return (
    <Dialog open={Boolean(cliente)} onOpenChange={(open) => { if (!open) aoFechar(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-200 bg-white text-zinc-900 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cliente?.nome}</DialogTitle>
          <DialogDescription>Cadastro completo do cliente e resumo do histórico de atendimento.</DialogDescription>
        </DialogHeader>
        {cliente && <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Item rotulo="Tipo" valor={cliente.tipo_pessoa === "PJ" ? "Pessoa jurídica" : "Pessoa física"} />
          <Item rotulo="Status" valor={cliente.status} />
          <Item rotulo={cliente.tipo_pessoa === "PJ" ? "CNPJ" : "CPF"} valor={cliente.documento ? maskDoc(cliente.documento, cliente.tipo_pessoa) : null} />
          <Item rotulo={cliente.tipo_pessoa === "PJ" ? "Inscrição estadual" : "RG"} valor={cliente.rg_ie} />
          {cliente.tipo_pessoa === "PJ" && <Item rotulo="Nome fantasia" valor={cliente.nome_fantasia} />}
          <Item rotulo="Telefone" valor={cliente.telefone} />
          <Item rotulo="Telefone secundário" valor={cliente.telefone2} />
          <Item rotulo="WhatsApp" valor={cliente.whatsapp} />
          <Item rotulo="E-mail" valor={cliente.email} />
          <Item rotulo="Endereço" valor={endereco} />
          <Item rotulo="Cidade / UF / CEP" valor={cidade} />
          <Item rotulo="Nascimento" valor={formatData(cliente.data_nascimento)} />
          <Item rotulo="OS vinculadas" valor={cliente.totalOS} />
          <Item rotulo="Última OS" valor={formatData(cliente.ultimaOS)} />
          <Item rotulo="Tags" valor={cliente.tags.join(", ")} />
          <div className="sm:col-span-2"><Item rotulo="Observações" valor={cliente.observacoes} /></div>
          {cliente.motivo_bloqueio && <div className="sm:col-span-2"><Item rotulo="Motivo do bloqueio" valor={cliente.motivo_bloqueio} /></div>}
        </dl>}
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {cliente?.whatsapp || cliente?.telefone ? <Button type="button" variant="outline" asChild><a href={waUrl(cliente.whatsapp || cliente.telefone || "")} target="_blank" rel="noreferrer"><ExternalLink size={15} className="mr-2" />WhatsApp</a></Button> : null}
            <Button type="button" variant="outline" disabled={!cliente} onClick={() => { if (cliente) aoVerHistorico(cliente); }}><History size={15} className="mr-2" />Histórico de OS</Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={aoFechar}>Fechar</Button>
            <Button type="button" disabled={!cliente} onClick={() => { if (cliente) aoEditar(cliente); }} className="bg-[#00A651] text-white hover:bg-[#008c44]"><Pencil size={15} className="mr-2" />Editar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}