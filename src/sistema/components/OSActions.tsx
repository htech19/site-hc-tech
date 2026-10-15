import { memo, useCallback } from "react";
import { Eye, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { osNum, formatData, type OS } from "@/sistema/os-shared";
import { ROTULO_STATUS, type OrdemServico, type StatusOS } from "@/sistema/types";
import { useSistemaStore } from "@/sistema/store";

/** Monta a URL de WhatsApp usando o rótulo PT-BR do status (formato UI). */
export function montarUrlWhatsapp(os: OrdemServico): string {
  const cliente = os.clienteNome ?? "cliente";
  const texto = `Olá, sou da HC Tech. A sua OS ${osNum(os.numero)} do ${os.aparelho} (${cliente}) está com status ${ROTULO_STATUS[os.status as StatusOS] ?? os.status}.`;
  return `https://wa.me/5511977934634?text=${encodeURIComponent(texto)}`;
}

interface Props {
  os: OrdemServico;
  aoVisualizar: (os: OrdemServico) => void;
  aoEditar: (os: OrdemServico) => void;
}

const CLASSE_BOTAO =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:opacity-50";

/**
 * Botões de ação de uma linha de OS: visualizar, editar, excluir e WhatsApp.
 * Usa `useCallback` em todos os handlers para não quebrar o memo da tabela.
 */
export const OSActions = memo(function OSActions({ os, aoVisualizar, aoEditar }: Props) {
  const excluirOS = useSistemaStore((s) => s.excluirOS);
  const notificar = useSistemaStore((s) => s.notificar);

  const handleVisualizar = useCallback(() => aoVisualizar(os), [aoVisualizar, os]);
  const handleEditar = useCallback(() => aoEditar(os), [aoEditar, os]);

  const handleExcluir = useCallback(() => {
    if (!window.confirm(`Deseja realmente excluir a OS ${osNum(os.numero)}?`)) return;
    void excluirOS(os.id);
  }, [excluirOS, os.id, os.numero]);

  const handleWhatsApp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Abre em nova aba apenas se houver telefone; caso contrário avisa.
      if (!os.telefone) {
        notificar("Esta OS não possui telefone cadastrado.", "info");
        return;
      }
      window.open(montarUrlWhatsapp(os), "_blank", "noopener,noreferrer");
    },
    [notificar, os]
  );

  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={handleVisualizar} className={CLASSE_BOTAO} title="Ver detalhes" aria-label={`Ver OS ${os.numero}`}>
        <Eye size={14} />
      </button>
      <button type="button" onClick={handleEditar} className={CLASSE_BOTAO} title="Editar" aria-label={`Editar OS ${os.numero}`}>
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={handleWhatsApp}
        className={CLASSE_BOTAO}
        title="Enviar status por WhatsApp"
        aria-label={`Enviar WhatsApp sobre a OS ${os.numero}`}
      >
        <MessageCircle size={14} />
      </button>
      <button
        type="button"
        onClick={handleExcluir}
        className={`${CLASSE_BOTAO} hover:border-rose-500 hover:text-rose-400`}
        title="Excluir"
        aria-label={`Excluir OS ${os.numero}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
});

export default OSActions;
