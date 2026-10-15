/**
 * Tabela de Preços (catálogo de serviços com faixas de valor).
 *
 * Página herdada da versão anterior do /sistema — movida de
 * `SistemaServicosPage.tsx` para que este arquivo possa hospedar o módulo
 * "Serviços" (tipos de serviço) exigido pelo spec. Rota: /sistema/servicos.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Smartphone, Laptop, Monitor } from "lucide-react";
import { formatBRL } from "@/sistema/os-shared";
import { CarregandoArea, EstadoErro } from "@/sistema/components/LoadingSpinner";

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

export default function SistemaTabelaPrecosPage() {
  const [list, setList] = useState<Servico[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<unknown>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase.from("servicos").select("*").order("nome");
    // Um erro de leitura NÃO é um catálogo vazio: sem isso a página exibia
    // "Nenhum serviço encontrado" quando a consulta falhava.
    if (error) {
      setErro(error);
      setList([]);
    } else {
      setList((data as Servico[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

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
        className="sm:max-w-xs bg-zinc-900 text-zinc-100 border-zinc-700"
      />

      {loading ? (
        <CarregandoArea rotulo="Carregando catálogo de serviços..." />
      ) : erro ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <EstadoErro erro={erro} aoTentarNovamente={() => void carregar()} />
        </div>
      ) : (
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
                  <Card key={s.id} className="border-zinc-800 bg-zinc-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-zinc-100">{s.nome}</CardTitle>
                      {s.descricao && (
                        <CardDescription className="text-zinc-400">{s.descricao}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-[#00FF88] font-bold">
                        {formatBRL(s.preco_min)} – {formatBRL(s.preco_max)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {filtered.filter((s) => s.categoria === c.key).length === 0 && (
                <p className="text-zinc-500 col-span-full py-6 text-center">
                  Nenhum serviço encontrado.
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      )}
    </div>
  );
}
