import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  CLASSE_ORCAMENTO,
  ROTULO_ORCAMENTO,
  type StatusOrcamento,
} from "@/sistema/types";

interface Props {
  status: StatusOrcamento;
  compacto?: boolean;
}

/** Badge de status do orçamento (Pendente/Aprovado/Reprovado). */
export const OrcamentoStatusBadge = memo(function OrcamentoStatusBadge({
  status,
  compacto,
}: Props) {
  const icone =
    status === "APROVADO" ? "✅" : status === "REPROVADO" ? "❌" : "⏳";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-semibold",
        compacto ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        CLASSE_ORCAMENTO[status]
      )}
    >
      <span aria-hidden>{icone}</span>
      {ROTULO_ORCAMENTO[status]}
    </span>
  );
});

/** Opções de status para <select> de orçamento. */
export const LISTA_STATUS_ORCAMENTO: { valor: StatusOrcamento; rotulo: string }[] = (
  Object.keys(ROTULO_ORCAMENTO) as StatusOrcamento[]
).map((valor) => ({ valor, rotulo: ROTULO_ORCAMENTO[valor] }));

export default OrcamentoStatusBadge;
