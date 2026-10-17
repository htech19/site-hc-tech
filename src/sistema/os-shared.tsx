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
  pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  em_andamento: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  estoque: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  devolucao: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  aprovado: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  concluida: "bg-green-600/20 text-green-400 border-green-400/30",
  cancelada: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
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
  `https://wa.me/5511977934634?text=${encodeURIComponent(
    `Olá, sou da HC Tech. Sua OS ${o.numero} do ${o.aparelho} está com status ${STATUS_LABEL[o.status]}.`
  )}`;

export const osNum = (n: number) => `#${String(n).padStart(4, "0")}`;
export const formatData = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—";
