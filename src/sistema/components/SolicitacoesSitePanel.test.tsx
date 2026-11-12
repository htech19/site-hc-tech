import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SolicitacoesSitePanel } from "./SolicitacoesSitePanel";

const { recentes, resumo, vazio } = vi.hoisted(() => ({
  recentes: [
    {
      id: "s1",
      protocolo: "HC-2026-0001",
      nome: "João Souza",
      telefone: "11988887777",
      categoria: "Celular",
      marca: "Samsung",
      modelo: "A30",
      servico: "Troca de tela",
      status: "recebido",
      created_at: "2026-10-18T12:00:00.000Z",
    },
  ],
  resumo: { total: 3, recebido: 1, emAnalise: 1, aguardandoContato: 0 },
  vazio: false,
}));

vi.mock("@/integrations/supabase/sistema", () => ({
  useSolicitacoesSiteRecentes: () => ({
    data: vazio ? [] : recentes,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useResumoSolicitacoesSite: () => ({
    data: resumo,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

const renderPainel = () =>
  render(
    <MemoryRouter>
      <SolicitacoesSitePanel />
    </MemoryRouter>
  );

describe("SolicitacoesSitePanel", () => {
  it("mostra os pedidos do site no dashboard", () => {
    renderPainel();

    expect(screen.getByText("🌐 Solicitações do site")).toBeInTheDocument();
    expect(screen.getByText("HC-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("João Souza")).toBeInTheDocument();
    expect(screen.getByText("Recebido")).toBeInTheDocument();
    expect(screen.getByText("Celular Samsung A30 • Troca de tela")).toBeInTheDocument();

    const abrir = screen.getByRole("link", { name: /Abrir módulo/i });
    expect(abrir).toHaveAttribute("href", "/sistema/solicitacoes");
  });

  it("resume o funil de solicitações", () => {
    renderPainel();

    const novos = screen.getByText("Novos").closest("div");
    expect(novos?.textContent).toContain("1");
    const total = screen.getByText("Total").closest("div");
    expect(total?.textContent).toContain("3");
  });
});
