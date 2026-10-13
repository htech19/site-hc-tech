import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Filter, Plus, Search, Trash2, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ClienteForm } from "@/sistema/components/ClienteForm";
import { ClienteList } from "@/sistema/components/ClienteList";
import { ClienteOSHistory } from "@/sistema/components/ClienteOSHistory";
import {
  buildClientesSearchFilter,
  parseClientesCsv,
  serializeClientesCsv,
  type ClienteFormData,
  type ClienteResumo,
  type FiltroContato,
} from "@/sistema/clientes/clientes-utils";

const PAGE_SIZE = 25;
const QUERY_CHUNK_SIZE = 500;
const MUTATION_CHUNK_SIZE = 100;
type ClienteBase = Pick<ClienteResumo, "id" | "nome" | "telefone" | "email" | "created_at">;

async function carregarResumoOS(clienteIds: string[]) {
  const resumo = new Map<string, { total: number; ultima: string | null }>();
  if (clienteIds.length === 0) return resumo;

  for (let offset = 0; ; offset += QUERY_CHUNK_SIZE) {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("cliente_id, quantidade, data_entrada")
      .in("cliente_id", clienteIds)
      .order("data_entrada", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + QUERY_CHUNK_SIZE - 1);
    if (error) throw error;

    for (const os of data ?? []) {
      if (!os.cliente_id) continue;
      const atual = resumo.get(os.cliente_id) ?? { total: 0, ultima: null };
      atual.total += os.quantidade ?? 1;
      if (!atual.ultima || os.data_entrada > atual.ultima) atual.ultima = os.data_entrada;
      resumo.set(os.cliente_id, atual);
    }
    if ((data?.length ?? 0) < QUERY_CHUNK_SIZE) break;
  }
  return resumo;
}

async function carregarPaginaClientes(busca: string, filtro: FiltroContato, pagina: number) {
  let consulta = supabase
    .from("clientes")
    .select("id, nome, telefone, email, created_at", { count: "exact" })
    .order("nome", { ascending: true })
    .order("id", { ascending: true });
  if (busca) consulta = consulta.or(buildClientesSearchFilter(busca));
  if (filtro === "telefone") consulta = consulta.not("telefone", "is", null);
  if (filtro === "email") consulta = consulta.not("email", "is", null);

  const { data, error, count } = await consulta.range(pagina * PAGE_SIZE, pagina * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) throw error;
  const clientes = (data ?? []) as ClienteBase[];
  const resumoOS = await carregarResumoOS(clientes.map((cliente) => cliente.id));
  return {
    total: count ?? 0,
    linhas: clientes.map((cliente) => ({
      ...cliente,
      telefone: cliente.telefone ?? "",
      totalOS: resumoOS.get(cliente.id)?.total ?? 0,
      ultimaOS: resumoOS.get(cliente.id)?.ultima ?? null,
    } satisfies ClienteResumo)),
  };
}

async function carregarIdsFiltrados(busca: string, filtro: FiltroContato) {
  const ids: string[] = [];
  for (let offset = 0; ; offset += QUERY_CHUNK_SIZE) {
    let consulta = supabase.from("clientes").select("id").order("nome", { ascending: true }).order("id", { ascending: true });
    if (busca) consulta = consulta.or(buildClientesSearchFilter(busca));
    if (filtro === "telefone") consulta = consulta.not("telefone", "is", null);
    if (filtro === "email") consulta = consulta.not("email", "is", null);
    const { data, error } = await consulta.range(offset, offset + QUERY_CHUNK_SIZE - 1);
    if (error) throw error;
    ids.push(...(data ?? []).map((cliente) => cliente.id));
    if ((data?.length ?? 0) < QUERY_CHUNK_SIZE) break;
  }
  return ids;
}

