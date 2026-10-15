import { describe, expect, it } from "vitest";
import { detalheDoErro, estadoDaConsulta, mensagemDeErro } from "./erroConsulta";

/**
 * Erro real medido na API REST deste projeto (projeto Supabase fiwbbhrrk...):
 * a tabela `orcamentos` não existe porque a migração 0003 não foi aplicada.
 * A página mostrava "Nenhum orçamento" em vez de acusar a falha.
 */
const ERRO_PGRST205 = {
  code: "PGRST205",
  details: null,
  hint: "Perhaps you meant the table 'public.clientes'",
  message: "Could not find the table 'public.orcamentos' in the schema cache",
};

describe("mensagemDeErro", () => {
  it("explica que a tabela não existe quando o PostgREST devolve PGRST205", () => {
    const msg = mensagemDeErro(ERRO_PGRST205);

    expect(msg).toContain("não existe no banco de dados");
    expect(msg).toContain("APLICAR-0003-no-SQL-Editor.sql");
  });

  it("reconhece PGRST205 mesmo sem o campo code (só pela mensagem)", () => {
    const msg = mensagemDeErro({
      message: "Could not find the table 'public.estoque' in the schema cache",
    });

    expect(msg).toContain("não existe no banco de dados");
  });

  it("explica falha de conexão quando o navegador não alcança o banco", () => {
    const msg = mensagemDeErro(new TypeError("Failed to fetch"));

    expect(msg).toContain("Verifique sua conexão");
  });

  it("preserva o detalhe técnico em erros desconhecidos, em vez de generalizar", () => {
    const msg = mensagemDeErro({ code: "42501", message: "permission denied for table orcamentos" });

    expect(msg).toContain("42501");
    expect(msg).toContain("permission denied for table orcamentos");
  });

  it("aceita string e Error lançados diretamente", () => {
    expect(mensagemDeErro("algo quebrou")).toBe("algo quebrou");
    expect(mensagemDeErro(new Error("falha direta"))).toBe("falha direta");
  });

  it("nunca devolve string vazia", () => {
    expect(mensagemDeErro(null)).not.toBe("");
    expect(mensagemDeErro(undefined)).not.toBe("");
    expect(mensagemDeErro({})).not.toBe("");
    expect(mensagemDeErro("")).not.toBe("");
  });
});

describe("detalheDoErro", () => {
  it("junta code, message e hint para o bloco técnico", () => {
    const detalhe = detalheDoErro(ERRO_PGRST205);

    expect(detalhe).toContain("PGRST205");
    expect(detalhe).toContain("Could not find the table");
    expect(detalhe).toContain("Perhaps you meant");
  });

  it("devolve null quando não há nada a mostrar", () => {
    expect(detalheDoErro(null)).toBeNull();
    expect(detalheDoErro({})).toBeNull();
  });
});

describe("estadoDaConsulta", () => {
  /**
   * O bug que este helper corrige: com `isLoading` (isPending && isFetching) uma
   * consulta PAUSADA por falta de rede aparecia como lista vazia, porque
   * `isFetching` é `false` enquanto pausada.
   */
  const pausada = {
    isPending: true,
    isError: false,
    error: null,
    isPaused: true,
  };

  it("não trata consulta PAUSADA como vazia: ela está carregando", () => {
    const estado = estadoDaConsulta(pausada);

    expect(estado.carregando).toBe(true);
    expect(estado.pausada).toBe(true);
    expect(estado.erro).toBeUndefined();
  });

  it("trata busca em andamento (não pausada) como carregando", () => {
    const estado = estadoDaConsulta({ isPending: true, isError: false, error: null, isPaused: false });

    expect(estado.carregando).toBe(true);
    expect(estado.pausada).toBe(false);
  });

  it("considera consulta pausada mesmo sem a flag explícita de pausa", () => {
    const estado = estadoDaConsulta({ isPending: true, isError: false, error: null });

    expect(estado.carregando).toBe(true);
    expect(estado.pausada).toBe(false);
  });

  it("só libera o estado vazio quando a consulta assentou COM SUCESSO", () => {
    const estado = estadoDaConsulta({ isPending: false, isError: false, error: null, isPaused: false });

    expect(estado.carregando).toBe(false);
    expect(estado.pausada).toBe(false);
    expect(estado.erro).toBeUndefined();
  });

  it("devolve o erro quando a consulta falhou, sem ficar presa em carregando", () => {
    const estado = estadoDaConsulta({
      isPending: false,
      isError: true,
      error: ERRO_PGRST205,
      isPaused: false,
    });

    expect(estado.carregando).toBe(false);
    expect(estado.erro).toBe(ERRO_PGRST205);
  });

  it("nunca devolve erro enquanto a consulta ainda não assentou", () => {
    expect(estadoDaConsulta(pausada).erro).toBeUndefined();
    expect(estadoDaConsulta({ isPending: true, isError: false, error: ERRO_PGRST205 }).erro).toBeUndefined();
  });
});
