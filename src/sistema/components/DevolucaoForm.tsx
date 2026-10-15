import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "./FormInput";
import { Modal } from "./Modal";
import { FORMULARIO_DEVOLUCAO_VAZIO, useSistemaStore } from "@/sistema/store";
import { osNum } from "@/sistema/os-shared";
import type { OrdemServico } from "@/sistema/types";

type Form = typeof FORMULARIO_DEVOLUCAO_VAZIO;
type Erros = Partial<Record<keyof Form, string>>;

function validar(form: Form): Erros {
  const erros: Erros = {};
  if (!form.osId) erros.osId = "Selecione a OS.";
  if (!form.aparelho.trim()) erros.aparelho = "Informe o aparelho.";
  if (!form.cliente.trim()) erros.cliente = "Informe o cliente.";
  if (!form.dataDevolucao) erros.dataDevolucao = "Informe a data.";
  return erros;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  /** OS elegíveis para devolução (todas ou filtradas pela página). */
  osDisponiveis: OrdemServico[];
}

/**
 * Modal de registro de devolução.
 * Ao selecionar a OS, aparelho/cliente/defeito são preenchidos automaticamente
 * (e a store sincroniza o status da OS para DEVOLUCAO ao salvar).
 */
export const DevolucaoForm = memo(function DevolucaoForm({
  aberto,
  aoFechar,
  osDisponiveis,
}: Props) {
  const criarDevolucao = useSistemaStore((s) => s.criarDevolucao);

  const [form, setForm] = useState<Form>(FORMULARIO_DEVOLUCAO_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

  const alterar = useCallback(<K extends keyof Form>(campo: K, valor: Form[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }, []);

  /** Preenche os campos derivados ao escolher a OS. */
  const aoSelecionarOS = useCallback(
    (osId: string) => {
      const os = osDisponiveis.find((o) => o.id === osId);
      setForm((f) => ({
        ...f,
        osId,
        aparelho: os?.aparelho ?? f.aparelho,
        cliente: os?.clienteNome ?? f.cliente,
        defeito: os?.defeito ?? f.defeito,
      }));
      setErros((e) => ({ ...e, osId: undefined }));
    },
    [osDisponiveis]
  );

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const novos = validar(form);
      setErros(novos);
      if (Object.keys(novos).length > 0) return;

      setSalvando(true);
      const ok = await criarDevolucao(form);
      setSalvando(false);

      if (ok) {
        setForm({ ...FORMULARIO_DEVOLUCAO_VAZIO, dataDevolucao: new Date().toISOString().slice(0, 10) });
        aoFechar();
      }
    },
    [form, criarDevolucao, aoFechar]
  );

  const aoCancelar = useCallback(() => {
    setErros({});
    aoFechar();
  }, [aoFechar]);

  const opcoesOS = osDisponiveis.map((o) => ({
    valor: o.id,
    rotulo: `${osNum(o.numero)} · ${o.aparelho} · ${o.clienteNome ?? "sem cliente"}`,
  }));

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo="Registrar Devolução"
      descricao="O status da OS vinculada será alterado automaticamente."
      carregando={salvando}
      naoFecharFora
      largura="max-w-xl"
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
            form="form-devolucao"
            disabled={salvando}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            {salvando ? "Salvando..." : "Registrar"}
          </Button>
        </>
      }
    >
      <form id="form-devolucao" onSubmit={submeter} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Ordem de Serviço"
          obrigatorio
          valor={form.osId}
          aoMudar={aoSelecionarOS}
          opcoes={opcoesOS}
          placeholder="Selecione a OS..."
          erro={erros.osId}
          className="sm:col-span-2"
        />
        <FormInput
          label="Aparelho"
          obrigatorio
          valor={form.aparelho}
          aoMudar={(v) => alterar("aparelho", v)}
          erro={erros.aparelho}
        />
        <FormInput
          label="Cliente"
          obrigatorio
          valor={form.cliente}
          aoMudar={(v) => alterar("cliente", v)}
          erro={erros.cliente}
        />
        <FormInput
          label="Data da Devolução"
          obrigatorio
          tipo="date"
          valor={form.dataDevolucao}
          aoMudar={(v) => alterar("dataDevolucao", v)}
          erro={erros.dataDevolucao}
          className="sm:col-span-2"
        />
        <FormTextarea
          label="Defeito"
          valor={form.defeito}
          aoMudar={(v) => alterar("defeito", v)}
          linhas={2}
        />
        <FormTextarea
          label="Observação"
          placeholder="Motivo, condição da entrega..."
          valor={form.observacao}
          aoMudar={(v) => alterar("observacao", v)}
          linhas={2}
        />
      </form>
    </Modal>
  );
});

export default DevolucaoForm;
