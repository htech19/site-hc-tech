import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/sistema/queryClient";
import { useResumoSolicitacoesSite } from "@/integrations/supabase/sistema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import {
  CATEGORIAS_SOLICITACAO,
  STATUS_SOLICITACAO,
  classeStatusSolicitacao,
  corStatusSolicitacao,
  formatarDataHora,
  rotuloStatusSolicitacao,
} from "@/sistema/solicitacoes-shared";
import { CarregandoArea, EstadoErroCompacto, EstadoVazio } from "@/sistema/components/LoadingSpinner";

const PAGE = 15;

type Sol = {
  id: string;
  protocolo: string;
  nome: string;
  telefone: string;
  email: string | null;
  preferencia_contato: string | null;
  periodo_contato: string | null;
  categoria: string;
  marca: string;
  modelo: string;
  numero_serie: string | null;
  imei1: string | null;
  imei2: string | null;
  estado_geral: string | null;
  info_adicional: string | null;
  servico: string;
  descricao_defeito: string;
  sintomas: string[];
  historico: string[];
  atendimento: string;
  observacoes: string | null;
  status: string;
  whatsapp_status: string;
  created_at: string;
  updated_at: string;
  /** Foto do aparelho no momento da entrada */
  foto_entrada?: string | null;
  /** Foto do aparelho no momento da saída */
  foto_saida?: string | null;
};

const clean = (s: string) => s.replace(/[%,()]/g, " ").trim();

