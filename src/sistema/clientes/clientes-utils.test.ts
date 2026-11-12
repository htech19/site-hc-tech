import { describe, expect, it } from "vitest";
import { buildClientesSearchFilter, clienteFormVazio, descreverDuplicidades, parseClientesCsv, parseClientesTabela, serializeClientesCsv, validarCliente, type ClienteResumo } from "./clientes-utils";
import { parseSpreadsheetML, toExcelXML } from "./utils";
import type { Cliente } from "@/sistema/os-shared";

describe("utilitários de Clientes", () => {
  it("lê CSV com cabeçalho CRM, acentos e campos entre aspas", () => {
    const [linha] = parseClientesCsv('Nome;CPF;Telefone;E-mail;Cidade;Tags\r\n"Ana, Silva";529.982.247-25;(11) 99999-0000;ana@example.com;SBC;recorrente|vip');
    expect(linha).toMatchObject({
      linha: 2,
      cliente: { nome: "Ana, Silva", documento: "529.982.247-25", cidade: "SBC", tags: ["recorrente", "vip"] },
      erros: [],
      duplicado: null,
    });
  });

  it("valida CPF, telefone e e-mail com relatório por linha", () => {
    const [linha] = parseClientesCsv("Nome,CPF,Telefone,E-mail\nAna,11111111111,123,nao-e-mail");
    expect(linha.linha).toBe(2);
    expect(linha.erros).toEqual(expect.arrayContaining(["CPF inválido.", "Telefone deve ter DDD e 10 ou 11 dígitos.", "E-mail inválido."]));
  });

  it("rejeita CSV com aspas não fechadas", () => {
    expect(() => parseClientesCsv('Nome;Telefone;Observações\nAna;11999990000;"campo sem fechamento')).toThrow("CSV inválido");
  });

  it("rejeita telefone ausente e tipo de pessoa desconhecido", () => {
    const [semTelefone] = parseClientesCsv("Nome,Telefone\nAna,");
    const [tipoInvalido] = parseClientesCsv("Nome,Telefone,Tipo\nAna,11999990000,Empresa");
    expect(semTelefone.erros).toContain("Telefone é obrigatório.");
    expect(tipoInvalido.erros).toContain("Tipo de pessoa deve ser PF ou PJ.");
  });

  it("importa uma tabela já convertida de Excel com as mesmas validações", () => {
    const linhas = parseClientesTabela([
      ["Nome", "Telefone"],
      ["Ana", "11999990000"],
      ["", ""],
    ]);
    expect(linhas[0].cliente.nome).toBe("Ana");
    expect(linhas[0].erros).toEqual([]);
    expect(linhas[1].erros).toContain("Nome é obrigatório.");
  });

  it("exporta e reimporta SpreadsheetML (.xls) sem perder colunas", () => {
    const xml = toExcelXML([
      ["Nome", "Telefone"],
      ["Ana", "11999990000"],
    ]);
    const tabela = parseSpreadsheetML(xml);
    expect(tabela[0]).toEqual(["Nome", "Telefone"]);
    const [linha] = parseClientesTabela(tabela);
    expect(linha.cliente.nome).toBe("Ana");
    expect(linha.erros).toEqual([]);
  });

  it("identifica duplicidades por documento dentro do arquivo", () => {
    const linhas = parseClientesCsv("nome;cpf\nAna;52998224725\nAna repetida;529.982.247-25");
    expect(linhas[0].duplicado).toBeNull();
    expect(linhas[1].duplicado).toContain("linha 2");
  });

  it("identifica duplicidade entre telefone secundário e WhatsApp", () => {
    const linhas = parseClientesCsv("nome;telefone;telefone 2;whatsapp\nAna;11911112222;5511999990000;\nBia;11999990000;;");
    expect(linhas[1].duplicado).toContain("linha 2");
  });

  it("importa os campos CRM e aliases de status exportados", () => {
    const [linha] = parseClientesCsv("Nome;Tipo;CPF/CNPJ;RG / IE;Nome fantasia;Data de nascimento;Telefone;Telefone 2;Complemento;Status;Motivo do bloqueio\nOficina;PJ;04.252.011/0001-10;IE-1;Oficina ABC;;1133334444;11988887777;Sala 2;bloqueado;Cadastro solicitado");
    expect(linha.cliente).toMatchObject({
      tipo_pessoa: "PJ",
      rg_ie: "IE-1",
      nome_fantasia: "Oficina ABC",
      telefone2: "11988887777",
      complemento: "Sala 2",
      status: "bloqueado",
      motivo_bloqueio: "Cadastro solicitado",
    });
    expect(linha.erros).toEqual([]);
  });

  it("exporta todos os campos com BOM UTF-8 e escape CSV", () => {
    const cliente: ClienteResumo = {
      ...clienteFormVazio(), id: "1", created_at: "2026-10-13", updated_at: "2026-10-13",
      consentimento_lgpd: false, consentimento_data: null, aceita_whatsapp: true, aceita_email: true,
      aceita_sms: false, aceita_marketing: false, classificacao: null, limite_credito: 0,
      totalOS: 0, ultimaOS: null,
    };
    cliente.nome = 'Ana "A"; Silva';
    cliente.observacoes = "linha 1\rlinha 2";
    expect(serializeClientesCsv([cliente])).toMatch(/^\uFEFF/);
    expect(serializeClientesCsv([cliente])).toContain('"Ana ""A""; Silva"');
    expect(serializeClientesCsv([cliente])).toContain('"linha 1\rlinha 2"');
    expect(serializeClientesCsv([cliente])).toContain("CPF/CNPJ");
    expect(serializeClientesCsv([cliente])).not.toContain("user_id");
  });

  it("pesquisa nos campos CRM e combina busca numérica mascarada", () => {
    const filtro = buildClientesSearchFilter("529.982.247-25");
    expect(filtro).toContain("documento.ilike");
    expect(filtro).toContain("email.ilike");
    expect(buildClientesSearchFilter("11999990000")).toContain("telefone.ilike.\"%(11) 99999-0000%\"");
  });

  it("valida formulário e motivo exigido para bloqueio", () => {
    const cliente = { ...clienteFormVazio(), nome: "Ana", telefone: "(11) 99999-0000", status: "bloqueado" as const };
    expect(validarCliente(cliente)).toContain("Informe o motivo do bloqueio.");
    expect(validarCliente({ ...cliente, motivo_bloqueio: "Solicitação do cliente" })).toEqual([]);
  });

  it("detecta duplicidade de telefone secundário com DDI no cadastro existente", () => {
    const existente: Cliente = {
      ...clienteFormVazio(), id: "existente", nome: "Ana existente", created_at: "2026-01-01", updated_at: "2026-01-01",
      consentimento_lgpd: false, consentimento_data: null, aceita_whatsapp: true, aceita_email: true,
      aceita_sms: false, aceita_marketing: false, classificacao: null, limite_credito: 0,
      telefone2: "+55 (11) 99999-0000",
    };
    const duplicidades = descreverDuplicidades({ ...clienteFormVazio(), nome: "Ana", telefone: "(11) 99999-0000" }, [existente]);
    expect(duplicidades).toEqual(["Ana existente (telefone)"]);
  });
});