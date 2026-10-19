/**
 * =============================================================================
 * INTEGRAÇÃO SUPABASE — MÓDULO /sistema (queries & mutations)
 * =============================================================================
 * Camada de leitura do módulo. Todos os hooks usam TanStack Query com
 * `staleTime: 30s` (cache inteligente conforme spec FASE 7) e chaves de query
 * hierárquicas com prefixo `['sistema', <entidade>]` — assim a store Zustand
 * consegue invalidar TODAS as variações de uma entidade com um único
 * `invalidateQueries({ queryKey: ['sistema', 'os'] })`.
 *
 * As escritas (mutações) vivem em `src/sistema/store.ts`.
 * =============================================================================
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ORDENACAO_STATUS,
  adaptarCaixa,
  adaptarDevolucao,
  adaptarEstoque,
  adaptarOrcamento,
  adaptarOS,
  paraStatusUI,
  type AparelhoAgrupado,
  type CaixaMovimentacao,
  type Cliente,
  type Devolucao,
  type EstoqueItem,
  type FiltroOS,
  type LinhaCaixa,
  type LinhaDevolucao,
  type LinhaEstoque,
  type LinhaOrdemServico,
  type LinhaOrcamento,
  type LinhaServicoTipo,
  type MetricasDashboard,
  type Orcamento,
  type StatusOS,
  type TipoServico,
} from "@/sistema/types";

/** Colunas realmente existentes no banco hoje (migrations 0000–0002). */
const COLUNAS_OS = `
  id, numero, aparelho, marca, quantidade, defeito, status, observacao,
  valor, telefone, data_entrada, cliente_id, cliente_nome, created_at,
  cliente:cliente_id ( id, nome, telefone )
`;

const STALE = 30_000;

/** Shape intermediário devolvido pelo PostgREST com o join em `cliente`. */
type LinhaOSComCliente = LinhaOrdemServico & {
  cliente: { id: string; nome: string; telefone: string | null } | null;
};

/** Normaliza a linha vinda do join: preenche nome/telefone do cliente. */
function normalizarOS(linha: LinhaOSComCliente) {
  const base: LinhaOrdemServico = {
    ...linha,
    cliente_nome: linha.cliente_nome ?? linha.cliente?.nome ?? null,
    telefone: linha.telefone ?? linha.cliente?.telefone ?? null,
  };
  return adaptarOS(base);
}

// =============================================================================
// ORDENS DE SERVIÇO
// =============================================================================

export function useOS(filtro?: Partial<FiltroOS>): UseQueryResult<Awaited<ReturnType<typeof normalizarOS>>[]> {
  return useQuery({
    queryKey: ["sistema", "os", filtro ?? {}],
    queryFn: async () => {
      let consulta = supabase
        .from("ordens_servico")
        .select(COLUNAS_OS)
        .order("numero", { ascending: false });

      const status = filtro?.status;
      if (status && status !== "TODOS") {
        // A UI usa MAIÚSCULO; o banco guarda minúsculo (decisão de arquitetura).
        const mapa: Record<string, string> = {
          PENDENTE: "pendente",
          EM_ANDAMENTO: "em_andamento",
          CONCLUIDA: "concluida",
          ESTOQUE: "estoque",
          DEVOLUCAO: "devolucao",
          CANCELADA: "cancelada",
        };
        consulta = consulta.eq("status", mapa[status] ?? status.toLowerCase());
      }
      if (filtro?.clienteId && filtro.clienteId !== "TODOS") {
        consulta = consulta.eq("cliente_id", filtro.clienteId);
      }
      if (filtro?.dataInicio) consulta = consulta.gte("data_entrada", filtro.dataInicio);
      if (filtro?.dataFim) consulta = consulta.lte("data_entrada", filtro.dataFim);

      const { data, error } = await consulta;
      if (error) throw error;
      return ((data ?? []) as unknown as LinhaOSComCliente[]).map(normalizarOS);
    },
    staleTime: STALE,
  });
}

// =============================================================================
// CLIENTES
// =============================================================================

export function useClientes(): UseQueryResult<Cliente[]> {
  return useQuery({
    queryKey: ["sistema", "clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone, email, created_at")
        .order("nome", { ascending: true });
      if (error) throw error;

      // Totalizadores de OS por cliente (1 query agregada, não N queries).
      const { data: agregado } = await supabase
        .from("ordens_servico")
        .select("cliente_id, quantidade, data_entrada")
        .not("cliente_id", "is", null);

      const mapa = new Map<string, { total: number; ultima: string | null }>();
      for (const registro of (agregado ?? []) as { cliente_id: string; quantidade: number; data_entrada: string }[]) {
        const atual = mapa.get(registro.cliente_id) ?? { total: 0, ultima: null };
        atual.total += registro.quantidade ?? 1;
        if (!atual.ultima || registro.data_entrada > atual.ultima) atual.ultima = registro.data_entrada;
        mapa.set(registro.cliente_id, atual);
      }

      return ((data ?? []) as { id: string; nome: string; telefone: string | null; email: string | null; created_at: string }[]).map(
        (c) => ({
          id: c.id,
          nome: c.nome,
          telefone: c.telefone ?? "",
          email: c.email,
          totalOS: mapa.get(c.id)?.total ?? 0,
          ultimaOS: mapa.get(c.id)?.ultima ?? null,
          createdAt: c.created_at,
        }) satisfies Cliente
      );
    },
    staleTime: STALE,
  });
}

/** Lista simples de clientes usada apenas como opções de <select>. */
export function useClientesLeves() {
  return useQuery({
    queryKey: ["sistema", "clientes", "leves"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string; telefone: string | null }[];
    },
    staleTime: STALE,
  });
}/**
 * =============================================================================
 * DASHBOARD
 * =============================================================================
 */
export function useMetricasDashboard(): UseQueryResult<MetricasDashboard> {
  return useQuery({
    queryKey: ["sistema", "dashboard"],
    queryFn: async () => {
      // Cada contagem carrega seu próprio erro: uma tabela ausente (migração
      // pendente) não pode virar "0", porque 0 é uma leitura válida e diferente.
      const [
        { data: os, error: erroOS },
        { count: totalClientes, error: erroClientes },
        { count: itensEstoque, error: erroEstoque },
        { count: totalSolicitacoes, error: erroSolicitacoes },
      ] = await Promise.all([
        supabase.from("ordens_servico").select("status, valor, quantidade"),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase
          .from("estoque")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("orcamento_solicitacoes")
          .select("id", { count: "exact", head: true }),
      ]);

      if (erroOS) throw erroOS;

      const linhas = (os ?? []) as { status: string; valor: number | null; quantidade: number }[];
      const contar = (alvo: StatusOS) =>
        linhas.filter((l) => paraStatusUI(l.status) === alvo).length;

      return {
        totalOS: linhas.length,
        concluidas: contar("CONCLUIDA"),
        pendentes: contar("PENDENTE"),
        emAndamento: contar("EM_ANDAMENTO"),
        emEstoque: contar("ESTOQUE"),
        devolucoes: contar("DEVOLUCAO"),
        canceladas: contar("CANCELADA"),
        faturamento: linhas
          .filter((l) => paraStatusUI(l.status) === "CONCLUIDA")
          .reduce((soma, l) => soma + Number(l.valor ?? 0), 0),
        totalClientes: erroClientes ? null : totalClientes ?? 0,
        itensEstoque: erroEstoque ? null : itensEstoque ?? 0,
        solicitacoes: erroSolicitacoes ? null : totalSolicitacoes ?? 0,
      } satisfies MetricasDashboard;
    },
    staleTime: STALE,
    refetchInterval: 60_000, // "métricas em tempo real" — polling de 60s
  });
}

