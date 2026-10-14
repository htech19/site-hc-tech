import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_NUMBER } from "@/config/contact";

const STATUS = [
  { v: "recebido", l: "Recebido" },
  { v: "em_analise", l: "Em análise" },
  { v: "aguardando_contato", l: "Aguardando contato" },
  { v: "orcamento_enviado", l: "Orçamento enviado" },
  { v: "aprovado", l: "Aprovado" },
  { v: "recusado", l: "Recusado" },
  { v: "concluido", l: "Concluído" },
];
const statusLabel = (v: string) => STATUS.find((s) => s.v === v)?.l ?? v;
const CATS = ["Celular", "iPhone", "Tablet", "Notebook", "Computador"];
const PAGE = 15;

type Sol = {
  id: string; protocolo: string; nome: string; telefone: string; email: string | null;
  preferencia_contato: string | null; periodo_contato: string | null; categoria: string; marca: string; modelo: string;
  numero_serie: string | null; imei1: string | null; imei2: string | null; estado_geral: string | null; info_adicional: string | null;
  servico: string; descricao_defeito: string; sintomas: string[]; historico: string[]; atendimento: string;
  observacoes: string | null; status: string; whatsapp_status: string; created_at: string; updated_at: string;
};

const fmt = (d: string) => new Date(d).toLocaleString("pt-BR");
const clean = (s: string) => s.replace(/[%,()]/g, " ").trim();

function resumo(s: Sol) {
  return [
    `Protocolo: ${s.protocolo}`, `Status: ${statusLabel(s.status)}`, `Data: ${fmt(s.created_at)}`,
    `Cliente: ${s.nome} — ${s.telefone}${s.email ? ` — ${s.email}` : ""}`,
    `Equipamento: ${s.categoria} ${s.marca} ${s.modelo}`,
    s.numero_serie ? `Série: ${s.numero_serie}` : "", s.imei1 ? `IMEI 1: ${s.imei1}` : "", s.imei2 ? `IMEI 2: ${s.imei2}` : "",
    s.estado_geral ? `Estado: ${s.estado_geral}` : "",
    `Serviço: ${s.servico}`, `Defeito: ${s.descricao_defeito}`,
    s.sintomas.length ? `Sintomas: ${s.sintomas.join(", ")}` : "", s.historico.length ? `Histórico: ${s.historico.join(", ")}` : "",
    `Atendimento: ${s.atendimento}`, s.periodo_contato ? `Melhor período: ${s.periodo_contato}` : "",
    s.observacoes ? `Obs.: ${s.observacoes}` : "",
  ].filter(Boolean).join("\n");
}

function waCliente(s: Sol) {
  const tel = s.telefone.replace(/\D/g, "");
  const msg = `Olá, ${s.nome.split(" ")[0]}! Aqui é da HC Tech Infocell, sobre seu orçamento ${s.protocolo} (${s.categoria} ${s.marca} ${s.modelo}).`;
  return `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
}

export default function SistemaSolicitacoesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Sol[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [cat, setCat] = useState("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [sel, setSel] = useState<Sol | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from("orcamento_solicitacoes").select("*", { count: "exact" }).order("created_at", { ascending: false });
    const b = clean(busca);
    if (b) q = q.or(`protocolo.ilike.%${b}%,nome.ilike.%${b}%,telefone.ilike.%${b.replace(/\D/g, "") || b}%,modelo.ilike.%${b}%`);
    if (status !== "todos") q = q.eq("status", status);
    if (cat !== "todas") q = q.eq("categoria", cat);
    if (de) q = q.gte("created_at", `${de}T00:00:00-03:00`);
    if (ate) q = q.lte("created_at", `${ate}T23:59:59-03:00`);
    const { data, count, error: err } = await q.range(page * PAGE, page * PAGE + PAGE - 1);
    if (err) setError("Não foi possível carregar as solicitações.");
    else { setRows((data as Sol[]) ?? []); setTotal(count ?? 0); }
    setLoading(false);
  }, [busca, status, cat, de, ate, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const filtro = (fn: () => void) => { fn(); setPage(0); };

  const mudarStatus = async (s: Sol, novo: string) => {
    const { error: err } = await supabase.from("orcamento_solicitacoes").update({ status: novo }).eq("id", s.id);
    if (err) return toast({ title: "Erro ao atualizar status", variant: "destructive" });
    const upd = { ...s, status: novo, updated_at: new Date().toISOString() };
    setSel(upd);
    setRows((r) => r.map((x) => (x.id === s.id ? upd : x)));
    toast({ title: "Status atualizado" });
  };

  const copiar = async (s: Sol) => {
    try { await navigator.clipboard.writeText(resumo(s)); toast({ title: "Dados copiados" }); }
    catch { toast({ title: "Não foi possível copiar", variant: "destructive" }); }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Solicitações de orçamento (site)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Protocolo, nome, telefone ou modelo" value={busca} onChange={(e) => filtro(() => setBusca(e.target.value))} className="lg:col-span-2" />
            <Select value={status} onValueChange={(v) => filtro(() => setStatus(v))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos os status</SelectItem>{STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={cat} onValueChange={(v) => filtro(() => setCat(v))}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent><SelectItem value="todas">Todas as categorias</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" aria-label="De" value={de} onChange={(e) => filtro(() => setDe(e.target.value))} />
              <Input type="date" aria-label="Até" value={ate} onChange={(e) => filtro(() => setAte(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Protocolo</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Equipamento</TableHead><TableHead>Serviço</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">Carregando...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-red-600">{error} <Button variant="link" onClick={load}>Tentar novamente</Button></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">Nenhuma solicitação encontrada.</TableCell></TableRow>
              ) : rows.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSel(s)}>
                  <TableCell className="font-mono text-xs font-semibold">{s.protocolo}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmt(s.created_at)}</TableCell>
                  <TableCell>{s.nome}<div className="text-xs text-gray-500">{s.telefone}</div></TableCell>
                  <TableCell>{s.categoria} {s.marca} {s.modelo}</TableCell>
                  <TableCell>{s.servico}</TableCell>
                  <TableCell><Badge variant="outline">{statusLabel(s.status)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{total} solicitação(ões)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></Button>
          <span>{page + 1} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Próxima página"><ChevronRight size={16} /></Button>
        </div>
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {sel && (
            <>
              <DialogHeader><DialogTitle className="font-mono">{sel.protocolo}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Status:</span>
                  <Select value={sel.status} onValueChange={(v) => mudarStatus(sel, v)}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 font-sans text-sm text-gray-100">{resumo(sel)}</pre>
                <p className="text-xs text-gray-500">
                  Criado em {fmt(sel.created_at)} • Atualizado em {fmt(sel.updated_at)} •{" "}
                  WhatsApp do cliente: {sel.whatsapp_status === "aberto" ? "aberto no aparelho (envio não confirmado)" : "mensagem apenas preparada"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={waCliente(sel)} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#00A651] text-white hover:bg-[#008c44]"><MessageCircle size={16} className="mr-1" /> Abrir WhatsApp</Button>
                  </a>
                  <Button variant="outline" onClick={() => copiar(sel)}><Copy size={16} className="mr-1" /> Copiar dados</Button>
                </div>
                <p className="text-[11px] text-gray-400">Número comercial do site: {WHATSAPP_NUMBER}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
