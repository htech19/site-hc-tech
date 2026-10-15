import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Download, Filter, Plus, Search, Trash2, Upload, UserRound, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ClienteDetailsDialog } from "@/sistema/components/ClienteDetailsDialog";
import { ClienteForm } from "@/sistema/components/ClienteForm";
import { ClienteImportDialog } from "@/sistema/components/ClienteImportDialog";
import { ClienteList } from "@/sistema/components/ClienteList";
import { ClienteOSHistory } from "@/sistema/components/ClienteOSHistory";
import {
  buildClientesSearchFilter,
  descreverDuplicidades,
  serializeClientesCsv,
  type ClienteFormData,
  type ClienteImportacaoLinha,
  type ClienteResumo,
  type FiltroStatus,
} from "@/sistema/clientes/clientes-utils";
import { maskDoc, maskPhone, onlyDigits } from "@/sistema/clientes/utils";
import type { Cliente } from "@/sistema/os-shared";

const PAGE_SIZES = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const QUERY_CHUNK_SIZE = 500;
const MUTATION_CHUNK_SIZE = 100;

type StatusCliente = Cliente["status"];

async function carregarResumoOS(clienteIds: string[]) {
  const resumo = new Map<string, { total: number; ultima: string | null }>();
  if (clienteIds.length === 0) return resumo;

  for (let offset = 0; ; offset += QUERY_CHUNK_SIZE) {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("id, cliente_id, data_entrada")
      .in("cliente_id", clienteIds)
      .order("data_entrada", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + QUERY_CHUNK_SIZE - 1);
    if (error) throw error;

    for (const os of data ?? []) {
      if (!os.cliente_id) continue;
      const atual = resumo.get(os.cliente_id) ?? { total: 0, ultima: null };
      atual.total += 1;
      if (!atual.ultima || os.data_entrada > atual.ultima) atual.ultima = os.data_entrada;
      resumo.set(os.cliente_id, atual);
    }
    if ((data?.length ?? 0) < QUERY_CHUNK_SIZE) break;
  }
  return resumo;
}

async function carregarPaginaClientes(busca: string, status: FiltroStatus, tag: string, pagina: number, pageSize: number) {
  let query = supabase.from("clientes").select("*", { count: "exact" }).order("nome").order("id");
  if (busca) query = query.or(buildClientesSearchFilter(busca));
  if (status !== "todos") query = query.eq("status", status);
  if (tag) query = query.contains("tags", [tag]);

  const { data, error, count } = await query.range(pagina * pageSize, pagina * pageSize + pageSize - 1);
  if (error) throw error;
  const clientes = (data ?? []) as Cliente[];
  const resumoOS = await carregarResumoOS(clientes.map((cliente) => cliente.id));
  return {
    total: count ?? 0,
    linhas: clientes.map((cliente) => ({
      ...cliente,
      totalOS: resumoOS.get(cliente.id)?.total ?? 0,
      ultimaOS: resumoOS.get(cliente.id)?.ultima ?? null,
    } satisfies ClienteResumo)),
  };
}

async function carregarIdsFiltrados(busca: string, status: FiltroStatus, tag: string) {
  const ids: string[] = [];
  for (let offset = 0; ; offset += QUERY_CHUNK_SIZE) {
    let query = supabase.from("clientes").select("id").order("nome").order("id");
    if (busca) query = query.or(buildClientesSearchFilter(busca));
    if (status !== "todos") query = query.eq("status", status);
    if (tag) query = query.contains("tags", [tag]);
    const { data, error } = await query.range(offset, offset + QUERY_CHUNK_SIZE - 1);
    if (error) throw error;
    ids.push(...(data ?? []).map((cliente) => cliente.id));
    if ((data?.length ?? 0) < QUERY_CHUNK_SIZE) break;
  }
  return ids;
}

async function carregarParaExportacao(ids: string[]) {
  const clientes: Cliente[] = [];
  for (let offset = 0; offset < ids.length; offset += MUTATION_CHUNK_SIZE) {
    const { data, error } = await supabase.from("clientes").select("*").in("id", ids.slice(offset, offset + MUTATION_CHUNK_SIZE));
    if (error) throw error;
    clientes.push(...((data ?? []) as Cliente[]));
  }
  return clientes;
}

