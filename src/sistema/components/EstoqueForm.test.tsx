import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EstoqueForm } from "./EstoqueForm";
import { CATEGORIAS_ESTOQUE } from "@/sistema/data/categoriasEstoque";

const abrir = () => render(<EstoqueForm aberto aoFechar={() => {}} />);

describe("EstoqueForm — passo 1 (cards de tipo de item)", () => {
  it("apresenta um card para cada categoria do documento", async () => {
    abrir();
    expect(screen.getByText("Selecione o tipo de item")).toBeInTheDocument();

    for (const c of CATEGORIAS_ESTOQUE) {
      expect(screen.getByRole("button", { name: new RegExp(c.rotulo) })).toBeInTheDocument();
    }
    // 13 cards = 12 grupos comerciais + aparelho de cliente
    expect(CATEGORIAS_ESTOQUE).toHaveLength(13);
  });

  it("bloqueia Continuar até que uma categoria seja escolhida", () => {
    abrir();
    const continuar = screen.getByRole("button", { name: /Continuar/ });
    expect(continuar).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Acessórios/ }));
    expect(continuar).toBeEnabled();
    expect(screen.getByRole("button", { name: /Acessórios/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("mostra o campo de subcategoria pesquisável depois de escolher o card", () => {
    abrir();
    expect(screen.queryByText(/Subcategoria \(opcional\)/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Telas e displays/ }));
    expect(screen.getByText("Subcategoria (opcional)")).toBeInTheDocument();
  });
});

describe("EstoqueForm — passo 2 (marca/modelo, lógica do orçamento)", () => {
  const abrirPasso2 = () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: /Acessórios/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));
  };

  it("abre a lista de marcas no foco e compõe o Aparelho ao escolher marca + modelo", () => {
    abrirPasso2();

    const marcaInput = screen.getByLabelText(/^Marca/);
    fireEvent.focus(marcaInput);
    // Lista das bases do orçamento (MARCAS_CELULAR ∪ MARCAS_NOTEBOOK)
    expect(screen.getAllByRole("option").length).toBeGreaterThan(10);
    fireEvent.mouseDown(screen.getAllByRole("option", { name: "Samsung" })[0]);
    expect(marcaInput).toHaveValue("Samsung");

    const modeloInput = screen.getByLabelText(/^Modelo/);
    fireEvent.focus(modeloInput);
    // Lista de modelos filtrada pela marca escolhida
    expect(
      screen.getAllByRole("option").some((o) => o.textContent?.includes("Galaxy A54")),
    ).toBe(true);
    fireEvent.mouseDown(screen.getAllByRole("option", { name: /Galaxy A54/ })[0]);

    expect(screen.getByLabelText(/^Aparelho/)).toHaveValue("Samsung Galaxy A54");
  });

  it("escolher marca na lista recompõe o Aparelho (ação explícita = autoritativa)", () => {
    abrirPasso2();
    fireEvent.change(screen.getByLabelText(/^Aparelho/), { target: { value: "m54" } });

    fireEvent.focus(screen.getByLabelText(/^Marca/));
    fireEvent.mouseDown(screen.getAllByRole("option", { name: "Motorola" })[0]);

    expect(screen.getByLabelText(/^Aparelho/)).toHaveValue("Motorola");
  });

  it("digitou Aparelho à mão → digitar modelo não sobrescreve o texto manual", () => {
    abrirPasso2();
    const aparelho = screen.getByLabelText(/^Aparelho/);
    fireEvent.change(aparelho, { target: { value: "m54" } });

    fireEvent.change(screen.getByLabelText(/^Modelo/), { target: { value: "G84" } });

    expect(aparelho).toHaveValue("m54");
  });
});

describe("EstoqueForm — passo 2 (dados do item)", () => {
  it("avança com os campos de sempre e a categoria como referência", () => {
    abrir();

    fireEvent.click(screen.getByRole("button", { name: /Acessórios/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));

    // Referência da categoria escolhida + link de alterar
    expect(screen.getByText("Acessórios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alterar tipo de item/ })).toBeInTheDocument();

    // Campos originais preservados
    expect(screen.getByLabelText(/Aparelho/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantidade/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Defeito/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Condição/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Observação/)).toBeInTheDocument();
  });

  it("volta ao passo 1 sem perder a categoria escolhida", () => {
    abrir();

    fireEvent.click(screen.getByRole("button", { name: /Ferramentas/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(screen.getByText("Ferramentas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Alterar tipo de item/ }));
    expect(screen.getByText("Selecione o tipo de item")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ferramentas/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
