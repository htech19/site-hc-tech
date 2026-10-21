/**
 * =============================================================================
 * WIZARD — Nova OS (HC TECH)
 * =============================================================================
 * Criado no MESMO padrão visual e de navegação do wizard de orçamento:
 * etapas numeradas, campos de busca com dropdown e dados reaproveitados das
 * bases que já existem no sistema.
 *
 * - Cliente: dropdown pesquisável com a lista de clientes cadastrados
 *   (`useClientesLeves`); alternativa de cliente avulso (nome + telefone).
 * - Equipamento: categorias Celular / Notebook / Desktop / Outro, marca
 *   pesquisável e modelo pesquisável com TODOS os modelos da Tabela de Telas
 *   (celular) ou do catálogo interno (notebook/desktop).
 * - Defeito: serviço, descrição, status, valor e data de entrada.
 *
 * Ao final, cria a OS de verdade no Supabase pela store (`criarOSDeSolicitacao`)
 * e exibe o número gerado.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  User,
  Smartphone,
  Laptop,
  Monitor,
  Package,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClientesLeves } from "@/integrations/supabase/sistema";
import { useSistemaStore } from "@/sistema/store";
import { LISTA_STATUS } from "@/sistema/components/OSStatusBadge";
import { telas } from "@/sistema/data/telas";
import { MARCAS_CELULAR, MARCAS_NOTEBOOK, MODELOS_POR_MARCA } from "@/sistema/data/catalogos";
import type { FormularioOS, StatusOS } from "@/sistema/types";
import { ComboBusca, type ComboBuscaOpcao } from "@/sistema/components/ComboBusca";

// -----------------------------------------------------------------------------
// TIPOS E CONSTANTES
// -----------------------------------------------------------------------------

interface PropsWizardNovaOS {
  onClose: () => void;
  /** Chamado após a criação, com o número real da OS (para avisos do chamador). */
  onCriada?: (os: { id: string; numero: number }) => void;
}

type CategoriaOS = "CELULAR" | "NOTEBOOK" | "DESKTOP" | "OUTRO";
type ModoCliente = "cadastrado" | "avulso";

const CATEGORIAS: { valor: CategoriaOS; rotulo: string; descricao: string; icone: LucideIcon }[] = [
  { valor: "CELULAR", rotulo: "Celular", descricao: "Smartphone, tablet", icone: Smartphone },
  { valor: "NOTEBOOK", rotulo: "Notebook", descricao: "Notebook, ultrabook", icone: Laptop },
  { valor: "DESKTOP", rotulo: "Desktop", descricao: "PC, all-in-one", icone: Monitor },
  { valor: "OUTRO", rotulo: "Outro", descricao: "Console, impressora...", icone: Package },
];

const ETAPAS = ["Cliente", "Equipamento", "Defeito e valor"];

const hoje = () => new Date().toISOString().slice(0, 10);

/**
 * Converte o valor digitado ("1.200,00" / "1200,50" / "1200.50") para o
 * formato que a store espera ("1200.50"). Sem isso, ponto de milhar vira NaN
 * e o valor seria recusado ou, pior, gravado como 0.
 */
const normalizarValor = (v: string) => {
  const limpo = v.replace(/[^\d.,]/g, "").trim();
  if (!limpo) return "";
  if (limpo.includes(",")) return limpo.replace(/\./g, "").replace(",", ".");
  return limpo;
};

