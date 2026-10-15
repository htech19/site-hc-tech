import { memo } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "./LoadingSpinner";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  /** Largura máxima do modal (classes Tailwind). */
  largura?: string;
  /** Exibe overlay de carregamento e bloqueia o conteúdo. */
  carregando?: boolean;
  /** Impede o fechamento por clique fora / ESC (útil em formulários sujos). */
  naoFecharFora?: boolean;
}

/**
 * Modal genérico reutilizável (wraps o Dialog do shadcn/ui).
 *
 * Centraliza cabeçalho, botão de fechar, rodapé e estado de carregamento para
 * que todos os CRUDs do módulo tenham o mesmo comportamento e acessibilidade.
 */
export const Modal = memo(function Modal({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = "max-w-2xl",
  carregando,
  naoFecharFora,
}: Props) {
  return (
    <Dialog
      open={aberto}
      onOpenChange={(abertoNovo) => {
        if (!abertoNovo && !carregando) aoFechar();
      }}
    >
      <DialogContent
        aria-describedby={descricao ? "modal-descricao" : undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={[
          "max-h-[90vh] overflow-y-auto border border-zinc-800 bg-zinc-900 p-0 text-zinc-100",
          "shadow-[0_24px_64px_rgba(0,0,0,0.6)]",
          largura,
        ].join(" ")}
        {...(naoFecharFora ? { onPointerDownOutside: (e: Event) => e.preventDefault() } : {})}
      >
        <DialogHeader className="border-b border-zinc-800 px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-50">{titulo}</DialogTitle>
              {descricao && (
                <p id="modal-descricao" className="mt-1 text-sm text-zinc-400">
                  {descricao}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              disabled={carregando}
              aria-label="Fechar"
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 transition hover:border-rose-500 hover:bg-rose-500 hover:text-white disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <div className="relative px-6 py-5">
          {carregando && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-2xl bg-zinc-900/70 backdrop-blur-sm">
              <LoadingSpinner rotulo="Salvando..." />
            </div>
          )}
          {children}
        </div>

        {rodape && (
          <DialogFooter className="border-t border-zinc-800 bg-zinc-950/40 px-6 py-4">
            {rodape}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default Modal;
