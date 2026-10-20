/**
 * =============================================================================
 * WIZARD DE SOLICITAÇÃO DE ORÇAMENTO — Módulo Orçamento Inteligente (HC TECH)
 * =============================================================================
 * Wizard com 4 passos para solicitação de orçamento profissional.
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Check, ArrowLeft, ArrowRight, AlertCircle, Phone, Smartphone, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  SERVICOS_CELULAR,
  SERVICOS_NOTEBOOK,
  getServicosPorCategoria,
  getMarcasSugeridas,
  getModelosPorMarca,
} from "@/sistema/data/catalogos";
import { getModelosTelaPorMarca } from "@/sistema/data/telas";
import {
  consultarPreco,
  gerarProtocoloSolicitacao,
  type ResultadoPreco,
  type ParametrosPreco,
} from "@/sistema/services/precosService";
import {
  construirOpcoesTipoTela,
  type OpcaoTipoTela,
} from "@/sistema/services/tipoTelaService";
import { TipoTela, TipoEquipamento } from "@/sistema/types";
import { ROTULO_TIPO_EQUIPAMENTO, ROTULO_TIPO_TELA } from "@/sistema/types";

import { formatBRL } from "@/sistema/os-shared";


// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface PropsSolicitacaoOrcamentoWizard {
  onClose: () => void;
  onSolicitacaoRegistrada?: (dados: DadosSolicitacao, resultadoPreco: ResultadoPreco) => void;
}

type PassoWizard = 1 | 2 | 3 | 4;

export interface DadosSolicitacao {
  // Passo 1: Tipo de equipamento
  tipoEquipamento: TipoEquipamento | null;

  // Passo 2: Dados do equipamento e serviço
  marca: string;
  modelo: string;
  imei1?: string;
  imei2?: string;
  numeroSerie?: string;
  servico: string;
  tipoTela?: TipoTela;
  descricaoDefeito: string;

  // Passo 3: Dados do cliente
  clienteNome: string;
  clienteTelefone: string;
  quantidade: number;
  observacoes: string;

  // Passo 4: Resultado da consulta
  resultadoPreco: ResultadoPreco | null;
  protocoloSolicitacao: string | null;
}

interface EstadoFormulario {
  erros: Partial<Record<keyof DadosSolicitacao, string>>;
}

/**
 * Faixa de preços reais da tabela formatada em BRL (ex.: "R$ 200,00 a R$ 240,00").
 * Formatação fica na camada de apresentação — o serviço devolve apenas números.
 */
function formatarFaixaPreco(precos: number[]): string | null {
  if (precos.length === 0) return null;
  const distintos = Array.from(new Set(precos)).sort((a, b) => a - b);
  return distintos.length === 1
    ? formatBRL(distintos[0])
    : `${formatBRL(distintos[0])} a ${formatBRL(distintos[distintos.length - 1])}`;
}

/** Texto exibido sob o nome da qualidade no dropdown. */
function descricaoDaOpcao(opcao: OpcaoTipoTela): string {
  const faixa = formatarFaixaPreco(opcao.precos);
  return faixa ? `${opcao.descricao} Preço na tabela: ${faixa}.` : opcao.descricao;
}

// -----------------------------------------------------------------------------
// VALIDAÇÕES
// -----------------------------------------------------------------------------

/** Valida se o IMEI é numérico e tem 15 dígitos. */
function validarImei(imei: string | undefined): string | null {
  if (!imei) return null;
  const imeiLimpo = imei.replace(/\D/g, "");
  if (imeiLimpo.length !== 15) {
    return "IMEI deve ter 15 dígitos.";
  }
  if (imei.length !== imeiLimpo.length) {
    return "IMEI deve conter apenas números.";
  }
  return null;
}

/** Valida se o telefone é válido (apenas números, incio opcional + ou DDD). */
function validarTelefone(telefone: string): string | null {
  const apenasNumeros = telefone.replace(/\D/g, "");
  if (apenasNumeros.length < 8) {
    return "Telefone inválido. Mínimo 8 dígitos.";
  }
  return null;
}

// -----------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// -----------------------------------------------------------------------------

