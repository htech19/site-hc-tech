/**
 * =============================================================================
 * COMBOBUSCA — dropdown pesquisável de marca/modelo (HC TECH)
 * =============================================================================
 * Componente extraído de `orcamentos/WizardNovaOS.tsx` para reutilização —
 * é a MESMA lógica da tela de Novo Orçamento / Nova OS: input que abre a
 * lista no foco, filtra enquanto o usuário digita (tolerante a acentos e
 * caixa), mostra a marca ao lado do modelo e seleciona com um clique.
 *
 * Usado hoje em: WizardNovaOS (etapa Equipamento) e EstoqueForm
 * (passo 2 — Marca/Modelo do cadastro de itens).
 *==========================================================================*/

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

/** Opção de lista: valor gravado, rótulo exibido e complemento (ex.: marca). */
export interface ComboBuscaOpcao {
  /** Valor efetivamente gravado no campo. */
  valor: string;
  /** Texto principal exibido na lista. */
  rotulo: string;
  /** Complemento (marca) exibido à direita. */
  detalhe?: string;
}

/** Normaliza para busca: sem acentos, minúsculas e sem espaços nas pontas. */
export const normalizarBusca = (v: string) =>
  (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

interface ComboBuscaProps {
  id: string;
  label: string;
  valor: string;
  opcoes: ComboBuscaOpcao[];
  aoDigitar: (v: string) => void;
  aoSelecionar: (o: ComboBuscaOpcao) => void;
  placeholder: string;
  obrigatorio?: boolean;
  erro?: string;
  dica?: string;
}

export function ComboBusca({
  id,
  label,
  valor,
  opcoes,
  aoDigitar,
  aoSelecionar,
  placeholder,
  obrigatorio,
  erro,
  dica,
}: ComboBuscaProps) {
  const [aberto, setAberto] = useState(false);

  const filtradas = useMemo(() => {
    const termo = normalizarBusca(valor);
    const base = termo
      ? opcoes.filter((o) => normalizarBusca(`${o.rotulo} ${o.detalhe ?? ""}`).includes(termo))
      : opcoes;
    return base.slice(0, 80);
  }, [valor, opcoes]);

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-zinc-300">
        {label} {obrigatorio && <span className="text-[#00FF88]">*</span>}
      </label>
      <Input
        id={id}
        value={valor}
        onChange={(e) => {
          aoDigitar(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
      />
      {aberto && filtradas.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
        >
          {filtradas.map((o) => (
            <li key={`${o.detalhe ?? ""}|${o.valor}`}>
              <button
                type="button"
                role="option"
                aria-selected={o.valor === valor}
                // onMouseDown em vez de onClick: o input perde o foco antes do
                // clique terminar e a lista fecharia sem selecionar.
                onMouseDown={(e) => {
                  e.preventDefault();
                  aoSelecionar(o);
                  setAberto(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800"
              >
                <span className="truncate text-zinc-200">{o.rotulo}</span>
                {o.detalhe && (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {o.detalhe}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {erro ? (
        <p className="mt-1 text-xs text-rose-400">{erro}</p>
      ) : (
        dica && <p className="mt-1 text-[11px] text-zinc-500">{dica}</p>
      )}
    </div>
  );
}

export default ComboBusca;
