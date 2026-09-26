import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Clock, DollarSign, Users } from "lucide-react";
import { StatusBadge, formatBRL, type OS } from "@/sistema/os-shared";

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

  const pendentes = os.filter((o) => o.status === "pendente").length;
  const faturamento = os
    .filter((o) => o.status === "concluida")
    .reduce((s, o) => s + Number(o.valor ?? 0), 0);

  const cards = [
    { label: "Total de OS", value: os.length, icon: ClipboardList, color: "text-gray-900" },
    { label: "OS Pendentes", value: pendentes, icon: Clock, color: "text-yellow-600" },
    { label: "Faturamento Concluído", value: formatBRL(faturamento), icon: DollarSign, color: "text-[#00A651]" },
    { label: "Total de Clientes", value: totalClientes, icon: Users, color: "text-gray-900" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas 5 OS</CardTitle>
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
