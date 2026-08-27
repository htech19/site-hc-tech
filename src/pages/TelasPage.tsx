import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  ArrowLeft,
  Smartphone,
  Tablet,
  MessageCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  PackageCheck,
  Clock,
  HelpCircle,
} from "lucide-react";
import { telas, marcasTelas, qualidadesTelas, type Tela } from "@/data/telas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const WHATSAPP = "5511940562933";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FAIXAS = [
  { id: "all", label: "Todos os preços", test: () => true },
  { id: "a", label: "Até R$ 200", test: (p: number) => p <= 200 },
  { id: "b", label: "R$ 200 – R$ 400", test: (p: number) => p > 200 && p <= 400 },
  { id: "c", label: "R$ 400 – R$ 700", test: (p: number) => p > 400 && p <= 700 },
  { id: "d", label: "Acima de R$ 700", test: (p: number) => p > 700 },
];

// Qualidades premium são feitas sob encomenda; as populares ficam em estoque
const EM_ESTOQUE = new Set(["INCELL", "CHINA", "PADRÃO"]);

const qualidadeTone = (q: string) => {
  if (q === "ORIGINAL" || q === "NACIONAL") return "bg-primary/15 text-primary border-primary/30";
  if (q === "OLED" || q === "AMOLED" || q === "VIVID")
    return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const waLink = (t: Tela) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Quero orçamento da troca de tela: ${t.marca} ${t.modelo} (${t.qualidade}) — ${brl(
      t.preco,
    )} • cód. ${t.codigo}`,
  )}`;

const TelaCard = ({ t }: { t: Tela }) => {
  const estoque = EM_ESTOQUE.has(t.qualidade);
  const Icone = t.tipo.toUpperCase().includes("TABLET") ? Tablet : Smartphone;
  return (
    <article className="group flex h-full flex-col rounded-xl border border-border bg-card/95 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.45)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <Icone className="size-4" aria-hidden="true" />
          </span>
          {t.marca}
        </div>
        <Badge variant="outline" className={qualidadeTone(t.qualidade)}>
          {t.qualidade}
        </Badge>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
        {t.marca === "Apple" ? "iPhone" : t.marca} {t.modelo}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Cód. {t.codigo} • {t.tipo || "Celular"}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 text-xs">
          {estoque ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <PackageCheck className="size-3.5" aria-hidden="true" /> Em estoque
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" /> Sob encomenda
            </span>
          )}
        </div>
        <p className="mt-1 text-2xl font-bold text-primary">{brl(t.preco)}</p>
        <Button asChild size="sm" className="mt-3 w-full">
          <a href={waLink(t)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" aria-hidden="true" />
            Orçamento no WhatsApp
          </a>
        </Button>
      </div>
    </article>
  );
};

const TelasPage = () => {
  const [q, setQ] = useState("");
  const [marca, setMarca] = useState("all");
  const [qualidade, setQualidade] = useState("all");
  const [faixa, setFaixa] = useState("all");
  const [limite, setLimite] = useState(60);

  useEffect(() => {
    document.title = "Tabela de Telas 2026 — Preços de Troca de Tela | HC Tech InfoCell";
    const desc =
      "Consulte preços atualizados de troca de tela para iPhone, Samsung, Xiaomi, Redmi, Motorola, POCO, Realme e LG em São Bernardo do Campo. Busca em tempo real e orçamento por WhatsApp.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  const filtered = useMemo(() => {
    const termo = q.trim().toLowerCase();
    const faixaTest = FAIXAS.find((f) => f.id === faixa)?.test ?? (() => true);
    return telas.filter((t) => {
      if (marca !== "all" && t.marca !== marca) return false;
      if (qualidade !== "all" && t.qualidade !== qualidade) return false;
      if (!faixaTest(t.preco)) return false;
      if (!termo) return true;
      const alias = t.marca === "Apple" ? "iphone apple" : t.marca === "Redmi" ? "xiaomi redmi" : t.marca;
      const haystack = `${alias} ${t.modelo} ${t.qualidade} ${t.tipo} ${t.codigo}`.toLowerCase();
      return termo.split(/\s+/).every((token) => haystack.includes(token));
    });
  }, [q, marca, qualidade, faixa]);

  useEffect(() => setLimite(60), [q, marca, qualidade, faixa]);

  const temFiltro = q || marca !== "all" || qualidade !== "all" || faixa !== "all";
  const limpar = () => {
    setQ("");
    setMarca("all");
    setQualidade("all");
    setFaixa("all");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 80% at 20% 0%, hsl(var(--primary)/0.18), transparent 70%), radial-gradient(50% 70% at 90% 10%, hsl(199 89% 48% / 0.14), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para o início
          </Link>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" /> Tabela atualizada — 08/2026
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Tabela de <span className="text-primary">Telas</span> e preços de troca
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {telas.length} telas cadastradas para iPhone, Samsung, Xiaomi, Redmi, POCO, Motorola,
            Realme, LG e tablets. Busque seu modelo e feche o orçamento pelo WhatsApp.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> 90 dias de garantia
            </li>
            <li className="inline-flex items-center gap-2">
              <Zap className="size-4 text-primary" aria-hidden="true" /> Troca no mesmo dia
            </li>
            <li className="inline-flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" aria-hidden="true" /> São Bernardo do
              Campo e região do ABC
            </li>
          </ul>
        </div>
      </header>

      {/* Busca + filtros */}
      <section
        aria-label="Busca e filtros"
        className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur"
      >
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busque por modelo: iPhone 12, A15, Redmi Note 11, Moto G84..."
              aria-label="Buscar modelo de tela"
              className="h-12 pl-9 pr-10 text-base"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              aria-label="Filtrar por marca"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
            >
              <option value="all">Todas as marcas</option>
              {marcasTelas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={qualidade}
              onChange={(e) => setQualidade(e.target.value)}
              aria-label="Filtrar por tipo de tela"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
            >
              <option value="all">Todos os tipos</option>
              {qualidadesTelas.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <select
              value={faixa}
              onChange={(e) => setFaixa(e.target.value)}
              aria-label="Filtrar por faixa de preço"
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
            >
              {FAIXAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            {temFiltro && (
              <Button variant="outline" size="sm" onClick={limpar} className="h-10">
                <X className="size-4" aria-hidden="true" /> Limpar filtros
              </Button>
            )}
          </div>

          <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
            <strong className="text-foreground">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "tela encontrada" : "telas encontradas"}
            {marca !== "all" && ` em ${marca}`}
          </p>
        </div>
      </section>

      {/* Resultados */}
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/95 p-10 text-center">
            <p className="text-base font-medium">Nenhuma tela encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente outro termo ou fale com a gente — temos acesso a modelos fora da tabela.
            </p>
            <Button asChild className="mt-5">
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  "Olá! Não encontrei minha tela na tabela. Podem me ajudar?",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" aria-hidden="true" /> Consultar no WhatsApp
              </a>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, limite).map((t) => (
                <TelaCard key={`${t.codigo}-${t.modelo}-${t.qualidade}-${t.preco}`} t={t} />
              ))}
            </div>
            {filtered.length > limite && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => setLimite((l) => l + 60)}>
                  Ver mais telas ({filtered.length - limite} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAQ */}
      <section id="faq" className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <HelpCircle className="size-3.5" aria-hidden="true" /> Tire suas dúvidas
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Perguntas <span className="text-primary">frequentes</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Respostas rápidas sobre troca de telas, prazos e garantia.
          </p>
        </div>

        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card/95 px-4 sm:px-6">
          {[
            {
              q: "Quanto tempo leva a troca de tela?",
              a: "A maioria dos modelos fica pronta em até 40 minutos. Modelos mais complexos ou com necessidade de peça sob encomenda podem levar até 24 horas úteis.",
            },
            {
              q: "A tela trocada tem garantia?",
              a: "Sim. Oferecemos 90 dias de garantia real contra defeitos de fabricação. A garantia não cobre quebras por quedas ou impactos posteriores.",
            },
            {
              q: "Qual a diferença entre tela original, OLED e premium?",
              a: "A tela original segue o padrão de fábrica da marca. OLED/AMOLED oferecem cores vibrantes e preto perfeito. As opções premium e padrão são peças de alta qualidade com ótimo custo-benefício, ideais para quem quer economizar sem abrir mão da funcionalidade.",
            },
            {
              q: "Vocês trocam telas de qualquer modelo?",
              a: "Trabalhamos com iPhones, Samsung Galaxy, Motorola, Xiaomi, Redmi, POCO, Realme, LG e tablets. Consulte disponibilidade pelo WhatsApp informando o modelo exato do aparelho.",
            },
            {
              q: "O orçamento é gratuito?",
              a: "Sim. O orçamento é 100% gratuito e sem compromisso. Basta buscar seu modelo na tabela, clicar em \"Orçamento no WhatsApp\" e enviar a mensagem já preenchida.",
            },
            {
              q: "Onde fica a assistência técnica?",
              a: "Estamos em São Bernardo do Campo, SP. O endereço completo e orientações de como chegar são enviados após o agendamento pelo WhatsApp.",
            },
          ].map((item, idx) => (
            <AccordionItem key={`faq-${idx}`} value={`item-${idx}`} className="border-b border-border last:border-b-0">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline sm:text-base [&[data-state=open]>svg]:text-primary">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">

        <p>
          Preços de referência (08/2026), sujeitos a alteração sem aviso. Mão de obra inclusa em
          orçamento no balcão.
        </p>
        <p className="mt-2">HC Tech InfoCell • São Bernardo do Campo — SP • (11) 94056-2933</p>
      </footer>
    </div>
  );
};

export default TelasPage;
