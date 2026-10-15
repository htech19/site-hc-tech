import { memo } from "react";
import { cn } from "@/lib/utils";
import { CLASSE_STATUS, ICONE_STATUS, ROTULO_STATUS, type StatusOS } from "@/sistema/types";

interface Props {
  status: StatusOS;
  /** Versão compacta para uso em tabelas densas. */
  compacto?: boolean;
  /** Esconde o ícone (mantém só o texto). */
  semIcone?: boolean;
}

/**
 * Badge de status da OS — tema escuro, cores por status.
 * Segue os rótulos/ícones do HTML de referência, mas no tema slate/zinc com
 * verde neon para "Concluída".
 */
export const OSStatusBadge = memo(function OSStatusBadge({
  status,
  compacto,
  semIcone,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-semibold",
        compacto ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        CLASSE_STATUS[status]
      )}
    >
      {!semIcone && <span aria-hidden>{ICONE_STATUS[status]}</span>}
      {ROTULO_STATUS[status]}
    </span>
  );
});

/** Badges de status para seleção múltipla (ex.: filtro). */
export const LISTA_STATUS: { valor: StatusOS; rotulo: string }[] = (
  Object.keys(ROTULO_STATUS) as StatusOS[]
).map((valor) => ({ valor, rotulo: ROTULO_STATUS[valor] }));

export default OSStatusBadge;