/** Últimas OS cadastradas (ordenadas por `created_at`). */
export function useUltimasOS(limite = 5) {
  return useQuery({
    queryKey: ["sistema", "os", "recentes", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, aparelho, defeito, status, cliente_nome, cliente:cliente_id(nome)")
        .order("created_at", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return ((data ?? []) as unknown as (LinhaOrdemServico & { cliente: { nome: string } | null })[]).map((l) => ({
        id: l.id,
        numero: l.numero,
        aparelho: l.aparelho,
        defeito: l.defeito ?? "-",
        status: paraStatusUI(l.status),
        clienteNome: l.cliente_nome ?? l.cliente?.nome ?? "—",
      }));
    },
    staleTime: STALE,
    refetchInterval: 60_000,
  });
}

/** Agregação "aparelhos mais atendidos" (top 8) com defeito mais comum. */
export function useAparelhosMaisAtendidos(limite = 8): UseQueryResult<AparelhoAgrupado[]> {
  return useQuery({
    queryKey: ["sistema", "dashboard", "aparelhos", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("aparelho, defeito, quantidade");
      if (error) throw error;

      const grupos = new Map<string, { qtd: number; defeitos: Map<string, number> }>();
      for (const l of (data ?? []) as { aparelho: string; defeito: string | null; quantidade: number }[]) {
        const g = grupos.get(l.aparelho) ?? { qtd: 0, defeitos: new Map<string, number>() };
        g.qtd += l.quantidade ?? 1;
        if (l.defeito) g.defeitos.set(l.defeito, (g.defeitos.get(l.defeito) ?? 0) + 1);
        grupos.set(l.aparelho, g);
      }

      return [...grupos.entries()]
        .sort((a, b) => b[1].qtd - a[1].qtd)
        .slice(0, limite)
        .map(([aparelho, g]) => ({
          aparelho,
          quantidade: g.qtd,
          defeitoMaisComum:
            [...g.defeitos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
        }));
    },
    staleTime: STALE,
  });
}

/** Distribuição de OS por status (alimenta o gráfico de barras). */
export function useOSPorStatus() {
  return useQuery({
    queryKey: ["sistema", "dashboard", "por-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_servico").select("status");
      if (error) throw error;
      const contagem = new Map<StatusOS, number>(ORDENACAO_STATUS.map((s) => [s, 0]));
      for (const l of (data ?? []) as { status: string }[]) {
        const s = paraStatusUI(l.status);
        contagem.set(s, (contagem.get(s) ?? 0) + 1);
      }
      return ORDENACAO_STATUS.map((s) => ({ status: s, quantidade: contagem.get(s) ?? 0 }));
    },
    staleTime: STALE,
    refetchInterval: 60_000,
  });
}

// =============================================================================
// SOLICITAÇÕES DE ORÇAMENTO RECEBIDAS PELO SITE
// =============================================================================
// A tabela `orcamento_solicitacoes` não tem acesso anônimo: só administradores
// leem (RLS via `has_role`). São os pedidos que o botão “Solicitar orçamento”
// do site grava pela edge function `solicitar-orcamento`.

/** Campos mínimos das solicitações exibidos na tela e no dashboard. */
export interface SolicitacaoSiteResumo {
  id: string;
  protocolo: string;
  nome: string;
  telefone: string;
  categoria: string;
  marca: string;
  modelo: string;
  servico: string;
  status: string;
  created_at: string;
}

const COLUNAS_SOLICITACAO_SITE =
  "id, protocolo, nome, telefone, categoria, marca, modelo, servico, status, created_at";

/** Últimas solicitações recebidas pelo site (dashboard e resumos). */
export function useSolicitacoesSiteRecentes(
  limite = 6
): UseQueryResult<SolicitacaoSiteResumo[]> {
  return useQuery({
    queryKey: ["sistema", "solicitacoes", "recentes", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamento_solicitacoes")
        .select(COLUNAS_SOLICITACAO_SITE)
        .order("created_at", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? []) as SolicitacaoSiteResumo[];
    },
    staleTime: STALE,
    // Mesmo polling do dashboard: um pedido novo aparece sem recarregar a página.
    refetchInterval: 60_000,
  });
}

/**
 * Contagens do funil de solicitações do site.
 * Cada contagem traz `null` quando a consulta falha (nunca um 0 enganoso).
 */
export function useResumoSolicitacoesSite() {
  return useQuery({
    queryKey: ["sistema", "solicitacoes", "resumo"],
    queryFn: async () => {
      const base = () => supabase.from("orcamento_solicitacoes").select("id", { count: "exact", head: true });
      const [total, recebido, emAnalise, aguardando] = await Promise.all([
        base(),
        base().eq("status", "recebido"),
        base().eq("status", "em_analise"),
        base().eq("status", "aguardando_contato"),
      ]);
      // O total define se a tabela está acessível; se falhar, tudo falha.
      if (total.error) throw total.error;
      return {
        total: total.count ?? 0,
        recebido: recebido.error ? null : recebido.count ?? 0,
        emAnalise: emAnalise.error ? null : emAnalise.count ?? 0,
        aguardandoContato: aguardando.error ? null : aguardando.count ?? 0,
      };
    },
    staleTime: STALE,
    refetchInterval: 60_000,
  });
}

// =============================================================================
// ESTOQUE
// =============================================================================

export function useEstoque(): UseQueryResult<EstoqueItem[]> {
  return useQuery({
    queryKey: ["sistema", "estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select("id, aparelho, quantidade, defeito, condicao, observacao, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as LinhaEstoque[]).map(adaptarEstoque);
    },
    staleTime: STALE,
  });
}

