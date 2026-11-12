import { memo, useEffect, useState } from "react";
import { useSistemaAuth } from "@/sistema/auth";
import SistemaClientesPage from "./SistemaClientesPage";

const SistemaAdminClientesPage = () => {
  const { session, loading } = useSistemaAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-foreground">Carregando...</span>
      </div>
    );
  }

  if (!session) {
    return <div className="text-center p-8"><p>Acesso negado. Faça login.</p></div>;
  }

  // Admin check - session user role
  // Note: This is a basic check; real app would use RLS policies
  return <SistemaClientesPage />;
};

export default SistemaAdminClientesPage;