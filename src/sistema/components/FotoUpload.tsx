/**
 * FotoUpload — componente reutilizável de seleção de foto da galeria/câmera.
 *
 * Funciona como:
 * - Desktop: abre dialog de seleção de arquivo (galeria/sistema)
 * - Mobile: abre menu nativo permitindo escolher entre câmera ou galeria
 *           (comportamento nativo do navegador Android/iOS)
 *
 * Uso:
 *   <FotoUpload label="Foto de Entrada" valor={fotoEntrada} onChange={setFotoEntrada} />
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  valor?: string | null;
  onChange: (base64: string | null) => void;
  hint?: string;
  className?: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const FotoUpload = memo(function FotoUpload({ label, valor, onChange, hint, className }: Props) {
  const [localValor, setLocalValor] = useState<string | null>(valor ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sincroniza quando o pai muda o valor (ex: abrir um item em edição)
  useEffect(() => {
    setLocalValor(valor ?? null);
  }, [valor]);

  const handleSelect = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione um arquivo de imagem.");
        return;
      }
      if (file.size > MAX_BYTES) {
        alert("A imagem deve ter no máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        setLocalValor(result);
        onChange(result);
      };
      reader.onerror = () => {
        alert("Não foi possível ler a imagem selecionada.");
      };
      reader.readAsDataURL(file);
      // limpa para permitir selecionar o mesmo arquivo novamente
      if (fileRef.current) fileRef.current.value = "";
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValor(null);
    onChange(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}

      <div className="flex items-center gap-3">
        {localValor ? (
          <div className="relative group">
            <img
              src={localValor}
              alt={label}
              className="h-20 w-20 rounded-lg object-cover border border-border"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover foto"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSelect}
            className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label={`Selecionar foto para ${label}`}
          >
            <Camera size={20} />
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          aria-label={`Upload foto para ${label}`}
        />

        {!localValor && (
          <button
            type="button"
            onClick={handleSelect}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <Upload size={14} />
            Escolher Foto
          </button>
        )}
      </div>
    </div>
  );
});

export default FotoUpload;