function filtrosDeDuplicidade(linhas: ClienteImportacaoLinha[]) {
  const filtros: string[] = [];
  const quote = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  for (const { cliente } of linhas) {
    const documento = onlyDigits(cliente.documento);
    const email = cliente.email?.trim();
    if (documento) {
      for (const valor of new Set([documento, maskDoc(documento, "PF"), maskDoc(documento, "PJ")])) {
        filtros.push(`documento.eq.${quote(valor)}`);
      }
      filtros.push(`documento.ilike.${quote(`%${documento.slice(-6)}`)}`);
    }
    if (email) filtros.push(`email.ilike.${quote(email.replace(/[%_]/g, "\\$&"))}`);
    for (const telefone of [cliente.telefone, cliente.telefone2, cliente.whatsapp]) {
      const digitos = onlyDigits(telefone);
      if (!digitos) continue;
      const local = digitos.replace(/^55(?=\d{10,11}$)/, "");
      const valores = new Set([digitos, local, `55${local}`, maskPhone(local)]);
      for (const valor of valores) {
        for (const campo of ["telefone", "telefone2", "whatsapp"]) {
          filtros.push(`${campo}.eq.${quote(valor)}`);
        }
      }
      const sufixo = digitos.slice(-7);
      if (sufixo.length === 7) {
        for (const campo of ["telefone", "telefone2", "whatsapp"]) {
          filtros.push(`${campo}.ilike.${quote(`%${sufixo}`)}`);
        }
      }
    }
  }
  return Array.from(new Set(filtros));
}

async function encontrarDuplicadosImportacao(linhas: ClienteImportacaoLinha[]) {
  const duplicados = new Map<number, string>();
  const candidatas = linhas.filter((linha) => !linha.duplicado);
  for (let offset = 0; offset < candidatas.length; offset += 10) {
    const lote = candidatas.slice(offset, offset + 10);
    const filtros = filtrosDeDuplicidade(lote);
    if (!filtros.length) continue;
    const { data, error } = await supabase.from("clientes").select("*").or(filtros.join(","));
    if (error) throw error;
    const existentes = (data ?? []) as Cliente[];
    for (const linha of lote) {
      const correspondencias = descreverDuplicidades(linha.cliente, existentes);
      if (correspondencias.length) duplicados.set(linha.linha, `Já existe: ${correspondencias.join("; ")}.`);
    }
  }
  return duplicados;
}

async function obterUsuarioId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada. Entre novamente no sistema.");
  return data.user.id;
}

function useDebounce(valor: string, atraso = 300) {
  const [debounced, setDebounced] = useState(valor.trim());
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(valor.trim()), atraso);
    return () => window.clearTimeout(timer);
  }, [valor, atraso]);
  return debounced;
}

function Indicador({ label, value, icon: Icon, tone = "zinc" }: {
  label: string;
  value?: number;
  icon: typeof Users;
  tone?: "zinc" | "green" | "amber" | "rose" | "blue";
}) {
  const color = {
    zinc: "text-zinc-600", green: "text-emerald-700", amber: "text-amber-700",
    rose: "text-rose-700", blue: "text-sky-700",
  }[tone];
  return (
    <div className="min-w-0 rounded-md border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-zinc-500 sm:text-sm">{label}</p>
        <Icon size={17} className={color} aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">{value ?? "—"}</p>
    </div>
  );
}

