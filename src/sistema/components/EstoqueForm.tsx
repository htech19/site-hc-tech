import { memo, useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableSelectOptions } from "@/components/ui/searchable-select";
import { FormInput, FormTextarea } from "./FormInput";
import { Modal } from "./Modal";
import {
  ComboBusca,
  type ComboBuscaOpcao,
  normalizarBusca,
} from "@/sistema/components/ComboBusca";
import { FORMULARIO_ESTOQUE_VAZIO, useSistemaStore } from "@/sistema/store";
import type { EstoqueItem } from "@/sistema/types";
import { CATEGORIAS_ESTOQUE, categoriaPorValor } from "@/sistema/data/categoriasEstoque";
import { telas } from "@/sistema/data/telas";
import { MARCAS_CELULAR, MARCAS_NOTEBOOK, MODELOS_POR_MARCA } from "@/sistema/data/catalogos";

type Form = typeof FORMULARIO_ESTOQUE_VAZIO;
type Erros = Partial<Record<keyof Form, string>>;

function validar(form: Form): Erros {
  const erros: Erros = {};
  if (!form.categoria.trim()) erros.categoria = "Selecione o tipo de item.";
  if (!form.aparelho.trim()) erros.aparelho = "Informe o aparelho.";
  const qtd = parseInt(form.quantidade, 10);
  if (Number.isNaN(qtd) || qtd < 1) erros.quantidade = "Mínimo 1.";
  return erros;
}

// -----------------------------------------------------------------------------
// MARCA/MODELO — mesmas bases da tela de Novo Orçamento / Nova OS
// (WizardNovaOS): marcas de celular + notebook e modelos da Tabela de Telas +
// catálogo interno. As listas são apenas sugestões — o usuário pode digitar
// qualquer valor (regra do spec: digitação livre quando fizer sentido).
// -----------------------------------------------------------------------------

const MARCAS_OPCOES: ComboBuscaOpcao[] = Array.from(
  new Set([...MARCAS_CELULAR, ...MARCAS_NOTEBOOK]),
)
  .sort((a, b) => a.localeCompare(b, "pt-BR"))
  .map((m) => ({ valor: m, rotulo: m }));

const MODELOS_TELA: ComboBuscaOpcao[] = (() => {
  const vistos = new Set<string>();
  const lista: ComboBuscaOpcao[] = [];
  for (const t of telas) {
    const chave = `${t.marca}|${t.modelo}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push({ valor: t.modelo.trim(), rotulo: t.modelo.trim(), detalhe: t.marca });
  }
  return lista;
})();

const MODELOS_CATALOGO: ComboBuscaOpcao[] = Object.entries(MODELOS_POR_MARCA).flatMap(
  ([marca, modelos]) =>
    modelos.map((modelo) => ({ valor: modelo, rotulo: modelo, detalhe: marca })),
);

/** Todos os modelos sem repetir marca+modelo (Tabela de Telas + catálogo). */
const MODELOS_TODOS: ComboBuscaOpcao[] = (() => {
  const vistos = new Set<string>();
  const lista: ComboBuscaOpcao[] = [];
  for (const o of [...MODELOS_TELA, ...MODELOS_CATALOGO]) {
    const chave = `${normalizarBusca(o.detalhe ?? "")}|${normalizarBusca(o.valor)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push(o);
  }
  return lista.sort(
    (a, b) =>
      (a.detalhe ?? "").localeCompare(b.detalhe ?? "", "pt-BR") ||
      a.rotulo.localeCompare(b.rotulo, "pt-BR"),
  );
})();

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  editando?: EstoqueItem | null;
}

/**
 * Modal de entrada/saída (cadastro/edição) de item de estoque.
 *
 * Fluxo em 2 passos, com a mesma engenharia da tela de Novo Orçamento:
 * - Passo 1: cards de "tipo de item" (catálogo completo §4 do spec +
 *   "Aparelho de cliente" do §2A) + subcategoria pesquisável;
 * - Passo 2: campos de sempre (aparelho, quantidade, defeito, condição,
 *   observação) com a categoria escolhida exibida como referência.
 */
