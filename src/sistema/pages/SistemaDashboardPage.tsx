import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Clock, DollarSign, Users, CheckCircle2, Package, Undo2 } from "lucide-react";
import { StatusBadge, formatBRL, STATUS_LABEL, type OS } from "@/sistema/os-shared";

export default function SistemaDashboardPage() {
  const [os, setOs] = useState<OS[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: osData }, { count }] = await Promise.all([
        supabase.from("ordens_servico").select("*").order("created_at", { ascending: false }),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
      ]);
      setOs((osData as OS[]) ?? []);
      setTotalClientes(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const pendentes = os.filter((o) => o.status === "pendente" || o.status === "em_andamento").length;
  const porStatus = (Object.keys(STATUS_LABEL) as OS["status"][]).map((k) => ({ k, n: os.filter((o) => o.status === k).length })).filter((x) => x.n > 0);
  const aparelhos = Object.values(
    os.reduce<Record<string, { nome: string; qtd: number; defeitos: Record<string, number> }>>((acc, o) => {
      const a = (acc[o.aparelho] ??= { nome: o.aparelho, qtd: 0, defeitos: {} });
      a.qtd += 1;
      if (o.defeito) a.defeitos[o.defeito] = (a.defeitos[o.defeito] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b.qtd - a.qtd).slice(0, 8);
  const faturamento = os
    .filter((o) => o.status === "concluida")
    .reduce((s, o) => s + Number(o.valor ?? 0), 0);

  const cards = [
    { label: "Total de OS", value: os.length, icon: ClipboardList, color: "text-gray-900" },
    { label: "OS Pendentes", value: pendentes, icon: Clock, color: "text-yellow-600" },
    { label: "Faturamento Concluído", value: formatBRL(faturamento), icon: DollarSign, color: "text-[#00A651]" },
    { label: "Total de Clientes", value: totalClientes, icon: Users, color: "text-gray-900" },
    { label: "Concluídas", value: os.filter((o) => o.status === "concluida").length, icon: CheckCircle2, color: "text-[#00A651]" },
    { label: "Em Estoque", value: os.filter((o) => o.status === "estoque").length, icon: Package, color: "text-purple-700" },
    { label: "Devoluções", value: os.filter((o) => o.status === "devolucao").length, icon: Undo2, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{c.label}</CardTitle>
              <c.icon size={18} className="text-[#00A651]" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.color}`}>{loading ? "—" : c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">📊 OS por Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {porStatus.length === 0 && <p className="text-sm text-gray-500">Sem dados ainda.</p>}
            {porStatus.map(({ k, n }) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0">{STATUS_LABEL[k]}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00A651]" style={{ width: `${(n / os.length) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-medium">{n}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">📱 Aparelhos Mais Atendidos</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Aparelho</TableHead><TableHead>Qtd. Atendimentos</TableHead><TableHead>Defeito Mais Comum</TableHead></TableRow></TableHeader>
              <TableBody>
                {aparelhos.map((a) => (
                  <TableRow key={a.nome}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{a.qtd}</TableCell>
                    <TableCell>{Object.entries(a.defeitos).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {!loading && aparelhos.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-6">Sem dados ainda.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas OS</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {os.slice(0, 5).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">#{o.numero}</TableCell>
                  <TableCell>{o.aparelho}</TableCell>
                  <TableCell>{o.cliente_nome ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-right">{formatBRL(o.valor)}</TableCell>
                </TableRow>
              ))}
              {!loading && os.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                    Nenhuma OS cadastrada ainda.{" "}
                    <Link to="/sistema/os" className="text-[#00A651] font-medium">Criar a primeira</Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
