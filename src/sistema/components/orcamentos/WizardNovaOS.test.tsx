import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WizardNovaOS from "./WizardNovaOS";

// O wizard usa a store e a lista de clientes do sistema. Nos testes, ambos são
// substituídos: o objetivo é validar o fluxo e o payload, não o Supabase.
const { criarOS, clientes } = vi.hoisted(() => ({
  criarOS: vi.fn(),
  clientes: [
    { id: "c1", nome: "Maria Silva", telefone: "11999998888" },
    { id: "c2", nome: "João Souza", telefone: "11888887777" },
  ],
}));

vi.mock("@/integrations/supabase/sistema", () => ({
  useClientesLeves: () => ({ data: clientes, isPending: false }),
}));

vi.mock("@/sistema/store", () => ({
  useSistemaStore: (selector: (s: { criarOSDeSolicitacao: typeof criarOS }) => unknown) =>
    selector({ criarOSDeSolicitacao: criarOS }),
}));

describe("WizardNovaOS", () => {
  beforeEach(() => {
    criarOS.mockReset();
    criarOS.mockResolvedValue({ id: "os-1", numero: 42 });
  });

  it("oferece as quatro categorias pedidas", () => {
    render(<MemoryRouter><WizardNovaOS onClose={() => {}} /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /Nova OS/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cliente cadastrado/i })).toBeInTheDocument();

    // Avança com o cliente já resolvido por uma seleção programática da lista.
    fireEvent.focus(screen.getByPlaceholderText("Buscar por nome ou telefone..."));
    const maria = screen
      .getAllByRole("option")
      .find((o) => o.textContent?.includes("Maria Silva"));
    expect(maria).toBeTruthy();
    fireEvent.mouseDown(maria!);
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(screen.getByRole("button", { name: /Celular/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Notebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desktop/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Outro/i })).toBeInTheDocument();
  });

  it("lista os modelos da tabela de telas e cria a OS com o cliente da base", async () => {
    const onClose = vi.fn();
    render(<MemoryRouter><WizardNovaOS onClose={onClose} /></MemoryRouter>);

    // Etapa 1 — cliente cadastrado
    fireEvent.focus(screen.getByPlaceholderText("Buscar por nome ou telefone..."));
    const maria = screen
      .getAllByRole("option")
      .find((o) => o.textContent?.includes("Maria Silva"));
    fireEvent.mouseDown(maria!);
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Etapa 2 — celular Samsung A30 (modelo presente na Tabela de Telas)
    fireEvent.click(screen.getByRole("button", { name: /Celular/i }));
    fireEvent.change(screen.getByPlaceholderText("Ex: Samsung, Apple, Dell..."), {
      target: { value: "Samsung" },
    });

    const campoModelo = screen.getByPlaceholderText("Ex: A30, iPhone 12, Moto G84...");
    fireEvent.focus(campoModelo);
    fireEvent.change(campoModelo, { target: { value: "A30 C/A" } });

    const opcoesModelo = screen.getAllByRole("option");
    // O texto da opção é o rótulo ("A30 C/A") + a marca ("Samsung").
    const a30 = opcoesModelo.find((o) => o.querySelector("span")?.textContent === "A30 C/A");
    expect(a30).toBeTruthy();
    fireEvent.mouseDown(a30!);

    // A lista precisa ter vindo da Tabela de Telas (marca Samsung no detalhe).
    expect(a30!.textContent).toContain("Samsung");

    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    // Etapa 3 — defeito e envio
    fireEvent.change(screen.getByPlaceholderText("Descreva o problema relatado pelo cliente..."), {
      target: { value: "Tela quebrada após queda" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Criar OS/i }));

    await waitFor(() => expect(criarOS).toHaveBeenCalledTimes(1));
    expect(criarOS).toHaveBeenCalledWith(
      expect.objectContaining({
        aparelho: "Samsung A30 C/A",
        marca: "Samsung",
        clienteId: "c1",
        telefone: "11999998888",
        defeito: "Tela quebrada após queda",
        quantidade: "1",
      })
    );

    expect(await screen.findByText(/OS #0042/)).toBeInTheDocument();
  });

  it("exige aviso para cliente avulso sem telefone", () => {
    render(<MemoryRouter><WizardNovaOS onClose={() => {}} /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /Cliente avulso/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome completo"), {
      target: { value: "Carlos Pereira" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/telefone com DDD/i);
  });
});
