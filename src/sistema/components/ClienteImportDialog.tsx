import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseClientesCsv, parseClientesTabela, type ClienteFormData, type ClienteImportacaoLinha } from "@/sistema/clientes/clientes-utils";
import { parseSpreadsheetML, parseXLSX } from "@/sistema/clientes/utils";

const EXTENSOES_ACEITAS = /\\.(csv|xlsx|xls)$/i;

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoChecarDuplicados: (linhas: ClienteImportacaoLinha[]) => Promise<Map<number, string>>;
  aoImportar: (clientes: ClienteFormData[]) => Promise<void>;
}

export function ClienteImportDialog({ aberto, aoFechar, aoChecarDuplicados, aoImportar }: Props) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<ClienteImportacaoLinha[]>([]);
  const [erroArquivo, setErroArquivo] = useState("");
  const [lendo, setLendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const elegiveis = useMemo(() => linhas.filter((linha) => linha.erros.length === 0 && !linha.duplicado), [linhas]);
  const comErro = linhas.filter((linha) => linha.erros.length > 0).length;
  const duplicados = linhas.filter((linha) => linha.duplicado).length;

  const selecionarArquivo = async (arquivo?: File) => {
    setLinhas([]);
    setErroArquivo("");
    if (!arquivo) return;
    if (arquivo.size > 10 * 1024 * 1024) {
      setErroArquivo("O arquivo deve ter no máximo 10 MB.");
      if (arquivoRef.current) arquivoRef.current.value = "";
      return;
    }
    if (!EXTENSOES_ACEITAS.test(arquivo.name)) {
      setErroArquivo("Formato não suportado. Envie um arquivo .csv, .xlsx ou .xls.");
      if (arquivoRef.current) arquivoRef.current.value = "";
      return;
    }
    setLendo(true);
    try {
      const nome = arquivo.name.toLowerCase();
      // Cada formato é convertido para a MESMA tabela e validado pelo mesmo
      // caminho (`parseClientesTabela`) — nada de regra duplicada por formato.
      const parsed = nome.endsWith(".xlsx")
        ? parseClientesTabela(await parseXLSX(await arquivo.arrayBuffer()))
        : nome.endsWith(".xls")
          ? parseClientesTabela(parseSpreadsheetML(await arquivo.text()))
          : parseClientesCsv(await arquivo.text());
      const candidatas = parsed.filter((linha) => linha.erros.length === 0);
      const encontradas = await aoChecarDuplicados(candidatas);
      setLinhas(parsed.map((linha) => ({ ...linha, duplicado: encontradas.get(linha.linha) ?? linha.duplicado })));
    } catch (erro) {
      setErroArquivo(erro instanceof Error ? erro.message : "Não foi possível analisar o arquivo.");
    } finally {
      setLendo(false);
      if (arquivoRef.current) arquivoRef.current.value = "";
    }
  };

  const importar = async () => {
    if (elegiveis.length === 0) return;
    setSalvando(true);
    setErroArquivo("");
    try {
      await aoImportar(elegiveis.map((linha) => linha.cliente));
      setLinhas([]);
      aoFechar();
    } catch (erro) {
      setErroArquivo(erro instanceof Error ? erro.message : "Falha ao gravar os registros.");
    } finally {
      setSalvando(false);
    }
  };

  const fechar = () => {
    if (lendo || salvando) return;
    setLinhas([]);
    setErroArquivo("");
    aoFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) fechar(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-700 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar clientes (CSV ou Excel)</DialogTitle>
          <DialogDescription>Valide e revise os registros antes de gravar. Importações aceitam até 500 linhas por arquivo — CSV, XLSX ou XLS.</DialogDescription>
        </DialogHeader>
        <label htmlFor="clientes-csv" className="text-sm font-medium">Arquivo CSV, XLSX ou XLS</label>
        <input ref={arquivoRef} id="clientes-csv" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={lendo || salvando} onChange={(event) => void selecionarArquivo(event.currentTarget.files?.[0])} className="block w-full rounded-md border border-zinc-700 p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-2" />
        {lendo && <p role="status" className="text-sm text-zinc-500">Analisando registros e verificando duplicidades...</p>}
        {erroArquivo && <p role="alert" className="rounded-md border border-rose-900/60 bg-rose-950/50 p-3 text-sm text-rose-200">{erroArquivo}</p>}
        {linhas.length > 0 && <>
          <p className="text-sm text-zinc-300">{elegiveis.length} prontos para importar; {duplicados} duplicados serão ignorados e {comErro} linhas contêm erros. A gravação inclui somente registros válidos e únicos.</p>
          <div className="max-h-[45vh] overflow-auto rounded-md border border-zinc-700">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-zinc-800 text-xs uppercase text-zinc-400"><tr><th className="px-3 py-2">Linha</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Documento</th><th className="px-3 py-2">Telefone</th><th className="px-3 py-2">Resultado</th></tr></thead>
              <tbody className="divide-y divide-zinc-800">{linhas.map((linha) => <tr key={linha.linha} className={linha.erros.length || linha.duplicado ? "bg-amber-500/10" : ""}>
                <td className="px-3 py-2">{linha.linha}</td><td className="px-3 py-2">{linha.cliente.nome || "—"}</td><td className="px-3 py-2">{linha.cliente.documento || "—"}</td><td className="px-3 py-2">{linha.cliente.telefone || "—"}</td>
                <td className="max-w-[320px] px-3 py-2 text-xs">{linha.erros.length ? linha.erros.join(" ") : linha.duplicado ?? "Pronto"}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={lendo || salvando} onClick={fechar}>Cancelar</Button>
          <Button type="button" disabled={lendo || salvando || elegiveis.length === 0} onClick={() => void importar()} className="bg-[#00A651] text-white hover:bg-[#008c44]">{salvando ? "Importando..." : `Importar ${elegiveis.length} cliente(s)`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}