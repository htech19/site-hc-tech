import { Badge } from "@/components/ui/badge";

export type OS = {
  id: string;
  numero: number;
  aparelho: string;
  marca: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  defeito: string | null;
  status: "pendente" | "aprovado" | "concluida" | "cancelada";
  valor: number | null;
  observacao: string | null;
  created_at: string;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string;
};

export const STATUS_LABEL: Record<OS["status"], string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_CLASS: Record<OS["status"], string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprovado: "bg-blue-100 text-blue-800 border-blue-200",
  concluida: "bg-green-100 text-green-800 border-green-200",
  cancelada: "bg-gray-100 text-gray-600 border-gray-200",
};

export function StatusBadge({ status }: { status: OS["status"] }) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export const formatBRL = (v: number | null | undefined) =>
  (Number(v ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const whatsappOsUrl = (o: OS) =>
  `https://wa.me/5511940562933?text=${encodeURIComponent(
    `Olá, sou da HC Tech. Sua OS ${o.numero} do ${o.aparelho} está com status ${STATUS_LABEL[o.status]}.`
  )}`;