const SolicitacaoOrcamentoWizard = ({ onClose, onSolicitacaoRegistrada }: PropsSolicitacaoOrcamentoWizard) => {
  const [passoAtual, setPassoAtual] = useState<PassoWizard>(1);
  const [formulario, setFormulario] = useState<DadosSolicitacao>({
    tipoEquipamento: null,
    marca: "",
    modelo: "",
    imei1: undefined,
    imei2: undefined,
    numeroSerie: undefined,
    servico: "",
    tipoTela: undefined,
    descricaoDefeito: "",
    clienteNome: "",
    clienteTelefone: "",
    quantidade: 1,
    observacoes: "",
    resultadoPreco: null,
    protocoloSolicitacao: null,
  });
  const [estadoFormulario, setEstadoFormulario] = useState<EstadoFormulario>({ erros: {} });
  const [carregando, setCarregando] = useState(false);
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false);

  // Controle de fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mostrarModalSucesso) {
          setMostrarModalSucesso(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mostrarModalSucesso]);

  // Atualiza erros de validação quando o formulário muda
  useEffect(() => {
    const novosErros: Partial<Record<keyof DadosSolicitacao, string>> = {};

    if (formulario.tipoEquipamento === null) {
      novosErros.tipoEquipamento = "Selecione o tipo de equipamento.";
    }

    if (passoAtual >= 2) {
      if (!formulario.marca.trim()) {
        novosErros.marca = "Informe a marca.";
      }
      if (!formulario.modelo.trim()) {
        novosErros.modelo = "Informe o modelo.";
      }
      if (!formulario.servico) {
        novosErros.servico = "Selecione o serviço.";
      }
      if (formulario.servico === "tela" && !formulario.tipoTela) {
        novosErros.tipoTela = "Selecione o tipo de tela.";
      }
      if (!formulario.descricaoDefeito.trim()) {
        novosErros.descricaoDefeito = "Descreva o defeito.";
      }
      const erroImei1 = validarImei(formulario.imei1);
      if (erroImei1) novosErros.imei1 = erroImei1;
      const erroImei2 = validarImei(formulario.imei2);
      if (erroImei2) novosErros.imei2 = erroImei2;
    }

    if (passoAtual >= 3) {
      if (!formulario.clienteNome.trim()) {
        novosErros.clienteNome = "Informe o nome do cliente.";
      }
      const erroTelefone = validarTelefone(formulario.clienteTelefone);
      if (erroTelefone) novosErros.clienteTelefone = erroTelefone;
    }

    setEstadoFormulario((prev) => ({ erros: { ...prev.erros, ...novosErros } }));
  }, [formulario, passoAtual]);

  // Handler para atualizar o formulário
  const atualizarFormulario = useCallback((campo: keyof DadosSolicitacao, valor: string | number | undefined | TipoTela | null) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  // Handler para concluir o passo
  const handleConcluirPasso = useCallback(() => {
    setEstadoFormulario({ erros: {} });
    if (passoAtual < 4) {
      setPassoAtual((p) => (p + 1) as PassoWizard);
    }
  }, [passoAtual]);

  // Handler para voltar um passo
  const handleVoltarPasso = useCallback(() => {
    if (passoAtual > 1) {
      setPassoAtual((p) => (p - 1) as PassoWizard);
    }
  }, [passoAtual]);

  // Consulta de preço (Passo 4)
  const handleConsultarPreco = useCallback(async () => {
    if (!formulario.tipoEquipamento || !formulario.marca || !formulario.modelo || !formulario.servico) {
      return;
    }

    setCarregando(true);
    try {
      const params: ParametrosPreco = {
        tipoEquipamento: formulario.tipoEquipamento,
        marca: formulario.marca,
        modelo: formulario.modelo,
        servico: formulario.servico,
        tipoTela: formulario.tipoTela,
      };

      const resultado = await consultarPreco(params);
      setFormulario((prev) => ({ ...prev, resultadoPreco: resultado }));
    } catch (erro) {
      setFormulario((prev) => ({
        ...prev,
        resultadoPreco: {
          status: "ERRO_SISTEMA",
          mensagem: "Erro ao consultar preço.",
        },
      }));
    } finally {
      setCarregando(false);
    }
  }, [formulario]);

  // Finalizar solicitação (Passo 4)
  const handleFinalizarSolicitacao = useCallback(() => {
    const protocolo = gerarProtocoloSolicitacao();
    setFormulario((prev) => ({
      ...prev,
      protocoloSolicitacao: protocolo,
    }));
    // Notifica o pai para registrar a solicitacao
    onSolicitacaoRegistrada?.(
      { ...formulario, protocoloSolicitacao: protocolo },
      formulario.resultadoPreco ?? { status: "SUJEITO_A_AVALIACAO", mensagem: "Sem resultado." }
    );

    setMostrarModalSucesso(true);
  }, [formulario]);


  // Fechar modal de sucesso e fechar o wizard
  const handleFecharSucesso = useCallback(() => {
    setMostrarModalSucesso(false);
    onClose();
  }, [onClose]);

  // Limpar e reiniciar o wizard
  const handleLimpar = useCallback(() => {
    setPassoAtual(1);
    setFormulario({
      tipoEquipamento: null,
      marca: "",
      modelo: "",
      imei1: undefined,
      imei2: undefined,
      numeroSerie: undefined,
      servico: "",
      tipoTela: undefined,
      descricaoDefeito: "",
      clienteNome: "",
      clienteTelefone: "",
      quantidade: 1,
      observacoes: "",
      resultadoPreco: null,
      protocoloSolicitacao: null,
    });
    setEstadoFormulario({ erros: {} });
    setMostrarModalSucesso(false);
  }, []);

  // Lista de opções para marca (datalist) — catálogo FASE 1
  const opcoesMarca = useMemo(
    () => getMarcasSugeridas(formulario.tipoEquipamento),
    [formulario.tipoEquipamento]
  );

  // Lista de opções para modelo (datalist) — Tabela de Telas (fonte da verdade)
  // + catálogo FASE 1.
  // Os modelos REAIS da marca têm prioridade; o catálogo complementa com
  // modelos fora da tabela e a lista genérica fica como último fallback
  // (a digitação livre no datalist continua permitida).
  const opcoesModeloCelular = useMemo(() => {
    if (formulario.tipoEquipamento !== TipoEquipamento.CELULAR) return [];

    const daTabela = getModelosTelaPorMarca(formulario.marca);
    const jaSugeridos = new Set(daTabela.map((m) => m.toUpperCase()));
    const extras = getModelosPorMarca(formulario.marca).filter(
      (m) => !jaSugeridos.has(m.toUpperCase())
    );

    if (daTabela.length > 0 || extras.length > 0) {
      return [...daTabela, ...extras];
    }

    return [
      "IPHONE 12",
      "IPHONE 11",
      "SAMSUNG GALAXY S21",
      "SAMSUNG GALAXY S20",
      "APPLE IPHONE 13",
    ];
  }, [formulario.tipoEquipamento, formulario.marca]);

  const opcoesModeloNotebook = useMemo(() => {
    if (formulario.tipoEquipamento !== TipoEquipamento.NOTEBOOK) return [];
    const daMarca = getModelosPorMarca(formulario.marca);
    if (daMarca.length > 0) return daMarca;
    return [
      "LENOVO IDEAPAD 3",
      "DELL INSPIRON 15",
      "ASUS X550",
      "HP PAVILION 15",
    ];
  }, [formulario.tipoEquipamento, formulario.marca]);

  // Serveços disponíveis baseados no tipo
  const servicosDisponiveis = useMemo(() => {
    if (formulario.tipoEquipamento === TipoEquipamento.CELULAR) {
      return SERVICOS_CELULAR;
    }
    if (formulario.tipoEquipamento === TipoEquipamento.NOTEBOOK) {
      return SERVICOS_NOTEBOOK;
    }
    return [];
  }, [formulario.tipoEquipamento]);

  // Sugestões de modelo conforme o tipo de equipamento selecionado
  const opcoesModelo = useMemo(
    () => (formulario.tipoEquipamento === TipoEquipamento.CELULAR ? opcoesModeloCelular : opcoesModeloNotebook),
    [formulario.tipoEquipamento, opcoesModeloCelular, opcoesModeloNotebook]
  );

  // Exibir tipo de tela se o serviço for "tela"
  const exibirTipoTela = formulario.servico === "tela";

  // Dropdown de Tipo de Tela: a regra vive em tipoTelaService (puro/testado).
  // Oferece EXATAMENTE as qualidades existentes na Tabela de Telas para o
  // modelo, com o preço real de cada uma; modelo fora da tabela cai no
  // catálogo completo e a consulta devolve "sujeito à avaliação" (sem inventar
  // preço). `linhas` vazio = modelo não cadastrado na Tabela de Telas.
  const { opcoes: opcoesTipoTela, linhas: linhasTelaModelo } = useMemo(
    () => construirOpcoesTipoTela(formulario.marca, formulario.modelo),
    [formulario.marca, formulario.modelo]
  );

  // Se o tipo de tela selecionado deixa de existir para o modelo, limpa a escolha
  useEffect(() => {
    if (!formulario.tipoTela) return;
    // Catálogo completo (fallback): nada a limpar
    if (linhasTelaModelo.length === 0) return;
    const aindaDisponivel = opcoesTipoTela.some((t) => t.id === formulario.tipoTela);
    if (!aindaDisponivel) {
      atualizarFormulario("tipoTela", undefined);
    }
  }, [linhasTelaModelo, opcoesTipoTela, formulario.tipoTela, atualizarFormulario]);


  // Aviso quando marca+modelo preenchidos não existem na Tabela de Telas
  // (apenas quando o serviço é "tela" e o campo Modelo já tem algo digitado)
  const modeloForaDaTabela = useMemo(() => {
    if (!exibirTipoTela) return false;
    if (!formulario.marca.trim() || !formulario.modelo.trim()) return false;
    return linhasTelaModelo.length === 0;
  }, [exibirTipoTela, formulario.marca, formulario.modelo, linhasTelaModelo]);


  // -----------------------------------------------------------------------------
  // WHATSAPP — botão exibido no modal de sucesso (após gerar o protocolo)
  // -----------------------------------------------------------------------------
  const telefoneWhatsApp = (formulario.clienteTelefone || "").replace(/\D/g, "");
  const valorMensagem = formulario.resultadoPreco?.total
    ? formatBRL(formulario.resultadoPreco.total)
    : "Sujeito à avaliação";
  const textoWhatsApp = `Olá ${formulario.clienteNome}! Seu orçamento HC TECH - Protocolo: ${formulario.protocoloSolicitacao} - ${formulario.marca} ${formulario.modelo} - Serviço: ${formulario.servico} - Valor: ${valorMensagem}.`;
  const linkWhatsApp = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(textoWhatsApp)}`;

  // -----------------------------------------------------------------------------
  // RENDERIZAÇÃO PRINCIPAL
  // -----------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Modal principal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border-2 border-[#00FF88]/20 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00FF88]/10">
              <AlertCircle className="h-5 w-5 text-[#00FF88]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                Solicitar Orçamento
              </h2>
              <p className="text-xs text-zinc-500">
                Passo {passoAtual} de 4
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navegação */}
        <div className="mb-6 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${passoAtual >= 1 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${passoAtual >= 2 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${passoAtual >= 3 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${passoAtual >= 4 ? "bg-[#00FF88]" : "bg-zinc-800"}`} />
        </div>

        {/* ============================================ */}
        {/* PASSO 1: TIPO DE EQUIPAMENTO */}
        {/* ============================================ */}
        {passoAtual === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-zinc-100">
                Selecione o tipo de equipamento
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Escolha a categoria do aparelho que deseja orçar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Opção Celular */}
              <button
                type="button"
                onClick={() => {
                  setFormulario((prev) => ({ ...prev, tipoEquipamento: TipoEquipamento.CELULAR }));
                  setEstadoFormulario({ erros: {} });
                }}
                className={`flex flex-col gap-4 rounded-xl border-2 p-6 transition-all ${
                  formulario.tipoEquipamento === TipoEquipamento.CELULAR
                    ? "border-[#00FF88] bg-[#00FF88]/10"
                    : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88]/20">
                  <Smartphone className="h-7 w-7 text-[#00FF88]" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100">
                    {ROTULO_TIPO_EQUIPAMENTO.CELULAR}
                  </h4>
                  <p className="mt-1 text-sm text-zinc-400">
                    Smartphones, tablets, etc.
                  </p>
                </div>
                {formulario.tipoEquipamento === TipoEquipamento.CELULAR && (
                  <Badge className="bg-[#00FF88] text-zinc-950">Selecionado</Badge>
                )}
              </button>

              {/* Opção Notebook */}
              <button
                type="button"
                onClick={() => {
                  setFormulario((prev) => ({ ...prev, tipoEquipamento: TipoEquipamento.NOTEBOOK }));
                  setEstadoFormulario({ erros: {} });
                }}
                className={`flex flex-col gap-4 rounded-xl border-2 p-6 transition-all ${
                  formulario.tipoEquipamento === TipoEquipamento.NOTEBOOK
                    ? "border-[#00FF88] bg-[#00FF88]/10"
                    : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF88]/20">
                  <Laptop className="h-7 w-7 text-[#00FF88]" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100">
                    {ROTULO_TIPO_EQUIPAMENTO.NOTEBOOK}
                  </h4>
                  <p className="mt-1 text-sm text-zinc-400">
                    Notebooks, ultrabooks, etc.
                  </p>
                </div>
                {formulario.tipoEquipamento === TipoEquipamento.NOTEBOOK && (
                  <Badge className="bg-[#00FF88] text-zinc-950">Selecionado</Badge>
                )}
              </button>
            </div>

            {estadoFormulario.erros.tipoEquipamento && (
              <p className="text-sm text-rose-400">{estadoFormulario.erros.tipoEquipamento}</p>
            )}

            {/* Botões do Passo 1 */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConcluirPasso}
                disabled={!formulario.tipoEquipamento}
                className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="mr-1 h-4 w-4" />
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PASSO 2: DADOS DO EQUIPAMENTO E SERVIÇO */}
        {/* ============================================ */}
        {passoAtual === 2 && (
          <div className="space-y-6">
            {/* Tipo de equipamento (exibido como referência) */}
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                {formulario.tipoEquipamento ? ROTULO_TIPO_EQUIPAMENTO[formulario.tipoEquipamento] : "Não selecionado"}
              </Badge>
              <span>-</span>
              <span className="font-medium text-zinc-300">Dados do equipamento</span>
            </div>

            {/* Marca e Modelo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Marca *
                </label>
                <Input
                  type="text"
                  value={formulario.marca}
                  onChange={(e) => atualizarFormulario("marca", e.target.value)}
                  list="marcas-sugeridas"
                  placeholder="Ex: Samsung, Apple, Lenovo..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
                <datalist id="marcas-sugeridas">
                  {opcoesMarca.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                {estadoFormulario.erros.marca && (
                  <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.marca}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Modelo *
                </label>
                <Input
                  type="text"
                  list="modelos-sugeridos"
                  value={formulario.modelo}
                  onChange={(e) => atualizarFormulario("modelo", e.target.value)}
                  placeholder="Ex: Galaxy S21, iPhone 12..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
                {estadoFormulario.erros.modelo && (
                  <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.modelo}</p>
                )}
                {/* Datalist vinculado ao campo Modelo (list="modelos-sugeridos") */}
                <datalist id="modelos-sugeridos">
                  {opcoesModelo.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* IMEI / Número de Série (condicional) */}
            {formulario.tipoEquipamento === TipoEquipamento.CELULAR ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    IMEI 1 (opcional)
                  </label>
                  <Input
                    type="text"
                    value={formulario.imei1 ?? ""}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, "").slice(0, 15);
                      atualizarFormulario("imei1", valor);
                    }}
                    placeholder="15 dígitos numéricos"
                    maxLength={15}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                  />
                  {estadoFormulario.erros.imei1 && (
                    <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.imei1}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    IMEI 2 (opcional)
                  </label>
                  <Input
                    type="text"
                    value={formulario.imei2 ?? ""}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, "").slice(0, 15);
                      atualizarFormulario("imei2", valor);
                    }}
                    placeholder="15 dígitos numéricos"
                    maxLength={15}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                  />
                  {estadoFormulario.erros.imei2 && (
                    <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.imei2}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Número de Série (opcional)
                  </label>
                  <Input
                    type="text"
                    value={formulario.numeroSerie ?? ""}
                    onChange={(e) => atualizarFormulario("numeroSerie", e.target.value)}
                    placeholder="Ex: ABC123XYZ"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                  />
                </div>
              </div>
            )}

            {/* Serviço */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Serviço *
              </label>
              <Select
                value={formulario.servico}
                onValueChange={(v) => {
                  atualizarFormulario("servico", v);
                  if (v !== "tela" && formulario.tipoTela) {
                    atualizarFormulario("tipoTela", undefined);
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Selecione o serviço..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {servicosDisponiveis.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-zinc-200">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.nome}</span>
                        {s.descricao && (
                          <span className="text-xs text-zinc-500 mt-0.5">{s.descricao}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estadoFormulario.erros.servico && (
                <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.servico}</p>
              )}
            </div>

            {/* Tipo de Tela (condicional) */}
            {exibirTipoTela && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Tipo de Tela *
                </label>
                <p className="mb-2 text-xs text-zinc-500">
                  Selecione o tipo de tela para o orçamento.
                </p>
                <Select
                  value={formulario.tipoTela ?? ""}
                  onValueChange={(v) => atualizarFormulario("tipoTela", v as TipoTela)}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Selecione o tipo de tela..." />
                  </SelectTrigger>                <SelectContent className="bg-zinc-800 border-zinc-700">
                    {opcoesTipoTela.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-zinc-200">
                        <div className="flex flex-col">
                          <span className="font-medium">{t.nome}</span>
                          <span className="text-xs text-zinc-500 mt-0.5">{descricaoDaOpcao(t)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modeloForaDaTabela && (
                  <p className="mt-1 text-xs text-amber-400">
                    Modelo não localizado na Tabela de Telas — o orçamento ficará sujeito à avaliação técnica.
                  </p>
                )}
                {estadoFormulario.erros.tipoTela && (
                  <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.tipoTela}</p>
                )}
              </div>
            )}

            {/* Descrição do Defeito */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Descrição do Defeito *
              </label>
              <Textarea
                value={formulario.descricaoDefeito}
                onChange={(e) => atualizarFormulario("descricaoDefeito", e.target.value)}
                placeholder="Descreva o problema em detalhes..."
                className="min-h-[100px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
              />
              {estadoFormulario.erros.descricaoDefeito && (
                <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.descricaoDefeito}</p>
              )}
            </div>

            {/* Botões do Passo 2 */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={handleVoltarPasso}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConcluirPasso}
                  disabled={
                    !formulario.marca.trim() ||
                    !formulario.modelo.trim() ||
                    !formulario.servico ||
                    !formulario.descricaoDefeito.trim() ||
                    (formulario.servico === "tela" && !formulario.tipoTela)
                  }
                  className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="mr-1 h-4 w-4" />
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PASSO 3: DADOS DO CLIENTE */}
        {/* ============================================ */}
        {passoAtual === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-zinc-100">
                Dados do Cliente
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Informe os dados para contato e identificação.
              </p>
            </div>

            {/* Nome do Cliente */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Nome do Cliente *
              </label>
              <Input
                type="text"
                value={formulario.clienteNome}
                onChange={(e) => atualizarFormulario("clienteNome", e.target.value)}
                placeholder="Nome completo do cliente"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
              />
              {estadoFormulario.erros.clienteNome && (
                <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.clienteNome}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Telefone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="tel"
                  value={formulario.clienteTelefone}
                  onChange={(e) => {
                    let valor = e.target.value.replace(/\D/g, "");
                    if (valor.length > 0) {
                      if (valor.length <= 2) {
                        // DDD
                      } else if (valor.length <= 10) {
                        // (XX) XXXXX-XXXX
                        valor = valor.slice(0, 2) + " " + valor.slice(2, 7) + "-" + valor.slice(7, 11);
                      } else {
                        valor = valor.slice(0, 2) + " " + valor.slice(2, 7) + "-" + valor.slice(7, 11);
                      }
                    }
                    atualizarFormulario("clienteTelefone", valor);
                  }}
                  placeholder="(11) 97793-4634"
                  className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
                />
              </div>
              {estadoFormulario.erros.clienteTelefone && (
                <p className="mt-1 text-xs text-rose-400">{estadoFormulario.erros.clienteTelefone}</p>
              )}
            </div>

            {/* Quantidade */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Quantidade
              </label>
              <Input
                type="number"
                min={1}
                value={formulario.quantidade}
                onChange={(e) => atualizarFormulario("quantidade", parseInt(e.target.value, 10) || 1)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20 w-20"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Observações (opcional)
              </label>
              <Textarea
                value={formulario.observacoes}
                onChange={(e) => atualizarFormulario("observacoes", e.target.value)}
                placeholder="Informações adicionais ou observações especiais..."
                className="min-h-[80px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/20"
              />
            </div>

            {/* Botões do Passo 3 */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={handleVoltarPasso}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConcluirPasso}
                  disabled={!formulario.clienteNome.trim() || !formulario.clienteTelefone.trim()}
                  className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="mr-1 h-4 w-4" />
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PASSO 4: REVISÃO E CONSULTA DE PREÇO */}
        {/* ============================================ */}
        {passoAtual === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-zinc-100">
                Revisão e Consulta de Preço
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Consulte o preço estimado para o serviço selecionado.
              </p>
            </div>

            {/* Resumo da Solicitação */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Resumo da Solicitação
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Tipo:</span>
                  <span className="ml-2 font-medium text-zinc-200">
                    {formulario.tipoEquipamento ? ROTULO_TIPO_EQUIPAMENTO[formulario.tipoEquipamento] : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Marca/Modelo:</span>
                  <span className="ml-2 font-medium text-zinc-200">
                    {formulario.marca} {formulario.modelo}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Serviço:</span>
                  <span className="ml-2 font-medium text-zinc-200">
                    {formulario.servico}
                  </span>
                </div>
                {formulario.tipoTela && (
                  <div>
                    <span className="text-zinc-500">Tipo de Tela:</span>
                    <span className="ml-2 font-medium text-zinc-200">
                      {ROTULO_TIPO_TELA[formulario.tipoTela]}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Cliente:</span>
                  <span className="ml-2 font-medium text-zinc-200">
                    {formulario.clienteNome}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Telefone:</span>
                  <span className="ml-2 font-medium text-zinc-200">
                    {formulario.clienteTelefone}
                  </span>
                </div>
              </div>
            </div>

            {/* Botão de Consulta */}
            <div className="flex items-center justify-center">
              <Button
                onClick={handleConsultarPreco}
                disabled={carregando}
                className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4h4z" />
                    </svg>
                    Consultando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Consultar Preço
                  </span>
                )}
              </Button>
            </div>

            {/* Resultado da Consulta */}
            {formulario.resultadoPreco && (
              <div
                className={`rounded-xl border p-4 ${
                  formulario.resultadoPreco.status === "SUCESSO"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : formulario.resultadoPreco.status === "SUJEITO_A_AVALIACAO"
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-rose-500/30 bg-rose-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {formulario.resultadoPreco.status === "SUCESSO" ? (
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      formulario.resultadoPreco.status === "SUCESSO"
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}>
                      {formulario.resultadoPreco.status === "SUCESSO" ? "Preço Encontrado" : "Sujeito a Avaliação"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {formulario.resultadoPreco.mensagem}
                    </p>
                    {formulario.resultadoPreco.preco && (
                      <p className="mt-2 text-lg font-bold text-[#00FF88]">
                        {formatBRL(formulario.resultadoPreco.preco)}
                      </p>
                    )}
                    {formulario.resultadoPreco.observacoes && formulario.resultadoPreco.observacoes.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                        {formulario.resultadoPreco.observacoes.map((obs, idx) => (
                          <li key={idx}>- {obs}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botões do Passo 4 */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={handleVoltarPasso}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalizarSolicitacao}
                  disabled={!formulario.resultadoPreco}
                  className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Finalizar Solicitação
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Sucesso */}
      {mostrarModalSucesso && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMostrarModalSucesso(false);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-emerald-500/30 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 mx-auto mb-4">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-zinc-100 text-center">
              Solicitação Registrada!
            </h3>              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4 text-center">
              <p className="text-sm text-zinc-400">Protocolo de Solicitação</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#00FF88]">
                {formulario.protocoloSolicitacao}
              </p>
            </div>

          {/* Indicador visual de sincronização com a Tabela de Telas */}
          {modeloForaDaTabela && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-xs text-amber-300">
                ⚠️ Modelo não localizado na Tabela de Telas — o orçamento ficará <strong>sujeito à avaliação técnica</strong>.<br />
                Para modelos conhecidos, o dropdown acima filtra automaticamente para as qualidades reais da tabela.
              </p>
            </div>
          )}

            <p className="mt-3 text-center text-sm text-zinc-400">
              Sua solicitação foi registrada com sucesso. Em breve nossa equipe entrará em contato.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Button
                onClick={handleFecharSucesso}
                className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] font-semibold"
              >
                OK
              </Button>
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#25D366]/40 bg-[#25D366]/15 px-4 py-2 text-sm font-semibold text-[#25D366] transition hover:bg-[#25D366]/25"
              >
                📱 Enviar WhatsApp
              </a>
              <Button
                variant="outline"
                onClick={handleLimpar}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitacaoOrcamentoWizard;
