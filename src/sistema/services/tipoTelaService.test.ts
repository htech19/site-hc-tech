import { describe, expect, it } from "vitest";
import { construirOpcoesTipoTela, getTelasDoModelo, type OpcaoTipoTela } from "./tipoTelaService";
import { TIPOS_TELA } from "@/sistema/data/catalogos";
import { TipoEquipamento, TipoTela } from "@/sistema/types";
import { consultarPreco } from "./precosService";

/** Nomes das qualidades oferecidas, na ordem em que o dropdown as exibe. */
const nomes = (opcoes: OpcaoTipoTela[]) => opcoes.map((o) => o.nome);

/** Preço mínimo real de cada opção. */
const precosMinimos = (opcoes: OpcaoTipoTela[]) => opcoes.map((o) => Math.min(...o.precos));

describe("opções de Tipo de Tela (Tabela de Telas)", () => {
  it("oferece para Apple + iPhone 12 apenas INCELL, JK, VIVID, OLED, AMOLED e DIAGNOSTICO", () => {
    const { opcoes } = construirOpcoesTipoTela("Apple", "iPhone 12");

    expect(nomes(opcoes)).toEqual(["INCELL", "JK", "VIVID", "OLED", "AMOLED", "DIAGNOSTICO"]);
    expect(opcoes.map((o) => o.id)).toEqual([
      TipoTela.INC,
      TipoTela.JK,
      TipoTela.VIVD,
      TipoTela.OLED,
      TipoTela.AMOLED,
      TipoTela.DIAGNOSTICO,
    ]);
    // Ordenadas pelo menor preço real da tabela.
    expect(precosMinimos(opcoes)).toEqual([220, 280, 340, 540, 640, 740]);
  });

  it("oferece para Motorola + G84 apenas INCELL e ORIGINAL", () => {
    const { opcoes } = construirOpcoesTipoTela("Motorola", "G84");

    expect(nomes(opcoes)).toEqual(["INCELL", "ORIGINAL"]);
    expect(opcoes.map((o) => o.id)).toEqual([TipoTela.INC, TipoTela.ORIGINAL]);
    // G84 tem duas linhas INCELL (R$ 200 e R$ 240) e uma ORIGINAL (R$ 400).
    expect(opcoes[0].precos).toEqual([200, 240]);
    expect(opcoes[1].precos).toEqual([400]);
  });

  it("não oferece qualidade que o modelo não possui na tabela", () => {
    const g84 = nomes(construirOpcoesTipoTela("Motorola", "G84").opcoes);
    const iphone12 = nomes(construirOpcoesTipoTela("Apple", "iPhone 12").opcoes);

    expect(g84).not.toContain("AMOLED");
    expect(g84).not.toContain("OLED");
    expect(iphone12).not.toContain("ORIGINAL");
    expect(iphone12).not.toContain("TABLET");
  });

  it("tolera variações de digitação da marca e do modelo", () => {
    const esperado = nomes(construirOpcoesTipoTela("Apple", "iPhone 12").opcoes);

    expect(nomes(construirOpcoesTipoTela("apple", "12").opcoes)).toEqual(esperado);
    expect(nomes(construirOpcoesTipoTela("iphone", "iPhone 12").opcoes)).toEqual(esperado);
    expect(nomes(construirOpcoesTipoTela("Moto", "Moto G84").opcoes)).toEqual(["INCELL", "ORIGINAL"]);
  });

  it("cai no catálogo completo quando o modelo não existe na tabela", () => {
    const { opcoes, linhas } = construirOpcoesTipoTela("Apple", "iPhone 99 Inexistente");

    expect(linhas).toEqual([]);
    expect(opcoes).toHaveLength(TIPOS_TELA.length);
    expect(nomes(opcoes)).toEqual(TIPOS_TELA.map((t) => t.nome));
    expect(opcoes.every((o) => o.precos.length === 0)).toBe(true);
  });

  it("devolve catálogo completo quando marca ou modelo ainda não foram preenchidos", () => {
    expect(construirOpcoesTipoTela("", "").opcoes).toHaveLength(TIPOS_TELA.length);
    expect(construirOpcoesTipoTela("Apple", "").opcoes).toHaveLength(TIPOS_TELA.length);
    expect(construirOpcoesTipoTela("Marca Desconhecida", "Modelo Qualquer").opcoes).toHaveLength(
      TIPOS_TELA.length
    );
  });

  it("getTelasDoModelo reconhece o modelo com prefixo de marca e ignora espaços extras", () => {
    expect(getTelasDoModelo("Apple", "iPhone 12").length).toBeGreaterThan(0);
    expect(getTelasDoModelo("  Apple  ", "  iPhone 12  ").length).toBe(
      getTelasDoModelo("Apple", "iPhone 12").length
    );
    expect(getTelasDoModelo("Apple", "iPhone 99 Inexistente")).toEqual([]);
  });

  it("garante o invariante: tudo que o dropdown oferece, a consulta de preços encontra", async () => {
    for (const [marca, modelo] of [
      ["Apple", "iPhone 12"],
      ["Motorola", "G84"],
      ["Samsung", "Galaxy S21"],
      ["Xiaomi", "Redmi Note 12"],
    ] as const) {
      const { opcoes } = construirOpcoesTipoTela(marca, modelo);
      expect(opcoes.length).toBeGreaterThan(0);

      for (const opcao of opcoes) {
        const resultado = await consultarPreco({
          tipoEquipamento: TipoEquipamento.CELULAR,
          marca,
          modelo,
          servico: "tela",
          tipoTela: opcao.id,
        });

        expect(resultado.status, `${marca} ${modelo} · ${opcao.nome}`).toBe("SUCESSO");
        expect(resultado.preco, `${marca} ${modelo} · ${opcao.nome}`).toBe(Math.min(...opcao.precos));
      }
    }
  });
});
