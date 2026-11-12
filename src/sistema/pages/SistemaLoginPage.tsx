import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSistemaAuth } from "@/sistema/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, Github, Chrome } from "lucide-react";

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

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setBusy(true);
    setErr(null);
    const redirectTo = `${window.location.origin}/sistema/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    
    setBusy(false);
    if (error) {
      setErr(`Erro ao conectar com ${provider}: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-lg border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            HC <span className="text-primary">TECH</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">Acesso ao sistema interno</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Botões de login social */}
          <div className="space-y-2 mb-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleOAuthLogin("google")}
              disabled={busy}
            >
              <Chrome className="h-4 w-4" />
              Continuar com Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleOAuthLogin("github")}
              disabled={busy}
            >
              <Github className="h-4 w-4" />
              Continuar com GitHub
            </Button>
          </div>
          
          {/* Divisor */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <Input
                id="email"
                className="border-input bg-background"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@hctech.com.br"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-foreground">Senha</Label>
              <Input
                id="pass"
                className="border-input bg-background"
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {busy ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
