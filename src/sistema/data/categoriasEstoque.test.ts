import { describe, expect, it } from "vitest";
import { CATEGORIAS_ESTOQUE, categoriaPorValor, rotuloCategoria } from "./categoriasEstoque";

describe("catálogo de categorias de estoque (spec §2A e §4)", () => {
  it("tem os 12 grupos comerciais + aparelhos de cliente (celular e notebook)", () => {
    expect(CATEGORIAS_ESTOQUE).toHaveLength(14);
    expect(CATEGORIAS_ESTOQUE.filter((c) => !c.aparelhoDeCliente)).toHaveLength(12);
    expect(CATEGORIAS_ESTOQUE.filter((c) => c.aparelhoDeCliente)).toHaveLength(2);
    expect(categoriaPorValor("aparelho_cliente")?.aparelhoDeCliente).toBe(true);
    expect(categoriaPorValor("notebook")?.aparelhoDeCliente).toBe(true);
  });

  it("traz TODO o conteúdo de subcategorias do documento (233 itens)", () => {
    const total = CATEGORIAS_ESTOQUE.reduce((soma, c) => soma + c.subcategorias.length, 0);
    expect(total).toBe(233);
  });

  it("cada grupo tem subcategorias e nenhum valor de categoria é duplicado", () => {
    for (const c of CATEGORIAS_ESTOQUE) {
      expect(c.subcategorias.length, c.valor).toBeGreaterThan(0);
      expect(c.rotulo.trim().length).toBeGreaterThan(0);
    }
    const valores = CATEGORIAS_ESTOQUE.map((c) => c.valor);
    expect(new Set(valores).size).toBe(valores.length);
  });

  it("não repete subcategoria dentro do mesmo grupo (duplicidade case-insensitive)", () => {
    for (const c of CATEGORIAS_ESTOQUE) {
      const normalizadas = c.subcategorias.map((s) => s.toLowerCase().trim());
      expect(new Set(normalizadas).size, c.valor).toBe(normalizadas.length);
    }
  });

  it("contém subcategorias representativas do documento", () => {
    const esperadas: [string, string][] = [
      ["acessorios", "Películas hidrogel"],
      ["acessorios", "Fones TWS"],
      ["telas", "Super AMOLED"],
      ["baterias", "Flex de bateria"],
      ["cameras", "Câmera ultrawide"],
      ["carcacas", "Bandeja SIM + microSD"],
      ["flex_conectores", "Conector Lightning"],
      ["audio_vibracao", "Vibracall"],
      ["sensores_biometria", "Componentes de Face ID"],
      ["componentes_placa", "PMIC"],
      ["ferramentas_equipamentos", "Estação de ar quente"],
      ["insumos_consumiveis", "Cola B7000"],
      ["testes_diagnostico", "Cabos de programação"],
      ["aparelho_cliente", "Aguardando peças"],
    ];
    for (const [valor, sub] of esperadas) {
      expect(categoriaPorValor(valor)?.subcategorias, `${valor} → ${sub}`).toContain(sub);
    }
  });

  it("rotuloCategoria devolve o rótulo amigável e lida com valores desconhecidos", () => {
    expect(rotuloCategoria("telas")).toBe("Telas e displays");
    expect(rotuloCategoria("")).toBe("");
    expect(rotuloCategoria(null)).toBe("");
    expect(rotuloCategoria("valor_inexistente")).toBe("valor_inexistente");
  });
});
