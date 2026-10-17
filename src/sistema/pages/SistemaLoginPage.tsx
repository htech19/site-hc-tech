import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSistemaAuth } from "@/sistema/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SistemaLoginPage() {
  const { session, loading } = useSistemaAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/sistema" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setBusy(false);
    if (error) {
      setErr("E-mail ou senha inválidos.");
    } else {
      navigate("/sistema", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-lg border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black tracking-tight text-zinc-100">
            HC <span className="text-[#00A651]">TECH</span>
          </CardTitle>
          <CardDescription className="text-zinc-400">Acesso ao sistema interno</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300">E-mail</Label>
              <Input
                id="email"
                className="border-zinc-700"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@hctech.com.br"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-zinc-300">Senha</Label>
              <Input
                id="pass"
                className="border-zinc-700"
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-[#00A651] hover:bg-[#008c44] text-white"
            >
              {busy ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
