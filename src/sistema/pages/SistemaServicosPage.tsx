import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Smartphone, Laptop, Monitor } from "lucide-react";
import { formatBRL } from "@/sistema/os-shared";

type Servico = {
  id: string;
  categoria: "celulares" | "notebooks" | "pcs";
  nome: string;
  descricao: string | null;
  preco_min: number;
  preco_max: number;
};

const CATS = [
  { key: "celulares", label: "Celulares", icon: Smartphone },
  { key: "notebooks", label: "Notebooks", icon: Laptop },
  { key: "pcs", label: "PCs", icon: Monitor },
] as const;

export default function SistemaServicosPage() {
  const [list, setList] = useState<Servico[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("servicos").select("*").order("nome");
      setList((data as Servico[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) =>
      [s.nome, s.descricao].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [list, busca]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar serviço..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="sm:max-w-xs bg-white"
      />

      <Tabs defaultValue="celulares">
        <TabsList>
          {CATS.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="gap-2">
              <c.icon size={15} /> {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATS.map((c) => (
          <TabsContent key={c.key} value={c.key}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {filtered
                .filter((s) => s.categoria === c.key)
                .map((s) => (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{s.nome}</CardTitle>
                      {s.descricao && <CardDescription>{s.descricao}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="text-[#00A651] font-bold">
                        {formatBRL(s.preco_min)} – {formatBRL(s.preco_max)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {!loading && filtered.filter((s) => s.categoria === c.key).length === 0 && (
                <p className="text-gray-500 col-span-full py-6 text-center">Nenhum serviço encontrado.</p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
