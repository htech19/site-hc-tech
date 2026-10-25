import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "./queryClient";
import {
  FILTRO_OS_PADRAO,
  adaptarOS,
  paraStatusBanco,
  type CaixaMovimentacao,
  type Cliente,
  type Devolucao,
  type EstoqueItem,
  type FiltroOS,
  type FormularioOS,
  type LinhaOrdemServico,
  type Orcamento,
  type StatusOrcamento,
  type StatusOS,
} from "./types";

// =============================================================================
// TIPOS DE APOIO
// =============================================================================

export type TipoNotificacao = "success" | "error" | "info";

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  mensagem: string;
}

export interface FiltroCaixa {
  busca: string;
  tipo: "TODOS" | "ENTRADA" | "SAIDA";
  dataInicio?: string;
  dataFim?: string;
}

export const FILTRO_CAIXA_PADRAO: FiltroCaixa = { busca: "", tipo: "TODOS" };

export interface FiltroRelatorio {
  status: StatusOS | "TODOS";
  clienteId: string | "TODOS";
  dataInicio?: string;
  dataFim?: string;
}

export const FILTRO_RELATORIO_PADRAO: FiltroRelatorio = {
  status: "TODOS",
  clienteId: "TODOS",
};

/** Qual modal está aberto e, se houver, o registro em edição. */
export interface EstadoModal<T> {
  aberto: boolean;
  editando: T | null;
}

const MODAL_FECHADO = { aberto: false, editando: null } as const;

// =============================================================================
// FORMULÁRIOS (estado inicial)
// =============================================================================

export const FORMULARIO_OS_VAZIO: FormularioOS = {
  aparelho: "",
  marca: "",
  clienteId: "",
  clienteNome: "",
  telefone: "",
  defeito: "",
  status: "PENDENTE",
  observacao: "",
  valorOrcado: "",
  quantidade: "1",
  dataEntrada: new Date().toISOString().slice(0, 10),
};

export const FORMULARIO_CLIENTE_VAZIO = {
  nome: "",
  telefone: "",
  email: "",
};

export const FORMULARIO_ESTOQUE_VAZIO = {
  aparelho: "",
  quantidade: "1",
  defeito: "",
  condicao: "",
  observacao: "",
  proprietario: "HC TECH",
  canal_de_venda: "Loja física",
  /** Slug do tipo de item escolhido nos cards (categoriasEstoque.ts). */
  categoria: "",
  /** Subcategoria/opção específica dentro do grupo escolhido. */
  subcategoria: "",
  // ---- Campos de PRODUTO (mercadoria de venda) ----
  sku: "",
  /** Preço de varejo (string para o input; vazio = sob consulta). */
  preco_venda: "",
  /** Custo de aquisição (vazio = não informado — nunca estimar). */
  custo: "",
  fornecedor: "",
  /** IMEI/SN para celulares e notebooks. */
  imei_sn: "",
};

/**
 * Formulário de Estoque completo. `marca`/`modelo` são preenchidos pelo combo
 * (estado próprio no EstoqueForm) e mesclados no payload no submit — por isso
 * ficam fora de `FORMULARIO_ESTOQUE_VAZIO`.
 */
export type FormularioEstoque = typeof FORMULARIO_ESTOQUE_VAZIO & {
  marca: string;
  modelo: string;
};

export const FORMULARIO_CAIXA_VAZIO = {
  descricao: "",
  tipo: "ENTRADA" as "ENTRADA" | "SAIDA",
  valor: "",
  data: new Date().toISOString().slice(0, 10),
  osId: "",
};

export const FORMULARIO_ORCAMENTO_VAZIO = {
  osId: "",
  descricao: "",
  valor: "",
  status: "PENDENTE" as StatusOrcamento,
  dataOrcamento: new Date().toISOString().slice(0, 10),
};

export const FORMULARIO_DEVOLUCAO_VAZIO = {
  osId: "",
  aparelho: "",
  cliente: "",
  defeito: "",
  observacao: "",
  dataDevolucao: new Date().toISOString().slice(0, 10),
};

// =============================================================================
// HELPERS
// =============================================================================

/** Recupera o dono dos dados (RLS exige `user_id` em todas as tabelas novas). */
async function pegarUsuarioId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada. Faça login novamente.");
  return data.user.id;
}

const gerarId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Invalida todos os queries com o prefixo informado (ex.: ['sistema','os']). */
function invalidar(prefixo: string[]) {
  void queryClient.invalidateQueries({ queryKey: prefixo });
}