// =============================================================================
// TIPOS DE SERVIÇO
// =============================================================================

export function useTiposServico(): UseQueryResult<TipoServico[]> {
  return useQuery({
    queryKey: ["sistema", "servico-tipos"],
    queryFn: async () => {
      const [{ data: tipos, error: erroTipos }, { data: defeitos }] = await Promise.all([
        supabase.from("servico_tipos").select("id, nome").order("nome"),
        supabase.from("ordens_servico").select("defeito"),
      ]);
      if (erroTipos) throw erroTipos;

      // Contador: cada OS pode listar vários defeitos separados por "," ou ";".
      const contagem = new Map<string, number>();
      for (const l of (defeitos ?? []) as { defeito: string | null }[]) {
        if (!l.defeito) continue;
        for (const pedaco of l.defeito.split(/[,;]/)) {
          const nome = pedaco.trim().toLowerCase();
          if (!nome || nome === "-") continue;
          contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
        }
      }

      return ((tipos ?? []) as LinhaServicoTipo[]).map((t) => ({
        id: t.id,
        nome: t.nome,
        quantidadeRealizada: contagem.get(t.nome.trim().toLowerCase()) ?? 0,
      }));
    },
    staleTime: STALE,
  });
}

// =============================================================================
// CAIXA
// =============================================================================

export function useCaixa(): UseQueryResult<CaixaMovimentacao[]> {
  return useQuery({
    queryKey: ["sistema", "caixa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixa_movimentos")
        .select("id, data, descricao, tipo, valor, created_at")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as LinhaCaixa[]).map(adaptarCaixa);
    },
    staleTime: STALE,
  });
}

// =============================================================================
// ORÇAMENTOS
// =============================================================================

export function useOrcamentos(): UseQueryResult<Orcamento[]> {
  return useQuery({
    queryKey: ["sistema", "orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(
          "id, os_id, cliente_id, descricao, valor, status, data_orcamento, created_at, updated_at, ordens:os_id(numero, aparelho, cliente_nome)"
        )
        .order("data_orcamento", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as unknown as (LinhaOrcamento & {
        ordens: { numero: number; aparelho: string; cliente_nome: string | null } | null;
      })[]).map((l) =>
        adaptarOrcamento(l, {
          numeroOS: l.ordens?.numero ?? null,
          clienteNome: l.ordens?.cliente_nome ?? null,
          aparelho: l.ordens?.aparelho ?? null,
        })
      );
    },
    staleTime: STALE,
  });
}

// =============================================================================
// DEVOLUÇÕES
// =============================================================================

export function useDevolucoes(): UseQueryResult<Devolucao[]> {
  return useQuery({
    queryKey: ["sistema", "devolucoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devolucoes")
        .select(
          "id, os_id, aparelho, cliente, defeito, observacao, data_devolucao, created_at, ordens:os_id(numero)"
        )
        .order("data_devolucao", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as unknown as (LinhaDevolucao & {
        ordens: { numero: number } | null;
      })[]).map((l) => adaptarDevolucao(l, { numeroOS: l.ordens?.numero ?? null }));
    },
    staleTime: STALE,
  });
}

// =============================================================================
// RELATÓRIO GERAL
// =============================================================================

/** Base única do relatório (mesmas colunas da tabela + totais para exportação). */
export function useRelatorioGeral() {
  return useQuery({
    queryKey: ["sistema", "relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(COLUNAS_OS)
        .order("data_entrada", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as LinhaOSComCliente[]).map(normalizarOS);
    },
    staleTime: STALE,
  });
}

// Re-export de conveniência para os consumidores da camada de queries.
export { ORDENACAO_STATUS };