const SistemaClientesPage = () => {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca);
  const [status, setStatus] = useState<FiltroStatus>("todos");
  const [tag, setTag] = useState("");
  const tagDebounced = useDebounce(tag);
  const [pagina, setPagina] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [formAberto, setFormAberto] = useState(false);
  const [importAberto, setImportAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteResumo | null>(null);
  const [clienteVisualizado, setClienteVisualizado] = useState<ClienteResumo | null>(null);
  const [clienteHistorico, setClienteHistorico] = useState<ClienteResumo | null>(null);
  const [operando, setOperando] = useState(false);
  const [aviso, setAviso] = useState("");
  const filtroAtivo = Boolean(buscaDebounced || status !== "todos" || tagDebounced);

  const consulta = useQuery({
    queryKey: ["sistema", "clientes", { busca: buscaDebounced, status, tag: tagDebounced, pagina, pageSize }],
    queryFn: () => carregarPaginaClientes(buscaDebounced, status, tagDebounced, pagina, pageSize),
    staleTime: 30_000,
  });
  const indicadores = useQuery({
    queryKey: ["sistema", "clientes", "indicadores"],
    queryFn: async () => {
      const contar = async (estado?: StatusCliente) => {
        let query = supabase.from("clientes").select("id", { count: "exact", head: true });
        if (estado) query = query.eq("status", estado);
        const { count, error } = await query;
        if (error) throw error;
        return count ?? 0;
      };
      const [todos, ativos, inativos, bloqueados] = await Promise.all([
        contar(), contar("ativo"), contar("inativo"), contar("bloqueado"),
      ]);
      return { todos, ativos, inativos, bloqueados };
    },
    staleTime: 30_000,
  });

  const linhas = consulta.data?.linhas ?? [];
  const total = consulta.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const todosDaPaginaSelecionados = linhas.length > 0 && linhas.every((cliente) => selecionados.has(cliente.id));
  const algunsDaPaginaSelecionados = linhas.some((cliente) => selecionados.has(cliente.id));
  const idsSelecionados = useMemo(() => Array.from(selecionados), [selecionados]);

  useEffect(() => {
    if (pagina >= totalPaginas) setPagina(totalPaginas - 1);
  }, [pagina, totalPaginas]);

  const invalidarClientes = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sistema", "clientes"] }),
      queryClient.invalidateQueries({ queryKey: ["sistema", "os"] }),
    ]);
  }, [queryClient]);

  const salvarCliente = useCallback(async (dados: ClienteFormData, id?: string) => {
    const payload = {
      ...dados,
      nome: dados.nome.trim(),
      documento: dados.documento?.trim() || null,
      telefone: dados.telefone?.trim() || null,
      telefone2: dados.telefone2?.trim() || null,
      whatsapp: dados.whatsapp?.trim() || null,
      email: dados.email?.trim() || null,
      rg_ie: dados.rg_ie?.trim() || null,
      nome_fantasia: dados.nome_fantasia?.trim() || null,
      cep: dados.cep?.trim() || null,
      endereco: dados.endereco?.trim() || null,
      numero: dados.numero?.trim() || null,
      complemento: dados.complemento?.trim() || null,
      bairro: dados.bairro?.trim() || null,
      cidade: dados.cidade?.trim() || null,
      uf: dados.uf?.trim().toUpperCase() || null,
      observacoes: dados.observacoes?.trim() || null,
      motivo_bloqueio: dados.status === "bloqueado" ? dados.motivo_bloqueio?.trim() || null : null,
    };
    if (id) {
      const { error } = await supabase.from("clientes").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const userId = await obterUsuarioId();
      const { error } = await supabase.from("clientes").insert({ ...payload, user_id: userId });
      if (error) throw error;
      setPagina(0);
    }
    await invalidarClientes();
    setAviso(id ? "Cadastro atualizado." : "Cliente cadastrado.");
  }, [invalidarClientes]);

  const excluirClientes = useCallback(async (ids: string[]) => {
    const vinculados = new Map<string, Set<string>>();
    const relacoes = [
      { tabela: "ordens_servico", rotulo: "OS" },
      { tabela: "cliente_contatos", rotulo: "contatos" },
      { tabela: "cliente_interacoes", rotulo: "interações" },
      { tabela: "cliente_anexos", rotulo: "anexos" },
      { tabela: "orcamentos", rotulo: "orçamentos" },
    ] as const;

    for (let offset = 0; offset < ids.length; offset += MUTATION_CHUNK_SIZE) {
      for (const relacao of relacoes) {
        for (let relacaoOffset = 0; ; relacaoOffset += QUERY_CHUNK_SIZE) {
          const { data, error } = await supabase.from(relacao.tabela)
            .select("cliente_id")
            .in("cliente_id", ids.slice(offset, offset + MUTATION_CHUNK_SIZE))
            .range(relacaoOffset, relacaoOffset + QUERY_CHUNK_SIZE - 1);
          if (error) throw error;
          for (const registro of data ?? []) {
            if (!registro.cliente_id) continue;
            const categorias = vinculados.get(registro.cliente_id) ?? new Set<string>();
            categorias.add(relacao.rotulo);
            vinculados.set(registro.cliente_id, categorias);
          }
          if ((data?.length ?? 0) < QUERY_CHUNK_SIZE) break;
        }
      }
    }

    const removiveis = ids.filter((id) => !vinculados.has(id));
    let removidos = 0;
    for (let offset = 0; offset < removiveis.length; offset += MUTATION_CHUNK_SIZE) {
      const { data, error } = await supabase.from("clientes").delete()
        .in("id", removiveis.slice(offset, offset + MUTATION_CHUNK_SIZE)).select("id");
      if (error) throw error;
      removidos += data?.length ?? 0;
    }
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      ids.forEach((id) => proximo.delete(id));
      return proximo;
    });
    await invalidarClientes();
    return { removidos, preservados: vinculados };
  }, [invalidarClientes]);

  const excluirUmCliente = async (cliente: ClienteResumo) => {
    if (!window.confirm(`Excluir o cadastro de ${cliente.nome}? Todos os registros vinculados serão verificados antes.`)) return;
    setOperando(true);
    setAviso("");
    try {
      const resultado = await excluirClientes([cliente.id]);
      const categorias = resultado.preservados.get(cliente.id);
      setAviso(categorias ? `${cliente.nome} não foi excluído: possui ${Array.from(categorias).join(", ")} vinculados. O histórico foi preservado.` : "Cliente excluído.");
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível excluir o cliente.");
    } finally {
      setOperando(false);
    }
  };

  const alternarCliente = (id: string, marcado: boolean) => setSelecionados((atual) => {
    const proximo = new Set(atual);
    if (marcado) proximo.add(id); else proximo.delete(id);
    return proximo;
  });
  const alternarPagina = (marcado: boolean) => setSelecionados((atual) => {
    const proximo = new Set(atual);
    for (const cliente of linhas) if (marcado) proximo.add(cliente.id); else proximo.delete(cliente.id);
    return proximo;
  });

  const selecionarFiltrados = async () => {
    setOperando(true);
    setAviso("");
    try {
      const ids = await carregarIdsFiltrados(buscaDebounced, status, tagDebounced);
      setSelecionados(new Set(ids));
      setAviso(`${ids.length} cliente(s) correspondem aos filtros e foram selecionados.`);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível selecionar os clientes filtrados.");
    } finally {
      setOperando(false);
    }
  };

  const excluirSelecionados = async () => {
    if (!idsSelecionados.length || !window.confirm(`Excluir ${idsSelecionados.length} cadastros sem registros relacionados? Clientes com OS, contatos, interações, anexos ou orçamentos serão preservados.`)) return;
    setOperando(true);
    setAviso("");
    try {
      const resultado = await excluirClientes(idsSelecionados);
      setAviso(`${resultado.removidos} excluído(s); ${resultado.preservados.size} preservado(s) por ter registros vinculados.`);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível excluir os clientes selecionados.");
    } finally {
      setOperando(false);
    }
  };

  const exportarClientes = async () => {
    setOperando(true);
    setAviso("");
    try {
      const ids = idsSelecionados.length ? idsSelecionados : await carregarIdsFiltrados(buscaDebounced, status, tagDebounced);
      const clientes = await carregarParaExportacao(ids);
      const file = new Blob([serializeClientesCsv(clientes)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAviso(`${clientes.length} cliente(s) exportado(s) conforme os filtros/seleção.`);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível exportar os clientes.");
    } finally {
      setOperando(false);
    }
  };

  const importarClientes = async (clientes: ClienteFormData[]) => {
    if (!clientes.length) return;
    const userId = await obterUsuarioId();
    const rows = clientes.map((cliente) => ({
      ...cliente,
      user_id: userId,
      nome: cliente.nome.trim(),
      documento: cliente.documento?.trim() || null,
      telefone: cliente.telefone?.trim() || null,
      telefone2: cliente.telefone2?.trim() || null,
      whatsapp: cliente.whatsapp?.trim() || null,
      email: cliente.email?.trim() || null,
      rg_ie: cliente.rg_ie?.trim() || null,
      nome_fantasia: cliente.nome_fantasia?.trim() || null,
      cep: cliente.cep?.trim() || null,
      endereco: cliente.endereco?.trim() || null,
      numero: cliente.numero?.trim() || null,
      complemento: cliente.complemento?.trim() || null,
      bairro: cliente.bairro?.trim() || null,
      cidade: cliente.cidade?.trim() || null,
      uf: cliente.uf?.trim().toUpperCase() || null,
      observacoes: cliente.observacoes?.trim() || null,
      motivo_bloqueio: cliente.status === "bloqueado" ? cliente.motivo_bloqueio?.trim() || null : null,
    }));
    const { error } = await supabase.from("clientes").insert(rows);
    if (error) throw error;
    setSelecionados(new Set());
    setPagina(0);
    await invalidarClientes();
    setAviso(`${rows.length} cliente(s) importado(s) em uma única gravação.`);
  };

  const limparFiltros = () => {
    setBusca(""); setStatus("todos"); setTag(""); setPagina(0); setSelecionados(new Set());
  };
  const editarCliente = (cliente: ClienteResumo) => {
    setClienteVisualizado(null); setClienteEditando(cliente); setFormAberto(true);
  };

  return (
    <section className="space-y-5 text-zinc-900">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Indicador label="Todos os clientes" value={indicadores.data?.todos} icon={Users} />
        <Indicador label="Ativos" value={indicadores.data?.ativos} icon={CheckCircle2} tone="green" />
        <Indicador label="Inativos" value={indicadores.data?.inativos} icon={UserRound} tone="amber" />
        <Indicador label="Bloqueados" value={indicadores.data?.bloqueados} icon={Ban} tone="rose" />
        <Indicador label="Encontrados" value={consulta.data?.total} icon={Search} tone="blue" />
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(150px,0.7fr)_minmax(160px,0.8fr)_auto]">
          <div className="space-y-1.5"><label htmlFor="busca-clientes" className="text-xs font-medium text-zinc-600">Pesquisar</label><div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden /><input id="busca-clientes" type="search" disabled={operando} value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(0); setSelecionados(new Set()); }} placeholder="Nome, telefone, CPF/CNPJ ou e-mail" className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]/30 disabled:bg-zinc-100" /></div></div>
          <div className="space-y-1.5"><label htmlFor="filtro-status" className="text-xs font-medium text-zinc-600">Status</label><select id="filtro-status" disabled={operando} value={status} onChange={(event) => { setStatus(event.target.value as FiltroStatus); setPagina(0); setSelecionados(new Set()); }} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm disabled:bg-zinc-100"><option value="todos">Todos os status</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option></select></div>
          <div className="space-y-1.5"><label htmlFor="filtro-status" className="text-xs font-medium text-zinc-600">Status</label><select id="filtro-status" disabled={operando} value={status} onChange={(event) => { setStatus(event.target.value as FiltroStatus); setPagina(0); setSelecionados(new Set()); }} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm disabled:bg-zinc-100"><option value="todos">Todos os status</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option></select></div>
          <div className="space-y-1.5"><label htmlFor="filtro-tag" className="text-xs font-medium text-zinc-600">Tag exata</label><input id="filtro-tag" disabled={operando} value={tag} onChange={(event) => { setTag(event.target.value); setPagina(0); setSelecionados(new Set()); }} placeholder="Ex.: recorrente" className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]/30 disabled:bg-zinc-100" /></div>
          <Button type="button" variant="outline" disabled={operando || !filtroAtivo} onClick={limparFiltros} className="h-10 self-end border-zinc-300 text-zinc-700"><X size={15} className="mr-2" />Limpar filtros</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={operando} onClick={() => setImportAberto(true)} className="border-zinc-300 text-zinc-700"><Upload size={15} className="mr-2" />Importar CSV</Button>
          <Button type="button" variant="outline" disabled={operando} onClick={() => void exportarClientes()} className="border-zinc-300 text-zinc-700"><Download size={15} className="mr-2" />Exportar {idsSelecionados.length ? `(${idsSelecionados.length})` : "filtrados"}</Button>
          <Button type="button" disabled={operando} onClick={() => { setClienteEditando(null); setFormAberto(true); }} className="bg-[#00A651] font-semibold text-white hover:bg-[#008c44]"><Plus size={16} className="mr-1" />Novo Cliente</Button>
        </div>
      </div>

      {aviso && <div role="status" className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"><span>{aviso}</span><button type="button" aria-label="Fechar aviso" onClick={() => setAviso("")}><X size={16} /></button></div>}
      {(consulta.error || indicadores.error) && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"><span>Falha ao consultar Clientes: {(consulta.error ?? indicadores.error)?.message}</span><Button type="button" variant="outline" onClick={() => { void consulta.refetch(); void indicadores.refetch(); }} className="border-rose-300">Tentar novamente</Button></div>}

      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600"><span className="inline-flex items-center gap-1.5"><Filter size={15} aria-hidden />{total} encontrado(s)</span><span aria-live="polite">{idsSelecionados.length} selecionado(s)</span>
          <Button type="button" variant="link" disabled={operando || total === 0} onClick={() => void selecionarFiltrados()} className="h-auto p-0 text-[#008c44]">Selecionar todos os filtrados</Button>
          {idsSelecionados.length > 0 && <Button type="button" variant="link" onClick={() => setSelecionados(new Set())} className="h-auto p-0 text-zinc-500">Limpar seleção</Button>}
        </div>
        <div className="flex flex-wrap items-center gap-2"><label htmlFor="page-size" className="text-sm text-zinc-600">Por página</label><select id="page-size" disabled={operando} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPagina(0); setSelecionados(new Set()); }} className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm disabled:bg-zinc-100">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select>
          {idsSelecionados.length > 0 && <Button type="button" variant="outline" disabled={operando} onClick={() => void excluirSelecionados()} className="border-rose-300 text-rose-700 hover:bg-rose-50"><Trash2 size={15} className="mr-2" />Excluir selecionados</Button>}
        </div>
      </div>

      <ClienteList linhas={linhas} carregando={consulta.isPending} pausada={consulta.isPaused} erro={consulta.isError ? consulta.error : undefined} aoTentarNovamente={() => void consulta.refetch()} selecionados={selecionados} todosSelecionados={todosDaPaginaSelecionados} algunsSelecionados={algunsDaPaginaSelecionados} operando={operando} aoAlternar={alternarCliente} aoAlternarPagina={alternarPagina} aoEditar={editarCliente} aoVisualizar={setClienteVisualizado} aoVerHistorico={setClienteHistorico} aoExcluir={(cliente) => void excluirUmCliente(cliente)} />

      <div className="flex flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><span>Página {Math.min(pagina + 1, totalPaginas)} de {totalPaginas}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={operando || pagina === 0 || consulta.isFetching} onClick={() => setPagina((atual) => Math.max(0, atual - 1))}>Anterior</Button><Button type="button" variant="outline" disabled={operando || pagina + 1 >= totalPaginas || consulta.isFetching} onClick={() => setPagina((atual) => atual + 1)}>Próxima</Button></div></div>

      <ClienteForm aberto={formAberto} editando={clienteEditando} aoFechar={() => { setFormAberto(false); setClienteEditando(null); }} aoSalvar={salvarCliente} />
      <ClienteDetailsDialog cliente={clienteVisualizado} aoFechar={() => setClienteVisualizado(null)} aoEditar={editarCliente} aoVerHistorico={(cliente) => { setClienteVisualizado(null); setClienteHistorico(cliente); }} />
      <ClienteOSHistory cliente={clienteHistorico} aoFechar={() => setClienteHistorico(null)} />
      <ClienteImportDialog aberto={importAberto} aoFechar={() => setImportAberto(false)} aoChecarDuplicados={encontrarDuplicadosImportacao} aoImportar={importarClientes} />
    </section>
  );
};

export default SistemaClientesPage;
