import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Printer, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge, formatBRL, formatData, osNum, STATUS_LABEL, type OS } from "@/sistema/os-shared";

export type GestaoKind = "estoque" | "orcamentos" | "devolucoes" | "relatorios" | "caixa" | "tipos";

type Mov = { id: string; data: string; descricao: string; tipo: "entrada" | "saida"; valor: number };
type Tipo = { id: string; nome: string };

function useOs() {
  const [os, setOs] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("ordens_servico").select("*").order("numero", { ascending: false }).then(({ data }) => {
      setOs((data as OS[]) ?? []);
      setLoading(false);
    });
  }, []);
  return { os, loading };
}

function Empty({ cols, icon, text }: { cols: number; icon: string; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-gray-500 py-10">
        <div className="text-3xl mb-1" aria-hidden>{icon}</div>
        {text}
      </TableCell>
    </TableRow>
  );
}

function Stat({ label, value, color = "text-gray-900" }: { label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle></CardHeader>
      <CardContent><div className={`text-2xl font-bold ${color}`}>{value}</div></CardContent>
    </Card>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

const green = "bg-[#00A651] hover:bg-[#008c44] text-white";

function OsViews({ kind }: { kind: "estoque" | "orcamentos" | "devolucoes" | "relatorios" }) {
  const { os, loading } = useOs();
  const loadingRow = loading ? <Empty cols={8} icon="⏳" text="Carregando..." /> : null;

  if (kind === "estoque") {
    const rows = os.filter((o) => o.status === "estoque");
    return (
      <Section title="📦 Itens em Estoque">
        <Table>
          <TableHeader><TableRow><TableHead>Aparelho</TableHead><TableHead>Qtd</TableHead><TableHead>Defeito / Condição</TableHead><TableHead>Observação</TableHead><TableHead>OS #</TableHead></TableRow></TableHeader>
          <TableBody>
            {loadingRow ?? (rows.length ? rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.aparelho}</TableCell>
                <TableCell>{o.quantidade} un.</TableCell>
                <TableCell>{o.defeito ?? "—"}</TableCell>
                <TableCell className="max-w-[250px] truncate">{o.observacao ?? "—"}</TableCell>
                <TableCell>{osNum(o.numero)}</TableCell>
              </TableRow>
            )) : <Empty cols={5} icon="📦" text="Nenhum item em estoque" />)}
          </TableBody>
        </Table>
      </Section>
    );
  }

  if (kind === "orcamentos") {
    const rows = os.filter((o) => Number(o.valor ?? 0) > 0 || (o.observacao ?? "").includes("R$"));
    return (
      <Section title="💰 Orçamentos">
        <Table>
          <TableHeader><TableRow><TableHead>OS #</TableHead><TableHead>Aparelho</TableHead><TableHead>Cliente</TableHead><TableHead>Defeito</TableHead><TableHead>Valor (R$)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {loadingRow ?? (rows.length ? rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{osNum(o.numero)}</TableCell>
                <TableCell className="font-medium">{o.aparelho}</TableCell>
                <TableCell>{o.cliente_nome ?? "—"}</TableCell>
                <TableCell>{o.defeito ?? "—"}</TableCell>
                <TableCell className="font-semibold text-[#00A651]">{formatBRL(o.valor)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
              </TableRow>
            )) : <Empty cols={6} icon="💰" text="Nenhum orçamento registrado" />)}
          </TableBody>
        </Table>
      </Section>
    );
  }

  if (kind === "devolucoes") {
    const rows = os.filter((o) => o.status === "devolucao");
    return (
      <Section title="↩️ Devoluções">
        <Table>
          <TableHeader><TableRow><TableHead>OS #</TableHead><TableHead>Aparelho</TableHead><TableHead>Cliente</TableHead><TableHead>Defeito</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader>
          <TableBody>
            {loadingRow ?? (rows.length ? rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{osNum(o.numero)}</TableCell>
                <TableCell className="font-medium">{o.aparelho}</TableCell>
                <TableCell>{o.cliente_nome ?? "—"}</TableCell>
                <TableCell>{o.defeito ?? "—"}</TableCell>
                <TableCell>{o.observacao ?? "—"}</TableCell>
              </TableRow>
            )) : <Empty cols={5} icon="↩️" text="Nenhuma devolução registrada" />)}
          </TableBody>
        </Table>
      </Section>
    );
  }

  // relatórios
  const faturamento = os.reduce((s, o) => s + Number(o.valor ?? 0), 0);
  const clientesUnicos = new Set(os.map((o) => o.cliente_nome).filter(Boolean)).size;
  const exportCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["OS #", "Data", "Aparelho", "Cliente", "Defeito", "Status", "Valor", "Observação"];
    const lines = os.map((o) => [osNum(o.numero), formatData(o.data_entrada), o.aparelho, o.cliente_nome, o.defeito, STATUS_LABEL[o.status], Number(o.valor ?? 0).toFixed(2), o.observacao].map(esc).join(";"));
    const blob = new Blob(["\ufeff" + [head.map(esc).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-hctech-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total de OS" value={loading ? "—" : os.length} />
        <Stat label="Faturamento Total" value={loading ? "—" : formatBRL(faturamento)} color="text-[#00A651]" />
        <Stat label="Clientes Únicos" value={loading ? "—" : clientesUnicos} />
      </div>
      <Section
        title="📈 Relatório Geral"
        action={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={15} className="mr-1" />Imprimir</Button>
            <Button size="sm" className={green} onClick={exportCSV} disabled={!os.length}><Download size={15} className="mr-1" />Exportar CSV</Button>
          </div>
        }
      >
        <Table>
          <TableHeader><TableRow><TableHead>OS #</TableHead><TableHead>Data</TableHead><TableHead>Aparelho</TableHead><TableHead>Cliente</TableHead><TableHead>Defeito</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader>
          <TableBody>
            {loadingRow ?? (os.length ? os.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{osNum(o.numero)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatData(o.data_entrada)}</TableCell>
                <TableCell>{o.aparelho}</TableCell>
                <TableCell>{o.cliente_nome ?? "—"}</TableCell>
                <TableCell>{o.defeito ?? "—"}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell>{formatBRL(o.valor)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{o.observacao ?? "—"}</TableCell>
              </TableRow>
            )) : <Empty cols={8} icon="📈" text="Nenhuma OS registrada" />)}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

function CaixaView() {
  const { toast } = useToast();
  const [list, setList] = useState<Mov[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ descricao: "", tipo: "entrada" as Mov["tipo"], valor: "", data: new Date().toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("caixa_movimentos").select("*").order("data", { ascending: false }).order("created_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar caixa", description: error.message, variant: "destructive" });
    setList((data as Mov[]) ?? []);
    setLoading(false);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const { entradas, saidas } = useMemo(() => ({
    entradas: list.filter((c) => c.tipo === "entrada").reduce((s, c) => s + Number(c.valor), 0),
    saidas: list.filter((c) => c.tipo === "saida").reduce((s, c) => s + Number(c.valor), 0),
  }), [list]);

  const save = async () => {
    const valor = Number(form.valor.replace(",", "."));
    const descricao = form.descricao.trim().slice(0, 200);
    if (!descricao || !Number.isFinite(valor) || valor <= 0) {
      toast({ title: "Preencha descrição e valor válido", variant: "destructive" });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("caixa_movimentos").insert({ user_id: u.user!.id, descricao, tipo: form.tipo, valor, data: form.data });
    if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    toast({ title: "Movimentação registrada" });
    setOpen(false);
    setForm({ ...form, descricao: "", valor: "" });
    load();
  };

  const remove = async (m: Mov) => {
    if (!confirm(`Excluir a movimentação "${m.descricao}"?`)) return;
    const { error } = await supabase.from("caixa_movimentos").delete().eq("id", m.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Entradas" value={formatBRL(entradas)} color="text-[#00A651]" />
        <Stat label="Saídas" value={formatBRL(saidas)} color="text-red-600" />
        <Stat label="Saldo" value={formatBRL(entradas - saidas)} />
      </div>
      <Section title="💳 Movimentações do Caixa" action={<Button size="sm" className={green} onClick={() => setOpen(true)}><Plus size={15} className="mr-1" />Nova Entrada</Button>}>
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {loading ? <Empty cols={5} icon="⏳" text="Carregando..." /> : list.length ? list.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap">{formatData(m.data)}</TableCell>
                <TableCell>{m.descricao}</TableCell>
                <TableCell>{m.tipo === "entrada" ? "Entrada" : "Saída"}</TableCell>
                <TableCell className={m.tipo === "entrada" ? "text-[#00A651] font-semibold" : "text-red-600 font-semibold"}>
                  {m.tipo === "entrada" ? "+" : "-"} {formatBRL(m.valor)}
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" className="h-9 w-9 text-red-600" aria-label="Excluir" onClick={() => remove(m)}><Trash2 size={15} /></Button></TableCell>
              </TableRow>
            )) : <Empty cols={5} icon="💳" text="Nenhuma movimentação" />}
          </TableBody>
        </Table>
      </Section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova movimentação</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Descrição *</Label><Input className="text-base sm:text-sm" maxLength={200} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Mov["tipo"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input className="text-base sm:text-sm" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
            </div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button className={green} onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TiposView() {
  const { toast } = useToast();
  const { os } = useOs();
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("servico_tipos").select("id, nome").order("nome");
    setTipos((data as Tipo[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const count: Record<string, number> = {};
    tipos.forEach((t) => (count[t.nome] = 0));
    os.forEach((o) => (o.defeito ?? "").split(/[,;]/).map((d) => d.trim()).filter((d) => d && d !== "-").forEach((d) => (count[d] = (count[d] ?? 0) + 1)));
    return Object.entries(count).sort((a, b) => b[1] - a[1]);
  }, [os, tipos]);

  const add = async () => {
    const nome = prompt("Nome do novo tipo de serviço:")?.trim().slice(0, 100);
    if (!nome) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("servico_tipos").insert({ user_id: u.user!.id, nome });
    if (error) toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    else { toast({ title: "Tipo de serviço adicionado" }); load(); }
  };

  return (
    <Section title="🔧 Tipos de Serviço" action={<Button size="sm" className={green} onClick={add}><Plus size={15} className="mr-1" />Adicionar</Button>}>
      <Table>
        <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Qtd. Realizados</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.length ? rows.map(([s, c]) => (
            <TableRow key={s}><TableCell className="font-medium">{s}</TableCell><TableCell>{c}x realizado</TableCell></TableRow>
          )) : <Empty cols={2} icon="🔧" text="Nenhum serviço registrado" />}
        </TableBody>
      </Table>
    </Section>
  );
}

export default function SistemaGestaoPage({ kind }: { kind: GestaoKind }) {
  if (kind === "caixa") return <CaixaView />;
  if (kind === "tipos") return <TiposView />;
  return <OsViews kind={kind} />;
}
