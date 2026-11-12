import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/sistema/components/LoadingSpinner";

/**
 * Callback para autenticação OAuth (Google/GitHub)
 * O Supabase redireciona para esta página após login social
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Troca o código de autorização pela sessão
      const code = searchParams.get("code");
      if (!code) {
        console.error("Código OAuth não encontrado na URL");
        navigate("/sistema/login?error=oauth_no_code", { replace: true });
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Erro no callback OAuth:", error);
        navigate("/sistema/login?error=oauth_failed", { replace: true });
      } else {
        // Sucesso - redireciona para o dashboard
        navigate("/sistema", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <LoadingSpinner tamanho={32} rotulo="Finalizando autenticação..." />
        <p className="mt-4 text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}