function resumo(s: Sol) {
  return [
    `Protocolo: ${s.protocolo}`,
    `Status: ${rotuloStatusSolicitacao(s.status)}`,
    `Data: ${formatarDataHora(s.created_at)}`,
    `Cliente: ${s.nome} — ${s.telefone}${s.email ? ` — ${s.email}` : ""}`,
    `Equipamento: ${s.categoria} ${s.marca} ${s.modelo}`,
    s.numero_serie ? `Série: ${s.numero_serie}` : "",
    s.imei1 ? `IMEI 1: ${s.imei1}` : "",
    s.imei2 ? `IMEI 2: ${s.imei2}` : "",
    s.estado_geral ? `Estado: ${s.estado_geral}` : "",
    `Serviço: ${s.servico}`,
    `Defeito: ${s.descricao_defeito}`,
    s.sintomas.length ? `Sintomas: ${s.sintomas.join(", ")}` : "",
    s.historico.length ? `Histórico: ${s.historico.join(", ")}` : "",
    `Atendimento: ${s.atendimento}`,
    s.periodo_contato ? `Melhor período: ${s.periodo_contato}` : "",
    s.observacoes ? `Obs.: ${s.observacoes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function waCliente(s: Sol) {
  let tel = s.telefone.replace(/\D/g, "");
  // Já pode vir com o DDI; não duplicar o 55.
  if (tel.length <= 11) tel = `55${tel}`;
  const msg = `Olá, ${s.nome.split(" ")[0]}! Aqui é da HC Tech Infocell, sobre seu orçamento ${s.protocolo} (${s.categoria} ${s.marca} ${s.modelo}).`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}

/** Rótulo + valor padronizados do painel de detalhes. */
function Campo({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 break-words text-sm text-foreground">{valor?.trim() ? valor : "—"}</dd>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background/40 p-4">
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-primary">
        {titulo}
      </h4>
      {children}
    </section>
  );
}

export default function SistemaSolicitacoesPage() {
  const { toast } = useToast();
  const consultaResumo = useResumoSolicitacoesSite();
  const { data: resumoFunil, refetch: recarregarResumo } = consultaResumo;

  const [rows, setRows] = useState<Sol[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [erroDetalhe, setErroDetalhe] = useState<unknown>(null);

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [cat, setCat] = useState("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [sel, setSel] = useState<Sol | null>(null);

  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [excluidosAbertos, setExcluidosAbertos] = useState(false);
  const [rowsExcluidos, setRowsExcluidos] = useState<Sol[]>([]);
  const [loadingExcluidos, setLoadingExcluidos] = useState(false);

  const carregarExcluidos = useCallback(async () => {
    setLoadingExcluidos(true);
    const { data, error: err } = await supabase
      .from("orcamento_solicitacoes")
      .select("*")
      .eq("status", "cancelada")
      .order("updated_at", { ascending: false });
    if (!err && data) {
      setRowsExcluidos(data as Sol[]);
    }
    setLoadingExcluidos(false);
  }, []);

  const salvarNovoNome = async (s: Sol) => {
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo) {
      return toast({ title: "Nome inválido", description: "O nome do dono não pode ficar vazio.", variant: "destructive" });
    }
    const { error: err } = await supabase
      .from("orcamento_solicitacoes")
      .update({ nome: nomeLimpo })
      .eq("id", s.id);
    if (err) {
      return toast({ title: "Erro ao atualizar nome", description: err.message, variant: "destructive" });
    }
    const upd = { ...s, nome: nomeLimpo, updated_at: new Date().toISOString() };
    setSel(upd);
    setRows((r) => r.map((x) => (x.id === s.id ? upd : x)));
    setEditandoNome(false);
    toast({ title: "Nome do dono atualizado", description: `Novo nome: ${nomeLimpo}` });
  };

  const excluirSolicitacao = async (s: Sol) => {
    if (!window.confirm(`Deseja realmente enviar a solicitação ${s.protocolo} para a lixeira (excluídos)?`)) return;
    const { error: err } = await supabase
      .from("orcamento_solicitacoes")
      .update({ status: "cancelada" })
      .eq("id", s.id);
    if (err) {
      return toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
    toast({ title: "Solicitação movida para excluídos", description: `Protocolo ${s.protocolo}` });
    setSel(null);
    void load();
    void recarregarResumo();
  };

  const restaurarSolicitacao = async (s: Sol) => {
    const { error: err } = await supabase
      .from("orcamento_solicitacoes")
      .update({ status: "recebido" })
      .eq("id", s.id);
    if (err) {
      return toast({ title: "Erro ao restaurar", description: err.message, variant: "destructive" });
    }
    toast({ title: "Solicitação restaurada", description: `Protocolo ${s.protocolo} retornado para ativos.` });
    void carregarExcluidos();
    void load();
  };

  const emailClientePro = (s: Sol) => {
    const assunto = encodeURIComponent(`Orçamento Técnico HC Tech - Protocolo ${s.protocolo}`);
    const corpo = encodeURIComponent(`Olá, ${s.nome}!\n\nRecebemos sua solicitação de orçamento (${s.protocolo}) para o aparelho ${s.categoria} ${s.marca} ${s.modelo}.\n\nServiço solicitado: ${s.servico}\nDefeito relatado: ${s.descricao_defeito}\n\nEntre em contato conosco para prosseguirmos com a manutenção especializada.\n\nAtenciosamente,\nHC Tech Infocell\nWhatsApp: (11) 97793-4634`);
    return `mailto:${s.email || ""}?subject=${assunto}&body=${corpo}`;
  };

  const gerarPDFOrcamento = (s: Sol) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = [
      "<!DOCTYPE html>",
      `<html lang="pt-BR"><head><meta charset="UTF-8">`,
      `<title>Orçamento Técnico - HC TECH ${s.protocolo}</title>`,
      "<style>",
      "body{font-family:Arial,sans-serif;color:#111;margin:0;padding:20px;background:#fff}",
      ".header{border-bottom:2px solid #00A651;padding-bottom:15px;display:flex;justify-content:space-between;align-items:center}",
      ".logo{font-size:24px;font-weight:bold;color:#00A651}",
      ".protocolo{text-align:right;font-size:14px;color:#555}",
      ".section{margin-top:20px;border:1px solid #ddd;border-radius:8px;padding:15px}",
      ".section h3{margin-top:0;color:#00A651;font-size:16px;border-bottom:1px solid #eee;padding-bottom:8px}",
      ".grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px}",
      ".label{font-weight:bold;color:#444}",
      ".footer{margin-top:30px;text-align:center;font-size:12px;color:#777;border-top:1px solid #ddd;padding-top:15px}",
      "@media print{body{padding:0}}",
      "</style></head><body>",
      `<div class="header"><div class="logo">HC TECH INFOCELL</div>`,
      `<div class="protocolo"><strong>Protocolo:</strong> ${s.protocolo}<br><strong>Data:</strong> ${formatarDataHora(s.created_at)}</div></div>`,
      `<div class="section"><h3>1. Dados do Cliente</h3><div class="grid">`,
      `<div><span class="label">Nome:</span> ${s.nome}</div>`,
      `<div><span class="label">Telefone:</span> ${s.telefone}</div>`,
      `<div><span class="label">E-mail:</span> ${s.email || "—"}</div>`,
      `<div><span class="label">Preferência:</span> ${s.preferencia_contato || "—"}</div>`,
      `</div></div>`,
      `<div class="section"><h3>2. Equipamento</h3><div class="grid">`,
      `<div><span class="label">Categoria:</span> ${s.categoria}</div>`,
      `<div><span class="label">Marca/Modelo:</span> ${s.marca} ${s.modelo}</div>`,
      `<div><span class="label">Série/IMEI:</span> ${s.numero_serie || s.imei1 || "—"}</div>`,
      `<div><span class="label">Estado:</span> ${s.estado_geral || "—"}</div>`,
      `</div></div>`,
      `<div class="section"><h3>3. Serviço & Defeito</h3>`,
      `<p><strong>Serviço:</strong> ${s.servico}</p>`,
      `<p><strong>Defeito:</strong> ${s.descricao_defeito}</p>`,
      s.sintomas.length ? `<p><strong>Sintomas:</strong> ${s.sintomas.join(", ")}</p>` : "",
      `</div>`,
      `<div class="section"><h3>4. Termos</h3>`,
      `<p style="font-size:12px;color:#555;">Este orçamento é uma estimativa preliminar. O diagnóstico definitivo ocorre em laboratório físico. Garantia de 90 dias para os serviços executados conforme CDC.</p>`,
      `</div>`,
      `<div class="footer">HC TECH INFOCELL • WhatsApp: (11) 97793-4634 • Atendimento Especializado</div>`,
      `<script>window.onload=function(){window.print();};</script>`,
      "</body></html>",
    ].join("");
    win.document.write(html);
    win.document.close();
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErroDetalhe(null);
    let q = supabase
      .from("orcamento_solicitacoes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    const b = clean(busca);
    if (b) {
      const somenteDigitos = b.replace(/\D/g, "");
      q = q.or(
        `protocolo.ilike.%${b}%,nome.ilike.%${b}%,telefone.ilike.${
          somenteDigitos || b
        }%,modelo.ilike.%${b}%`
      );
    }
    if (status !== "todos") q = q.eq("status", status);
    if (cat !== "todas") q = q.eq("categoria", cat);
    if (de) q = q.gte("created_at", `${de}T00:00:00-03:00`);
    if (ate) q = q.lte("created_at", `${ate}T23:59:59-03:00`);

    const { data, count, error: err } = await q.range(page * PAGE, page * PAGE + PAGE - 1);
    if (err) {
      setError("Não foi possível carregar as solicitações.");
      setErroDetalhe(err);
      setRows([]);
    } else {
      setRows((data as Sol[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [busca, status, cat, de, ate, page]);

  useEffect(() => {
    // Debounce curto: cada tecla na busca não dispara uma consulta.
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filtro = (fn: () => void) => {
    fn();
    setPage(0);
  };

  const temFiltro = busca || status !== "todos" || cat !== "todas" || de || ate;

  const limparFiltros = () => {
    setBusca("");
    setStatus("todos");
    setCat("todas");
    setDe("");
    setAte("");
    setPage(0);
  };

  const mudarStatus = async (s: Sol, novo: string) => {
    const { error: err } = await supabase
      .from("orcamento_solicitacoes")
      .update({ status: novo })
      .eq("id", s.id);
    if (err) {
      return toast({
        title: "Erro ao atualizar status",
        description: err.message,
        variant: "destructive",
      });
    }
    const upd = { ...s, status: novo, updated_at: new Date().toISOString() };
    setSel(upd);
    setRows((r) => r.map((x) => (x.id === s.id ? upd : x)));
    // Dashboard e contadores usam a mesma chave-prefixo: atualizam juntos.
    void queryClient.invalidateQueries({ queryKey: ["sistema", "solicitacoes"] });
    void recarregarResumo();
    toast({ title: "Status atualizado", description: `${s.protocolo} • ${rotuloStatusSolicitacao(novo)}` });
  };

  const copiar = async (s: Sol) => {
    try {
      await navigator.clipboard.writeText(resumo(s));
      toast({ title: "Dados copiados" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE));
  const { carregando: carregandoResumo } = estadoDaConsulta(consultaResumo);

  const cartoes = useMemo(
    () => [
      { rotulo: "Novos", valor: resumoFunil?.recebido, tom: "text-sky-300" },
      { rotulo: "Em análise", valor: resumoFunil?.emAnalise, tom: "text-amber-300" },
      { rotulo: "Aguardando contato", valor: resumoFunil?.aguardandoContato, tom: "text-violet-300" },
      { rotulo: "Total recebido", valor: resumoFunil?.total, tom: "text-foreground" },
    ],
    [resumoFunil]
  );

  return (
    <div className="space-y-4">
      {/* Aviso curto: o título já vem da topbar, então aqui fica só a instrução. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pedidos enviados pelo botão de orçamento da página inicial — os mesmos que aparecem no
          Dashboard. Use o status de cada linha para acompanhar o funil.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            void load();
            void recarregarResumo();
          }}
          className="shrink-0 border-border text-foreground hover:bg-muted"
        >
          <RefreshCw size={15} className="mr-1" /> Atualizar
        </Button>
      </div>
      {/* Botão para abrir modal de Itens Excluídos (Lixeira) */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setExcluidosAbertos(true);
            void carregarExcluidos();
          }}
          className="border-border bg-card text-xs text-foreground hover:border-rose-500/40 hover:text-rose-400"
        >
          <Trash2 size={14} className="mr-1.5" /> Ver Solicitações Excluídas / Lixeira
        </Button>
      </div>

      {/* Funil */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <article key={c.rotulo} className="rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {c.rotulo}
            </span>
            <div
              className={`mt-0.5 text-lg font-bold tabular-nums ${c.tom} ${
                carregandoResumo ? "animate-pulse text-muted-foreground" : ""
              }`}
            >
              {carregandoResumo ? "—" : c.valor ?? "—"}
            </div>
          </article>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-2 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Protocolo, nome, telefone ou modelo"
              value={busca}
              onChange={(e) => filtro(() => setBusca(e.target.value))}
              aria-label="Buscar solicitações"
              className="border-border bg-muted pl-9 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-[#00FF88]/20"
            />
          </div>

          <Select value={status} onValueChange={(v) => filtro(() => setStatus(v))}>
            <SelectTrigger className="border-border bg-muted text-foreground lg:col-span-3">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_SOLICITACAO.map((s) => (
                <SelectItem key={s.valor} value={s.valor}>
                  {s.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cat} onValueChange={(v) => filtro(() => setCat(v))}>
            <SelectTrigger className="border-border bg-muted text-foreground lg:col-span-2">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {CATEGORIAS_SOLICITACAO.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 lg:col-span-2">
            <Input
              type="date"
              aria-label="De"
              value={de}
              onChange={(e) => filtro(() => setDe(e.target.value))}
              className="border-border bg-muted text-foreground"
            />
            <Input
              type="date"
              aria-label="Até"
              value={ate}
              onChange={(e) => filtro(() => setAte(e.target.value))}
              className="border-border bg-muted text-foreground"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span aria-live="polite">
            <strong className="text-foreground">{total}</strong> solicitação(ões)
            {temFiltro ? " com os filtros atuais" : " no total"}
          </span>
          {temFiltro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limparFiltros}
              className="h-8 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={13} className="mr-1" /> Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-card">
          <CarregandoArea altura="h-56" rotulo="Carregando solicitações..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <EstadoErroCompacto
            erro={erroDetalhe ?? error}
            contexto="Solicitações do site"
            aoTentarNovamente={() => void load()}
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EstadoVazio
            icone="📭"
            titulo="Nenhuma solicitação encontrada"
            descricao={
              temFiltro
                ? "Ajuste ou limpe os filtros para ver outros pedidos."
                : "Os pedidos enviados pelo site aparecem aqui assim que chegam."
            }
            acao={
              temFiltro ? (
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <article
              key={s.id}
              className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              {/* Barra lateral: status identificável de relance, sem ler o texto. */}
              <span
                className={`absolute inset-y-0 left-0 w-1.5 ${corStatusSolicitacao(s.status)}`}
                aria-hidden
              />

              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {s.protocolo}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classeStatusSolicitacao(
                          s.status
                        )}`}
                      >
                        {rotuloStatusSolicitacao(s.status)}
                      </span>
                    </div>
                    <h2 className="mt-1.5 truncate text-sm font-bold text-foreground leading-tight">{s.nome}</h2>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {s.telefone}
                      {s.email ? ` • ${s.email}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatarDataHora(s.created_at)}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Equipamento</dt>
                    <dd className="truncate font-medium text-foreground">{s.categoria} {s.marca} {s.modelo}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Serviço</dt>
                    <dd className="truncate font-medium text-foreground">{s.servico}</dd>
                  </div>
                </dl>

                <div className="min-h-[40px]">
                  <p
                    className="text-[11px] text-muted-foreground leading-relaxed"
                    title={s.descricao_defeito}
                  >
                    {s.descricao_defeito || "Sem descrição do defeito"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                  <Select value={s.status} onValueChange={(v) => void mudarStatus(s, v)}>
                    <SelectTrigger
                      aria-label={`Status da solicitação ${s.protocolo}`}
                      className="h-8 w-full border-border bg-muted text-[10px] font-semibold text-foreground"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_SOLICITACAO.map((opcao) => (
                        <SelectItem key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap items-center gap-1">
                    <a
                      href={waCliente(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#1ea855]"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => void copiar(s)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition hover:bg-muted hover:text-primary"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSel(s)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition hover:bg-muted hover:text-primary"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Paginação */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {page + 1} de {pages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Página anterior"
            className="border-border text-foreground hover:bg-muted"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Próxima página"
            className="border-border text-foreground hover:bg-muted"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Detalhes */}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-border bg-card p-0 text-foreground">
          {sel && (
            <>
              <div className="border-b border-border p-5 pr-12">
                <DialogHeader>
                  <DialogTitle className="font-mono text-base text-primary">
                    {sel.protocolo}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Recebido em {formatarDataHora(sel.created_at)} • atualizado em{" "}
                    {formatarDataHora(sel.updated_at)}
                  </p>
                  <DialogDescription className="sr-only">
                    Detalhes da solicitação de orçamento feita pelo site.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                  <Select value={sel.status} onValueChange={(v) => void mudarStatus(sel, v)}>
                    <SelectTrigger className="h-9 w-52 border-border bg-muted text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_SOLICITACAO.map((s) => (
                        <SelectItem key={s.valor} value={s.valor}>
                          {s.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge
                    className={`border ${classeStatusSolicitacao(sel.status)}`}
                    variant="outline"
                  >
                    {rotuloStatusSolicitacao(sel.status)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 p-5">
                <Secao titulo="Cliente / Dono da Solicitação">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">Nome cadastrado pelo cliente:</span>
                    {!editandoNome ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNovoNome(sel.nome);
                          setEditandoNome(true);
                        }}
                        className="h-7 text-xs text-primary hover:bg-muted"
                      >
                        <Pencil size={12} className="mr-1" /> Corrigir Nome do Dono
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void salvarNovoNome(sel)}
                          className="h-7 bg-primary text-xs font-bold text-background hover:bg-primary/90"
                        >
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditandoNome(false)}
                          className="h-7 text-xs text-muted-foreground hover:text-white"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                  {editandoNome ? (
                    <div className="mt-2">
                      <Input
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                        placeholder="Nome correto do cliente/dono"
                        className="border-border bg-card text-foreground"
                      />
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                      <Campo rotulo="Nome / Dono" valor={sel.nome} />
                      <Campo rotulo="Telefone" valor={sel.telefone} />
                      <Campo rotulo="E-mail" valor={sel.email} />
                      <Campo rotulo="Preferência" valor={sel.preferencia_contato} />
                    </dl>
                  )}
                </Secao>

                <Secao titulo="Equipamento">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Campo rotulo="Categoria" valor={sel.categoria} />
                    <Campo rotulo="Marca / modelo" valor={`${sel.marca} ${sel.modelo}`.trim()} />
                    <Campo rotulo="Nº de série" valor={sel.numero_serie} />
                    <Campo rotulo="Estado geral" valor={sel.estado_geral} />
                    {sel.imei1 && <Campo rotulo="IMEI 1" valor={sel.imei1} />}
                    {sel.imei2 && <Campo rotulo="IMEI 2" valor={sel.imei2} />}
                  </dl>
                </Secao>

                <Secao titulo="Serviço e defeito">
                  <dl className="grid grid-cols-1 gap-3">
                    <Campo rotulo="Serviço" valor={sel.servico} />
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Defeito relatado
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-card p-3 text-sm text-foreground">
                        {sel.descricao_defeito}
                      </dd>
                    </div>
                  </dl>
                  {(sel.sintomas.length > 0 || sel.historico.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sel.sintomas.map((s) => (
                        <Badge
                          key={`s-${s}`}
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-200"
                        >
                          {s}
                        </Badge>
                      ))}
                      {sel.historico.map((h) => (
                        <Badge
                          key={`h-${h}`}
                          variant="outline"
                          className="border-zinc-600/40 bg-muted text-foreground"
                        >
                          {h}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Secao>

                <Secao titulo="Atendimento">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Campo rotulo="Forma" valor={sel.atendimento} />
                    <Campo rotulo="Melhor período" valor={sel.periodo_contato} />
                    <Campo rotulo="Observações" valor={sel.observacoes} />
                    <Campo rotulo="Informações adicionais" valor={sel.info_adicional} />
                  </dl>
                </Secao>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Ações e Envio Profissional ao Cliente
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Envie o orçamento formatado via WhatsApp, E-mail ou gere o PDF para impressão/compartilhamento direto.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a href={waCliente(sel)} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-primary font-bold text-white hover:bg-primary/90">
                        <MessageCircle size={16} className="mr-1.5" /> Enviar WhatsApp
                      </Button>
                    </a>

                    <a href={emailClientePro(sel)}>
                      <Button variant="outline" className="border-border bg-card text-foreground hover:border-primary hover:text-primary">
                        <Mail size={16} className="mr-1.5" /> Enviar E-mail
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      onClick={() => gerarPDFOrcamento(sel)}
                      className="border-border bg-card text-foreground hover:border-primary hover:text-primary"
                    >
                      <FileText size={16} className="mr-1.5" /> Gerar PDF
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => void copiar(sel)}
                      className="border-border bg-card text-foreground hover:bg-muted"
                    >
                      <Copy size={15} className="mr-1" /> Copiar
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => void excluirSolicitacao(sel)}
                      className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 size={16} className="mr-1" /> Excluir
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  WhatsApp do cliente:{" "}
                  {sel.whatsapp_status === "aberto"
                    ? "aberto no aparelho (envio não confirmado)"
                    : "mensagem apenas preparada"}
                  . Este status é independente do status do pedido.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal / Dialog de Solicitações Excluídas (Lixeira) */}
      <Dialog open={excluidosAbertos} onOpenChange={setExcluidosAbertos}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400">
              🗑️ Solicitações de Orçamento Excluídas (Lixeira)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pedidos removidos da listagem principal. Você pode restaurá-los a qualquer momento.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {loadingExcluidos ? (
              <CarregandoArea altura="h-32" rotulo="Carregando excluídos..." />
            ) : rowsExcluidos.length === 0 ? (
              <EstadoVazio
                icone="🗑️"
                titulo="Nenhuma solicitação excluída"
                descricao="As solicitações movidas para a lixeira aparecerão aqui."
              />
            ) : (
              rowsExcluidos.map((ex) => (
                <div
                  key={ex.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-muted-foreground">{ex.protocolo}</span>
                      <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-300 border border-rose-500/20">
                        Excluído
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-foreground">{ex.nome} • {ex.telefone}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ex.categoria} {ex.marca} {ex.modelo} • Excluído em {formatarDataHora(ex.updated_at)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => void restaurarSolicitacao(ex)}
                    className="bg-primary text-background font-bold hover:bg-primary/90"
                  >
                    <Undo2 size={14} className="mr-1.5" /> Restaurar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
