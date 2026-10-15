import { memo, useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { formatBRL } from "@/sistema/os-shared";
import type { CaixaMovimentacao } from "@/sistema/types";

interface Props {
  movimentos: CaixaMovimentacao[];
  carregando?: boolean;
}

/**
 * Cards de resumo do caixa: entradas, saídas e saldo.
 * Totais calculados com `useMemo` — só recalculam quando a lista muda.
 */
export const CaixaSummary = memo(function CaixaSummary({
  movimentos,
  carregando,
}: Props) {
  const { entradas, saidas, saldo } = useMemo(() => {
    let e = 0;
    let s = 0;
    for (const m of movimentos) {
      if (m.tipo === "ENTRADA") e += m.valor;
      else s += m.valor;
    }
    return { entradas: e, saidas: s, saldo: e - s };
  }, [movimentos]);

  const cartoes = [
    {
      rotulo: "Entradas",
      valor: entradas,
      icone: ArrowDownLeft,
      tom: "text-[#00FF88]",
      borda: "border-[#00FF88]/30",
      fundo: "bg-[#00FF88]/10",
    },
    {
      rotulo: "Saídas",
      valor: saidas,
      icone: ArrowUpRight,
      tom: "text-rose-300",
      borda: "border-rose-500/30",
      fundo: "bg-rose-500/10",
    },
    {
      rotulo: "Saldo",
      valor: saldo,
      icone: Wallet,
      tom: saldo >= 0 ? "text-[#00FF88]" : "text-rose-400",
      borda: saldo >= 0 ? "border-[#00FF88]/40" : "border-rose-500/40",
      fundo: saldo >= 0 ? "bg-[#00FF88]/10" : "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cartoes.map((c) => (
        <article
          key={c.rotulo}
          className={`rounded-xl border ${c.borda} bg-zinc-900 p-4`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {c.rotulo}
            </span>
            <span className={`rounded-lg p-1.5 ${c.fundo} ${c.tom}`}>
              <c.icone size={15} aria-hidden />
            </span>
          </div>
          <div
            className={`mt-2 text-2xl font-bold tabular-nums ${carregando ? "animate-pulse text-zinc-700" : c.tom}`}
          >
            {carregando ? "—" : formatBRL(c.valor)}
          </div>
        </article>
      ))}
    </div>
  );
});

export default CaixaSummary;
