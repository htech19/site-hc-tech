import { memo, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSistemaStore } from "@/sistema/store";

/** Senha mínima aqui é maior que a do Supabase (6): 8 é o mínimo aceitável. */
const TAMANHO_MINIMO = 8;

/** Mensagens do GoTrue em português, sem vazar detalhe técnico. */
function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("different from the old password")) {
    return "A nova senha precisa ser diferente da senha atual.";
  }
  if (m.includes("at least")) {
    return `A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`;
  }
  if (m.includes("should be a valid string")) {
    return "Senha inválida. Evite espaços no início ou no fim.";
  }
  if (m.includes("session") || m.includes("jwt")) {
    return "Sua sessão expirou. Entre novamente para trocar a senha.";
  }
  return "Não foi possível alterar a senha. Tente novamente.";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Diálogo "Alterar senha" — usa `supabase.auth.updateUser`, que altera a senha
 * do usuário logado sem exigir a senha antiga e sem administrar o projeto.
 * Foi criado para substituir a senha temporária do primeiro acesso.
 */
export const AlterarSenhaDialog = memo(function AlterarSenhaDialog({
  open,
  onOpenChange,
}: Props) {
  const notificar = useSistemaStore((s) => s.notificar);

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fechar = (proximo: boolean) => {
    if (ocupado) return;
    onOpenChange(proximo);
    if (!proximo) {
      setSenha("");
      setConfirmacao("");
      setErro(null);
      setMostrarSenha(false);
    }
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (ocupado) return;

    if (senha.length < TAMANHO_MINIMO) {
      setErro(`A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não conferem.");
      return;
    }

    setOcupado(true);
    setErro(null);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setOcupado(false);

    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }

    setSenha("");
    setConfirmacao("");
    onOpenChange(false);
    notificar("Senha alterada com sucesso!", "success");
  };

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-50">
            <KeyRound size={18} className="text-[#00A651]" />
            Alterar senha
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Vale para o seu acesso ao sistema. Use uma senha que você não use em
            outro lugar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nova-senha" className="text-zinc-300">
              Nova senha
            </Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pr-10 border-zinc-700"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 transition hover:text-zinc-200"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar-senha" className="text-zinc-300">
              Confirmar nova senha
            </Label>
            <Input
              id="confirmar-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="border-zinc-700"
              required
            />
          </div>

          <p className="text-xs text-zinc-500">
            Mínimo de {TAMANHO_MINIMO} caracteres. Ao salvar, a senha temporária
            deixa de valer imediatamente.
          </p>

          {erro && (
            <p role="alert" className="text-sm text-red-400">
              {erro}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fechar(false)}
              disabled={ocupado}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={ocupado}
              className="bg-[#00A651] text-white hover:bg-[#008f45]"
            >
              {ocupado && <Loader2 size={16} className="animate-spin" />}
              Salvar nova senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default AlterarSenhaDialog;
