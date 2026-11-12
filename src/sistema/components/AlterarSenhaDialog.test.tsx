import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AlterarSenhaDialog from "./AlterarSenhaDialog";

const updateUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { updateUser: (u: unknown) => updateUser(u) } },
}));

vi.mock("@/sistema/store", () => ({
  useSistemaStore: (sel: (s: { notificar: (m: string, t: string) => void }) => unknown) =>
    sel({ notificar: vi.fn() }),
}));

function montar() {
  return render(
    <AlterarSenhaDialog open onOpenChange={vi.fn()} />
  );
}

beforeEach(() => updateUser.mockReset());

describe("AlterarSenhaDialog", () => {
  it("valida o tamanho mínimo antes de chamar o Supabase", async () => {
    montar();
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "abc" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/pelo menos 8/i);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("exige confirmação igual", async () => {
    montar();
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senhaLonga123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "senhaLonga999" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/não conferem/i);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("chama updateUser com a senha quando tudo é válido", async () => {
    updateUser.mockResolvedValue({ error: null });
    montar();
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senhaLonga123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "senhaLonga123" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ password: "senhaLonga123" }));
  });

  it("traduz o erro do GoTrue 'different from the old password'", async () => {
    updateUser.mockResolvedValue({ error: { message: "New password should be different from the old password." } });
    montar();
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senhaLonga123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "senhaLonga123" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/diferente da senha atual/i);
  });
});
