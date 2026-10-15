import { memo, useCallback } from "react";
import { Printer } from "lucide-react";

interface Props {
  disabled?: boolean;
}

/** Botão de impressão do relatório (`window.print()`). */
export const RelatorioPrintButton = memo(function RelatorioPrintButton({
  disabled,
}: Props) {
  const imprimir = useCallback(() => window.print(), []);

  return (
    <button
      type="button"
      onClick={imprimir}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Printer size={15} aria-hidden />
      Imprimir
    </button>
  );
});

export default RelatorioPrintButton;
