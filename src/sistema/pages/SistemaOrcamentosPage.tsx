import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, FileCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useOrcamentos, useOS } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { OrcamentoList } from "@/sistema/components/OrcamentoList";
import { OrcamentoForm } from "@/sistema/components/OrcamentoForm";
import { OrcamentoStatusBadge } from "@/sistema/components/OrcamentoStatusBadge";
import { Modal } from "@/sistema/components/Modal";
import { useSistemaStore } from "@/sistema/store";
import { formatBRL, formatData, osNum, StatusBadge } from "@/sistema/os-shared";
import type { FormularioOS, Orcamento, StatusOrcamento, TipoTela } from "@/sistema/types";
import { TipoEquipamento, ROTULO_TIPO_TELA } from "@/sistema/types";
import type { DadosSolicitacao } from "@/sistema/components/orcamentos/SolicitacaoOrcamentoWizard";
import SolicitacaoOrcamentoWizard from "@/sistema/components/orcamentos/SolicitacaoOrcamentoWizard";
import { gerarProtocoloSolicitacao } from "@/sistema/services/precosService";

function useDebounce<T>(valor: T, atraso = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setV(valor), atraso);
    return () => clearTimeout(id);
  }, [valor, atraso]);
  return v;
}

const STATUS_TODOS = "TODOS" as const;

/** Status de uma solicitação de orçamento (fluxo administrativo). */
export type StatusSolicitacao =
  | "PENDENTE_ANALISE"
  | "APROVADO"
  | "REPROVADO"
  | "CONVERTIDO_OS"
  | "CANCELADO";

export const ROTULO_STATUS_SOLICITACAO: Record<StatusSolicitacao, string> = {
  PENDENTE_ANALISE: "Pendente de análise",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  CONVERTIDO_OS: "Convertido em OS",
  CANCELADO: "Cancelado",
};

