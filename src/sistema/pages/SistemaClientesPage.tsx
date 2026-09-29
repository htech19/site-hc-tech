import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, Eye, MessageCircle, Download, Upload, Paperclip, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Cliente, OS } from "@/sistema/os-shared";
import { StatusBadge, formatBRL } from "@/sistema/os-shared";
import ClienteFormDialog from "@/sistema/clientes/ClienteFormDialog";
import {
  onlyDigits, maskDoc, maskPhone, waUrl, MSG_TEMPLATES, fillTemplate, parseCSV, parseXLSX, toCSV, toExcelXML,
  toVCard, toGoogleCSV, download, IMPORT_FIELDS, EXPORT_HEAD, exportRow, findDuplicates,
} from "@/sistema/clientes/utils";

const STATUS_CLS: Record<Cliente["status"], string> = {
  ativo: "bg-green-100 text-green-800 border-green-200",
  inativo: "bg-gray-100 text-gray-600 border-gray-200",
  bloqueado: "bg-red-100 text-red-700 border-red-200",
};
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const uid = async () => (await supabase.auth.getUser()).data.user!.id;

export default function SistemaClientesPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Cliente[]>([]);
  const [osCount, setOsCount] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState("todos");
  const [fTag, setFTag] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [detail, setDetail] = useState<Cliente | null>(null);
  const [importRows, setImportRows] = useState<string[][] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data, error }, { data: os }] = await Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("ordens_servico").select("cliente_id"),
    ]);
    if (error) toast({ title: "Erro ao carregar clientes", description: error.message, variant: "destructive" });
    setList((data as Cliente[]) ?? []);
    const cnt: Record<string, number> = {};
    (os ?? []).forEach((o) => { if (o.cliente_id) cnt[o.cliente_id] = (cnt[o.cliente_id] ?? 0) + 1; });
    setOsCount(cnt);
  };
  useEffect(() => { load(); }, []);

  const allTags = useMemo(() => Array.from(new Set(list.flatMap((c) => c.tags ?? []))).sort(), [list]);

  const filtered = useMemo(() => {
    const q = norm(busca);
    const qd = onlyDigits(busca);
    return list.filter((c) => {
      if (fStatus !== "todos" && c.status !== fStatus) return false;
      if (fTag && !(c.tags ?? []).includes(fTag)) return false;
      if (!q) return true;
      const txt = norm([c.nome, c.nome_fantasia, c.email, c.cidade, c.bairro, c.endereco, ...(c.tags ?? [])].filter(Boolean).join(" "));
      if (txt.includes(q)) return true;
      return qd.length >= 3 && [c.telefone, c.telefone2, c.whatsapp, c.documento].some((v) => onlyDigits(v).includes(qd));
    });
  }, [list, busca, fStatus, fTag]);

  const remove = async (c: Cliente) => {
    if (osCount[c.id]) {
      if (!confirm(`"${c.nome}" possui ${osCount[c.id]} OS. Clientes com histórico não são excluídos. Deseja inativá-lo?`)) return;
      const { error } = await supabase.from("clientes").update({ status: "inativo" }).eq("id", c.id);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      await supabase.from("cliente_interacoes").insert({ cliente_id: c.id, user_id: await uid(), tipo: "sistema", descricao: "Cliente inativado" });
      toast({ title: "Cliente inativado" });
      return load();
    }
    if (!confirm(`Excluir definitivamente o cliente "${c.nome}"?`)) return;
    await supabase.from("cliente_contatos").delete().eq("cliente_id", c.id);
    await supabase.from("cliente_interacoes").delete().eq("cliente_id", c.id);
    const { data: anex } = await supabase.from("cliente_anexos").select("path").eq("cliente_id", c.id);
    if (anex?.length) await supabase.storage.from("cliente-anexos").remove(anex.map((a) => a.path));
    await supabase.from("cliente_anexos").delete().eq("cliente_id", c.id);
    const { error } = await supabase.from("clientes").delete().eq("id", c.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else { toast({ title: "Cliente excluído" }); load(); }
  };

  const sendWa = async (c: Cliente, text: string) => {
    const phone = c.whatsapp || c.telefone;
    if (!phone) return toast({ title: "Cliente sem telefone/WhatsApp", variant: "destructive" });
    if (!c.aceita_whatsapp) return toast({ title: "Cliente não autorizou contato por WhatsApp", variant: "destructive" });
    window.open(waUrl(phone, text), "_blank", "noopener");
    await supabase.from("cliente_interacoes").insert({ cliente_id: c.id, user_id: await uid(), tipo: "whatsapp", descricao: text });
  };

  const exportAs = (fmt: "csv" | "xls" | "vcf" | "google") => {
    const rows = filtered;
    if (!rows.length) return toast({ title: "Nada para exportar" });
    const d = new Date().toISOString().slice(0, 10);
    if (fmt === "csv") download(toCSV([EXPORT_HEAD, ...rows.map(exportRow)]), `clientes-${d}.csv`, "text/csv;charset=utf-8");
    if (fmt === "xls") download(toExcelXML([EXPORT_HEAD, ...rows.map(exportRow)]), `clientes-${d}.xls`, "application/vnd.ms-excel");
    if (fmt === "vcf") download(toVCard(rows), `clientes-${d}.vcf`, "text/vcard");
    if (fmt === "google") download(toGoogleCSV(rows), `google-contacts-${d}.csv`, "text/csv;charset=utf-8");
  };

  const onFile = async (f: File) => {
    try {
      const rows = /\.xlsx$/i.test(f.name) ? await parseXLSX(await f.arrayBuffer()) : parseCSV(await f.text());
      if (rows.length < 2) return toast({ title: "Arquivo sem dados", variant: "destructive" });
      setImportRows(rows);
    } catch (e) {
      toast({ title: "Erro ao ler arquivo", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 text-gray-900">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input placeholder="Buscar nome, CPF/CNPJ, telefone, cidade, tag..." value={busca} onChange={(e) => setBusca(e.target.value)} className="sm:max-w-xs bg-white" />
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-10 rounded-md border px-3 bg-white text-sm">
            <option value="todos">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option><option value="bloqueado">Bloqueados</option>
          </select>
          <select value={fTag} onChange={(e) => setFTag(e.target.value)} className="h-10 rounded-md border px-3 bg-white text-sm">
            <option value="">Todas as tags</option>{allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          <Button variant="outline" className="bg-white" onClick={() => fileRef.current?.click()}><Upload size={16} className="mr-1" /> Importar</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="bg-white"><Download size={16} className="mr-1" /> Exportar</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportAs("csv")}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("xls")}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("vcf")}>vCard (celular)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("google")}>Google Contatos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-[#00A651] hover:bg-[#008c44] text-white"><Plus size={16} className="mr-1" /> Novo Cliente</Button>
        </div>
      </div>
      <p className="text-sm text-gray-500">{filtered.length} de {list.length} clientes</p>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead><TableHead>Status</TableHead><TableHead>OS</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <button className="font-medium hover:underline text-left" onClick={() => setDetail(c)}>{c.nome}</button>
                    {!!c.tags?.length && <div className="flex gap-1 mt-1 flex-wrap">{c.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{c.documento ? maskDoc(c.documento, c.tipo_pessoa) : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.whatsapp || c.telefone ? maskPhone(c.whatsapp || c.telefone || "") : "—"}</TableCell>
                  <TableCell>{c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ""}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_CLS[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell>{osCount[c.id] ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDetail(c)} title="Ver ficha"><Eye size={15} /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-[#00A651]" title="WhatsApp"><MessageCircle size={15} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {MSG_TEMPLATES.map((t) => <DropdownMenuItem key={t.id} onClick={() => sendWa(c, fillTemplate(t.text, c))}>{t.label}</DropdownMenuItem>)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(c); setOpen(true); }} title="Editar"><Pencil size={15} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remove(c)} title={osCount[c.id] ? "Inativar" : "Excluir"}>{osCount[c.id] ? <Ban size={15} /> : <Trash2 size={15} />}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">Nenhum cliente encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClienteFormDialog open={open} onOpenChange={setOpen} editing={editing} all={list} onSaved={() => { setOpen(false); load(); }} />
      {detail && <ClienteDetail cliente={detail} onClose={() => setDetail(null)} onEdit={() => { setEditing(detail); setDetail(null); setOpen(true); }} />}
      {importRows && <ImportDialog rows={importRows} all={list} onClose={() => setImportRows(null)} onDone={() => { setImportRows(null); load(); }} />}
    </div>
  );
}

/* ---------------- Ficha do cliente ---------------- */
type Interacao = { id: string; tipo: string; descricao: string; created_at: string };
type Anexo = { id: string; nome: string; path: string; tamanho: number | null; created_at: string };
type Contato = { id: string; nome: string; cargo: string | null; telefone: string | null; whatsapp: string | null; email: string | null; principal: boolean };

function ClienteDetail({ cliente: c, onClose, onEdit }: { cliente: Cliente; onClose: () => void; onEdit: () => void }) {
  const { toast } = useToast();
  const [os, setOs] = useState<OS[]>([]);
  const [inter, setInter] = useState<Interacao[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [nota, setNota] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [a, b, d, e] = await Promise.all([
      supabase.from("ordens_servico").select("*").eq("cliente_id", c.id).order("created_at", { ascending: false }),
      supabase.from("cliente_interacoes").select("*").eq("cliente_id", c.id).order("created_at", { ascending: false }),
      supabase.from("cliente_anexos").select("*").eq("cliente_id", c.id).order("created_at", { ascending: false }),
      supabase.from("cliente_contatos").select("*").eq("cliente_id", c.id).order("principal", { ascending: false }),
    ]);
    setOs((a.data as OS[]) ?? []); setInter(b.data ?? []); setAnexos(d.data ?? []); setContatos(e.data ?? []);
  };
  useEffect(() => { load(); }, [c.id]);

  const total = os.filter((o) => o.status === "concluida").reduce((s, o) => s + Number(o.valor ?? 0), 0);

  const addNota = async () => {
    if (!nota.trim()) return;
    const { error } = await supabase.from("cliente_interacoes").insert({ cliente_id: c.id, user_id: await uid(), tipo: "nota", descricao: nota.trim().slice(0, 2000) });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setNota(""); load();
  };

  const upload = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) return toast({ title: "Arquivo acima de 10MB", variant: "destructive" });
    setUploading(true);
    const user = await uid();
    const path = `${user}/${c.id}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("cliente-anexos").upload(path, f);
    if (!error) await supabase.from("cliente_anexos").insert({ cliente_id: c.id, user_id: user, nome: f.name, path, tamanho: f.size });
    setUploading(false);
    if (error) toast({ title: "Erro no envio", description: error.message, variant: "destructive" });
    else load();
  };
  const openAnexo = async (a: Anexo) => {
    const { data, error } = await supabase.storage.from("cliente-anexos").createSignedUrl(a.path, 60);
    if (error || !data) return toast({ title: "Erro ao abrir", variant: "destructive" });
    window.open(data.signedUrl, "_blank", "noopener");
  };
  const delAnexo = async (a: Anexo) => {
    if (!confirm(`Remover "${a.nome}"?`)) return;
    await supabase.storage.from("cliente-anexos").remove([a.path]);
    await supabase.from("cliente_anexos").delete().eq("id", a.id);
    load();
  };

  const Row = ({ l, v }: { l: string; v?: string | null }) => <div><span className="text-gray-500 text-xs block">{l}</span><span className="text-sm">{v || "—"}</span></div>;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader><DialogTitle className="flex items-center gap-2">{c.nome}<Badge variant="outline" className={STATUS_CLS[c.status]}>{c.status}</Badge></DialogTitle></DialogHeader>
        <Tabs defaultValue="dados">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="os">OS ({os.length})</TabsTrigger>
            <TabsTrigger value="hist">Histórico ({inter.length})</TabsTrigger>
            <TabsTrigger value="anexos">Anexos ({anexos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <Row l="Tipo" v={c.tipo_pessoa} />
            <Row l={c.tipo_pessoa === "PJ" ? "CNPJ" : "CPF"} v={c.documento ? maskDoc(c.documento, c.tipo_pessoa) : ""} />
            <Row l={c.tipo_pessoa === "PJ" ? "IE" : "RG"} v={c.rg_ie} />
            <Row l="Telefone" v={c.telefone && maskPhone(c.telefone)} />
            <Row l="WhatsApp" v={c.whatsapp && maskPhone(c.whatsapp)} />
            <Row l="E-mail" v={c.email} />
            <Row l="Endereço" v={[c.endereco, c.numero, c.complemento, c.bairro].filter(Boolean).join(", ")} />
            <Row l="Cidade/UF" v={[c.cidade, c.uf].filter(Boolean).join("/")} />
            <Row l="CEP" v={c.cep} />
            <Row l="Classificação" v={c.classificacao} />
            <Row l="Limite de crédito" v={formatBRL(c.limite_credito)} />
            <Row l="Total em serviços concluídos" v={formatBRL(total)} />
            <Row l="LGPD" v={c.consentimento_lgpd ? `Consentido${c.consentimento_data ? " em " + new Date(c.consentimento_data).toLocaleDateString("pt-BR") : ""}` : "Sem consentimento"} />
            <Row l="Canais aceitos" v={[c.aceita_whatsapp && "WhatsApp", c.aceita_email && "E-mail", c.aceita_sms && "SMS", c.aceita_marketing && "Marketing"].filter(Boolean).join(", ")} />
            {c.status === "bloqueado" && <Row l="Motivo do bloqueio" v={c.motivo_bloqueio} />}
            <div className="col-span-full"><Row l="Observações" v={c.observacoes} /></div>
            {contatos.length > 0 && (
              <div className="col-span-full">
                <span className="text-gray-500 text-xs block mb-1">Contatos adicionais</span>
                {contatos.map((k) => <div key={k.id} className="text-sm">{k.nome}{k.cargo ? ` (${k.cargo})` : ""} — {[k.telefone, k.whatsapp, k.email].filter(Boolean).join(" · ")}{k.principal && " ★"}</div>)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="os">
            {os.length === 0 ? <p className="text-sm text-gray-500 py-4">Nenhuma OS para este cliente.</p> : (
              <Table><TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Aparelho</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>{os.map((o) => <TableRow key={o.id}><TableCell>{o.numero}</TableCell><TableCell>{o.aparelho}</TableCell><TableCell><StatusBadge status={o.status} /></TableCell><TableCell>{formatBRL(o.valor)}</TableCell><TableCell>{new Date(o.created_at).toLocaleDateString("pt-BR")}</TableCell></TableRow>)}</TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="hist" className="space-y-3">
            <div className="flex gap-2"><Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Registrar atendimento, ligação, observação..." maxLength={2000} /><Button onClick={addNota} className="bg-[#00A651] hover:bg-[#008c44] text-white self-end">Adicionar</Button></div>
            {inter.map((i) => <div key={i.id} className="border rounded-md p-2 text-sm"><div className="text-xs text-gray-500">{new Date(i.created_at).toLocaleString("pt-BR")} · {i.tipo}</div><div className="whitespace-pre-wrap">{i.descricao}</div></div>)}
            {inter.length === 0 && <p className="text-sm text-gray-500">Sem registros.</p>}
          </TabsContent>
          <TabsContent value="anexos" className="space-y-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}><Paperclip size={15} className="mr-1" />{uploading ? "Enviando..." : "Anexar arquivo"}</Button>
            {anexos.map((a) => (
              <div key={a.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                <button className="hover:underline text-left truncate" onClick={() => openAnexo(a)}>{a.nome}</button>
                <div className="flex items-center gap-2 shrink-0"><span className="text-xs text-gray-500">{a.tamanho ? `${Math.ceil(a.tamanho / 1024)} KB` : ""}</span><Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => delAnexo(a)}><Trash2 size={14} /></Button></div>
              </div>
            ))}
            {anexos.length === 0 && <p className="text-sm text-gray-500">Nenhum anexo.</p>}
          </TabsContent>
        </Tabs>
        <DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button><Button onClick={onEdit} className="bg-[#00A651] hover:bg-[#008c44] text-white"><Pencil size={15} className="mr-1" /> Editar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Importação ---------------- */
function ImportDialog({ rows, all, onClose, onDone }: { rows: string[][]; all: Cliente[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const head = rows[0];
  const [map, setMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    IMPORT_FIELDS.forEach((f) => {
      const i = head.findIndex((h) => f.aliases.includes(norm(String(h))));
      if (i >= 0) m[f.key] = i;
    });
    return m;
  });
  const [busy, setBusy] = useState(false);
  const body = rows.slice(1);

  const run = async () => {
    if (map.nome === undefined) return toast({ title: "Mapeie a coluna Nome", variant: "destructive" });
    setBusy(true);
    const user = await uid();
    const known = [...all];
    let ok = 0, dup = 0, skip = 0;
    const batch: Record<string, unknown>[] = [];
    for (const r of body) {
      const g = (k: string) => (map[k] !== undefined ? String(r[map[k]] ?? "").trim() : "");
      const nome = g("nome").slice(0, 150);
      if (!nome) { skip++; continue; }
      const tipo = /pj|jur/i.test(g("tipo_pessoa")) || onlyDigits(g("documento")).length === 14 ? "PJ" : "PF";
      const rec = {
        user_id: user, nome, tipo_pessoa: tipo,
        documento: onlyDigits(g("documento")) || null, telefone: g("telefone") || null, whatsapp: g("whatsapp") || null,
        email: g("email").toLowerCase() || null, cep: onlyDigits(g("cep")) || null, endereco: g("endereco") || null,
        numero: g("numero") || null, bairro: g("bairro") || null, cidade: g("cidade") || null, uf: g("uf").toUpperCase().slice(0, 2) || null,
        tags: g("tags") ? g("tags").split(/[,;|]|:::/).map((t) => t.trim()).filter((t) => t && !t.startsWith("*")) : [],
        observacoes: g("observacoes") || null,
      };
      if (findDuplicates(rec, known).length) { dup++; continue; }
      known.push({ ...rec, id: `tmp-${known.length}` } as unknown as Cliente);
      batch.push(rec);
    }
    for (let i = 0; i < batch.length; i += 200) {
      const { error } = await supabase.from("clientes").insert(batch.slice(i, i + 200) as never);
      if (error) { setBusy(false); return toast({ title: "Erro na importação", description: error.message, variant: "destructive" }); }
      ok += Math.min(200, batch.length - i);
    }
    setBusy(false);
    toast({ title: `Importação concluída: ${ok} novos`, description: `${dup} duplicados ignorados, ${skip} linhas sem nome.` });
    onDone();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader><DialogTitle>Importar clientes ({body.length} linhas)</DialogTitle></DialogHeader>
        <p className="text-sm text-gray-500">Associe as colunas do arquivo aos campos. Registros com CPF/CNPJ, e-mail ou telefone já cadastrados serão ignorados.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IMPORT_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              <select className="w-full h-9 rounded-md border px-2 text-sm bg-white" value={map[f.key] ?? ""} onChange={(e) => setMap({ ...map, [f.key]: e.target.value === "" ? (undefined as never) : Number(e.target.value) })}>
                <option value="">— ignorar —</option>
                {head.map((h, i) => <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>)}
              </select>
            </div>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={busy} onClick={run} className="bg-[#00A651] hover:bg-[#008c44] text-white">{busy ? "Importando..." : "Importar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
