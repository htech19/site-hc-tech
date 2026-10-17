import { forwardRef, memo, useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Classe base dos campos — tema slate/zinc escuro. */
const CLASSE_CAMPO =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/20 disabled:cursor-not-allowed disabled:opacity-60";

interface BaseProps {
  label: string;
  /** Mensagem de erro; se presente, o campo fica vermelho e a mensagem aparece. */
  erro?: string;
  /** Texto de apoio exibido abaixo do campo. */
  dica?: string;
  obrigatorio?: boolean;
  className?: string;
}

interface PropsFormInput extends BaseProps {
  valor: string;
  aoMudar: (valor: string) => void;
  tipo?: string;
  placeholder?: string;
  /** Desabilita a edição (modo leitura). */
  somenteLeitura?: boolean;
}

/** Input de texto com label, erro e dica — memoizado. */
export const FormInput = memo(
  forwardRef<HTMLInputElement, PropsFormInput>(function FormInput(
    {
      label,
      erro,
      dica,
      obrigatorio,
      className,
      valor,
      aoMudar,
      tipo = "text",
      placeholder,
      somenteLeitura,
    },
    ref
  ) {
    const id = useId();
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
          {obrigatorio && <span className="ml-1 text-[#00FF88]">*</span>}
        </Label>
        <Input
          ref={ref}
          id={id}
          type={tipo}
          value={valor}
          placeholder={placeholder}
          readOnly={somenteLeitura}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${id}-erro` : dica ? `${id}-dica` : undefined}
          onChange={(e) => aoMudar(e.target.value)}
          className={cn(CLASSE_CAMPO, erro && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/40")}
        />
        {erro ? (
          <p id={`${id}-erro`} className="text-xs text-rose-400">
            {erro}
          </p>
        ) : (
          dica && (
            <p id={`${id}-dica`} className="text-xs text-zinc-500">
              {dica}
            </p>
          )
        )}
      </div>
    );
  })
);

interface PropsFormTextarea extends BaseProps {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  linhas?: number;
}

/** Área de texto multiline com label/erro. */
export const FormTextarea = memo(function FormTextarea({
  label,
  erro,
  dica,
  obrigatorio,
  className,
  valor,
  aoMudar,
  placeholder,
  linhas = 3,
}: PropsFormTextarea) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
        {obrigatorio && <span className="ml-1 text-[#00FF88]">*</span>}
      </Label>
      <Textarea
        id={id}
        rows={linhas}
        value={valor}
        placeholder={placeholder}
        aria-invalid={!!erro}
        onChange={(e) => aoMudar(e.target.value)}
        className={cn(CLASSE_CAMPO, "min-h-[80px] resize-y", erro && "border-rose-500")}
      />
      {erro ? (
        <p className="text-xs text-rose-400">{erro}</p>
      ) : (
        dica && <p className="text-xs text-zinc-500">{dica}</p>
      )}
    </div>
  );
});

interface Opcao {
  valor: string;
  rotulo: string;
}

interface PropsFormSelect extends BaseProps {
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: Opcao[];
  placeholder?: string;
}

/** Select controlado com label/erro (usa Radix/shadcn). */
export const FormSelect = memo(function FormSelect({
  label,
  erro,
  dica,
  obrigatorio,
  className,
  valor,
  aoMudar,
  opcoes,
  placeholder = "Selecione...",
}: PropsFormSelect) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
        {obrigatorio && <span className="ml-1 text-[#00FF88]">*</span>}
      </Label>
      <Select value={valor} onValueChange={aoMudar}>
        <SelectTrigger
          className={cn(
            CLASSE_CAMPO,
            "h-auto py-2.5",
            erro && "border-rose-500"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor} className="focus:bg-zinc-800 focus:text-zinc-100">
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {erro ? (
        <p className="text-xs text-rose-400">{erro}</p>
      ) : (
        dica && <p className="text-xs text-zinc-500">{dica}</p>
      )}
    </div>
  );
});

export { CLASSE_CAMPO };
