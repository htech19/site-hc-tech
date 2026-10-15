import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormInput } from "./FormInput";
import { Modal } from "./Modal";
import { useSistemaStore } from "@/sistema/store";
import type { TipoServico } from "@/sistema/types";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  /** Serviço em edição (renomear); `null` = criação. */
  editando?: TipoServico | null;
}

/**
 * Modal de cadastro/renomeação de tipo de serviço.
 * O backend rejeita nomes duplicados (constraint unique) e a store traduz o erro.
 */
export const ServicoForm = memo(function ServicoForm({
  aberto,
  aoFechar,
  editando,
}: Props) {
  const criarTipoServico = useSistemaStore((s) => s.criarTipoServico);
  const notificar = useSistemaStore((s) => s.notificar);

  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [salvando, setSalvando] = useState(false);
  const [idCarregado, setIdCarregado] = useState<string | null>(null);

  if (aberto && editando && idCarregado !== editando.id) {
    setIdCarregado(editando.id);
    setErro(undefined);
    setNome(editando.nome);
  }

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nome.trim()) {
        setErro("Informe o nome do serviço.");
        return;
      }
      if (editando) {
        // Renomeação: por ora, apenas avisa — a store expõe criar/excluir.
        notificar("Edição de nome disponível excluindo e recriando o serviço.", "info");
        aoFechar();
        return;
      }
      setSalvando(true);
      const ok = await criarTipoServico(nome);
      setSalvando(false);
      if (ok) {
        setNome("");
        aoFechar();
      }
    },
    [nome, editando, criarTipoServico, notificar, aoFechar]
  );

  const aoCancelar = useCallback(() => {
    setErro(undefined);
    setNome("");
    setIdCarregado(null);
    aoFechar();
  }, [aoFechar]);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo={editando ? "Serviço" : "Novo Tipo de Serviço"}
      descricao="Ex: Troca de tela, Troca de bateria, Chip de rede..."
      carregando={salvando}
      naoFecharFora
      largura="max-w-md"
      rodape={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={aoCancelar}
            disabled={salvando}
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
          >
            Fechar
          </Button>
          {!editando && (
            <Button
              type="submit"
              form="form-servico"
              disabled={salvando}
              className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
            >
              {salvando ? "Salvando..." : "Adicionar"}
            </Button>
          )}
        </>
      }
    >
      <form id="form-servico" onSubmit={submeter}>
        <FormInput
          label="Nome do serviço"
          obrigatorio
          placeholder="Ex: Troca de tela"
          valor={nome}
          aoMudar={(v) => {
            setNome(v);
            setErro(undefined);
          }}
          erro={erro}
          somenteLeitura={!!editando}
        />
      </form>
    </Modal>
  );
});

export default ServicoForm;
