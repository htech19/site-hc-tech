import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput } from "./FormInput";
import { Modal } from "./Modal";
import {
  FORMULARIO_CLIENTE_VAZIO,
  useSistemaStore,
} from "@/sistema/store";
import type { Cliente } from "@/sistema/types";

type Form = typeof FORMULARIO_CLIENTE_VAZIO;
type Erros = Partial<Record<keyof Form, string>>;

function validar(form: Form): Erros {
  const erros: Erros = {};
  if (!form.nome.trim()) erros.nome = "Informe o nome do cliente.";
  if (!form.telefone.trim()) erros.telefone = "Informe o telefone.";
  return erros;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  /** Cliente em edição; `null` = criação. */
  editando?: Cliente | null;
}

/**
 * Modal de cadastro/edição de cliente (nome, telefone, e-mail).
 * Validação local em PT-BR + gravação via store (`criarCliente`/`atualizarCliente`).
 */
export const ClienteForm = memo(function ClienteForm({
  aberto,
  aoFechar,
  editando,
}: Props) {
  const criarCliente = useSistemaStore((s) => s.criarCliente);
  const atualizarCliente = useSistemaStore((s) => s.atualizarCliente);

  const [form, setForm] = useState<Form>(FORMULARIO_CLIENTE_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [idCarregado, setIdCarregado] = useState<string | null>(null);

  // Popula o form ao entrar em modo edição (padrão usado no OSForm).
  if (aberto && editando && idCarregado !== editando.id) {
    setIdCarregado(editando.id);
    setErros({});
    setForm({
      nome: editando.nome,
      telefone: editando.telefone,
      email: editando.email ?? "",
    });
  }

  const alterar = useCallback(<K extends keyof Form>(campo: K, valor: Form[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }, []);

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const novos = validar(form);
      setErros(novos);
      if (Object.keys(novos).length > 0) return;

      setSalvando(true);
      const ok = editando
        ? await atualizarCliente(editando.id, form)
        : await criarCliente(form);
      setSalvando(false);

      if (ok) {
        setForm(FORMULARIO_CLIENTE_VAZIO);
        setIdCarregado(null);
        aoFechar();
      }
    },
    [form, editando, atualizarCliente, criarCliente, aoFechar]
  );

  const aoCancelar = useCallback(() => {
    setErros({});
    setIdCarregado(null);
    aoFechar();
  }, [aoFechar]);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo={editando ? "Editar Cliente" : "Novo Cliente"}
      descricao="Cadastro com telefone e e-mail para contato."
      carregando={salvando}
      naoFecharFora
      largura="max-w-lg"
      rodape={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={aoCancelar}
            disabled={salvando}
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-cliente"
            disabled={salvando}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            {salvando ? "Salvando..." : editando ? "Atualizar" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={submeter} className="grid grid-cols-1 gap-4">
        <FormInput
          label="Nome"
          obrigatorio
          placeholder="Nome completo"
          valor={form.nome}
          aoMudar={(v) => alterar("nome", v)}
          erro={erros.nome}
        />
        <FormInput
          label="Telefone"
          obrigatorio
          tipo="tel"
          placeholder="(00) 00000-0000"
          valor={form.telefone}
          aoMudar={(v) => alterar("telefone", v)}
          erro={erros.telefone}
        />
        <FormInput
          label="E-mail"
          tipo="email"
          placeholder="opcional@email.com"
          valor={form.email}
          aoMudar={(v) => alterar("email", v)}
        />
      </form>
    </Modal>
  );
});

export default ClienteForm;
