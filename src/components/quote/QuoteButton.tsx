import { ClipboardList } from "lucide-react";
import { openQuote } from "@/config/contact";

export default function QuoteButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={openQuote}
      className={
        className ||
        (compact
          ? "inline-flex items-center gap-2 rounded-lg bg-[#00A651] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#008c44]"
          : "inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-[#00A651] px-8 py-5 text-sm font-black uppercase italic text-white shadow-[0_0_25px_rgba(0,166,81,0.45)] transition-all hover:scale-105")
      }
    >
      <ClipboardList size={compact ? 14 : 22} /> Solicitar Orçamento
    </button>
  );
}