/** Canceia queries ativas para não sobrescrever um update otimista. */
function cancelarQueries(prefixo: string[]) {
  void queryClient.cancelQueries({ queryKey: prefixo });
}

// =============================================================================
// INTERFACE DA STORE
// =============================================================================

interface EstadoSistema {
  // ---- Barra lateral / navegação ----
  barraLateralAberta: boolean;
  alternarBarraLateral: () => void;
  fecharBarraLateral: () => void;

  // ---- Busca global (topbar) ----
  buscaGlobal: string;
  definirBuscaGlobal: (valor: string) => void;

  // ---- Filtros ----
  filtroOS: FiltroOS;
  definirFiltroOS: (parcial: Partial<FiltroOS>) => void;
  limparFiltroOS: () => void;

  filtroCaixa: FiltroCaixa;
  definirFiltroCaixa: (parcial: Partial<FiltroCaixa>) => void;

  filtroRelatorio: FiltroRelatorio;
  definirFiltroRelatorio: (parcial: Partial<FiltroRelatorio>) => void;

  // ---- Modais ----
  modalOS: EstadoModal<null>;
  modalCliente: EstadoModal<Cliente>;
  modalEstoque: EstadoModal<EstoqueItem>;
  modalServico: EstadoModal<{ id: string; nome: string } | null>;
  modalCaixa: EstadoModal<null>;
  modalOrcamento: EstadoModal<Orcamento>;
  modalDevolucao: EstadoModal<null>;

  abrirModalOS: () => void;
  fecharModalOS: () => void;
  abrirModalCliente: (cliente?: Cliente) => void;
  fecharModalCliente: () => void;
  abrirModalEstoque: (item?: EstoqueItem) => void;
  fecharModalEstoque: () => void;
  abrirModalServico: (item?: { id: string; nome: string } | null) => void;
  fecharModalServico: () => void;
  abrirModalCaixa: () => void;
  fecharModalCaixa: () => void;
  abrirModalOrcamento: (item?: Orcamento) => void;
  fecharModalOrcamento: () => void;
  abrirModalDevolucao: () => void;
  fecharModalDevolucao: () => void;

  // ---- Notificações (toast) ----
  notificacoes: Notificacao[];
  notificar: (mensagem: string, tipo?: TipoNotificacao) => void;
  removerNotificacao: (id: string) => void;

  // ---- CRUD: Ordens de Serviço ----
  criarOS: (form: FormularioOS) => Promise<boolean>;
  /**
   * Estende o CRUD de OS (FASE 3 — Orçamento Inteligente): cria a OS devolvendo
   * `{ id, numero }` para o chamador exibir o número real (ex.: conversão de
   * solicitação de orçamento em OS). Não altera o comportamento de `criarOS`.
   */
  criarOSDeSolicitacao: (form: FormularioOS) => Promise<{ id: string; numero: number } | null>;
  atualizarOS: (id: string, form: FormularioOS) => Promise<boolean>;
  excluirOS: (id: string) => Promise<boolean>;
  definirStatusOS: (id: string, status: StatusOS) => Promise<boolean>;

  // ---- CRUD: Clientes ----
  criarCliente: (form: typeof FORMULARIO_CLIENTE_VAZIO) => Promise<boolean>;
  atualizarCliente: (id: string, form: typeof FORMULARIO_CLIENTE_VAZIO) => Promise<boolean>;
  excluirCliente: (id: string) => Promise<boolean>;

  // ---- CRUD: Estoque ----
  criarItemEstoque: (form: FormularioEstoque) => Promise<boolean>;
  atualizarItemEstoque: (id: string, form: FormularioEstoque) => Promise<boolean>;
  excluirItemEstoque: (id: string) => Promise<boolean>;

  // ---- CRUD: Tipos de serviço ----
  criarTipoServico: (nome: string) => Promise<boolean>;
  excluirTipoServico: (id: string) => Promise<boolean>;

  // ---- CRUD: Caixa ----
  criarMovimentacao: (form: typeof FORMULARIO_CAIXA_VAZIO) => Promise<boolean>;
  excluirMovimentacao: (id: string) => Promise<boolean>;

