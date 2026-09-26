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
import { Plus, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge, formatBRL, whatsappOsUrl, STATUS_LABEL, type OS, type Cliente } from "@/sistema/os-shared";

const emptyForm = {
  aparelho: "",
  marca: "",
  cliente_id: "",
  defeito: "",
  status: "pendente" as OS["status"],
  valor: "",
  observacao: "",
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

  const load = async () => {
    const [{ data: osData }, { data: cliData }] = await Promise.all([
      supabase.from("ordens_servico").select("*").order("numero", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
    ]);
    setList((osData as OS[]) ?? []);
    setClientes((cliData as Cliente[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) =>
      [o.numero, o.aparelho, o.marca, o.cliente_nome, o.defeito, STATUS_LABEL[o.status]]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [list, busca]);

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
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.aparelho.trim()) {
      toast({ title: "Informe o aparelho", variant: "destructive" });
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
      valor: form.valor ? Number(form.valor.replace(",", ".")) : 0,
      observacao: form.observacao.trim() || null,
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
          className="sm:max-w-xs bg-white"
        />
        <Button onClick={openNew} className="bg-[#00A651] hover:bg-[#008c44] text-white">
          <Plus size={16} className="mr-1" /> Nova OS
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Defeito</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">#{o.numero}</TableCell>
                  <TableCell>{o.aparelho}{o.marca ? ` · ${o.marca}` : ""}</TableCell>
                  <TableCell>{o.cliente_nome ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.defeito ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-right">{formatBRL(o.valor)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Nenhuma OS encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Defeito</Label>
              <Input value={form.defeito} onChange={(e) => setForm({ ...form, defeito: e.target.value })} placeholder="Tela quebrada" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="150.00" inputMode="decimal" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-[#00A651] hover:bg-[#008c44] text-white">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
