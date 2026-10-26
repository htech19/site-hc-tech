import { memo, useCallback, useState, useEffect } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "./Modal";
import { FormInput, FormTextarea } from "./FormInput";
import { useSistemaStore } from "@/sistema/store";
import type { EstoqueItem } from "@/sistema/types";

export type TipoMovimentacao = "ENTRADA" | "SAIDA";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  item: EstoqueItem | null;
  tipoInicial?: TipoMovimentacao;
}

const MOTIVOS_ENTRADA = [
  "Compra de fornecedor",
  "Devolução de cliente",
  "Devolução Mercado Livre",
  "Retorno de garantia",
  "Ajuste positivo de inventário",
  "Entrada inicial de lote",
];

const MOTIVOS_SAIDA = [
  "Venda na loja física (balcão)",
  "Venda Mercado Livre",
  "Consumo em Ordem de Serviço (peça)",
  "Devolução ao fornecedor / garantia",
  "Perda, dano ou avaria técnica",
  "Ajuste negativo de inventário",
];

export const EstoqueMovimentacaoModal = memo(function EstoqueMovimentacaoModal({
  aberto,
  aoFechar,
  item,
  tipoInicial = "ENTRADA",
}: Props) {
  const registrarMovimentacaoEstoque = useSistemaStore((s) => s.registrarMovimentacaoEstoque);

  const [tipo, setTipo] = useState<TipoMovimentacao>(tipoInicial);
  const [quantidade, setQuantidade] = useState("1");
  const [motivo, setMotivo] = useState(MOTIVOS_ENTRADA[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [referencia, setReferencia] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setTipo(tipoInicial);
      setQuantidade("1");
      setMotivo(tipoInicial === "ENTRADA" ? MOTIVOS_ENTRADA[0] : MOTIVOS_SAIDA[0]);
      setMotivoPersonalizado("");
      setReferencia("");
      setObservacao("");
      setErro(null);
    }
  }, [aberto, tipoInicial]);

  const aoMudarTipo = useCallback((novoTipo: TipoMovimentacao) => {
    setTipo(novoTipo);
    setMotivo(novoTipo === "ENTRADA" ? MOTIVOS_ENTRADA[0] : MOTIVOS_SAIDA[0]);
    setMotivoPersonalizado("");
    setErro(null);
  }, []);

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!item) return;

      const qtd = parseInt(quantidade, 10);
      if (Number.isNaN(qtd) || qtd <= 0) {
        setErro("A quantidade deve ser maior que zero.");
        return;
      }

      if (tipo === "SAIDA" && qtd > item.quantidade) {
        setErro(`Saldo insuficiente no estoque (${item.quantidade} disponível).`);
        return;
      }

      const motivoFinal = motivo === "OUTRO" ? motivoPersonalizado.trim() : motivo;
      if (!motivoFinal) {
        setErro("Informe o motivo da movimentação.");
        return;
      }

      const motivoComDetalhes = [
        motivoFinal,
        referencia.trim() ? `Ref: ${referencia.trim()}` : "",
        observacao.trim() ? `Obs: ${observacao.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      setSalvando(true);
      setErro(null);

      const ok = await registrarMovimentacaoEstoque({
        estoqueId: item.id,
        tipo,
        quantidade: qtd,
        motivo: motivoComDetalhes,
      });

      setSalvando(false);
      if (ok) aoFechar();
    },
    [item, quantidade, tipo, motivo, motivoPersonalizado, referencia, observacao, registrarMovimentacaoEstoque, aoFechar]
  );

  if (!item) return null;
  const listaMotivos = tipo === "ENTRADA" ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={`Movimentar Estoque — ${item.aparelho}`}
      descricao="Registre entradas e saídas mantendo histórico rastreável."
    >
      <form onSubmit={submeter} className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-100">{item.aparelho}</span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-sm text-[#00FF88]">
              {item.quantidade} un.
            </span>
          </div>
          <div className="mt-1 flex gap-3 text-[11px] text-zinc-400">
            <span>Dono: <strong className="text-zinc-200">{item.proprietario || "HC TECH"}</strong></span>
            <span>Canal: <strong className="text-zinc-200">{item.canal_de_venda || "Loja física"}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => aoMudarTipo("ENTRADA")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-bold transition ${
              tipo === "ENTRADA"
                ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
            }`}
          >
            <ArrowDownRight size={15} /> Dar Entrada (+)
          </button>
          <button
            type="button"
            onClick={() => aoMudarTipo("SAIDA")}
            className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-bold transition ${
              tipo === "SAIDA"
                ? "border-rose-500 bg-rose-500/10 text-rose-400"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
            }`}
          >
            <ArrowUpRight size={15} /> Dar Baixa / Saída (-)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput
            label={`Qtd. a ${tipo === "ENTRADA" ? "Adicionar" : "Baixar"}`}
            tipo="number"
            valor={quantidade}
            aoMudar={setQuantidade}
            obrigatorio
          />

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Motivo
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-[#00FF88] focus:outline-none"
            >
              {listaMotivos.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="OUTRO">Outro motivo...</option>
            </select>
          </div>
        </div>

        {motivo === "OUTRO" && (
          <FormInput
            label="Descreva o motivo"
            valor={motivoPersonalizado}
            aoMudar={setMotivoPersonalizado}
            obrigatorio
          />
        )}

        <FormInput
          label="Documento / Ref. (ex.: Pedido ML, OS, NF)"
          valor={referencia}
          aoMudar={setReferencia}
        />

        <FormTextarea
          label="Observação"
          valor={observacao}
          aoMudar={setObservacao}
          linhas={2}
        />

        {erro && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
            {erro}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
          <Button type="button" variant="ghost" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={salvando}
            className={tipo === "ENTRADA" ? "bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]" : "bg-rose-500 font-bold text-white hover:bg-rose-600"}
          >
            {salvando ? "Salvando..." : `Confirmar ${tipo === "ENTRADA" ? "Entrada" : "Saída"}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
});