async function carregarParaExportacao(ids: string[]) {
  const clientes: ClienteBase[] = [];
  for (let offset = 0; offset < ids.length; offset += MUTATION_CHUNK_SIZE) {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, telefone, email, created_at")
      .in("id", ids.slice(offset, offset + MUTATION_CHUNK_SIZE));
    if (error) throw error;
    clientes.push(...((data ?? []) as ClienteBase[]));
  }
  return clientes;
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

const SistemaClientesPage = () => {
  const queryClient = useQueryClient();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca);
  const [filtro, setFiltro] = useState<FiltroContato>("todos");
  const [pagina, setPagina] = useState(0);
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [formAberto, setFormAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteResumo | null>(null);
  const [clienteHistorico, setClienteHistorico] = useState<ClienteResumo | null>(null);
  const [operando, setOperando] = useState(false);
  const [aviso, setAviso] = useState("");

  const consulta = useQuery({
    queryKey: ["sistema", "clientes", { busca: buscaDebounced, filtro, pagina }],
    queryFn: () => carregarPaginaClientes(buscaDebounced, filtro, pagina),
    staleTime: 30_000,
  });
  const linhas = consulta.data?.linhas ?? [];
  const total = consulta.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const todosDaPaginaSelecionados = linhas.length > 0 && linhas.every((cliente) => selecionados.has(cliente.id));
  const algunsDaPaginaSelecionados = linhas.some((cliente) => selecionados.has(cliente.id));
  const idsSelecionados = useMemo(() => Array.from(selecionados), [selecionados]);

  useEffect(() => {
    setPagina(0);
    setSelecionados(new Set());
  }, [buscaDebounced, filtro]);

  useEffect(() => {
    if (pagina >= totalPaginas) setPagina(totalPaginas - 1);
  }, [pagina, totalPaginas]);

  const invalidarClientes = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["sistema", "clientes"] }),
    [queryClient]
  );

  const salvarCliente = useCallback(async (dados: ClienteFormData, id?: string) => {
    const payload = {
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim() || null,
      email: dados.email.trim() || null,
    };
    if (id) {
      const { error } = await supabase.from("clientes").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const userId = await obterUsuarioId();
      const { error } = await supabase.from("clientes").insert({ ...payload, user_id: userId });
      if (error) throw error;
    }
    await invalidarClientes();
  }, [invalidarClientes]);

  const excluirClientes = useCallback(async (ids: string[]) => {
    const vinculados = new Set<string>();
    for (let offset = 0; offset < ids.length; offset += MUTATION_CHUNK_SIZE) {
      for (let osOffset = 0; ; osOffset += QUERY_CHUNK_SIZE) {
        const { data, error } = await supabase
          .from("ordens_servico")
          .select("cliente_id")
          .in("cliente_id", ids.slice(offset, offset + MUTATION_CHUNK_SIZE))
          .range(osOffset, osOffset + QUERY_CHUNK_SIZE - 1);
        if (error) throw error;
        for (const os of data ?? []) if (os.cliente_id) vinculados.add(os.cliente_id);
        if ((data?.length ?? 0) < QUERY_CHUNK_SIZE) break;
      }
    }

    const removiveis = ids.filter((id) => !vinculados.has(id));
    let removidos = 0;
    for (let offset = 0; offset < removiveis.length; offset += MUTATION_CHUNK_SIZE) {
      const { data, error } = await supabase
        .from("clientes")
        .delete()
        .in("id", removiveis.slice(offset, offset + MUTATION_CHUNK_SIZE))
        .select("id");
      if (error) throw error;
      removidos += data?.length ?? 0;
    }

    setSelecionados((atuais) => {
      const proximos = new Set(atuais);
      ids.forEach((id) => proximos.delete(id));
      return proximos;
    });
    await invalidarClientes();
    return { removidos, preservados: vinculados.size };
  }, [invalidarClientes]);

  const excluirUmCliente = async (cliente: ClienteResumo) => {
    if (!window.confirm(`Excluir o cliente "${cliente.nome}"?`)) return;
    setOperando(true);
    setAviso("");
    try {
      const resultado = await excluirClientes([cliente.id]);
      setAviso(resultado.preservados ? `${cliente.nome} foi preservado porque possui OS vinculada.` : "Cliente excluído.");
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível excluir o cliente.");
    } finally {
      setOperando(false);
    }
  };

  const alternarCliente = (id: string, marcado: boolean) => {
    setSelecionados((atuais) => {
      const proximos = new Set(atuais);
      if (marcado) proximos.add(id);
      else proximos.delete(id);
      return proximos;
    });
  };

  const alternarPagina = (marcado: boolean) => {
    setSelecionados((atuais) => {
      const proximos = new Set(atuais);
      for (const cliente of linhas) {
        if (marcado) proximos.add(cliente.id);
        else proximos.delete(cliente.id);
      }
      return proximos;
    });
  };

  const selecionarFiltrados = async () => {
    setOperando(true);
    setAviso("");
    try {
      const ids = await carregarIdsFiltrados(buscaDebounced, filtro);
      setSelecionados(new Set(ids));
      setAviso(`${ids.length} cliente(s) filtrado(s) selecionado(s).`);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível selecionar os clientes.");
    } finally {
      setOperando(false);
    }
  };

  const excluirSelecionados = async () => {
    if (idsSelecionados.length === 0) return;
    if (!window.confirm(`Excluir ${idsSelecionados.length} cliente(s) selecionado(s) sem OS vinculada?`)) return;
    setOperando(true);
    setAviso("");
    try {
      const resultado = await excluirClientes(idsSelecionados);
      setAviso(`${resultado.removidos} excluído(s); ${resultado.preservados} preservado(s) por possuir OS vinculada.`);
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
      const ids = idsSelecionados.length > 0 ? idsSelecionados : await carregarIdsFiltrados(buscaDebounced, filtro);
      const clientes = await carregarParaExportacao(ids);
      const arquivo = new Blob([serializeClientesCsv(clientes)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setAviso(`${clientes.length} cliente(s) exportado(s).`);
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível exportar os clientes.");
    } finally {
      setOperando(false);
    }
  };

  const importarCsv = async (arquivo?: File) => {
    if (!arquivo) return;
    setOperando(true);
    setAviso("");
    let importados = 0;
    try {
      if (arquivo.size > 5 * 1024 * 1024) throw new Error("O arquivo CSV deve ter no máximo 5 MB.");
      const registros = parseClientesCsv(await arquivo.text());
      const userId = await obterUsuarioId();
      for (let offset = 0; offset < registros.length; offset += MUTATION_CHUNK_SIZE) {
        const lote = registros.slice(offset, offset + MUTATION_CHUNK_SIZE).map((registro) => ({ ...registro, user_id: userId }));
        const { error } = await supabase.from("clientes").insert(lote);
        if (error) throw error;
        importados += lote.length;
      }
      setSelecionados(new Set());
      await invalidarClientes();
      setAviso(`${registros.length} cliente(s) importado(s).`);
    } catch (erro) {
      const parcial = importados > 0 ? `${importados} cliente(s) foram gravados antes da falha. ` : "";
      setAviso(parcial + (erro instanceof Error ? erro.message : "Não foi possível importar o CSV."));
      if (importados > 0) void invalidarClientes();
    } finally {
      setOperando(false);
      if (arquivoRef.current) arquivoRef.current.value = "";
    }
  };

  return (
    <section className="space-y-4 text-zinc-100">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar nome, telefone ou e-mail" aria-label="Buscar clientes" className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88]/40" />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-300">
            <Filter size={15} aria-hidden />
            <select aria-label="Filtrar clientes por contato" value={filtro} onChange={(evento) => setFiltro(evento.target.value as FiltroContato)} className="min-h-10 bg-transparent outline-none">
              <option value="todos">Todos</option><option value="telefone">Com telefone</option><option value="email">Com e-mail</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={arquivoRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Selecionar CSV para importar" onChange={(evento) => void importarCsv(evento.currentTarget.files?.[0])} />
          <Button type="button" variant="outline" disabled={operando} onClick={() => arquivoRef.current?.click()} className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"><Upload size={15} className="mr-2" />Importar CSV</Button>
          <Button type="button" variant="outline" disabled={operando} onClick={() => void exportarClientes()} className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"><Download size={15} className="mr-2" />Exportar {idsSelecionados.length ? `(${idsSelecionados.length})` : "filtrados"}</Button>
          <Button type="button" onClick={() => { setClienteEditando(null); setFormAberto(true); }} className="bg-[#00FF88] font-bold text-zinc-950 hover:bg-[#00E67D]"><Plus size={16} className="mr-1" />Novo Cliente</Button>
        </div>
      </div>

      {aviso && <p role="status" className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">{aviso}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-zinc-800 py-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1.5"><Users size={15} aria-hidden />{total} cliente(s)</span>
          <span aria-live="polite">{idsSelecionados.length} selecionado(s)</span>
          <Button type="button" variant="link" disabled={operando || total === 0} onClick={() => void selecionarFiltrados()} className="h-auto p-0 text-[#00FF88]">Selecionar todos os filtrados</Button>
          {idsSelecionados.length > 0 && <Button type="button" variant="link" onClick={() => setSelecionados(new Set())} className="h-auto p-0 text-zinc-400">Limpar seleção</Button>}
        </div>
        {idsSelecionados.length > 0 && <Button type="button" variant="outline" disabled={operando} onClick={() => void excluirSelecionados()} className="border-rose-900 text-rose-300 hover:bg-rose-950"><Trash2 size={15} className="mr-2" />Excluir selecionados</Button>}
      </div>

      {consulta.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200"><span>Não foi possível carregar clientes: {consulta.error.message}</span><Button type="button" variant="outline" onClick={() => void consulta.refetch()} className="border-rose-800">Tentar novamente</Button></div>}

      <ClienteList linhas={linhas} carregando={consulta.isLoading} selecionados={selecionados} todosSelecionados={todosDaPaginaSelecionados} algunsSelecionados={algunsDaPaginaSelecionados} operando={operando} aoAlternar={alternarCliente} aoAlternarPagina={alternarPagina} aoEditar={(cliente) => { setClienteEditando(cliente); setFormAberto(true); }} aoVerHistorico={setClienteHistorico} aoExcluir={(cliente) => void excluirUmCliente(cliente)} />

      <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
        <span>Página {Math.min(pagina + 1, totalPaginas)} de {totalPaginas}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina((atual) => Math.max(0, atual - 1))} className="border-zinc-700 bg-zinc-900 text-zinc-200">Anterior</Button>
          <Button type="button" variant="outline" disabled={pagina + 1 >= totalPaginas || consulta.isFetching} onClick={() => setPagina((atual) => atual + 1)} className="border-zinc-700 bg-zinc-900 text-zinc-200">Próxima</Button>
        </div>
      </div>

      <ClienteForm aberto={formAberto} editando={clienteEditando} aoFechar={() => setFormAberto(false)} aoSalvar={salvarCliente} />
      <ClienteOSHistory cliente={clienteHistorico} aoFechar={() => setClienteHistorico(null)} />
    </section>
  );
};

export default SistemaClientesPage;
