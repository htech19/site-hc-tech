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

import { useMemo, useState, useEffect } from "react";
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
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);

  const filtradas = useMemo(() => {
    const termo = normalizarBusca(valor);
    const base = termo
      ? opcoes.filter((o) => normalizarBusca(`${o.rotulo} ${o.detalhe ?? ""}`).includes(termo))
      : opcoes;
    return base.slice(0, 80);
  }, [valor, opcoes]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!aberto || filtradas.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSelecionado((prev) => (prev < filtradas.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSelecionado((prev) => (prev > 0 ? prev - 1 : filtradas.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (indiceSelecionado >= 0) {
        aoSelecionar(filtradas[indiceSelecionado]);
        setAberto(false);
        setIndiceSelecionado(-1);
      }
    } else if (e.key === "Escape") {
      setAberto(false);
      setIndiceSelecionado(-1);
    }
  };

  // Resetar índice quando as opções filtradas mudam
  useEffect(() => {
    setIndiceSelecionado(-1);
  }, [filtradas]);

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">
        {label} {obrigatorio && <span className="text-primary">*</span>}
      </label>
      <Input
        id={id}
        value={valor}
        onChange={(e) => {
          aoDigitar(e.target.value);
          setAberto(true);
        }}
        onFocus={() => {
          setAberto(true);
          setIndiceSelecionado(-1);
        }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-[#00FF88]/20"
      />
      {aberto && filtradas.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-2xl"
        >
          {filtradas.map((o, index) => (
            <li key={`${o.detalhe ?? ""}|${o.valor}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === indiceSelecionado}
                onMouseDown={(e) => {
                  e.preventDefault();
                  aoSelecionar(o);
                  setAberto(false);
                  setIndiceSelecionado(-1);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  index === indiceSelecionado ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <span className="truncate text-foreground">{o.rotulo}</span>
                {o.detalhe && (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        dica && <p className="mt-1 text-[11px] text-muted-foreground">{dica}</p>
      )}
    </div>
  );
}

export default ComboBusca;
