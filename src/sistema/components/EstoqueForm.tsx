import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "./FormInput";
import { Modal } from "./Modal";
import { FORMULARIO_ESTOQUE_VAZIO, useSistemaStore } from "@/sistema/store";
import type { EstoqueItem } from "@/sistema/types";

type Form = typeof FORMULARIO_ESTOQUE_VAZIO;
type Erros = Partial<Record<keyof Form, string>>;

function validar(form: Form): Erros {
  const erros: Erros = {};
  if (!form.aparelho.trim()) erros.aparelho = "Informe o aparelho.";
  const qtd = parseInt(form.quantidade, 10);
  if (Number.isNaN(qtd) || qtd < 1) erros.quantidade = "Mínimo 1.";
  return erros;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  editando?: EstoqueItem | null;
}

/** Modal de entrada/saída (cadastro/edição) de item de estoque. */
export const EstoqueForm = memo(function EstoqueForm({
  aberto,
  aoFechar,
  editando,
}: Props) {
  const criarItemEstoque = useSistemaStore((s) => s.criarItemEstoque);
  const atualizarItemEstoque = useSistemaStore((s) => s.atualizarItemEstoque);

  const [form, setForm] = useState<Form>(FORMULARIO_ESTOQUE_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [idCarregado, setIdCarregado] = useState<string | null>(null);

  if (aberto && editando && idCarregado !== editando.id) {
    setIdCarregado(editando.id);
    setErros({});
    setForm({
      aparelho: editando.aparelho,
      quantidade: String(editando.quantidade),
      defeito: editando.defeito ?? "",
      condicao: editando.condicao ?? "",
      observacao: editando.observacao ?? "",
      proprietario: editando.proprietario ?? "HC TECH",
      canal_de_venda: editando.canal_de_venda ?? "Loja física",
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
        ? await atualizarItemEstoque(editando.id, form)
        : await criarItemEstoque(form);
      setSalvando(false);

      if (ok) {
        setForm(FORMULARIO_ESTOQUE_VAZIO);
        setIdCarregado(null);
        aoFechar();
      }
    },
    [form, editando, atualizarItemEstoque, criarItemEstoque, aoFechar]
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
      titulo={editando ? "Editar Item de Estoque" : "Nova Entrada no Estoque"}
      descricao="Aparelho parado, aguardando peça ou conserto."
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
            form="form-estoque"
            disabled={salvando}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            {salvando ? "Salvando..." : editando ? "Atualizar" : "Adicionar"}
          </Button>
        </>
      }
    >
      <form id="form-estoque" onSubmit={submeter} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          label="Aparelho"
          obrigatorio
          placeholder="Ex: Samsung J5, iPhone 8..."
          valor={form.aparelho}
          aoMudar={(v) => alterar("aparelho", v)}
          erro={erros.aparelho}
        />
        <FormInput
          label="Quantidade"
          obrigatorio
          tipo="number"
          valor={form.quantidade}
          aoMudar={(v) => alterar("quantidade", v)}
          erro={erros.quantidade}
        />
        <FormInput
          label="Defeito"
          placeholder="Opcional"
          valor={form.defeito}
          aoMudar={(v) => alterar("defeito", v)}
        />
        <FormInput
          label="Condição"
          placeholder="Ex: Trincado, não liga..."
          valor={form.condicao}
          aoMudar={(v) => alterar("condicao", v)}
        />
        <FormTextarea
          label="Observação"
          placeholder="Detalhes adicionais..."
          valor={form.observacao}
          aoMudar={(v) => alterar("observacao", v)}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
});

export default EstoqueForm;