export const CLASSE_STATUS_SOLICITACAO: Record<StatusSolicitacao, string> = {
  PENDENTE_ANALISE: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  APROVADO: "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30",
  REPROVADO: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CONVERTIDO_OS: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  CANCELADO: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

/**
 * Solicitação de orçamento registrada via wizard (estado local + futuro Supabase).
 * Mantém os campos mínimos necessários ao painel administrativo.
 */
export interface SolicitaracaoOrcamento {
  id: string;
  protocolo: string;
  data: string;
  clienteNome: string;
  clienteTelefone: string;
  tipoEquipamento: TipoEquipamento;
  marca: string;
  modelo: string;
  servico: string;
  tipoTela?: string | null;
  descricaoDefeito: string;
  observacoes: string;
  quantidade: number;
  origemSolicitacao: "PUBLICO" | "INTERNO";
  status: StatusSolicitacao;
  valorEstimado?: number | null;
  /** Vínculo com a OS criada a partir desta solicitação (FASE 3). */
  osId?: string | null;
}

/**
 * Página Orçamentos — painel administrativo com:
 * - Lista de orçamentos vinculados a OS (existente)
 * - Lista de solicitações de orçamento inteligente (nova)
 * - Wizard de nova solicitação (4 passos)
 */
const SistemaOrcamentosPage = memo(function SistemaOrcamentosPage() {
  // --- Orçamentos existentes (OS vinculadas) ---
  const consultaOrcamentos = useOrcamentos();
  const { data: orcamentos, refetch: recarregarOrcamentos } = consultaOrcamentos;
  // `isPending` (e não `isLoading`) é o que impede a lista de mentir: uma
  // consulta PAUSADA por falta de conexão não é uma lista vazia.
  const { carregando: orcamentosLoading, pausada: orcamentosPausada, erro: orcamentosErro } =
    estadoDaConsulta(consultaOrcamentos);
  const { data: os } = useOS();

  // --- Solicitações de orçamento inteligente (estado local por enquanto) ---
  const [solicitacoes, setSolicitacoes] = useState<SolicitaracaoOrcamento[]>([]);

  // --- Filtros e buscas ---
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 300);
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | typeof STATUS_TODOS>(STATUS_TODOS);
  const [filtroSolicitacoes, setFiltroSolicitacoes] = useState<StatusSolicitacao | typeof STATUS_TODOS>(STATUS_TODOS);

  // --- Modais ---
  const [modal, setModal] = useState<{ aberto: boolean; editando: Orcamento | null }>({
    aberto: false,
    editando: null,
  });
  const [mostrarWizard, setMostrarWizard] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitaracaoOrcamento | null>(null);

  // --- Conversão de solicitação em OS (FASE 3) ---
  const criarOSDeSolicitacao = useSistemaStore((s) => s.criarOSDeSolicitacao);
  const [solicitacaoParaConverter, setSolicitacaoParaConverter] = useState<SolicitaracaoOrcamento | null>(null);
  const [convertendoOS, setConvertendoOS] = useState(false);

  // --- Toast ---
  const { toast } = useToast();

  // =========================================================================
  // MÉTODOS: Gestão de solicitações
  // =========================================================================

  const adicionarSolicitacao = useCallback((dados: DadosSolicitacao, resultadoPreco: { status: string; preco?: number | null }) => {
    const nova: SolicitaracaoOrcamento = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      protocolo: dados.protocoloSolicitacao ?? gerarProtocoloSolicitacao(),
      data: new Date().toISOString(),
      clienteNome: dados.clienteNome,
      clienteTelefone: dados.clienteTelefone,
      tipoEquipamento: dados.tipoEquipamento ?? TipoEquipamento.CELULAR,
      marca: dados.marca,
      modelo: dados.modelo,
      servico: dados.servico,
      tipoTela: dados.tipoTela ?? null,
      descricaoDefeito: dados.descricaoDefeito,
      observacoes: dados.observacoes,
      quantidade: dados.quantidade,
      origemSolicitacao: "PUBLICO" as const,
      status: "PENDENTE_ANALISE" as const,
      valorEstimado: resultadoPreco.status === "SUCESSO" ? resultadoPreco.preco ?? null : null,
    };
    setSolicitacoes((prev) => [nova, ...prev]);
    toast({
      title: "Solicitação registrada",
      description: `Protocolo ${nova.protocolo} — pendente de análise.`,
      variant: "default",
    });
  }, [toast]);

  const atualizarStatusSolicitacao = useCallback((id: string, status: StatusSolicitacao) => {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }, []);

  const removerSolicitacao = useCallback((id: string) => {
    setSolicitacoes((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "Solicitação removida",
      description: "A solicitação foi excluída do painel.",
      variant: "destructive",
    });
  }, [toast]);

  // =========================================================================
  // MÉTODOS: Filtragem de orçamentos (existente)
  // =========================================================================

  const linhas = useMemo(() => {
    const q = buscaDebounced.trim().toLowerCase();
    return (orcamentos ?? []).filter((o) => {
      if (filtroStatus !== STATUS_TODOS && o.status !== filtroStatus) return false;
      if (!q) return true;
      return [o.clienteNome ?? "", o.aparelho ?? "", o.descricao ?? "", String(o.numeroOS ?? "")].some(
        (campo) => campo.toLowerCase().includes(q)
      );
    });
  }, [orcamentos, buscaDebounced, filtroStatus]);

  const totais = useMemo(() => {
    const aprovado = (orcamentos ?? [])
      .filter((o) => o.status === "APROVADO")
      .reduce((s, o) => s + o.valor, 0);
    const pendente = (orcamentos ?? [])
      .filter((o) => o.status === "PENDENTE")
      .reduce((s, o) => s + o.valor, 0);
    return { aprovado, pendente };
  }, [orcamentos]);

  // =========================================================================
  // MÉTODOS: Filtragem de solicitações
  // =========================================================================

  const solicitacoesFiltradas = useMemo(() => {
    const q = buscaDebounced.trim().toLowerCase();
    return solicitacoes.filter((s) => {
      if (filtroSolicitacoes !== STATUS_TODOS && s.status !== filtroSolicitacoes) return false;
      if (!q) return true;
      return [
        s.protocolo.toLowerCase(),
        s.clienteNome.toLowerCase(),
        s.marca.toLowerCase(),
        s.modelo.toLowerCase(),
        s.servico.toLowerCase(),
        s.tipoEquipamento.toLowerCase(),
      ].some((campo) => campo.includes(q));
    });
  }, [solicitacoes, buscaDebounced, filtroSolicitacoes]);

  const totaisSolicitacoes = useMemo(() => {
    const pendentes = solicitacoes.filter((s) => s.status === "PENDENTE_ANALISE").length;
    const aprovados = solicitacoes.filter((s) => s.status === "APROVADO").length;
    const convertidos = solicitacoes.filter((s) => s.status === "CONVERTIDO_OS").length;
    return { pendentes, aprovados, convertidos };
  }, [solicitacoes]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  /** Botão principal "Novo Orçamento" (uso interno) — abre o wizard de solicitação. */
  const aoNovoOrcamento = useCallback(() => setMostrarWizard(true), []);
  const aoFecharOrcamento = useCallback(() => setModal({ aberto: false, editando: null }), []);

  const aoFecharWizard = useCallback(() => setMostrarWizard(false), []);

  const aoVisualizarSolicitacao = useCallback((s: SolicitaracaoOrcamento) => {
    setSolicitacaoSelecionada(s);
  }, []);

  const aoFecharVisualizacao = useCallback(() => setSolicitacaoSelecionada(null), []);

  const aoConverterEmOS = useCallback((s: SolicitaracaoOrcamento) => {
    // FASE 3: abre o modal de confirmação antes de criar a OS de verdade.
    setSolicitacaoParaConverter(s);
  }, []);

  const aoCancelarConversaoOS = useCallback(() => {
    if (!convertendoOS) setSolicitacaoParaConverter(null);
  }, [convertendoOS]);

  /** Confirma a conversão: cria a OS herdando os campos da solicitação. */
  const confirmarConversaoOS = useCallback(async () => {
    const s = solicitacaoParaConverter;
    if (!s) return;

    setConvertendoOS(true);
    const rotuloTela = s.tipoTela ? ROTULO_TIPO_TELA[s.tipoTela as TipoTela] : undefined;

    const form: FormularioOS = {
      aparelho: `${s.tipoEquipamento === TipoEquipamento.CELULAR ? "Celular" : "Notebook"} ${s.marca} ${s.modelo}`.trim(),
      marca: s.marca,
      clienteId: "", // sem vínculo com cliente cadastrado — nome/telefone herdados da solicitação
      clienteNome: s.clienteNome,
      telefone: s.clienteTelefone,
      defeito: s.descricaoDefeito,
      status: "PENDENTE",
      observacao: [
        `Conversão da solicitação ${s.protocolo}.`,
        `Serviço: ${s.servico}${rotuloTela ? ` (Tela: ${rotuloTela})` : ""}.`,
        s.valorEstimado != null
          ? `Valor estimado: ${formatBRL(s.valorEstimado)}.`
          : "Valor: sujeito à avaliação técnica.",
        s.observacoes ? `Obs.: ${s.observacoes}` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
      valorOrcado: s.valorEstimado != null ? String(s.valorEstimado).replace(".", ",") : "",
      quantidade: String(Math.max(1, s.quantidade || 1)),
      dataEntrada: new Date().toISOString().slice(0, 10),
    };

    const osCriada = await criarOSDeSolicitacao(form);
    setConvertendoOS(false);

    if (osCriada) {
      // Trazível: registra o payload herdado no console (debug/auditoria local).
      console.log(`[Orçamentos] Solicitação ${s.protocolo} convertida em OS ${osNum(osCriada.numero)}`, {
        osId: osCriada.id,
        herdados: form,
      });
      setSolicitacoes((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, status: "CONVERTIDO_OS" as const, osId: osCriada.id } : x))
      );
      toast({
        title: "Solicitação convertida",
        description: `Solicitação convertida para OS ${osNum(osCriada.numero)} com sucesso.`,
      });
      setSolicitacaoParaConverter(null);
    }
    // Em caso de erro o próprio store notifica; o modal permanece aberto para retry.
  }, [solicitacaoParaConverter, criarOSDeSolicitacao, toast]);

  const aoAprovarSolicitacao = useCallback((s: SolicitaracaoOrcamento) => {
    atualizarStatusSolicitacao(s.id, "APROVADO");
    toast({
      title: "Solicitação aprovada",
      description: `Protocolo ${s.protocolo} — aprovado para orçamento final.`,
    });
  }, [atualizarStatusSolicitacao, toast]);

  const aoReprovarSolicitacao = useCallback((s: SolicitaracaoOrcamento) => {
    atualizarStatusSolicitacao(s.id, "REPROVADO");
    toast({
      title: "Solicitação reprovada",
      description: `Protocolo ${s.protocolo} — reprovada.`,
      variant: "destructive",
    });
  }, [atualizarStatusSolicitacao, toast]);

  // Opções de status
  const opcoesStatus: { valor: string; rotulo: string }[] = [
    { valor: STATUS_TODOS, rotulo: "Todos os status" },
    { valor: "PENDENTE", rotulo: "Pendentes" },
    { valor: "APROVADO", rotulo: "Aprovados" },
    { valor: "REPROVADO", rotulo: "Reprovados" },
  ];

  const opcoesStatusSolicitacoes: { valor: string; rotulo: string }[] = [
    { valor: STATUS_TODOS, rotulo: "Todas" },
    { valor: "PENDENTE_ANALISE", rotulo: "Pendentes" },
    { valor: "APROVADO", rotulo: "Aprovados" },
    { valor: "REPROVADO", rotulo: "Reprovados" },
    { valor: "CONVERTIDO_OS", rotulo: "Convertidos" },
    { valor: "CANCELADO", rotulo: "Cancelados" },
  ];

  // =========================================================================
  // RENDERIZAÇÃO
  // =========================================================================

  return (
    <div className="space-y-4">
      {/* Resumo de Orçamentos (existente) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Aprovados
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-[#00FF88]">
            {formatBRL(totais.aprovado)}
          </div>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Pendentes
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-amber-300">
            {formatBRL(totais.pendente)}
          </div>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Total de orçamentos
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-zinc-100">
            {orcamentos?.length ?? 0}
          </div>
        </article>
      </div>

      {/* Resumo de Solicitações (novo) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Novo painel
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-[#00FF88]">
            Orçamento Inteligente
          </div>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Pendentes
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-amber-300">
            {totaisSolicitacoes.pendentes}
          </div>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Aprovadas
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-[#00FF88]">
            {totaisSolicitacoes.aprovados}
          </div>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Convertidas em OS
          </span>
          <div className="mt-1 text-xl font-bold tabular-nums text-blue-300">
            {totaisSolicitacoes.convertidos}
          </div>
        </article>
      </div>

      {/* Controles: Busca e filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente, aparelho, OS, protocolo, serviço..."
            aria-label="Buscar orçamentos e solicitações"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/40 lg:max-w-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de status (orçamentos existentes) */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-1">
            {opcoesStatus.map((o) => (
              <button
                key={o.valor}
                type="button"
                onClick={() => setFiltroStatus(o.valor as StatusOrcamento | typeof STATUS_TODOS)}
                className={
                  filtroStatus === o.valor
                    ? "rounded-lg border border-[#00FF88]/40 bg-[#00FF88]/10 px-3 py-2 text-xs font-bold text-[#00FF88]"
                    : "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-[#00FF88]/40 hover:text-zinc-200"
                }
              >
                {o.rotulo}
              </button>
            ))}
          </div>

          {/* Filtro de status (solicitacoes) */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-1">
            {opcoesStatusSolicitacoes.map((o) => (
              <button
                key={o.valor}
                type="button"
                onClick={() => setFiltroSolicitacoes(o.valor as StatusSolicitacao | typeof STATUS_TODOS)}
                className={
                  filtroSolicitacoes === o.valor
                    ? "rounded-lg border border-[#00FF88]/40 bg-[#00FF88]/10 px-3 py-2 text-xs font-bold text-[#00FF88]"
                    : "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-[#00FF88]/40 hover:text-zinc-200"
                }
              >
                {o.rotulo}
              </button>
            ))}
          </div>

          <Button onClick={aoNovoOrcamento} className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]">
            <Plus size={16} className="mr-1" /> Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Legenda de status (orçamentos) */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>Status (Orçamentos):</span>
        {(["PENDENTE", "APROVADO", "REPROVADO"] as StatusOrcamento[]).map((s) => (
          <OrcamentoStatusBadge key={s} status={s} compacto />
        ))}
        <span className="ml-4">Status (Solicitações):</span>
        {([
          "PENDENTE_ANALISE",
          "APROVADO",
          "REPROVADO",
          "CONVERTIDO_OS",
        ] as StatusSolicitacao[]).map((s) => (
          <Badge key={s} variant="outline" className={CLASSE_STATUS_SOLICITACAO[s]}>
            {ROTULO_STATUS_SOLICITACAO[s]}
          </Badge>
        ))}
      </div>

      {/* Legenda de origem (demo) */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>Demonstração:</span>
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
          Origem: {String().padEnd(12, " ")}
        </Badge>
        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
          Protocolo: ORC-{Date.now().toString().slice(-8)}
        </Badge>
      </div>

      {/* --- Tabela de Solicitações (novo painel) --- */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-100">Solicitações de Orçamento Inteligente</h3>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
            {solicitacoesFiltradas.length} registro(s)
          </Badge>
        </div>

        {solicitacoesFiltradas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-6 text-center">
            <p className="text-sm text-zinc-500">Nenhuma solicitação encontrada.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Clique em &quot;Novo Orçamento&quot; para iniciar o fluxo.
            </p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-800">
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Protocolo
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Data
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Cliente
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Aparelho
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Serviço
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Valor Estimado
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoesFiltradas.map((s) => (
                  <TableRow key={s.id} className="hover:bg-zinc-800/30">
                    <TableCell className="font-mono text-sm font-bold text-[#00FF88]">
                      {s.protocolo}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm">
                      {formatData(s.data)}
                    </TableCell>
                    <TableCell className="text-zinc-200 text-sm">
                      <div>
                        <span className="font-medium">{s.clienteNome}</span>
                      </div>
                      <div className="text-xs text-zinc-500">{s.clienteTelefone}</div>
                    </TableCell>
                    <TableCell className="text-zinc-200 text-sm">
                      <div>
                        <span className="text-zinc-400">{s.tipoEquipamento === TipoEquipamento.CELULAR ? "Celular" : "Notebook"}</span>
                        {" "}
                        <span className="font-medium">{s.marca} {s.modelo}</span>
                      </div>
                      {s.tipoTela && (
                        <div className="text-xs text-zinc-500">Tipo de tela: {s.tipoTela}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-200 text-sm">
                      {s.servico}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.valorEstimado != null ? (
                        <span className="font-semibold text-[#00FF88]">
                          {formatBRL(s.valorEstimado)}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">Sujeito à avaliação</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CLASSE_STATUS_SOLICITACAO[s.status]}>
                        {ROTULO_STATUS_SOLICITACAO[s.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Visualizar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => aoVisualizarSolicitacao(s)}
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Converter em OS (FASE 3: abre modal de confirmação) */}
                        {s.status === "PENDENTE_ANALISE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => aoConverterEmOS(s)}
                            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            title="Converter em OS"
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Aprovar / Reprovar */}
                        {s.status === "PENDENTE_ANALISE" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => aoAprovarSolicitacao(s)}
                              className="h-8 w-8 text-[#00FF88] hover:text-[#00E67D] hover:bg-[#00FF88]/10"
                              title="Aprovar"
                            >
                              <FileCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => aoReprovarSolicitacao(s)}
                              className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              title="Reprovar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* OrcamentoList existente */}
      <OrcamentoList
        linhas={linhas}
        carregando={orcamentosLoading}
        pausada={orcamentosPausada}
        erro={orcamentosErro}
        aoTentarNovamente={() => void recarregarOrcamentos()}
        aoEditar={(orcamento) => setModal({ aberto: true, editando: orcamento })}
      />

      {/* OrcamentoForm existente */}
      <OrcamentoForm
        aberto={modal.aberto}
        editando={modal.editando}
        aoFechar={aoFecharOrcamento}
        osDisponiveis={(os ?? []).map((o) => ({ id: o.id, numero: o.numero }))}
      />

      {/* Wizard de Nova Solicitação */}
      {mostrarWizard && (
        <SolicitacaoOrcamentoWizard
          onClose={aoFecharWizard}
          onSolicitacaoRegistrada={adicionarSolicitacao}
        />
      )}

      {/* Modal de confirmação: Converter solicitação em OS (FASE 3) */}
      <Modal
        aberto={solicitacaoParaConverter != null}
        aoFechar={aoCancelarConversaoOS}
        titulo="Converter em Ordem de Serviço"
        descricao="Confirme os dados que serão herdados pela nova OS."
        largura="max-w-lg"
        carregando={convertendoOS}
        naoFecharFora
        rodape={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={aoCancelarConversaoOS}
              disabled={convertendoOS}
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarConversaoOS}
              disabled={convertendoOS}
              className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"
            >
              {convertendoOS ? "Convertendo..." : "Confirmar Conversão"}
            </Button>
          </>
        }
      >
        {solicitacaoParaConverter && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Solicitação
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-[#00FF88]">
                {solicitacaoParaConverter.protocolo}
              </p>
            </div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Cliente</dt>
                <dd className="text-zinc-200">
                  {solicitacaoParaConverter.clienteNome} — {solicitacaoParaConverter.clienteTelefone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Aparelho</dt>
                <dd className="text-zinc-200">
                  {solicitacaoParaConverter.tipoEquipamento === TipoEquipamento.CELULAR ? "Celular" : "Notebook"}{" "}
                  {solicitacaoParaConverter.marca} {solicitacaoParaConverter.modelo}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Serviço</dt>
                <dd className="text-zinc-200">
                  {solicitacaoParaConverter.servico}
                  {solicitacaoParaConverter.tipoTela &&
                    ` (Tela: ${ROTULO_TIPO_TELA[solicitacaoParaConverter.tipoTela as TipoTela] ?? solicitacaoParaConverter.tipoTela})`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Valor estimado</dt>
                <dd className={solicitacaoParaConverter.valorEstimado != null ? "font-semibold text-[#00FF88]" : "text-amber-300 italic"}>
                  {solicitacaoParaConverter.valorEstimado != null
                    ? formatBRL(solicitacaoParaConverter.valorEstimado)
                    : "Sujeito à avaliação técnica"}
                </dd>
              </div>
            </dl>
            <div>
              <dt className="text-xs text-zinc-500">Defeito relatado</dt>
              <p className="mt-1 text-zinc-300 whitespace-pre-wrap">
                {solicitacaoParaConverter.descricaoDefeito}
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              A OS será criada com status &quot;Pendente&quot; e o vínculo será registrado nesta solicitação.
            </p>
          </div>
        )}
      </Modal>

      {/* Diálogo de Visualização de Solicitação */}
      <Dialog open={solicitacaoSelecionada != null} onOpenChange={() => aoFecharVisualizacao()}>
        <DialogContent className="rounded-xl border-zinc-700 bg-zinc-900 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-100">
              Visualizar Solicitação
            </DialogTitle>
          </DialogHeader>

          {solicitacaoSelecionada && (
            <div className="space-y-4">
              {/* Protocolo e data */}
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                <span className="font-mono text-sm font-bold text-[#00FF88]">
                  {solicitacaoSelecionada.protocolo}
                </span>
                <span className="text-zinc-500 text-sm">|</span>
                <span className="text-zinc-400 text-sm">
                  {formatData(solicitacaoSelecionada.data)}
                </span>
              </div>

              {/* Cliente */}
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cliente
                </h4>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                  <p className="font-medium text-zinc-200">{solicitacaoSelecionada.clienteNome}</p>
                  <p className="text-sm text-zinc-400">{solicitacaoSelecionada.clienteTelefone}</p>
                </div>
              </div>

              {/* Aparelho e Serviço */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Aparelho
                  </h4>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                    <p className="text-sm text-zinc-300">
                      <span className="text-zinc-500">Tipo: </span>
                      {solicitacaoSelecionada.tipoEquipamento === TipoEquipamento.CELULAR ? "Celular" : "Notebook"}
                    </p>
                    <p className="text-sm font-medium text-zinc-200">
                      {solicitacaoSelecionada.marca} {solicitacaoSelecionada.modelo}
                    </p>
                    {solicitacaoSelecionada.tipoTela && (
                      <p className="text-sm text-zinc-500">Tipo de tela: {solicitacaoSelecionada.tipoTela}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Serviço
                  </h4>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                    <p className="text-sm font-medium text-zinc-200">{solicitacaoSelecionada.servico}</p>
                    <p className="text-sm text-zinc-500 mt-1">Qtd: {solicitacaoSelecionada.quantidade}</p>
                  </div>
                </div>
              </div>

              {/* Defeito e Observações */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Defeito Relatado
                  </h4>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {solicitacaoSelecionada.descricaoDefeito}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Observações
                  </h4>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                      {solicitacaoSelecionada.observacoes || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Valor Estimado */}
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Valor Estimado
                </h4>
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                  {solicitacaoSelecionada.valorEstimado != null ? (
                    <p className="text-lg font-bold text-[#00FF88]">
                      {formatBRL(solicitacaoSelecionada.valorEstimado)}
                    </p>
                  ) : (
                    <p className="text-amber-300 italic">
                      Sujeito à avaliação técnica
                    </p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                {solicitacaoSelecionada.status === "PENDENTE_ANALISE" && (
                  <>
                    <Button
                      onClick={() => {
                        aoAprovarSolicitacao(solicitacaoSelecionada);
                        aoFecharVisualizacao();
                      }}
                      className="bg-[#00FF88] text-zinc-950 hover:bg-[#00E67D] font-semibold"
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        aoReprovarSolicitacao(solicitacaoSelecionada);
                        aoFecharVisualizacao();
                      }}
                      className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                    >
                      Reprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        aoConverterEmOS(solicitacaoSelecionada);
                        aoFecharVisualizacao();
                      }}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    >
                      Converter em OS
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={aoFecharVisualizacao}
                  className="ml-auto text-zinc-400 hover:text-zinc-200"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default SistemaOrcamentosPage;
