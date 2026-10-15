import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "./FormInput";
import { Modal } from "./Modal";
import { FORMULARIO_CAIXA_VAZIO, useSistemaStore } from "@/sistema/store";

type Form = typeof FORMULARIO_CAIXA_VAZIO;
type Erros = Partial<Record<keyof Form, string>>;

function validar(form: Form): Erros {
  const erros: Erros = {};
  if (!form.descricao.trim()) erros.descricao = "Descreva a movimentação.";
  const valor = Number(form.valor.replace(",", "."));
  if (!form.valor.trim() || Number.isNaN(valor) || valor <= 0)
    erros.valor = "Informe um valor maior que zero.";
  if (!form.data) erros.data = "Informe a data.";
  return erros;
}

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  /** Permite vincular a uma OS (usado na página do caixa). */
  osVinculadas?: { id: string; numero: number }[];
}

/** Modal de nova movimentação de caixa (entrada/saída). */
export const CaixaForm = memo(function CaixaForm({
  aberto,
  aoFechar,
  osVinculadas = [],
}: Props) {
  const criarMovimentacao = useSistemaStore((s) => s.criarMovimentacao);

  const [form, setForm] = useState<Form>(FORMULARIO_CAIXA_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

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
      const ok = await criarMovimentacao({
        ...form,
        // Sentinelas do Radix Select não podem ser gravadas no banco.
        osId: form.osId === "__nenhuma__" ? "" : form.osId,
      });
      setSalvando(false);

      if (ok) {
        setForm({ ...FORMULARIO_CAIXA_VAZIO, data: new Date().toISOString().slice(0, 10) });
        aoFechar();
      }
    },
    [form, criarMovimentacao, aoFechar]
  );

  const aoCancelar = useCallback(() => {
    setErros({});
    aoFechar();
  }, [aoFechar]);

  const opcoesOS = osVinculadas.map((o) => ({
    valor: o.id,
    rotulo: `OS #${String(o.numero).padStart(4, "0")}`,
  }));
  const opcoesVinculo = [
    { valor: "__nenhuma__", rotulo: "Sem vínculo" },
    ...opcoesOS,
  ];

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo="Nova Movimentação"
      descricao="Registre uma entrada ou saída do caixa."
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
            form="form-caixa"
            disabled={salvando}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            {salvando ? "Salvando..." : "Registrar"}
          </Button>
        </>
      }
    >
      <form id="form-caixa" onSubmit={submeter} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Tipo"
          obrigatorio
          valor={form.tipo}
          aoMudar={(v) => alterar("tipo", v as Form["tipo"])}
          opcoes={[
            { valor: "ENTRADA", rotulo: "↑ Entrada" },
            { valor: "SAIDA", rotulo: "↓ Saída" },
          ]}
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
          valor={form.data}
          aoMudar={(v) => alterar("data", v)}
          erro={erros.data}
          className="sm:col-span-2"
        />
        <FormTextarea
          label="Descrição"
          obrigatorio
          placeholder="Ex: Pagamento de conserto do iPhone 11"
          valor={form.descricao}
          aoMudar={(v) => alterar("descricao", v)}
          erro={erros.descricao}
          linhas={2}
          className="sm:col-span-2"
        />
        {opcoesOS.length > 0 && (
          <FormSelect
            label="Vincular à OS (opcional)"
            valor={form.osId || "__nenhuma__"}
            aoMudar={(v) => alterar("osId", v)}
            opcoes={opcoesVinculo}
            className="sm:col-span-2"
          />
        )}
      </form>
    </Modal>
  );
});

export default CaixaForm;
