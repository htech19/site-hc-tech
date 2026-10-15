import { memo, useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import type { EstoqueItem } from "@/sistema/types";

interface Props {
  itens: EstoqueItem[];
  /** Quantidade mínima para alertar (padrão: 1 unidade). */
  limite?: number;
}

/**
 * Alerta de estoque baixo — destaca itens com `quantidade <= limite`.
 * A lista de alertados é memoizada; o componente não renderiza nada se não
 * houver itens críticos (evita ruído visual).
 */
export const EstoqueAlert = memo(function EstoqueAlert({ itens, limite = 1 }: Props) {
  const criticos = useMemo(
    () => itens.filter((i) => i.quantidade <= limite),
    [itens, limite]
  );

  if (criticos.length === 0) return null;

  return (
    <aside
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
        <TriangleAlert size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-amber-300">
          Estoque baixo em {criticos.length} item(ns)
        </h3>
        <p className="mt-0.5 text-xs text-amber-200/80">
          {criticos
            .slice(0, 4)
            .map((i) => `${i.aparelho} (${i.quantidade})`)
            .join(" · ")}
          {criticos.length > 4 && ` · +${criticos.length - 4} outros`}
        </p>
      </div>
    </aside>
  );
});

export default EstoqueAlert;
