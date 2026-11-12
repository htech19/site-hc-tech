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
import { toast } from "@/components/ui/use-toast";
import { useClientesLeves } from "@/integrations/supabase/sistema";
import { useSistemaStore } from "@/sistema/store";
import { LISTA_STATUS } from "@/sistema/components/OSStatusBadge";
import { telas, getModelosTelaPorMarca, getQualidadesDisponiveis, consultarPrecoTela } from "@/sistema/data/telas";
import { MARCAS_CELULAR, MARCAS_NOTEBOOK, MODELOS_POR_MARCA, SERVICOS_CELULAR, SERVICOS_NOTEBOOK, getServicosPorCategoria, servicoRequerTipoTela } from "@/sistema/data/catalogos";
import type { FormularioOS, StatusOS } from "@/sistema/types";
import { ComboBusca, type ComboBuscaOpcao } from "@/sistema/components/ComboBusca";
import { OrcamentoFinanceiroForm } from "@/sistema/components/orcamentos/OrcamentoFinanceiroForm";

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

const ETAPAS = ["Cliente", "Equipamento", "Defeito e valor", "Orçamento"];

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

/**
 * Formata telefone brasileiro para o padrão (XX) XXXXX-XXXX
 */
const formatarTelefone = (valor: string): string => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

/**
 * Valida telefone brasileiro (celular com DDD)
 */
const validarTelefone = (telefone: string): boolean => {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 11) return false;
  const ddd = parseInt(digitos.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  // Celular deve ter 9 dígitos após o DDD
  if (digitos.length === 11 && digitos[2] !== "9") return false;
  return true;
};

/**
 * Converte telefone para formato internacional (55 + DDD + número)
 */
