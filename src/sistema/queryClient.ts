import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient compartilhado do módulo /sistema.
 *
 * Foi extraído de `App.tsx` para que a store (Zustand) consiga invalidar o cache
 * do TanStack Query após qualquer mutação CRUD, sem criar dependência circular
 * entre React e store.
 *
 * `staleTime: 30_000` (30s) conforme spec FASE 7 — evita refetch excessivo em
 * telas de listagem mantendo dados "frescos" o suficiente para o dashboard.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Getter usado pelo App.tsx (mantém uma única instância no app inteiro). */
export function getQueryClient(): QueryClient {
  return queryClient;
}
