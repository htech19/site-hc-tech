import { describe, expect, it } from "vitest";
import { buildClientesSearchFilter, parseClientesCsv, serializeClientesCsv, type ClienteResumo } from "./clientes-utils";

describe("utilitários de Clientes", () => {
  it("lê CSV separado por ponto e vírgula com campos entre aspas", () => {
    expect(parseClientesCsv('nome;telefone;email\r\n"Ana, Silva";11999990000;ana@example.com')).toEqual([
      { nome: "Ana, Silva", telefone: "11999990000", email: "ana@example.com" },
    ]);
  });

  it("rejeita linhas sem nome ou telefone", () => {
    expect(() => parseClientesCsv("nome,telefone\nAna,")).toThrow("Linha 2");
  });

  it("escapa aspas e separadores ao exportar", () => {
    const cliente: ClienteResumo = { id: "1", nome: 'Ana "A"; Silva', telefone: "11999990000", email: null, created_at: "2026-10-13", totalOS: 0, ultimaOS: null };
    expect(serializeClientesCsv([cliente])).toContain('"Ana ""A""; Silva"');
  });

  it("mantém caracteres de busca dentro dos valores do filtro", () => {
    expect(buildClientesSearchFilter('ana,"x')).toBe('nome.ilike."%ana,\\"x%",telefone.ilike."%ana,\\"x%",email.ilike."%ana,\\"x%"');
  });
});