const normalizar = (v: string) =>
  (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Opção de lista do ComboBusca (valor gravado, rótulo e detalhe/marca). */
type Opcao = ComboBuscaOpcao;

// Marcas: base da Tabela de Telas + catálogo de celulares.
const MARCAS_CELULAR_OPCOES: Opcao[] = Array.from(new Set(MARCAS_CELULAR))
  .sort((a, b) => a.localeCompare(b, "pt-BR"))
  .map((m) => ({ valor: m, rotulo: m }));

const MARCAS_NOTEBOOK_OPCOES: Opcao[] = Array.from(
  new Set([...MARCAS_NOTEBOOK, "Positivo", "Multilaser", "Outra"])
)
  .sort((a, b) => a.localeCompare(b, "pt-BR"))
  .map((m) => ({ valor: m, rotulo: m }));

// Todos os modelos de tela cadastrados, sem repetir marca+modelo.
const MODELOS_TELA: Opcao[] = (() => {
  const vistos = new Set<string>();
  const lista: Opcao[] = [];
  for (const t of telas) {
    const chave = `${t.marca}|${t.modelo}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push({ valor: t.modelo.trim(), rotulo: t.modelo.trim(), detalhe: t.marca });
  }
  return lista.sort(
    (a, b) =>
      (a.detalhe ?? "").localeCompare(b.detalhe ?? "", "pt-BR") ||
      a.rotulo.localeCompare(b.rotulo, "pt-BR")
  );
})();

// Modelos do catálogo interno (notebook/desktop).
const MODELOS_CATALOGO: Opcao[] = Object.entries(MODELOS_POR_MARCA).flatMap(([marca, modelos]) =>
  modelos.map((modelo) => ({ valor: modelo, rotulo: modelo, detalhe: marca }))
);

// -----------------------------------------------------------------------------
// WIZARD
// -----------------------------------------------------------------------------

const WizardNovaOS = ({ onClose, onCriada }: PropsWizardNovaOS) => {
  const navigate = useNavigate();
  const criarOSDeSolicitacao = useSistemaStore((s) => s.criarOSDeSolicitacao);
  const { data: clientes, isPending: carregandoClientes } = useClientesLeves();

  const [etapa, setEtapa] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [osCriada, setOsCriada] = useState<{ id: string; numero: number } | null>(null);

  // Etapa 1 — cliente
  const [modoCliente, setModoCliente] = useState<ModoCliente>("cadastrado");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<{
    id: string;
    nome: string;
    telefone: string | null;
  } | null>(null);
  const [listaClientesAberta, setListaClientesAberta] = useState(false);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [telefoneAvulso, setTelefoneAvulso] = useState("");

  // Etapa 2 — equipamento
  const [categoria, setCategoria] = useState<CategoriaOS | "">("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [serial, setSerial] = useState("");

  // Etapa 3 — defeito e valor
  const [defeito, setDefeito] = useState("");
  const [status, setStatus] = useState<StatusOS>("PENDENTE");
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrada, setDataEntrada] = useState(hoje());

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  const rotuloCategoria = CATEGORIAS.find((c) => c.valor === categoria)?.rotulo ?? "";

  const clientesFiltrados = useMemo(() => {
    const termo = normalizar(buscaCliente);
    const base = clientes ?? [];
    if (!termo) return base.slice(0, 50);
    return base
      .filter(
        (c) =>
          normalizar(c.nome).includes(termo) ||
          normalizar(c.telefone ?? "").includes(termo)
      )
      .slice(0, 50);
  }, [clientes, buscaCliente]);

  // Opções de marca/modelo conforme a categoria (e a marca já escolhida).
  const marcasDisponiveis = useMemo<Opcao[]>(() => {
    if (categoria === "CELULAR") return MARCAS_CELULAR_OPCOES;
    if (categoria === "NOTEBOOK" || categoria === "DESKTOP") return MARCAS_NOTEBOOK_OPCOES;
    if (categoria === "OUTRO") {
      return Array.from(
        new Set([...MARCAS_CELULAR_OPCOES.map((m) => m.valor), ...MARCAS_NOTEBOOK_OPCOES.map((m) => m.valor)])
      )
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((m) => ({ valor: m, rotulo: m }));
    }
    return [];
  }, [categoria]);

  const modelosDisponiveis = useMemo<Opcao[]>(() => {
    const alvo = normalizar(marca);
    if (categoria === "CELULAR") {
      // Sem marca digitada: todos os modelos da tabela. Com marca: só os dela.
      return alvo
        ? MODELOS_TELA.filter((o) => normalizar(o.detalhe ?? "") === alvo)
        : MODELOS_TELA;
    }
    if (categoria === "NOTEBOOK" || categoria === "DESKTOP") {
      return alvo
        ? MODELOS_CATALOGO.filter((o) => normalizar(o.detalhe ?? "") === alvo)
        : MODELOS_CATALOGO;
    }
    return [];
  }, [categoria, marca]);

  const escolherCategoria = useCallback((nova: CategoriaOS) => {
    setCategoria(nova);
    setMarca("");
    setModelo("");
    setErro(null);
  }, []);

  const validarEtapa = useCallback(
    (numero: number): string | null => {
      if (numero === 1) {
        if (modoCliente === "cadastrado") {
          if (!clienteSelecionado) return "Selecione um cliente da lista ou cadastre como avulso.";
        } else {
          if (nomeAvulso.trim().length < 3) return "Informe o nome do cliente (mínimo 3 letras).";
          if (telefoneAvulso.replace(/\D/g, "").length < 10)
            return "Informe o telefone com DDD.";
        }
      }
      if (numero === 2) {
        if (!categoria) return "Escolha a categoria do equipamento.";
        if (!marca.trim()) return "Informe a marca.";
        if (!modelo.trim()) return "Informe o modelo (ou digite “Não sei”).";
        if ((parseInt(quantidade, 10) || 0) < 1) return "Quantidade mínima: 1.";
      }
      if (numero === 3) {
        if (defeito.trim().length < 5) return "Descreva o defeito relatado.";
        if (!dataEntrada) return "Informe a data de entrada.";
        if (valor.trim() && Number.isNaN(Number(normalizarValor(valor))))
          return "Valor orçado inválido.";
      }
      return null;
    },
    [modoCliente, clienteSelecionado, nomeAvulso, telefoneAvulso, categoria, marca, modelo, quantidade, defeito, dataEntrada, valor]
  );

  const avancar = () => {
    const problema = validarEtapa(etapa);
    if (problema) return setErro(problema);
    setErro(null);
    setEtapa((n) => Math.min(3, n + 1));
  };

  const voltar = () => {
    setErro(null);
    setEtapa((n) => Math.max(1, n - 1));
  };

  const finalizar = async () => {
    // Revalida todas as etapas — o usuário pode ter voltado e limpado algo.
    for (const n of [1, 2, 3]) {
      const problema = validarEtapa(n);
      if (problema) {
        setEtapa(n);
        return setErro(problema);
      }
    }
    if (salvando) return;
    setSalvando(true);
    setErro(null);

    const telefone =
      modoCliente === "cadastrado"
        ? clienteSelecionado?.telefone ?? ""
        : telefoneAvulso.trim();

    const form: FormularioOS = {
      aparelho: `${marca.trim()} ${modelo.trim()}`.trim(),
      marca: marca.trim(),
      clienteId: modoCliente === "cadastrado" ? clienteSelecionado?.id ?? "" : "",
      clienteNome: modoCliente === "avulso" ? nomeAvulso.trim() : "",
      telefone,
      defeito: defeito.trim(),
      status,
      observacao: [
        rotuloCategoria ? `Categoria: ${rotuloCategoria}` : "",
        serial.trim() ? `Nº de série: ${serial.trim()}` : "",
        observacao.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
      valorOrcado: normalizarValor(valor),
      quantidade: String(Math.max(1, parseInt(quantidade, 10) || 1)),
      dataEntrada,
    };

    const criada = await criarOSDeSolicitacao(form);
    setSalvando(false);

    if (!criada) {
      setErro("Não foi possível criar a OS. Confira os dados e tente novamente.");
      return;
    }
    setOsCriada(criada);
    onCriada?.(criada);
    navigate("/loja");
  };

  const reiniciar = () => {
    setEtapa(1);
    setErro(null);
    setOsCriada(null);
    setModoCliente("cadastrado");
    setBuscaCliente("");
    setClienteSelecionado(null);
    setNomeAvulso("");
    setTelefoneAvulso("");
    setCategoria("");
    setMarca("");
    setModelo("");
    setQuantidade("1");
    setSerial("");
    setDefeito("");
    setStatus("PENDENTE");
    setValor("");
    setObservacao("");
    setDataEntrada(hoje());
  };

  const campo =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-nova-os"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-5 pb-4">
          <div>
            <h2 id="titulo-nova-os" className="text-lg font-bold text-zinc-100">
              {osCriada ? "OS criada" : "Nova OS"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {osCriada
                ? "A ordem de serviço já está salva no sistema."
                : `Etapa ${etapa} de ${ETAPAS.length} — ${ETAPAS[etapa - 1]}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progresso */}
        {!osCriada && (
          <div className="flex gap-2 px-5 pt-4">
            {ETAPAS.map((nome, i) => (
              <div key={nome} className="flex-1">
                <div
                  className={`h-1.5 rounded-full ${etapa >= i + 1 ? "bg-[#00FF88]" : "bg-zinc-800"}`}
                />
                <span
                  className={`mt-1 hidden text-[10px] font-semibold uppercase tracking-wide sm:block ${
                    etapa === i + 1 ? "text-[#00FF88]" : "text-zinc-500"
                  }`}
                >
                  {nome}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-5">
          {osCriada ? (
            <div className="space-y-5 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88]/15 text-[#00FF88]">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-100">
                  OS #{String(osCriada.numero).padStart(4, "0")}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {rotuloCategoria} {marca} {modelo} — {defeito}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Cliente: {(clienteSelecionado?.nome ?? nomeAvulso) || "—"}
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={reiniciar}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cadastrar outra OS
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ---------------------------------------------------------- */}
              {/* ETAPA 1 — CLIENTE                                          */}
              {/* ---------------------------------------------------------- */}
              {etapa === 1 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModoCliente("cadastrado");
                        setErro(null);
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        modoCliente === "cadastrado"
                          ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <User size={15} /> Cliente cadastrado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModoCliente("avulso");
                        setErro(null);
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        modoCliente === "avulso"
                          ? "border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Package size={15} /> Cliente avulso
                    </button>
                  </div>

                  {modoCliente === "cadastrado" ? (
                    <div className="relative">
                      <label
                        htmlFor="busca-cliente"
                        className="mb-2 block text-sm font-semibold text-zinc-300"
                      >
                        Cliente <span className="text-[#00FF88]">*</span>
                      </label>
                      {clienteSelecionado ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#00FF88]/40 bg-[#00FF88]/5 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-100">
                              {clienteSelecionado.nome}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {clienteSelecionado.telefone || "Sem telefone cadastrado"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setClienteSelecionado(null);
                              setBuscaCliente("");
                            }}
                            className="shrink-0 text-xs text-[#00FF88] hover:bg-[#00FF88]/10"
                          >
                            Trocar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search
                              size={15}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                              aria-hidden
                            />
                            <Input
                              id="busca-cliente"
                              value={buscaCliente}
                              onChange={(e) => {
                                setBuscaCliente(e.target.value);
                                setListaClientesAberta(true);
                              }}
                              onFocus={() => setListaClientesAberta(true)}
                              onBlur={() => setTimeout(() => setListaClientesAberta(false), 150)}
                              placeholder="Buscar por nome ou telefone..."
                              role="combobox"
                              aria-expanded={listaClientesAberta}
                              aria-controls="lista-clientes"
                              autoComplete="off"
                              className="border-zinc-700 bg-zinc-800 pl-9 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                            />
                          </div>
                          {listaClientesAberta && (
                            <ul
                              id="lista-clientes"
                              role="listbox"
                              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
                            >
                              {carregandoClientes ? (
                                <li className="px-3 py-2 text-sm text-zinc-500">
                                  Carregando clientes...
                                </li>
                              ) : clientesFiltrados.length === 0 ? (
                                <li className="px-3 py-2 text-sm text-zinc-500">
                                  Nenhum cliente encontrado. Use “Cliente avulso”.
                                </li>
                              ) : (
                                clientesFiltrados.map((c) => (
                                  <li key={c.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={false}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setClienteSelecionado(c);
                                        setListaClientesAberta(false);
                                        setBuscaCliente("");
                                        setErro(null);
                                      }}
                                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800"
                                    >
                                      <span className="truncate text-zinc-200">{c.nome}</span>
                                      <span className="shrink-0 text-xs text-zinc-500">
                                        {c.telefone || "—"}
                                      </span>
                                    </button>
                                  </li>
                                ))
                              )}
                            </ul>
                          )}
                        </>
                      )}
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Lista dos clientes já cadastrados no sistema.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="nome-avulso"
                          className="mb-2 block text-sm font-semibold text-zinc-300"
                        >
                          Nome do cliente <span className="text-[#00FF88]">*</span>
                        </label>
                        <Input
                          id="nome-avulso"
                          value={nomeAvulso}
                          onChange={(e) => setNomeAvulso(e.target.value)}
                          placeholder="Nome completo"
                          className={campo}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="telefone-avulso"
                          className="mb-2 block text-sm font-semibold text-zinc-300"
                        >
                          Telefone <span className="text-[#00FF88]">*</span>
                        </label>
                        <Input
                          id="telefone-avulso"
                          value={telefoneAvulso}
                          onChange={(e) => setTelefoneAvulso(e.target.value)}
                          inputMode="tel"
                          placeholder="(11) 90000-0000"
                          className={campo}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* ETAPA 2 — EQUIPAMENTO                                      */}
              {/* ---------------------------------------------------------- */}
              {etapa === 2 && (
                <div className="space-y-5">
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-zinc-300">
                      Categoria do equipamento <span className="text-[#00FF88]">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {CATEGORIAS.map((c) => {
                        const ativo = categoria === c.valor;
                        return (
                          <button
                            key={c.valor}
                            type="button"
                            onClick={() => escolherCategoria(c.valor)}
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
                            <span className={`text-sm font-bold ${ativo ? "text-[#00FF88]" : "text-zinc-200"}`}>
                              {c.rotulo}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                              {c.descricao}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {categoria && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <ComboBusca
                          id="marca-os"
                          label="Marca"
                          obrigatorio
                          valor={marca}
                          opcoes={marcasDisponiveis}
                          aoDigitar={(v) => {
                            setMarca(v);
                            setModelo("");
                          }}
                          aoSelecionar={(o) => {
                            setMarca(o.valor);
                            setModelo("");
                          }}
                          placeholder="Ex: Samsung, Apple, Dell..."
                        />
                        <ComboBusca
                          id="modelo-os"
                          label="Modelo"
                          obrigatorio
                          valor={modelo}
                          opcoes={modelosDisponiveis}
                          aoDigitar={setModelo}
                          aoSelecionar={(o) => {
                            setModelo(o.valor);
                            if (o.detalhe) setMarca(o.detalhe);
                          }}
                          placeholder={
                            categoria === "CELULAR"
                              ? "Ex: A30, iPhone 12, Moto G84..."
                              : "Ex: Galaxy Book, Inspiron 15..."
                          }
                          dica={
                            categoria === "CELULAR"
                              ? `${MODELOS_TELA.length} modelos da Tabela de Telas disponíveis.`
                              : "Digite para filtrar ou informe um modelo fora da lista."
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="quantidade-os"
                            className="mb-2 block text-sm font-semibold text-zinc-300"
                          >
                            Quantidade <span className="text-[#00FF88]">*</span>
                          </label>
                          <Input
                            id="quantidade-os"
                            type="number"
                            min={1}
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            className={campo}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="serial-os"
                            className="mb-2 block text-sm font-semibold text-zinc-300"
                          >
                            Nº de série (opcional)
                          </label>
                          <Input
                            id="serial-os"
                            value={serial}
                            onChange={(e) => setSerial(e.target.value)}
                            placeholder="Ex: ABC123XYZ"
                            className={campo}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* ETAPA 3 — DEFEITO E VALOR                                  */}
              {/* ---------------------------------------------------------- */}
              {etapa === 3 && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="defeito-os"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Defeito relatado <span className="text-[#00FF88]">*</span>
                    </label>
                    <Textarea
                      id="defeito-os"
                      value={defeito}
                      onChange={(e) => setDefeito(e.target.value)}
                      placeholder="Descreva o problema relatado pelo cliente..."
                      rows={3}
                      className="resize-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="status-os"
                        className="mb-2 block text-sm font-semibold text-zinc-300"
                      >
                        Status inicial
                      </label>
                      <select
                        id="status-os"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StatusOS)}
                        className={campo}
                      >
                        {LISTA_STATUS.map((s) => (
                          <option key={s.valor} value={s.valor}>
                            {s.rotulo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="valor-os"
                        className="mb-2 block text-sm font-semibold text-zinc-300"
                      >
                        Valor orçado (R$)
                      </label>
                      <Input
                        id="valor-os"
                        inputMode="decimal"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                        className={campo}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="data-os"
                        className="mb-2 block text-sm font-semibold text-zinc-300"
                      >
                        Data de entrada
                      </label>
                      <Input
                        id="data-os"
                        type="date"
                        value={dataEntrada}
                        onChange={(e) => setDataEntrada(e.target.value)}
                        className={campo}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="obs-os"
                      className="mb-2 block text-sm font-semibold text-zinc-300"
                    >
                      Observação (opcional)
                    </label>
                    <Textarea
                      id="obs-os"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Estado do aparelho, acessórios, combinados..."
                      rows={2}
                      className="resize-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                    />
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Resumo
                    </p>
                    <p className="mt-1 text-zinc-200">
                      {rotuloCategoria} · {marca} {modelo}
                      {serial.trim() ? ` · série ${serial.trim()}` : ""}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {(clienteSelecionado?.nome ?? nomeAvulso) || "—"} ·{" "}
                      {(clienteSelecionado?.telefone ?? telefoneAvulso) || "sem telefone"}
                    </p>
                  </div>
                </div>
              )}

              {erro && (
                <p
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
                </p>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        {!osCriada && (
          <div className="flex items-center justify-between gap-2 border-t border-zinc-800 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={salvando}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              {etapa > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={voltar}
                  disabled={salvando}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
              )}
              {etapa < 3 ? (
                <Button
                  type="button"
                  onClick={avancar}
                  className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
                >
                  Continuar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={finalizar}
                  disabled={salvando}
                  className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D] disabled:opacity-60"
                >
                  <Check className="mr-1 h-4 w-4" />
                  {salvando ? "Salvando..." : "Criar OS"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardNovaOS;