export const EstoqueForm = memo(function EstoqueForm({
  aberto,
  aoFechar,
  editando,
}: Props) {
  const criarItemEstoque = useSistemaStore((s) => s.criarItemEstoque);
  const atualizarItemEstoque = useSistemaStore((s) => s.atualizarItemEstoque);

  const [form, setForm] = useState<Form>(FORMULARIO_ESTOQUE_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);
  const [idCarregado, setIdCarregado] = useState<string | null>(null);
  const [passo, setPasso] = useState<1 | 2>(1);
  // Subcategorias criadas nesta sessão (cadastro inline sem sair do form).
  const [subcategoriasExtras, setSubcategoriasExtras] = useState<string[]>([]);
  // Marca/modelo — mesma lógica da tela de orçamento (dropdown pesquisável).
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  // Último Aparelho preenchido automaticamente por marca/modelo: serve para a
  // digitação livre (no campo Aparelho ou no modelo) nunca apagar texto manual.
  const [aparelhoComposto, setAparelhoComposto] = useState("");

  if (aberto && editando && idCarregado !== editando.id) {
    setIdCarregado(editando.id);
    setErros({});
    setPasso(1);
    setForm({
      aparelho: editando.aparelho,
      quantidade: String(editando.quantidade),
      defeito: editando.defeito ?? "",
      condicao: editando.condicao ?? "",
      observacao: editando.observacao ?? "",
      proprietario: editando.proprietario ?? "HC TECH",
      canal_de_venda: editando.canal_de_venda ?? "Loja física",
      categoria: editando.categoria ?? "",
      subcategoria: editando.subcategoria ?? "",
      sku: editando.sku ?? "",
      preco_venda: editando.precoVenda != null ? String(editando.precoVenda) : "",
      custo: editando.custo != null ? String(editando.custo) : "",
      fornecedor: editando.fornecedor ?? "",
    });
    // Marca/modelo salvos têm prioridade; senão, melhor esforço separando do
    // aparelho ("Samsung Galaxy A54" → marca Samsung, modelo Galaxy A54).
    const alvo = editando.aparelho.toLowerCase().trim();
    const achou = editando.marca
      ? { marca: editando.marca, resto: editando.modelo ?? "" }
      : MARCAS_OPCOES.reduce<{ marca: string; resto: string } | null>(
      (melhor, m) => {
        const base = m.valor.toLowerCase();
        if (alvo !== base && !alvo.startsWith(`${base} `)) return melhor;
        if (melhor && m.valor.length <= melhor.marca.length) return melhor;
        return { marca: m.valor, resto: editando.aparelho.slice(m.valor.length).trim() };
      },
      null,
    );
    setMarca(achou?.marca ?? "");
    setModelo(achou?.resto ?? "");
    setAparelhoComposto(achou ? editando.aparelho : "");
  }

  const alterar = useCallback(<K extends keyof Form>(campo: K, valor: Form[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }, []);

  const categoriaAtual = categoriaPorValor(form.categoria);

  // Opções da subcategoria: catálogo do spec + as criadas inline nesta sessão,
  // sem duplicidade (comparação normalizada).
  const opcoesSubcategoria = useMemo<SearchableSelectOptions[]>(() => {
    const base = categoriaAtual?.subcategorias ?? [];
    const vistos = new Set<string>();
    const lista: SearchableSelectOptions[] = [];
    for (const nome of [...base, ...subcategoriasExtras]) {
      const chave = nome.toLowerCase().trim();
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      lista.push({ label: nome, value: nome });
    }
    return lista;
  }, [categoriaAtual, subcategoriasExtras]);

  const criarSubcategoria = useCallback(
    (termo: string) => {
      setSubcategoriasExtras((prev) =>
        prev.some((s) => s.toLowerCase().trim() === termo.toLowerCase().trim())
          ? prev
          : [...prev, termo],
      );
      alterar("subcategoria", termo);
    },
    [alterar],
  );

  const escolherCategoria = useCallback(
    (valor: string) => {
      setForm((f) => ({
        ...f,
        categoria: valor,
        subcategoria: "",
        // Troca de categoria = novo item: limpa só o que veio do catálogo
        // marca/modelo, preservando texto digitado manualmente.
        aparelho: f.aparelho && f.aparelho === aparelhoComposto ? "" : f.aparelho,
      }));
      setErros((e) => ({ ...e, categoria: undefined, subcategoria: undefined }));
      setMarca("");
      setModelo("");
      setAparelhoComposto("");
    },
    [aparelhoComposto],
  );

  // ---------------------------------------------------------------------------
  // Marca/modelo → Aparelho (regra única e previsível):
  // * escolher NA LISTA (marca ou modelo) = ação explícita → recompõe sempre;
  // * apenas DIGITAR → só compõe se o Aparelho estiver vazio ou for a última
  //   composição automática — nunca apaga texto manual.
  // ---------------------------------------------------------------------------
  const definirAparelho = useCallback((nome: string) => {
    setForm((f) => ({ ...f, aparelho: nome }));
    setErros((e) => ({ ...e, aparelho: undefined }));
    setAparelhoComposto(nome);
  }, []);

  const composarSeLivre = useCallback(
    (nome: string) => {
      if (form.aparelho.trim() && form.aparelho !== aparelhoComposto) return;
      setForm((f) => ({ ...f, aparelho: nome }));
      setErros((e) => ({ ...e, aparelho: undefined }));
      setAparelhoComposto(nome);
    },
    [form.aparelho, aparelhoComposto],
  );

  const aoDigitarMarca = useCallback(
    (v: string) => {
      setMarca(v);
      setModelo("");
      composarSeLivre(v);
    },
    [composarSeLivre],
  );

  const aoEscolherMarca = useCallback(
    (o: ComboBuscaOpcao) => {
      setMarca(o.valor);
      setModelo("");
      definirAparelho(o.valor);
    },
    [definirAparelho],
  );

  const aoDigitarModelo = useCallback(
    (v: string) => {
      setModelo(v);
      composarSeLivre(`${marca} ${v}`.trim());
    },
    [marca, composarSeLivre],
  );

  const aoSelecionarModelo = useCallback(
    (o: ComboBuscaOpcao) => {
      setModelo(o.valor);
      definirAparelho(`${marca} ${o.valor}`.trim());
    },
    [marca, definirAparelho],
  );

  const modelosDisponiveis = useMemo(() => {
    const alvo = normalizarBusca(marca);
    return alvo
      ? MODELOS_TODOS.filter((o) => normalizarBusca(o.detalhe ?? "") === alvo)
      : MODELOS_TODOS;
  }, [marca]);

  const continuar = useCallback(() => {
    if (!form.categoria.trim()) {
      setErros({ categoria: "Selecione o tipo de item." });
      return;
    }
    setPasso(2);
  }, [form.categoria]);

  const submeter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const novos = validar(form);
      setErros(novos);
      if (Object.keys(novos).length > 0) {
        if (novos.categoria) setPasso(1);
        return;
      }

      setSalvando(true);
      // marca/modelo vivem em estado próprio (combo) → entram no payload aqui.
      const payload = { ...form, marca, modelo };
      const ok = editando
        ? await atualizarItemEstoque(editando.id, payload)
        : await criarItemEstoque(payload);
      setSalvando(false);

      if (ok) {
        setForm(FORMULARIO_ESTOQUE_VAZIO);
        setIdCarregado(null);
        setSubcategoriasExtras([]);
        setPasso(1);
        setMarca("");
        setModelo("");
        setAparelhoComposto("");
        aoFechar();
      }
    },
    [form, marca, modelo, editando, atualizarItemEstoque, criarItemEstoque, aoFechar],
  );

  const aoCancelar = useCallback(() => {
    setErros({});
    setIdCarregado(null);
    setPasso(1);
    setSubcategoriasExtras([]);
    setMarca("");
    setModelo("");
    setAparelhoComposto("");
    aoFechar();
  }, [aoFechar]);

  const rotuloCategoria = categoriaAtual?.rotulo ?? "";

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo={editando ? "Editar Item de Estoque" : "Nova Entrada no Estoque"}
      descricao={
        passo === 1
          ? "Escolha o tipo de item para começar."
          : "Preencha os dados do item cadastrado."
      }
      carregando={salvando}
      naoFecharFora
      largura="max-w-2xl"
      rodape={
        passo === 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={aoCancelar}
              disabled={salvando}
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={continuar}
              disabled={!form.categoria.trim()}
              className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasso(1)}
              disabled={salvando}
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-estoque"
              disabled={salvando}
              className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
            >
              {salvando ? "Salvando..." : editando ? "Atualizar" : "Adicionar"}
            </Button>
          </>
        )
      }
    >
      {/* Barra de progresso (mesma engenharia do orçamento) */}
      <div className="mb-5 flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${passo >= 1 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${passo >= 2 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
      </div>

      {/* ================================================================ */}
      {/* PASSO 1 — TIPO DE ITEM (cards)                                    */}
      {/* ================================================================ */}
      {passo === 1 && (
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-zinc-100">Selecione o tipo de item</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Categorias do estoque comercial e assistência técnica.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIAS_ESTOQUE.map((c) => {
              const ativo = form.categoria === c.valor;
              return (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => escolherCategoria(c.valor)}
                  aria-pressed={ativo}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                    ativo
                      ? "border-[#00FF88] bg-[#00FF88]/10"
                      : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
                  }`}
                >
                  <c.icone
                    size={18}
                    className={ativo ? "text-[#00FF88]" : "text-zinc-400"}
                  />
                  <span
                    className={`text-sm font-bold ${ativo ? "text-[#00FF88]" : "text-zinc-200"}`}
                  >
                    {c.rotulo}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {c.descricao}
                  </span>
                </button>
              );
            })}
          </div>

          {erros.categoria && (
            <p className="text-sm text-rose-400">{erros.categoria}</p>
          )}

          {categoriaAtual && (
            <SearchableSelect
              label={
                categoriaAtual.aparelhoDeCliente
                  ? "Estágio do aparelho (opcional)"
                  : "Subcategoria (opcional)"
              }
              name="subcategoria-estoque"
              options={opcoesSubcategoria}
              selectedValue={form.subcategoria}
              onSelect={(v) => alterar("subcategoria", v ?? "")}
              onCreate={criarSubcategoria}
              allowCreate
              placeholder={
                categoriaAtual.aparelhoDeCliente
                  ? "Ex: Aguardando peças, Em teste..."
                  : "Digite para pesquisar ou criar uma nova..."
              }
              texts={{ noResults: "Nenhuma subcategoria — digite para criar." }}
            />
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* PASSO 2 — DADOS DO ITEM                                           */}
      {/* ================================================================ */}
      {passo === 2 && (
        <div className="space-y-5">
          {/* Categoria escolhida (referência) */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5 rounded-lg border border-[#00FF88]/30 bg-[#00FF88]/10 px-2.5 py-1 text-[#00FF88]">
              {categoriaAtual && <categoriaAtual.icone size={14} />}
              <span className="font-semibold">{rotuloCategoria}</span>
            </span>
            {form.subcategoria && (
              <span className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-zinc-300">
                {form.subcategoria}
              </span>
            )}
            <button
              type="button"
              onClick={() => setPasso(1)}
              className="text-xs text-zinc-500 underline underline-offset-2 transition hover:text-zinc-300"
            >
              Alterar tipo de item
            </button>
          </div>

          <form
            id="form-estoque"
            onSubmit={submeter}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <ComboBusca
              id="marca-estoque"
              label="Marca"
              valor={marca}
              opcoes={MARCAS_OPCOES}
              aoDigitar={aoDigitarMarca}
              aoSelecionar={aoEscolherMarca}
              placeholder="Ex: Samsung, Apple, Motorola..."
              dica="Selecione da lista ou digite para filtrar."
            />
            <ComboBusca
              id="modelo-estoque"
              label="Modelo"
              valor={modelo}
              opcoes={modelosDisponiveis}
              aoDigitar={aoDigitarModelo}
              aoSelecionar={aoSelecionarModelo}
              placeholder="Ex: Galaxy A15, iPhone 12, Moto G84..."
              dica={
                marca
                  ? `${modelosDisponiveis.length} modelo(s) para “${marca}” — ou digite outro.`
                  : "Escolha a marca para filtrar — ou digite o modelo."
              }
            />
            <FormInput
              label="Aparelho"
              obrigatorio
              placeholder="Preenchido por Marca + Modelo (ou digite)"
              valor={form.aparelho}
              aoMudar={(v) => {
                alterar("aparelho", v);
                // Texto manual passa a ser dono do campo: composição não sobrescreve.
                setAparelhoComposto((c) => (v === c ? c : ""));
              }}
              erro={erros.aparelho}
            />
            <FormInput
              label="Quantidade"
              obrigatorio
              tipo="number"
              valor={form.quantidade}
              aoMudar={(v) => alterar("quantidade", v)}
              erro={erros.quantidade}
            />
            <FormInput
              label="Defeito"
              placeholder="Opcional"
              valor={form.defeito}
              aoMudar={(v) => alterar("defeito", v)}
            />
            <FormInput
              label="Condição"
              placeholder="Ex: Trincado, não liga..."
              valor={form.condicao}
              aoMudar={(v) => alterar("condicao", v)}
            />
            {/* ---- Campos de PRODUTO (mercadoria de venda) ---- */}
            <FormInput
              label="SKU / Código"
              placeholder="Ex: KD-788, LEY-1681 (opcional)"
              valor={form.sku}
              aoMudar={(v) => alterar("sku", v)}
            />
            <FormInput
              label="Preço de venda"
              placeholder="Ex: 27,90 (vazio = sob consulta)"
              valor={form.preco_venda}
              aoMudar={(v) => alterar("preco_venda", v)}
            />
            <FormInput
              label="Custo"
              placeholder="Não informado = vazio (nunca estimar)"
              valor={form.custo}
              aoMudar={(v) => alterar("custo", v)}
            />
            <FormInput
              label="Fornecedor"
              placeholder="Opcional"
              valor={form.fornecedor}
              aoMudar={(v) => alterar("fornecedor", v)}
            />
            <FormTextarea
              label="Observação"
              placeholder="Detalhes adicionais..."
              valor={form.observacao}
              aoMudar={(v) => alterar("observacao", v)}
              className="sm:col-span-2"
            />
          </form>
        </div>
      )}
    </Modal>
  );
});

export default EstoqueForm;
