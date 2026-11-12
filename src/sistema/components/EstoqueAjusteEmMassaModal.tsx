import { memo, useCallback, useState } from "react";
import { AlertTriangle, CheckSquare, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";
import { useSistemaStore } from "@/sistema/store";
import { CATEGORIAS_ESTOQUE } from "@/sistema/data/categoriasEstoque";
import type { EstoqueItem } from "@/sistema/types";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  itensSelecionados: EstoqueItem[];
  aoConcluir: () => void;
}
export const EstoqueAjusteEmMassaModal = memo(function EstoqueAjusteEmMassaModal({
  aberto,
  aoFechar,
  itensSelecionados,
  aoConcluir,
}: Props) {
  const atualizarEmMassaEstoque = useSistemaStore((s) => s.atualizarEmMassaEstoque);
  const excluirEmMassaEstoque = useSistemaStore((s) => s.excluirEmMassaEstoque);

  const [acao, setAcao] = useState<"proprietario" | "canal" | "categoria" | "excluir">("proprietario");
  const [novoProprietario, setNovoProprietario] = useState("HC TECH");
  const [novoCanal, setNovoCanal] = useState("Mercado Livre");
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIAS_ESTOQUE[0]?.valor ?? "");
  const [salvando, setSalvando] = useState(false);

  const total = itensSelecionados.length;
  const ids = itensSelecionados.map((i) => i.id);

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!total) return;

      setSalvando(true);

      let ok = false;
      if (acao === "proprietario") {
        ok = await atualizarEmMassaEstoque(ids, { proprietario: novoProprietario });
      } else if (acao === "canal") {
        ok = await atualizarEmMassaEstoque(ids, { canal_de_venda: novoCanal });
      } else if (acao === "categoria") {
        ok = await atualizarEmMassaEstoque(ids, { categoria: novaCategoria });
      } else if (acao === "excluir") {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE ${total} item(ns) do estoque?`)) {
          setSalvando(false);
          return;
        }
        ok = await excluirEmMassaEstoque(ids);
      }

      setSalvando(false);
      if (ok) {
        aoConcluir();
        aoFechar();
      }
    },
    [acao, total, ids, novoProprietario, novoCanal, novaCategoria, atualizarEmMassaEstoque, excluirEmMassaEstoque, aoConcluir, aoFechar]
  );

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={`Ajuste em Massa (${total} item${total > 1 ? "s" : ""})`}
      descricao="Aplique alterações coletivas com segurança e validação."
    >
      <form onSubmit={submeter} className="space-y-4">
        <div className="rounded-xl border border-border bg-background/60 p-3 text-xs text-foreground">
          Você selecionou <strong className="text-primary">{total} item(ns)</strong>. Escolha a ação desejada abaixo:
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ação Coletiva
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setAcao("proprietario")}
              className={`rounded-lg border p-2 text-xs font-bold transition ${
                acao === "proprietario"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card/60 text-muted-foreground"
              }`}
            >
              Proprietário
            </button>
            <button
              type="button"
              onClick={() => setAcao("canal")}
              className={`rounded-lg border p-2 text-xs font-bold transition ${
                acao === "canal"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card/60 text-muted-foreground"
              }`}
            >
              Canal Venda
            </button>
            <button
              type="button"
              onClick={() => setAcao("categoria")}
              className={`rounded-lg border p-2 text-xs font-bold transition ${
                acao === "categoria"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card/60 text-muted-foreground"
              }`}
            >
              Categoria
            </button>
            <button
              type="button"
              onClick={() => setAcao("excluir")}
              className={`rounded-lg border p-2 text-xs font-bold transition ${
                acao === "excluir"
                  ? "border-rose-500 bg-rose-500/10 text-rose-400"
                  : "border-border bg-card/60 text-muted-foreground"
              }`}
            >
              Excluir
            </button>
          </div>
        </div>

        {acao === "proprietario" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Novo Proprietário para os {total} itens
            </label>
            <select
              value={novoProprietario}
              onChange={(e) => setNovoProprietario(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="HC TECH">HC TECH (Loja Própria)</option>
              <option value="Mercado Livre">Mercado Livre (Estoque Próprio ML)</option>
              <option value="FASTCELL">FASTCELL</option>
              <option value="Cliente / Assistência">Cliente / Assistência (Custódia)</option>
            </select>
          </div>
        )}

        {acao === "canal" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Novo Canal de Venda para os {total} itens
            </label>
            <select
              value={novoCanal}
              onChange={(e) => setNovoCanal(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="Loja física">Loja física (Balcão)</option>
              <option value="Mercado Livre">Mercado Livre (E-commerce)</option>
              <option value="Shopee">Shopee</option>
              <option value="WhatsApp">WhatsApp / Catálogo</option>
            </select>
          </div>
        )}

        {acao === "categoria" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nova Categoria para os {total} itens
            </label>
            <select
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {CATEGORIAS_ESTOQUE.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo} {c.aparelhoDeCliente ? "(Custódia)" : "(Venda)"}
                </option>
              ))}
            </select>
          </div>
        )}

        {acao === "excluir" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <div>
              <strong className="block font-bold">Atenção: Ação irreversível!</strong>
              Todos os {total} itens selecionados serão permanentemente excluídos do banco de dados.
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={salvando}
            className={
              acao === "excluir"
                ? "bg-rose-500 font-bold text-white hover:bg-rose-600"
                : "bg-primary font-bold text-background hover:bg-primary/90"
            }
          >
            {salvando ? "Processando..." : `Confirmar para ${total} item(ns)`}
          </Button>
        </div>
      </form>
    </Modal>
  );
});

