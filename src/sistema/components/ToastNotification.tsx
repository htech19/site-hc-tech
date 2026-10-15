import { memo } from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { useSistemaStore, type TipoNotificacao } from "@/sistema/store";

const ICONE: Record<TipoNotificacao, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COR: Record<TipoNotificacao, string> = {
  success: "border-l-[#00FF88] text-[#00FF88]",
  error: "border-l-rose-500 text-rose-400",
  info: "border-l-sky-500 text-sky-400",
};

/**
 * Container de notificações do módulo /sistema.
 *
 * Bebe da store Zustand (`notificacoes`), o que permite disparar mensagens
 * tanto de componentes React quanto de ações CRUD assíncronas fora da árvore.
 * Cada item é auto-descartado pela store após 4s.
 */
export const ToastNotification = memo(function ToastNotification() {
  const notificacoes = useSistemaStore((s) => s.notificacoes);
  const remover = useSistemaStore((s) => s.removerNotificacao);

  if (notificacoes.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[3000] flex flex-col gap-2"
      role="region"
      aria-label="Notificações"
    >
      {notificacoes.map((n) => {
        const Icone = ICONE[n.tipo];
        return (
          <div
            key={n.id}
            className={[
              "pointer-events-auto flex min-w-[260px] items-center gap-2.5 rounded-xl",
              "border border-zinc-800 border-l-4 bg-zinc-900 px-4 py-3",
              "text-sm text-zinc-100 shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
              "animate-in slide-in-from-right duration-300",
              COR[n.tipo],
            ].join(" ")}
          >
            <Icone size={16} className="shrink-0" />
            <span className="flex-1 text-zinc-200">{n.mensagem}</span>
            <button
              type="button"
              onClick={() => remover(n.id)}
              className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
});

export default ToastNotification;
