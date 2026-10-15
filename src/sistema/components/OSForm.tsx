import { memo, useCallback, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormTextarea } from "./FormInput";
import { Modal } from "./Modal";
import { useSistemaStore, FORMULARIO_OS_VAZIO } from "@/sistema/store";
import { LISTA_STATUS } from "./OSStatusBadge";
import type { FormularioOS, OrdemServico } from "@/sistema/types";

interface Props {
  clientes: { id: string; nome: string; telefone?: string | null }[];
  aberto: boolean;
  aoFechar: () => void;
  /** OS em edição; `null` = criação. */
  editando?: OrdemServico | null;
}

type Erros = Partial<Record<keyof FormularioOS, string>>;

/**
 * Schema Zod do formulário de OS (spec FASE 4 — "validação Zod").
 * Mensagens em PT-BR; o refinamento cobre a regra "cliente obrigatório"
 * (ou vinculado, ou avulso digitado).
 */
const SCHEMA_OS = z
  .object({
    aparelho: z.string().trim().min(1, "Informe o aparelho."),
    marca: z.string(),
    clienteId: z.string(),
    clienteNome: z.string(),
    telefone: z.string(),
    defeito: z.string().trim().min(1, "Descreva o defeito."),
    status: z.enum([
      "PENDENTE",
      "EM_ANDAMENTO",
      "CONCLUIDA",
      "ESTOQUE",
      "DEVOLUCAO",
      "CANCELADA",
    ]),
    observacao: z.string(),
    valorOrcado: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (!Number.isNaN(Number(v.replace(",", "."))) && Number(v.replace(",", ".")) >= 0),
        "Valor inválido."
      ),
    quantidade: z.string().refine((v) => {
      const n = parseInt(v, 10);
      return !Number.isNaN(n) && n >= 1;
    }, "Mínimo 1."),
    dataEntrada: z.string().min(1, "Informe a data de entrada."),
  })
  .superRefine((form, ctx) => {
    if (!form.clienteId && !form.clienteNome.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clienteNome"],
        message: "Selecione ou digite o cliente.",
      });
    }
  });

/** Valida o formulário via Zod e devolve o mapa campo -> mensagem PT-BR. */
function validar(form: FormularioOS): Erros {
  const resultado = SCHEMA_OS.safeParse(form);
  if (resultado.success) return {};
  const erros: Erros = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path[0] as keyof FormularioOS;
    if (!erros[campo]) erros[campo] = issue.message;
  }
  return erros;
}

/**
 * Formulário de Nova OS / Editar OS.
 *
 * Espelha os campos do HTML de referência (aparelho, quantidade, cliente,
 * telefone, defeito, status, observação/orçamento, valor, data de entrada),
 * com validação local e gravação via store (`criarOS`/`atualizarOS`).
 */
