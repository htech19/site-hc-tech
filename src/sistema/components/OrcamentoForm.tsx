import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "./FormInput";
import { Modal } from "./Modal";
import { FORMULARIO_ORCAMENTO_VAZIO, useSistemaStore } from "@/sistema/store";
import { LISTA_STATUS_ORCAMENTO } from "./OrcamentoStatusBadge";
import type { Orcamento } from "@/sistema/types";

type Form = typeof FORMULARIO_ORCAMENTO_VAZIO;
type Erros = Partial<Record<keyof Form, string>>;

function validar(form: Form): Erros {
  const erros: Erros = {};
  const valor = Number(form.valor.replace(",", "."));
  if (!form.valor.trim() || Number.isNaN(valor) || valor < 0)
    erros.valor = "Informe um valor válido.";
  if (!form.dataOrcamento) erros.dataOrcamento = "Informe a data.";
  return erros;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  editando?: Orcamento | null;
  /** OPções de OS para vínculo. */
  osDisponiveis?: { id: string; numero: number }[];
}

/** Modal de criação/edição de orçamento (vinculado a uma OS). */
export const OrcamentoForm = memo(function OrcamentoForm({
  aberto,
  aoFechar,
  editando,
  osDisponiveis = [],
}: Props) {
  const criarOrcamento = useSistemaStore((s) => s.criarOrcamento);
  const atualizarOrcamento = useSistemaStore((s) => s.atualizarOrcamento);

  const [form, setForm] = useState<Form>(FORMULARIO_ORCAMENTO_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [idCarregado, setIdCarregado] = useState<string | null>(null);

  if (aberto && editando && idCarregado !== editando.id) {
    setIdCarregado(editando.id);
    setErros({});
    setForm({
      osId: editando.osId ?? "",
      descricao: editando.descricao ?? "",
      valor: String(editando.valor),
      status: editando.status,
      dataOrcamento: editando.dataOrcamento.slice(0, 10),
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
        ? await atualizarOrcamento(editando.id, form)
        : await criarOrcamento(form);
      setSalvando(false);

      if (ok) {
        setForm(FORMULARIO_ORCAMENTO_VAZIO);
        setIdCarregado(null);
        aoFechar();
      }
    },
    [form, editando, atualizarOrcamento, criarOrcamento, aoFechar]
  );

  const aoCancelar = useCallback(() => {
    setErros({});
    setIdCarregado(null);
    aoFechar();
  }, [aoFechar]);

  const opcoesOS = [
    { valor: "__nenhuma__", rotulo: "Sem vínculo com OS" },
    ...osDisponiveis.map((o) => ({
      valor: o.id,
      rotulo: `OS #${String(o.numero).padStart(4, "0")}`,
    })),
  ];

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo={editando ? "Editar Orçamento" : "Novo Orçamento"}
      descricao="Valores apresentados ao cliente para aprovação."
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
            form="form-orcamento"
            disabled={salvando}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            {salvando ? "Salvando..." : editando ? "Atualizar" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-orcamento" onSubmit={submeter} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Vincular à OS"
          valor={form.osId || "__nenhuma__"}
          aoMudar={(v) => alterar("osId", v === "__nenhuma__" ? "" : v)}
          opcoes={opcoesOS}
          className="sm:col-span-2"
        />
        <FormInput
          label="Valor (R$)"
          obrigatorio
          tipo="number"
          placeholder="0,00"
          valor={form.valor}
          aoMudar={(v) => alterar("valor", v)}
          erro={erros.valor}
        />
        <FormInput
          label="Data"
          obrigatorio
          tipo="date"
          valor={form.dataOrcamento}
          aoMudar={(v) => alterar("dataOrcamento", v)}
          erro={erros.dataOrcamento}
        />
        <FormSelect
          label="Status"
          valor={form.status}
          aoMudar={(v) => alterar("status", v as Form["status"])}
          opcoes={LISTA_STATUS_ORCAMENTO}
          className="sm:col-span-2"
        />
        <FormTextarea
          label="Descrição"
          placeholder="Itens do orçamento, peças, mão de obra..."
          valor={form.descricao}
          aoMudar={(v) => alterar("descricao", v)}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
});

export default OrcamentoForm;
