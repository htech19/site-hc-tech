import { Badge } from "@/components/ui/badge";

export type OS = {
  id: string;
  numero: number;
  aparelho: string;
  marca: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  defeito: string | null;
  status: "pendente" | "em_andamento" | "aprovado" | "concluida" | "estoque" | "devolucao" | "cancelada";
  valor: number | null;
  observacao: string | null;
  quantidade: number;
  telefone: string | null;
  data_entrada: string;
  created_at: string;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string;
  tipo_pessoa: "PF" | "PJ";
  documento: string | null;
  rg_ie: string | null;
  nome_fantasia: string | null;
  data_nascimento: string | null;
  telefone2: string | null;
  whatsapp: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  tags: string[];
  classificacao: string | null;
  status: "ativo" | "inativo" | "bloqueado";
  motivo_bloqueio: string | null;
  consentimento_lgpd: boolean;
  consentimento_data: string | null;
  aceita_whatsapp: boolean;
  aceita_email: boolean;
  aceita_sms: boolean;
  aceita_marketing: boolean;
  limite_credito: number;
  updated_at: string;
};

export const STATUS_LABEL: Record<OS["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  aprovado: "Aprovado",
  concluida: "Concluída",
  estoque: "Estoque",
  devolucao: "Devolução",
  cancelada: "Cancelada",
};

const STATUS_CLASS: Record<OS["status"], string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  em_andamento: "bg-orange-100 text-orange-800 border-orange-200",
  estoque: "bg-purple-100 text-purple-800 border-purple-200",
  devolucao: "bg-red-100 text-red-700 border-red-200",
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

export const osNum = (n: number) => `#${String(n).padStart(4, "0")}`;
export const formatData = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—";
