import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Cliente } from "@/sistema/os-shared";

const emptyForm = { nome: "", telefone: "", email: "", endereco: "" };

export default function SistemaClientesPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("clientes").select("*").order("nome");
    setList((data as Cliente[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      [c.nome, c.telefone, c.email, c.endereco]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [list, busca]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({
      nome: c.nome,
      telefone: c.telefone ?? "",
      email: c.email ?? "",
      endereco: c.endereco ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      endereco: form.endereco.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("clientes").update(payload).eq("id", editing.id)
      : await supabase.from("clientes").insert({
          ...payload,
          user_id: (await supabase.auth.getUser()).data.user!.id,
        });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar cliente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Cliente atualizado" : "Cliente adicionado" });
    setOpen(false);
    load();
  };

  const remove = async (c: Cliente) => {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return;
    const { error } = await supabase.from("clientes").delete().eq("id", c.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nome, telefone, e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="sm:max-w-xs bg-white"
        />
        <Button onClick={openNew} className="bg-[#00A651] hover:bg-[#008c44] text-white">
          <Plus size={16} className="mr-1" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.telefone ?? "—"}</TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{c.endereco ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)} title="Editar">
                        <Pencil size={15} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remove(c)} title="Excluir">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    Nenhum cliente encontrado.
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
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 9 9999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
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
