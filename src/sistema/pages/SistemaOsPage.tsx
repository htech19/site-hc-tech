import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MessageCircle, Pencil, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge, formatBRL, whatsappOsUrl, STATUS_LABEL, osNum, formatData, type OS, type Cliente } from "@/sistema/os-shared";

const emptyForm = {
  aparelho: "",
  marca: "",
  cliente_id: "",
  defeito: "",
  status: "pendente" as OS["status"],
  valor: "",
  observacao: "",
  quantidade: "1",
  telefone: "",
  data_entrada: new Date().toISOString().slice(0, 10),
};

export default function SistemaOsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<OS[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OS | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fStatus, setFStatus] = useState("todos");
  const [fCliente, setFCliente] = useState("todos");
  const [detail, setDetail] = useState<OS | null>(null);

  const load = async () => {
    const [{ data: osData }, { data: cliData }] = await Promise.all([
      supabase.from("ordens_servico").select("*").order("numero", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
    ]);
    setList((osData as OS[]) ?? []);
    setClientes((cliData as Cliente[]) ?? []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("nova") === "1") { setEditing(null); setForm(emptyForm); setOpen(true); window.history.replaceState(null, "", "/sistema/os"); }
  }, []);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = list.filter(
      (o) => (fStatus === "todos" || o.status === fStatus) && (fCliente === "todos" || (o.cliente_nome ?? "") === fCliente)
    );
    if (!q) return base;
    return base.filter((o) =>
      [o.numero, o.aparelho, o.marca, o.cliente_nome, o.defeito, STATUS_LABEL[o.status]]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [list, busca, fStatus, fCliente]);
  const nomesClientes = useMemo(() => [...new Set(list.map((o) => o.cliente_nome).filter(Boolean) as string[])].sort(), [list]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (o: OS) => {
    setEditing(o);
    setForm({
      aparelho: o.aparelho,
      marca: o.marca ?? "",
      cliente_id: o.cliente_id ?? "",
      defeito: o.defeito ?? "",
      status: o.status,
      valor: o.valor != null ? String(o.valor) : "",
      observacao: o.observacao ?? "",
      quantidade: String(o.quantidade ?? 1),
      telefone: o.telefone ?? "",
      data_entrada: o.data_entrada ?? emptyForm.data_entrada,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.aparelho.trim()) {
      toast({ title: "Informe o aparelho", variant: "destructive" });
      return;
    }
    const qtd = parseInt(form.quantidade, 10);
    const valorNum = form.valor ? Number(form.valor.replace(",", ".")) : 0;
    if (!Number.isFinite(qtd) || qtd < 1 || !Number.isFinite(valorNum) || valorNum < 0) {
      toast({ title: "Quantidade ou valor inválido", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const cliente = clientes.find((c) => c.id === form.cliente_id);
    const payload = {
      aparelho: form.aparelho.trim(),
      marca: form.marca.trim() || null,
      cliente_id: form.cliente_id || null,
      cliente_nome: cliente?.nome ?? null,
      defeito: form.defeito.trim() || null,
      status: form.status,
      valor: valorNum,
      observacao: form.observacao.trim() || null,
      quantidade: qtd,
      telefone: form.telefone.trim() || cliente?.whatsapp || cliente?.telefone || null,
      data_entrada: form.data_entrada || emptyForm.data_entrada,
    };
    const { error } = editing
      ? await supabase.from("ordens_servico").update(payload).eq("id", editing.id)
      : await supabase.from("ordens_servico").insert({ ...payload, user_id: userData.user!.id });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar OS", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "OS atualizada" : "OS criada" });
    setOpen(false);
    load();
  };

  const remove = async (o: OS) => {
    if (!confirm(`Excluir a OS #${o.numero}?`)) return;
    const { error } = await supabase.from("ordens_servico").delete().eq("id", o.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por número, aparelho, cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="sm:max-w-xs bg-white text-base sm:text-sm"
        />
        <div className="flex gap-2 flex-1 sm:justify-end">
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="bg-white w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fCliente} onValueChange={setFCliente}>
            <SelectTrigger className="bg-white w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              {nomesClientes.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-[#00A651] hover:bg-[#008c44] text-white">
          <Plus size={16} className="mr-1" /> Nova OS
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS #</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Defeito</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{osNum(o.numero)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatData(o.data_entrada)}</TableCell>
                  <TableCell>{o.aparelho}{o.marca ? ` · ${o.marca}` : ""}{o.quantidade > 1 ? ` (${o.quantidade} un.)` : ""}</TableCell>
                  <TableCell>{o.cliente_nome ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.defeito ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="max-w-[180px] truncate">{o.observacao ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatBRL(o.valor)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setDetail(o)} title="Detalhes" aria-label="Detalhes">
                        <Eye size={15} />
                      </Button>
                      <a href={whatsappOsUrl(o)} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline" className="h-8 w-8 text-[#00A651] border-[#00A651]/40 hover:bg-[#00A651]/10" title="Avisar no WhatsApp">
                          <MessageCircle size={15} />
                        </Button>
                      </a>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(o)} title="Editar">
                        <Pencil size={15} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remove(o)} title="Excluir">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    Nenhuma OS encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar OS #${editing.numero}` : "Nova Ordem de Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Aparelho *</Label>
              <Input value={form.aparelho} onChange={(e) => setForm({ ...form, aparelho: e.target.value })} placeholder="iPhone 11" />
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Apple" />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem cliente</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as OS["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min={1} inputMode="numeric" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input type="tel" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 90000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Entrada</Label>
              <Input type="date" value={form.data_entrada} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Defeito</Label>
              <Input value={form.defeito} onChange={(e) => setForm({ ...form, defeito: e.target.value })} placeholder="Tela quebrada" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Orçado (R$)</Label>
              <Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="150.00" inputMode="decimal" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Observação / Orçamento</Label>
              <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            {!editing && <Button variant="outline" onClick={() => setForm(emptyForm)}>Limpar</Button>}
            <Button onClick={save} disabled={saving} className="bg-[#00A651] hover:bg-[#008c44] text-white">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes da OS {detail && osNum(detail.numero)}</DialogTitle></DialogHeader>
          {detail && (
            <dl className="grid grid-cols-3 gap-y-2 text-sm">
              {([
                ["Data", formatData(detail.data_entrada)],
                ["Aparelho", `${detail.aparelho}${detail.marca ? ` · ${detail.marca}` : ""}`],
                ["Quantidade", `${detail.quantidade} un.`],
                ["Cliente", detail.cliente_nome ?? "—"],
                ["Telefone", detail.telefone ?? "—"],
                ["Defeito", detail.defeito ?? "—"],
                ["Valor", formatBRL(detail.valor)],
                ["Observação", detail.observacao ?? "—"],
              ] as const).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="col-span-2 break-words">{v}</dd>
                </div>
              ))}
              <dt className="text-gray-500">Status</dt>
              <dd className="col-span-2"><StatusBadge status={detail.status} /></dd>
            </dl>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
