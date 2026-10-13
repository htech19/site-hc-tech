import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormInput } from "./FormInput";
import type { ClienteFormData, ClienteResumo } from "@/sistema/clientes/clientes-utils";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: ClienteFormData, id?: string) => Promise<void>;
  editando: ClienteResumo | null;
}

export function ClienteForm({ aberto, aoFechar, aoSalvar, editando }: Props) {
  const [form, setForm] = useState<ClienteFormData>({ nome: "", telefone: "", email: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setForm({
      nome: editando?.nome ?? "",
      telefone: editando?.telefone ?? "",
      email: editando?.email ?? "",
    });
    setErro("");
  }, [aberto, editando]);

  const submeter = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = { nome: form.nome.trim(), telefone: form.telefone.trim(), email: form.email.trim() };
    if (!dados.nome) return setErro("Informe o nome do cliente.");
    if (!dados.telefone) return setErro("Informe o telefone do cliente.");
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

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open && !salvando) aoFechar(); }}>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription className="text-zinc-400">Os dados permanecem vinculados às ordens de serviço existentes.</DialogDescription>
        </DialogHeader>
        <form id="form-cliente" onSubmit={(evento) => void submeter(evento)} className="grid gap-4">
        <FormInput
          label="Nome"
          obrigatorio
          placeholder="Nome completo"
          valor={form.nome}
          aoMudar={(nome) => setForm((atual) => ({ ...atual, nome }))}
        />
        <FormInput
          label="Telefone"
          obrigatorio
          tipo="tel"
          placeholder="(00) 00000-0000"
          valor={form.telefone}
          aoMudar={(telefone) => setForm((atual) => ({ ...atual, telefone }))}
        />
        <FormInput
          label="E-mail"
          tipo="email"
          placeholder="opcional@email.com"
          valor={form.email}
          aoMudar={(email) => setForm((atual) => ({ ...atual, email }))}
        />
          {erro && <p role="alert" className="text-sm text-rose-300">{erro}</p>}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={salvando} onClick={aoFechar} className="border-zinc-700 bg-zinc-900 text-zinc-200">Cancelar</Button>
          <Button type="submit" form="form-cliente" disabled={salvando} className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]">{salvando ? "Salvando..." : editando ? "Atualizar cliente" : "Salvar cliente"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ClienteForm;
