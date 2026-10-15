import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clienteFormVazio, validarCliente, type ClienteFormData, type ClienteResumo } from "@/sistema/clientes/clientes-utils";
import { maskCEP, maskDoc, maskPhone } from "@/sistema/clientes/utils";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: ClienteFormData, id?: string) => Promise<void>;
  editando: ClienteResumo | null;
}

export function ClienteForm({ aberto, aoFechar, aoSalvar, editando }: Props) {
  const [form, setForm] = useState<ClienteFormData>(() => clienteFormVazio());
  const [tagsTexto, setTagsTexto] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm(editando ? {
      nome: editando.nome,
      tipo_pessoa: editando.tipo_pessoa,
      documento: editando.documento,
      rg_ie: editando.rg_ie,
      nome_fantasia: editando.nome_fantasia,
      data_nascimento: editando.data_nascimento,
      telefone: editando.telefone,
      telefone2: editando.telefone2,
      whatsapp: editando.whatsapp,
      email: editando.email,
      cep: editando.cep,
      endereco: editando.endereco,
      numero: editando.numero,
      complemento: editando.complemento,
      bairro: editando.bairro,
      cidade: editando.cidade,
      uf: editando.uf,
      observacoes: editando.observacoes,
      tags: editando.tags ?? [],
      status: editando.status,
      motivo_bloqueio: editando.motivo_bloqueio,
    } : clienteFormVazio());
    setTagsTexto(editando?.tags?.join(", ") ?? "");
    setErro("");
  }, [aberto, editando]);

  const alterar = <K extends keyof ClienteFormData>(campo: K, valor: ClienteFormData[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const submeter = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = {
      ...form,
      nome: form.nome.trim(),
      documento: form.documento?.trim() || null,
      telefone: form.telefone?.trim() || null,
      telefone2: form.telefone2?.trim() || null,
      whatsapp: form.whatsapp?.trim() || null,
      email: form.email?.trim() || null,
      cep: form.cep?.trim() || null,
      endereco: form.endereco?.trim() || null,
      numero: form.numero?.trim() || null,
      complemento: form.complemento?.trim() || null,
      bairro: form.bairro?.trim() || null,
      cidade: form.cidade?.trim() || null,
      uf: form.uf?.trim().toUpperCase() || null,
      observacoes: form.observacoes?.trim() || null,
      tags: tagsTexto.split(",").map((tag) => tag.trim()).filter(Boolean),
      motivo_bloqueio: form.motivo_bloqueio?.trim() || null,
    } satisfies ClienteFormData;
    const erros = validarCliente(dados);
    if (erros.length) return setErro(erros.join(" "));
    setErro("");
    setSalvando(true);
    try {
      await aoSalvar(dados, editando?.id);
      aoFechar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const campo = (id: string, label: string, valor: string | null | undefined, onChange: (value: string) => void, options: { type?: string; required?: boolean; placeholder?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-zinc-700">{label}{options.required ? " *" : ""}</Label>
      <Input id={id} type={options.type ?? "text"} required={options.required} value={valor ?? ""} placeholder={options.placeholder} onChange={(event) => onChange(event.target.value)} className="border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400" />
    </div>
  );

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open && !salvando) aoFechar(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-200 bg-white text-zinc-900 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Cadastro comercial e de contato do cliente.</DialogDescription>
        </DialogHeader>
        <form id="form-cliente" onSubmit={(evento) => void submeter(evento)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="cliente-tipo">Tipo de pessoa</Label><select id="cliente-tipo" value={form.tipo_pessoa} onChange={(event) => { const tipo = event.target.value as ClienteFormData["tipo_pessoa"]; alterar("tipo_pessoa", tipo); if (form.documento) alterar("documento", maskDoc(form.documento, tipo)); }} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="cliente-status">Status</Label><select id="cliente-status" value={form.status} onChange={(event) => alterar("status", event.target.value as ClienteFormData["status"])} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option></select></div>
          {campo("cliente-nome", "Nome completo / razão social", form.nome, (value) => alterar("nome", value), { required: true })}
          {form.tipo_pessoa === "PJ" && campo("cliente-fantasia", "Nome fantasia", form.nome_fantasia, (value) => alterar("nome_fantasia", value))}
          {campo("cliente-documento", form.tipo_pessoa === "PJ" ? "CNPJ" : "CPF", form.documento, (value) => alterar("documento", maskDoc(value, form.tipo_pessoa)), { placeholder: form.tipo_pessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00" })}
          {campo("cliente-rg", form.tipo_pessoa === "PJ" ? "Inscrição estadual" : "RG", form.rg_ie, (value) => alterar("rg_ie", value))}
          {campo("cliente-telefone", "Telefone", form.telefone, (value) => alterar("telefone", maskPhone(value)), { type: "tel", required: true, placeholder: "(00) 00000-0000" })}
          {campo("cliente-telefone2", "Telefone secundário", form.telefone2, (value) => alterar("telefone2", maskPhone(value)), { type: "tel" })}
          {campo("cliente-whatsapp", "WhatsApp", form.whatsapp, (value) => alterar("whatsapp", maskPhone(value)), { type: "tel" })}
          {campo("cliente-email", "E-mail", form.email, (value) => alterar("email", value), { type: "email" })}
          {form.tipo_pessoa === "PF" && campo("cliente-nascimento", "Data de nascimento", form.data_nascimento, (value) => alterar("data_nascimento", value || null), { type: "date" })}
          {campo("cliente-cep", "CEP", form.cep, (value) => alterar("cep", maskCEP(value)))}
          {campo("cliente-endereco", "Endereço", form.endereco, (value) => alterar("endereco", value))}
          {campo("cliente-numero", "Número", form.numero, (value) => alterar("numero", value))}
          {campo("cliente-complemento", "Complemento", form.complemento, (value) => alterar("complemento", value))}
          {campo("cliente-bairro", "Bairro", form.bairro, (value) => alterar("bairro", value))}
          {campo("cliente-cidade", "Cidade", form.cidade, (value) => alterar("cidade", value))}
          {campo("cliente-uf", "UF", form.uf, (value) => alterar("uf", value.slice(0, 2)))}
          {campo("cliente-tags", "Tags (separadas por vírgula)", tagsTexto, setTagsTexto)}
          {form.status === "bloqueado" && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cliente-motivo">Motivo do bloqueio *</Label><Input id="cliente-motivo" required value={form.motivo_bloqueio ?? ""} onChange={(event) => alterar("motivo_bloqueio", event.target.value)} className="border-zinc-300 bg-white" /></div>}
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cliente-observacoes">Observações</Label><Textarea id="cliente-observacoes" value={form.observacoes ?? ""} onChange={(event) => alterar("observacoes", event.target.value)} className="border-zinc-300 bg-white" rows={3} /></div>
          {erro && <p role="alert" className="text-sm text-rose-300">{erro}</p>}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={salvando} onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-cliente" disabled={salvando} className="bg-[#00A651] font-bold text-white hover:bg-[#008c44]">{salvando ? "Salvando..." : editando ? "Atualizar cliente" : "Salvar cliente"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ClienteForm;