  // ---- CRUD: Orçamentos ----
  criarOrcamento: (form: typeof FORMULARIO_ORCAMENTO_VAZIO) => Promise<boolean>;
  atualizarOrcamento: (id: string, form: typeof FORMULARIO_ORCAMENTO_VAZIO) => Promise<boolean>;
  excluirOrcamento: (id: string) => Promise<boolean>;

  // ---- CRUD: Devoluções ----
  criarDevolucao: (form: typeof FORMULARIO_DEVOLUCAO_VAZIO) => Promise<boolean>;
  excluirDevolucao: (id: string) => Promise<boolean>;
}

// =============================================================================
// STORE
// =============================================================================

export const useSistemaStore = create<EstadoSistema>((set, get) => {
  /** Envolvente padrão: notifica no erro e devolve `false`. */
  const executar = async (rotina: () => Promise<void>, sucesso: string): Promise<boolean> => {
    try {
      await rotina();
      get().notificar(sucesso, "success");
      return true;
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : "Erro inesperado.";
      get().notificar(msg, "error");
      return false;
    }
  };

  // Monta o payload de OS a partir do formulário (já no formato do banco).
  const montarPayloadOS = async (form: FormularioOS) => {
    const userId = await pegarUsuarioId();
    const clienteId = form.clienteId || null;
    // Sem cliente vinculado, guardamos o nome digitado para não perder dado.
    const clienteNome = form.clienteId ? null : form.clienteNome.trim() || null;
    return {
      user_id: userId,
      aparelho: form.aparelho.trim(),
      marca: form.marca.trim() || null,
      cliente_id: clienteId,
      cliente_nome: clienteNome,
      telefone: form.telefone.trim() || null,
      defeito: form.defeito.trim(),
      status: paraStatusBanco(form.status),
      observacao: form.observacao.trim() || null,
      valor: Number(form.valorOrcado.replace(",", ".")) || 0,
      quantidade: Math.max(1, parseInt(form.quantidade, 10) || 1),
      data_entrada: form.dataEntrada,
    };
  };

  return {
    // -------------------------------------------------------------------------
    // NAVEGAÇÃO
    // -------------------------------------------------------------------------
    barraLateralAberta: false,
    alternarBarraLateral: () => set((s) => ({ barraLateralAberta: !s.barraLateralAberta })),
    fecharBarraLateral: () => set({ barraLateralAberta: false }),

    buscaGlobal: "",
    definirBuscaGlobal: (valor) => set({ buscaGlobal: valor }),

    // -------------------------------------------------------------------------
    // FILTROS
    // -------------------------------------------------------------------------
    filtroOS: FILTRO_OS_PADRAO,
    definirFiltroOS: (parcial) => set((s) => ({ filtroOS: { ...s.filtroOS, ...parcial } })),
    limparFiltroOS: () => set({ filtroOS: FILTRO_OS_PADRAO }),

    filtroCaixa: FILTRO_CAIXA_PADRAO,
    definirFiltroCaixa: (parcial) => set((s) => ({ filtroCaixa: { ...s.filtroCaixa, ...parcial } })),

    filtroRelatorio: FILTRO_RELATORIO_PADRAO,
    definirFiltroRelatorio: (parcial) =>
      set((s) => ({ filtroRelatorio: { ...s.filtroRelatorio, ...parcial } })),

    // -------------------------------------------------------------------------
    // MODAIS
    // -------------------------------------------------------------------------
    modalOS: MODAL_FECHADO,
    abrirModalOS: () => set({ modalOS: { aberto: true, editando: null } }),
    fecharModalOS: () => set({ modalOS: MODAL_FECHADO }),

    modalCliente: MODAL_FECHADO as EstadoModal<Cliente>,
    abrirModalCliente: (cliente) => set({ modalCliente: { aberto: true, editando: cliente ?? null } }),
    fecharModalCliente: () => set({ modalCliente: MODAL_FECHADO as EstadoModal<Cliente> }),

    modalEstoque: MODAL_FECHADO as EstadoModal<EstoqueItem>,
    abrirModalEstoque: (item) => set({ modalEstoque: { aberto: true, editando: item ?? null } }),
    fecharModalEstoque: () => set({ modalEstoque: MODAL_FECHADO as EstadoModal<EstoqueItem> }),

    modalServico: MODAL_FECHADO as EstadoModal<{ id: string; nome: string } | null>,
    abrirModalServico: (item) =>
      set({ modalServico: { aberto: true, editando: item ?? null } }),
    fecharModalServico: () =>
      set({ modalServico: MODAL_FECHADO as EstadoModal<{ id: string; nome: string } | null> }),

    modalCaixa: MODAL_FECHADO,
    abrirModalCaixa: () => set({ modalCaixa: { aberto: true, editando: null } }),
    fecharModalCaixa: () => set({ modalCaixa: MODAL_FECHADO }),

    modalOrcamento: MODAL_FECHADO as EstadoModal<Orcamento>,
    abrirModalOrcamento: (item) => set({ modalOrcamento: { aberto: true, editando: item ?? null } }),
    fecharModalOrcamento: () => set({ modalOrcamento: MODAL_FECHADO as EstadoModal<Orcamento> }),

    modalDevolucao: MODAL_FECHADO,
    abrirModalDevolucao: () => set({ modalDevolucao: { aberto: true, editando: null } }),
    fecharModalDevolucao: () => set({ modalDevolucao: MODAL_FECHADO }),

    // -------------------------------------------------------------------------
    // NOTIFICAÇÕES
    // -------------------------------------------------------------------------
    notificacoes: [],
    notificar: (mensagem, tipo = "info") => {
      const id = gerarId();
      set((s) => ({ notificacoes: [...s.notificacoes, { id, tipo, mensagem }] }));
      // Auto-dismiss após 4s (mesmo comportamento do toast do HTML original).
      setTimeout(() => get().removerNotificacao(id), 4000);
    },
    removerNotificacao: (id) =>
      set((s) => ({ notificacoes: s.notificacoes.filter((n) => n.id !== id) })),

    // -------------------------------------------------------------------------
    // CRUD: ORDENS DE SERVIÇO
    // -------------------------------------------------------------------------
    criarOS: (form) =>
      executar(async () => {
        await cancelarQueries(["sistema", "os"]);
        const payload = await montarPayloadOS(form);
        const { error } = await supabase.from("ordens_servico").insert(payload);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "OS criada com sucesso!"),

    criarOSDeSolicitacao: async (form) => {
      try {
        await cancelarQueries(["sistema", "os"]);
        const payload = await montarPayloadOS(form);
        const { data, error } = await supabase
          .from("ordens_servico")
          .insert(payload)
          .select("id, numero")
          .single();
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
        get().notificar(`OS #${String(data.numero).padStart(4, "0")} criada com sucesso!`, "success");
        return { id: data.id, numero: data.numero };
      } catch (erro) {
        const msg = erro instanceof Error ? erro.message : "Erro inesperado.";
        get().notificar(msg, "error");
        return null;
      }
    },

    atualizarOS: (id, form) =>
      executar(async () => {
        await cancelarQueries(["sistema", "os"]);
        const payload = await montarPayloadOS(form);
        const { error } = await supabase.from("ordens_servico").update(payload).eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "OS atualizada!"),

    excluirOS: (id) =>
      executar(async () => {
        await cancelarQueries(["sistema", "os"]);
        // Otimista: remove do cache imediatamente, com rollback em caso de erro.
        const chaves = queryClient.getQueriesData({ queryKey: ["sistema", "os"] });
        const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
        if (error) {
          chaves.forEach(([chave, dados]) => queryClient.setQueryData(chave, dados));
          throw new Error(traduzirErro(error.message));
        }
        invalidar(["sistema"]);
      }, "OS excluída."),

    definirStatusOS: (id, status) =>
      executar(async () => {
        await cancelarQueries(["sistema", "os"]);
        const { error } = await supabase
          .from("ordens_servico")
          .update({ status: paraStatusBanco(status) })
          .eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, `Status alterado para ${status}.`),

    // -------------------------------------------------------------------------
    // CRUD: CLIENTES
    // -------------------------------------------------------------------------
    criarCliente: (form) =>
      executar(async () => {
        const userId = await pegarUsuarioId();
        const { error } = await supabase.from("clientes").insert({
          user_id: userId,
          nome: form.nome.trim(),
          telefone: form.telefone.trim() || null,
          email: form.email.trim() || null,
        });
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Cliente cadastrado!"),

    atualizarCliente: (id, form) =>
      executar(async () => {
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: form.nome.trim(),
            telefone: form.telefone.trim() || null,
            email: form.email.trim() || null,
          })
          .eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Cliente atualizado!"),

    excluirCliente: (id) =>
      executar(async () => {
        const { error } = await supabase.from("clientes").delete().eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Cliente excluído."),

    // -------------------------------------------------------------------------
    // CRUD: ESTOQUE
    // -------------------------------------------------------------------------
    criarItemEstoque: (form) =>
      executar(async () => {
        const userId = await pegarUsuarioId();
        const { error } = await supabase.from("estoque").insert({
          user_id: userId,
          proprietario: form.proprietario || "HC TECH",
          canal_de_venda: form.canal_de_venda || "Loja física",
          aparelho: form.aparelho.trim(),
          quantidade: Math.max(1, parseInt(form.quantidade, 10) || 1),
          defeito: form.defeito.trim() || null,
          condicao: form.condicao.trim() || null,
          observacao: form.observacao.trim() || null,
          categoria: form.categoria || null,
          subcategoria: form.subcategoria || null,
          sku: form.sku.trim() || null,
          marca: form.marca.trim() || null,
          modelo: form.modelo.trim() || null,
          preco_venda: form.preco_venda.trim() ? parseFloat(form.preco_venda.replace(",", ".")) : null,
          custo: form.custo.trim() ? parseFloat(form.custo.replace(",", ".")) : null,
          fornecedor: form.fornecedor.trim() || null,
          imei_sn: form.imei_sn.trim() || null,
        });
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Item adicionado ao estoque!"),

    atualizarItemEstoque: (id, form) =>
      executar(async () => {
        const { error } = await supabase
          .from("estoque")
          .update({
            aparelho: form.aparelho.trim(),
            quantidade: Math.max(1, parseInt(form.quantidade, 10) || 1),
            defeito: form.defeito.trim() || null,
            condicao: form.condicao.trim() || null,
            observacao: form.observacao.trim() || null,
            proprietario: form.proprietario || "HC TECH",
            canal_de_venda: form.canal_de_venda || "Loja física",
            categoria: form.categoria || null,
            subcategoria: form.subcategoria || null,
            sku: form.sku.trim() || null,
            marca: form.marca.trim() || null,
            modelo: form.modelo.trim() || null,
            preco_venda: form.preco_venda.trim() ? parseFloat(form.preco_venda.replace(",", ".")) : null,
            custo: form.custo.trim() ? parseFloat(form.custo.replace(",", ".")) : null,
            fornecedor: form.fornecedor.trim() || null,
            imei_sn: form.imei_sn.trim() || null,
          })
          .eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Item de estoque atualizado!"),

    excluirItemEstoque: (id) =>
      executar(async () => {
        const { error } = await supabase.from("estoque").delete().eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Item removido do estoque."),

    // -------------------------------------------------------------------------
    // CRUD: TIPOS DE SERVIÇO
    // -------------------------------------------------------------------------
    criarTipoServico: (nome) =>
      executar(async () => {
        const userId = await pegarUsuarioId();
        const { error } = await supabase
          .from("servico_tipos")
          .insert({ user_id: userId, nome: nome.trim() });
        if (error) {
          if (error.code === "23505") throw new Error("Este tipo de serviço já existe.");
          throw new Error(traduzirErro(error.message));
        }
        invalidar(["sistema"]);
      }, "Tipo de serviço adicionado!"),

    excluirTipoServico: (id) =>
      executar(async () => {
        const { error } = await supabase.from("servico_tipos").delete().eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Tipo de serviço removido."),

    // -------------------------------------------------------------------------
    // CRUD: CAIXA
    // -------------------------------------------------------------------------
    criarMovimentacao: (form) =>
      executar(async () => {
        const userId = await pegarUsuarioId();
        const { error } = await supabase.from("caixa_movimentos").insert({
          user_id: userId,
          data: form.data,
          descricao: form.descricao.trim(),
          tipo: form.tipo === "ENTRADA" ? "entrada" : "saida",
          valor: Math.abs(Number(form.valor.replace(",", ".")) || 0),
          ...(form.osId ? { os_id: form.osId } : {}),
        });
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Movimentação registrada!"),

    excluirMovimentacao: (id) =>
      executar(async () => {
        const { error } = await supabase.from("caixa_movimentos").delete().eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Movimentação excluída."),

    // -------------------------------------------------------------------------
    // CRUD: ORÇAMENTOS
    // -------------------------------------------------------------------------
    criarOrcamento: (form) =>
      executar(async () => {
        const userId = await pegarUsuarioId();
        const { error } = await supabase.from("orcamentos").insert({
          user_id: userId,
          os_id: form.osId || null,
          descricao: form.descricao.trim() || null,
          valor: Number(form.valor.replace(",", ".")) || 0,
          status: form.status.toLowerCase(),
          data_orcamento: form.dataOrcamento,
        });
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Orçamento criado!"),

    atualizarOrcamento: (id, form) =>
      executar(async () => {
        const { error } = await supabase
          .from("orcamentos")
          .update({
            os_id: form.osId || null,
            descricao: form.descricao.trim() || null,
            valor: Number(form.valor.replace(",", ".")) || 0,
            status: form.status.toLowerCase(),
            data_orcamento: form.dataOrcamento,
          })
          .eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Orçamento atualizado!"),

    excluirOrcamento: (id) =>
      executar(async () => {
        const { error } = await supabase.from("orcamentos").delete().eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Orçamento excluído."),

    // -------------------------------------------------------------------------
    // CRUD: DEVOLUÇÕES
    // -------------------------------------------------------------------------
    criarDevolucao: (form) =>
      executar(async () => {
        const userId = await pegarUsuarioId();
        // 1. Registra a devolução.
        const { error } = await supabase.from("devolucoes").insert({
          user_id: userId,
          os_id: form.osId,
          aparelho: form.aparelho.trim(),
          cliente: form.cliente.trim(),
          defeito: form.defeito.trim() || null,
          observacao: form.observacao.trim() || null,
          data_devolucao: form.dataDevolucao,
        });
        if (error) throw new Error(traduzirErro(error.message));

        // 2. Sincroniza o status da OS vinculada (consistência entre módulos).
        const { error: erroOS } = await supabase
          .from("ordens_servico")
          .update({ status: paraStatusBanco("DEVOLUCAO") })
          .eq("id", form.osId);
        if (erroOS) console.warn("[sistema] Falha ao sincronizar status da OS:", erroOS.message);

        invalidar(["sistema"]);
      }, "Devolução registrada!"),

    excluirDevolucao: (id) =>
      executar(async () => {
        const { error } = await supabase.from("devolucoes").delete().eq("id", id);
        if (error) throw new Error(traduzirErro(error.message));
        invalidar(["sistema"]);
      }, "Devolução excluída."),
  };
});

// =============================================================================
// UTILITÁRIOS EXPORTADOS
// =============================================================================

/**
 * Converte mensagens crípticas do Postgres/PostgREST em texto compreensível
 * para o operador (PT-BR).
 */
export function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("duplicate key") || m.includes("unique constraint"))
    return "Já existe um registro com esse valor.";
  if (m.includes("row-level security") || m.includes("permission denied"))
    return "Sem permissão para esta operação.";
  if (m.includes("violates foreign key"))
    return "Registro vinculado a outros dados. Remova os vínculos primeiro.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Falha de conexão. Verifique sua internet.";
  if (m.includes("session expired") || m.includes("jwt")) return "Sessão expirada. Refaça o login.";
  return mensagem;
}

/** Filtro puro de OS — reutilizado por página, relatório e dashboard. */
export function filtrarOS<T extends { status: StatusOS; clienteId: string | null; aparelho: string; clienteNome?: string | null; defeito: string; numero: number }>(
  lista: T[],
  filtro: FiltroOS,
  mapaClientes?: Map<string, string>
): T[] {
  const busca = filtro.busca.trim().toLowerCase();
  return lista.filter((os) => {
    if (filtro.status !== "TODOS" && os.status !== filtro.status) return false;
    if (filtro.clienteId !== "TODOS" && os.clienteId !== filtro.clienteId) return false;
    if (!busca) return true;
    const nomeCliente =
      (os.clienteId ? mapaClientes?.get(os.clienteId) : null) ?? os.clienteNome ?? "";
    return [
      String(os.numero),
      os.aparelho,
      nomeCliente,
      os.defeito,
    ].some((campo) => campo.toLowerCase().includes(busca));
  });
}

/** Converte linhas cruas do banco em `OrdemServico` de domínio. */
export function converterLinhasOS(linhas: LinhaOrdemServico[]) {
  return linhas.map(adaptarOS);
}

/** Soma entradas/saídas e devolve o resumo do caixa. */
export function resumirCaixa(movimentos: CaixaMovimentacao[]) {
  const entradas = movimentos
    .filter((m) => m.tipo === "ENTRADA")
    .reduce((s, m) => s + m.valor, 0);
  const saidas = movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + m.valor, 0);
  return { entradas, saidas, saldo: entradas - saidas };
}