export const OSForm = memo(function OSForm({ clientes, aberto, aoFechar, editando }: Props) {
  const criarOS = useSistemaStore((s) => s.criarOS);
  const atualizarOS = useSistemaStore((s) => s.atualizarOS);

  const [form, setForm] = useState<FormularioOS>(FORMULARIO_OS_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  /** Rastreia se o form já foi populado para a OS em edição. */
  const [idCarregado, setIdCarregado] = useState<string | null>(null);

  // Popula o formulário quando entra em modo edição.
  if (aberto && editando && idCarregado !== editando.id) {
    setIdCarregado(editando.id);
    setErros({});
    setForm({
      aparelho: editando.aparelho,
      marca: editando.marca ?? "",
      clienteId: editando.clienteId ?? "",
      clienteNome: editando.clienteNome ?? "",
      telefone: editando.telefone ?? "",
      defeito: editando.defeito,
      status: editando.status,
      observacao: editando.observacao ?? "",
      valorOrcado: editando.valorOrcado ? String(editando.valorOrcado) : "",
      quantidade: String(editando.quantidade),
      dataEntrada: editando.dataEntrada.slice(0, 10),
    });
  }

  const alterar = useCallback(
    <K extends keyof FormularioOS>(campo: K, valor: FormularioOS[K]) => {
      setForm((f) => ({ ...f, [campo]: valor }));
      setErros((e) => ({ ...e, [campo]: undefined }));
    },
    []
  );

  const opcoesClientes = clientes.map((c) => ({ valor: c.id, rotulo: c.nome }));

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const novosErros = validar(form);
      setErros(novosErros);
      if (Object.keys(novosErros).length > 0) return;

      setSalvando(true);
      const ok = editando ? await atualizarOS(editando.id, form) : await criarOS(form);
      setSalvando(false);

      if (ok) {
        setForm(FORMULARIO_OS_VAZIO);
        setIdCarregado(null);
        aoFechar();
      }
    },
    [form, editando, atualizarOS, criarOS, aoFechar]
  );

  const aoCancelar = useCallback(() => {
    setErros({});
    setIdCarregado(null);
    // Limpa campos para a próxima abertura não herdar dados da anterior.
    setForm(FORMULARIO_OS_VAZIO);
    aoFechar();
  }, [aoFechar]);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo={editando ? `Editar OS #${String(editando.numero).padStart(4, "0")}` : "Nova Ordem de Serviço"}
      descricao="Preencha os dados do aparelho recebido."
      carregando={salvando}
      naoFecharFora
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
            form="form-os"
            disabled={salvando}
            className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
          >
            {salvando ? "Salvando..." : editando ? "Atualizar OS" : "Salvar OS"}
          </Button>
        </>
      }
    >
      <form id="form-os" onSubmit={submeter} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          label="Aparelho"
          obrigatorio
          placeholder="Ex: iPhone 6s, Moto G54..."
          valor={form.aparelho}
          aoMudar={(v) => alterar("aparelho", v)}
          erro={erros.aparelho}
        />
        <FormInput
          label="Marca"
          placeholder="Opcional"
          valor={form.marca}
          aoMudar={(v) => alterar("marca", v)}
        />

        <FormSelect
          label="Cliente"
          valor={form.clienteId}
          aoMudar={(v) => alterar("clienteId", v)}
          opcoes={opcoesClientes}
          placeholder="Selecione um cliente"
          dica="Deixe vazio e informe abaixo para cliente não cadastrado."
        />
        <FormInput
          label="Cliente avulso"
          placeholder="Nome do cliente"
          valor={form.clienteNome}
          aoMudar={(v) => alterar("clienteNome", v)}
          erro={erros.clienteNome}
          somenteLeitura={!!form.clienteId}
        />

        <FormInput
          label="Telefone"
          tipo="tel"
          placeholder="(00) 00000-0000"
          valor={form.telefone}
          aoMudar={(v) => alterar("telefone", v)}
        />
        <FormInput
          label="Quantidade"
          tipo="number"
          valor={form.quantidade}
          aoMudar={(v) => alterar("quantidade", v)}
          erro={erros.quantidade}
        />

        <FormInput
          label="Defeito"
          obrigatorio
          placeholder="Descrição do defeito"
          valor={form.defeito}
          aoMudar={(v) => alterar("defeito", v)}
          erro={erros.defeito}
          className="sm:col-span-2"
        />

        <FormSelect
          label="Status"
          valor={form.status}
          aoMudar={(v) => alterar("status", v as FormularioOS["status"])}
          opcoes={LISTA_STATUS}
        />
        <FormInput
          label="Valor Orçado (R$)"
          tipo="number"
          placeholder="0,00"
          valor={form.valorOrcado}
          aoMudar={(v) => alterar("valorOrcado", v)}
          erro={erros.valorOrcado}
          dica="Use ponto ou vírgula para centavos."
        />

        <FormInput
          label="Data de Entrada"
          tipo="date"
          valor={form.dataEntrada}
          aoMudar={(v) => alterar("dataEntrada", v)}
          erro={erros.dataEntrada}
        />

        <FormTextarea
          label="Observação / Orçamento"
          placeholder="Valores, observações, detalhes..."
          valor={form.observacao}
          aoMudar={(v) => alterar("observacao", v)}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
});

export default OSForm;
