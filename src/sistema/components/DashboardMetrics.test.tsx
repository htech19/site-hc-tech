import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardMetrics } from "./DashboardMetrics";
import type { MetricasDashboard } from "@/sistema/types";

const metricas: MetricasDashboard = {
  totalOS: 12,
  concluidas: 4,
  pendentes: 3,
  emEstoque: 2,
  devolucoes: 1,
  canceladas: 0,
  emAndamento: 2,
  faturamento: 1500,
  totalClientes: 8,
  itensEstoque: 5,
};

const renderMetricas = () =>
  render(
    <MemoryRouter>
      <DashboardMetrics metricas={metricas} />
    </MemoryRouter>
  );

describe("DashboardMetrics", () => {
  it("transforma cada indicador em um link para o módulo correspondente", () => {
    renderMetricas();

    const destinos: [RegExp, string][] = [
      [/Total de OS/, "/sistema/os"],
      [/OS Ativas/, "/sistema/os?status=EM_ANDAMENTO"],
      [/Pendentes/, "/sistema/os?status=PENDENTE"],
      [/Concluídas/, "/sistema/os?status=CONCLUIDA"],
      [/Em Estoque/, "/sistema/estoque"],
      [/Devoluções/, "/sistema/devolucoes"],
      [/Faturamento/, "/sistema/relatorios"],
      [/Clientes/, "/sistema/clientes"],
    ];

    for (const [nome, href] of destinos) {
      expect(screen.getByRole("link", { name: nome })).toHaveAttribute("href", href);
    }
  });

  it("mostra os valores reais das métricas nos cards", () => {
    renderMetricas();

    expect(screen.getByRole("link", { name: /Total de OS/ })).toHaveTextContent("12");
    expect(screen.getByRole("link", { name: /OS Ativas/ })).toHaveTextContent("5");
    expect(screen.getByRole("link", { name: /Clientes/ })).toHaveTextContent("8");
    expect(screen.getByRole("link", { name: /Faturamento/ })).toHaveTextContent("1.500,00");
  });
});