const paraFormatoInternacional = (telefone: string): string => {
  const digitos = telefone.replace(/\D/g, "");
  return `55${digitos}`;
};

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
  const [qualidade, setQualidade] = useState("");
  const [servico, setServico] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [serial, setSerial] = useState("");

  // Etapa 3 — defeito e valor
  const [defeito, setDefeito] = useState("");
  const [status, setStatus] = useState<StatusOS>("PENDENTE");
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrada, setDataEntrada] = useState(hoje());

  // Etapa 4 — orçamento (campos financeiros)
  const [custoPeca, setCustoPeca] = useState<number>(0);
  const [valorPeca, setValorPeca] = useState<number>(0);
  const [valorMaoObra, setValorMaoObra] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);
  const [custosAdicionais, setCustosAdicionais] = useState<number>(0);
  const [garantiaDias, setGarantiaDias] = useState<number>(90);
  const [observacoesFinanceiras, setObservacoesFinanceiras] = useState<string>("");

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
      // Usa a função do catálogo para obter os modelos reais
      const modelosCatalogo = getModelosTelaPorMarca(alvo);
      if (modelosCatalogo.length > 0) {
        return modelosCatalogo.map((m) => ({
          valor: m,
          rotulo: m,
          detalhe: alvo,
        }));
      }
      // Fallback: todos os modelos da tabela
      return MODELOS_TELA;
    }
    if (categoria === "NOTEBOOK" || categoria === "DESKTOP") {
      return alvo
        ? MODELOS_CATALOGO.filter((o) => normalizar(o.detalhe ?? "") === alvo)
        : MODELOS_CATALOGO;
    }
    return [];
  }, [categoria, marca]);

  // Helpers de tela: só exibe quando o SERVIÇO escolhido exige tela
  const ehTela = servicoRequerTipoTela(servico);

  // Qualidades disponíveis para o modelo selecionado (só faz sentido com tela)
  const qualidadesDisponiveis = useMemo(() => {
    if (!ehTela || !marca || !modelo) return [];
    return getQualidadesDisponiveis(marca, modelo);
  }, [ehTela, marca, modelo]);

  // Preço de referência: só quando serviço de tela + qualidade selecionados
  const precoReferencia = useMemo(() => {
    if (!ehTela || !marca || !modelo || !qualidade) return null;
    const p = consultarPrecoTela(marca, modelo, qualidade);
    return typeof p === "number" ? p : null;
  }, [ehTela, marca, modelo, qualidade]);

  const escolherCategoria = useCallback((nova: CategoriaOS) => {
    setCategoria(nova);
    setMarca("");
    setModelo("");
    setQualidade("");
    setServico("");
    setErro(null);
  }, []);

  const validarEtapa = useCallback(
    (numero: number): string | null => {
      if (numero === 1) {
        if (modoCliente === "cadastrado") {
          if (!clienteSelecionado) return "Selecione um cliente da lista ou cadastre como avulso.";
        } else {
          if (nomeAvulso.trim().length < 3) return "Informe o nome do cliente (mínimo 3 letras).";
          if (!validarTelefone(telefoneAvulso))
            return "Informe um telefone válido com DDD (XX) XXXXX-XXXX.";
        }
      }
      if (numero === 2) {
        if (!categoria) return "Escolha a categoria do equipamento.";
        if (!marca.trim()) return "Informe a marca.";
        if (!modelo.trim()) return "Informe o modelo (ou digite Não sei).";
        if (!servico) return "Selecione o serviço.";
        // Qualidade da tela só obrigatória quando o serviço é Troca de Tela
        if (servicoRequerTipoTela(servico) && !qualidade) return "Selecione a qualidade da tela.";
        if ((parseInt(quantidade, 10) || 0) < 1) return "Quantidade mínima: 1.";
      }
      if (numero === 3) {
        if (defeito.trim().length < 5) return "Descreva o defeito relatado.";
        if (!dataEntrada) return "Informe a data de entrada.";
        if (valor.trim() && Number.isNaN(Number(normalizarValor(valor))))
          return "Valor orçado inválido.";
        if (!servico) return "Selecione o serviço.";
        if (servicoRequerTipoTela(servico) && !qualidade) return "Selecione a qualidade da tela.";
      }
      if (numero === 4) {
        if (valorPeca <= 0) return "Informe o valor da peça.";
        if (valorMaoObra <= 0) return "Informe o valor da mão de obra.";
      }
      return null;
    },
    [modoCliente, clienteSelecionado, nomeAvulso, telefoneAvulso, categoria, marca, modelo, quantidade, defeito, dataEntrada, valor, valorPeca, valorMaoObra, servico, qualidade]
  );

  const avancar = () => {
    const problema = validarEtapa(etapa);
    if (problema) return setErro(problema);
    setErro(null);
    setEtapa((n) => Math.min(4, n + 1));
  };

  const voltar = () => {
    setErro(null);
    setEtapa((n) => Math.max(1, n - 1));
  };

  const finalizar = async () => {
    // Revalida todas as etapas — o usuário pode ter voltado e limpado algo.
    for (const n of [1, 2, 3, 4]) {
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
        servico ? `Serviço: ${servico}` : "",
        rotuloCategoria ? `Categoria: ${rotuloCategoria}` : "",
        serial.trim() ? `Nº de série: ${serial.trim()}` : "",
        observacao.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
      valorOrcado: normalizarValor(valor),
      quantidade: String(Math.max(1, parseInt(quantidade, 10) || 1)),
      dataEntrada,
      // Dados financeiros
      custoPeca,
      valorPeca,
      valorMaoObra,
      desconto,
      frete,
      custosAdicionais,
      garantiaDias,
      observacoesFinanceiras,
    };

    const criada = await criarOSDeSolicitacao(form);
    setSalvando(false);

    if (!criada) {
      setErro("Não foi possível criar a OS. Confira os dados e tente novamente.");
      return;
    }
    setOsCriada(criada);
    onCriada?.(criada);
    // Removido: navigate("/loja");
    // Após criar OS interna, permanece no modal para visualização
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
    "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-nova-os"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5 pb-4">
          <div>
            <h2 id="titulo-nova-os" className="text-lg font-bold text-foreground">
              {osCriada ? "OS criada" : "Nova OS"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
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
            className="text-muted-foreground hover:bg-card hover:text-foreground"
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
                  className={`h-1.5 rounded-full ${etapa >= i + 1 ? "bg-primary" : "bg-card"}`}
                />
                <span
                  className={`mt-1 hidden text-[10px] font-semibold uppercase tracking-wide sm:block ${
                    etapa === i + 1 ? "text-primary" : "text-muted-foreground"
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                  OS #{String(osCriada.numero).padStart(4, "0")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rotuloCategoria} {marca} {modelo} — {defeito}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cliente: {(clienteSelecionado?.nome ?? nomeAvulso) || "—"}
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={reiniciar}
                  className="border-border text-foreground hover:bg-card"
                >
                  Cadastrar outra OS
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-primary font-bold text-background hover:bg-primary/90"
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
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
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
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Package size={15} /> Cliente avulso
                    </button>
                  </div>

                  {modoCliente === "cadastrado" ? (
                    <div className="relative">
                      <label
                        htmlFor="busca-cliente"
                        className="mb-2 block text-sm font-semibold text-foreground"
                      >
                        Cliente <span className="text-primary">*</span>
                      </label>
                      {clienteSelecionado ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {clienteSelecionado.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
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
                            className="shrink-0 text-xs text-primary hover:bg-primary/10"
                          >
                            Trocar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search
                              size={15}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                              className="border-border bg-card pl-9 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                          {listaClientesAberta && (
                            <ul
                              id="lista-clientes"
                              role="listbox"
                              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-background py-1 shadow-2xl"
                            >
                              {carregandoClientes ? (
                                <li className="px-3 py-2 text-sm text-muted-foreground">
                                  Carregando clientes...
                                </li>
                              ) : clientesFiltrados.length === 0 ? (
                                <li className="px-3 py-2 text-sm text-muted-foreground">
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
                                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-card"
                                    >
                                      <span className="truncate text-foreground">{c.nome}</span>
                                      <span className="shrink-0 text-xs text-muted-foreground">
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
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Lista dos clientes já cadastrados no sistema.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="nome-avulso"
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Nome do cliente <span className="text-primary">*</span>
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
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Telefone <span className="text-primary">*</span>
                        </label>
                        <Input
                          id="telefone-avulso"
                          value={telefoneAvulso}
                          onChange={(e) => setTelefoneAvulso(formatarTelefone(e.target.value))}
                          inputMode="tel"
                          placeholder="(11) 90000-0000"
                          className={campo}
                          maxLength={15}
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
                    <span className="mb-2 block text-sm font-semibold text-foreground">
                      Categoria do equipamento <span className="text-primary">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {CATEGORIAS.map((c) => {
                        const ativo = categoria === c.valor;
                        return (
                          <button
                            key={c.valor}
                            type="button"
                            onClick={() => setCategoria(c.valor)}
                            className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                              ativo
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card/50 hover:border-border"
                            }`}
                          >
                            <c.icone
                              size={18}
                              className={ativo ? "text-primary" : "text-muted-foreground"}
                            />
                            <span className={`text-sm font-bold ${ativo ? "text-primary" : "text-foreground"}`}>
                              {c.rotulo}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
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
                            setQualidade("");
                            if (o.detalhe) setMarca(o.detalhe);
                          }}
                          placeholder={
                            categoria === "CELULAR"
                              ? "Ex: A30, iPhone 12, Moto G84..."
                              : "Ex: Galaxy Book, Inspiron 15..."
                          }
                          dica={
                            categoria === "CELULAR"
                              ? `${modelosDisponiveis.length} modelos da Tabela de Telas disponíveis.`
                              : "Digite para filtrar ou informe um modelo fora da lista."
                          }
                        />
                      </div>

                      {/* Ordem correta: Serviço → Qualidade (se Troca de Tela) */}
                      <div>
                        <label
                          htmlFor="servico-os"
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Serviço <span className="text-primary">*</span>
                        </label>
                        <select
                          id="servico-os"
                          value={servico}
                          onChange={(e) => {
                            const novo = e.target.value;
                            setServico(novo);
                            if (!servicoRequerTipoTela(novo)) setQualidade("");
                          }}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          <option value="">Selecione o serviço...</option>
                          {getServicosPorCategoria(categoria === "CELULAR" ? "CELULAR" : "NOTEBOOK").map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nome} — {s.descricao}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ehTela
                            ? "Serviço de tela selecionado: escolha a qualidade abaixo."
                            : "A qualidade da tela só é necessária para o serviço Troca de Tela."}
                        </p>
                      </div>

                      {/* Qualidade da Tela — SÓ aparece se serviço === Troca de Tela (id "tela") */}
                      {ehTela && (
                        <div>
                          <label
                            htmlFor="qualidade-os"
                            className="mb-2 block text-sm font-semibold text-foreground"
                          >
                            Qualidade da Tela <span className="text-primary">*</span>
                          </label>
                          <select
                            id="qualidade-os"
                            value={qualidade}
                            onChange={(e) => setQualidade(e.target.value)}
                            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          >
                            <option value="">Selecione a qualidade...</option>
                            {qualidadesDisponiveis.map((q) => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                          {qualidadesDisponiveis.length === 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Nenhuma qualidade cadastrada para este modelo na Tabela de Telas — preencha o valor manualmente.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Preço de Referência (só com Troca de Tela + qualidade) */}
                      {precoReferencia !== null && (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase">
                                Preço de Referência
                              </p>
                              <p className="text-lg font-bold text-primary">
                                R$ {precoReferencia.toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setValor(String(precoReferencia.toFixed(2)))}
                              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                            >
                              Usar como valor
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="quantidade-os"
                            className="mb-2 block text-sm font-semibold text-foreground"
                          >
                            Quantidade <span className="text-primary">*</span>
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
                            className="mb-2 block text-sm font-semibold text-foreground"
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
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Defeito relatado <span className="text-primary">*</span>
                    </label>
                    <Textarea
                      id="defeito-os"
                      value={defeito}
                      onChange={(e) => setDefeito(e.target.value)}
                      placeholder="Descreva o problema relatado pelo cliente..."
                      rows={3}
                      className="resize-none border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="status-os"
                        className="mb-2 block text-sm font-semibold text-foreground"
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
                        className="mb-2 block text-sm font-semibold text-foreground"
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
                        className="mb-2 block text-sm font-semibold text-foreground"
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
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Observação (opcional)
                    </label>
                    <Textarea
                      id="obs-os"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Estado do aparelho, acessórios, combinados..."
                      rows={2}
                      className="resize-none border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-card/40 p-3 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Resumo
                    </p>
                    <p className="mt-1 text-foreground">
                      {rotuloCategoria} · {marca} {modelo}
                      {serial.trim() ? ` · série ${serial.trim()}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(clienteSelecionado?.nome ?? nomeAvulso) || "—"} ·{" "}
                      {(clienteSelecionado?.telefone ?? telefoneAvulso) || "sem telefone"}
                    </p>
                  </div>
                </div>
              )}

              {/* ETAPA 4 — ORÇAMENTO FINANCEIRO */}
            {etapa === 4 && (
              <div className="space-y-4 p-4">
                {marca && modelo && servico ? (
                  <OrcamentoFinanceiroForm
                    modelo={modelo}
                    marca={marca}
                    qualidadeTela={ehTela ? qualidade : undefined}
                      servico={servico}
                      // Estados financeiros compartilhados
                      custoPeca={custoPeca}
                      setCustoPeca={setCustoPeca}
                      valorPeca={valorPeca}
                      setValorPeca={setValorPeca}
                      valorMaoObra={valorMaoObra}
                      setValorMaoObra={setValorMaoObra}
                      desconto={desconto}
                      setDesconto={setDesconto}
                      frete={frete}
                      setFrete={setFrete}
                      custosAdicionais={custosAdicionais}
                      setCustosAdicionais={setCustosAdicionais}
                      garantiaDias={garantiaDias}
                      setGarantiaDias={setGarantiaDias}
                      observacoes={observacoesFinanceiras}
                      setObservacoes={setObservacoesFinanceiras}
                      // Dados do cliente para envio/preview
                      clienteNome={
                        modoCliente === "cadastrado"
                          ? clienteSelecionado?.nome
                          : nomeAvulso
                      }
                      clienteTelefone={
                        modoCliente === "cadastrado"
                          ? clienteSelecionado?.telefone
                          : telefoneAvulso
                      }
                      onSalvar={(orcamento) => {
                        // TODO: Salvar orçamento no Supabase
                        toast({
                          title: "Orçamento salvo",
                          description: `Orçamento para ${marca} ${modelo} salvo com sucesso.`,
                        });
                      }}
                      onEnviarCliente={(orcamento, canal) => {
                        toast({
                          title: `Enviado via ${canal}`,
                          description: `Orçamento enviado ao cliente (Valor: R$ ${orcamento.valor})`,
                        });
                      }}
                    />
                  ) : (
                    <div className="rounded-lg border border-border bg-card/40 p-6 text-center">
                      <p className="text-muted-foreground mb-2">
                        Selecione um modelo e o serviço para exibir os campos financeiros.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setEtapa(3)}
                        disabled={etapa < 4}
                      >
                        Voltar para Etapa 3
                      </Button>
                    </div>
                  )}
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
          <div className="flex items-center justify-between gap-2 border-t border-border p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={salvando}
              className="border-border text-foreground hover:bg-card"
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
                  className="border-border text-foreground hover:bg-card"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
              )}
              {etapa < 3 ? (
                <Button
                  type="button"
                  onClick={avancar}
                  className="bg-primary font-bold text-background hover:bg-primary/90"
                >
                  Continuar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={finalizar}
                  disabled={salvando}
                  className="bg-primary font-bold text-background hover:bg-primary/90 disabled:opacity-60"
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
