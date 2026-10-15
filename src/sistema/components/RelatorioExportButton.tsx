import { memo, useCallback } from "react";
import { Download } from "lucide-react";
import { formatBRL, formatData, osNum } from "@/sistema/os-shared";
import { ROTULO_STATUS, type OrdemServico } from "@/sistema/types";

interface Props {
  linhas: OrdemServico[];
  /** Nome base do arquivo (sem extensão). */
  nomeArquivo?: string;
  disabled?: boolean;
}

const CABECALHO = [
  "OS",
  "Data Entrada",
  "Data Conclusão",
  "Cliente",
  "Telefone",
  "Aparelho",
  "Quantidade",
  "Defeito",
  "Status",
  "Valor Orçado",
  "Observação",
];

/** Escapa um campo CSV (aspas duplas + separador `;` do Excel PT-BR). */
function escapar(campo: string | number): string {
  const texto = String(campo ?? "");
  if (texto.includes(";") || texto.includes('"') || texto.includes("\n")) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Botão "Exportar CSV" — gera o arquivo com Blob + download nativo.
 * BOM UTF-8 incluído para o Excel reconhecer acentos corretamente.
 */
export const RelatorioExportButton = memo(function RelatorioExportButton({
  linhas,
  nomeArquivo = "relatorio-geral",
  disabled,
}: Props) {
  const exportar = useCallback(() => {
    if (linhas.length === 0) return;

    const corpo = linhas.map((o) =>
      [
        osNum(o.numero),
        formatData(o.dataEntrada),
        o.dataConclusao ? formatData(o.dataConclusao) : "",
        o.clienteNome ?? "",
        o.telefone ?? "",
        o.aparelho,
        o.quantidade,
        o.defeito,
        ROTULO_STATUS[o.status],
        formatBRL(o.valorOrcado).replace("R$", "").trim(),
        o.observacao ?? "",
      ]
        .map(escapar)
        .join(";")
    );

    const csv = [CABECALHO.join(";"), ...corpo].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [linhas, nomeArquivo]);

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={disabled || linhas.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#00FF88] hover:text-[#00FF88] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Download size={15} aria-hidden />
      Exportar CSV
    </button>
  );
});

export default RelatorioExportButton;
