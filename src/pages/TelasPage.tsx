import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  MessageCircle,
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Smartphone,
  Tablet,
  PackageCheck,
  HelpCircle,
} from "lucide-react";
import { telas, marcasTelas, qualidadesTelas, type Tela } from "@/sistema/data/telas";
import { buildWhatsAppUrl } from "@/config/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
  if (q === "ORIGINAL" || q === "NACIONAL")
    return "border-[#00A651]/40 bg-[#00A651]/15 text-[#00A651]";
  if (q === "OLED" || q === "AMOLED" || q === "VIVID")
    return "border-sky-500/40 bg-sky-500/15 text-sky-300";
  return "border-white/15 bg-white/[0.06] text-gray-300";
};

const waLink = (t: Tela) =>
  buildWhatsAppUrl(
    `Olá! Quero orçamento da troca de tela: ${t.marca} ${t.modelo} (${t.qualidade}) — ${brl(
      t.preco,
    )} • cód. ${t.codigo}`,
  );

const highlights = [
  { icon: ShieldCheck, text: "90 dias de garantia" },
  { icon: Clock, text: "Troca em até 40 min" },
  { icon: MapPin, text: "São Bernardo do Campo" },
];

const FALAS = [
  {
    title: "Garantia de 90 dias",
    desc: "Cobertura real contra defeitos de fabricação.",
  },
  {
    title: "Troca express",
    desc: "Maioria dos modelos prontos em até 40 minutos.",
  },
  {
    title: "Peças selecionadas",
    desc: "Telas originais e premium com qualidade comprovada.",
  },
];

const FAQ = [
  {
    q: "Quanto tempo leva a troca de tela?",
    a: "A maioria dos modelos fica pronta em até 40 minutos. Modelos mais complexos ou com necessidade de peça sob encomenda podem levar até 24 horas úteis.",
  },
  {
    q: "A tela trocada tem garantia?",
    a: "Sim. Oferecemos 90 dias de garantia real contra defeitos de fabricação. A garantia não cobre quedas e impactos posteriores.",
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
];

const TelaCard = ({ t }: { t: Tela }) => {
  const estoque = EM_ESTOQUE.has(t.qualidade);
  const Icone = t.tipo.toUpperCase().includes("TABLET") ? Tablet : Smartphone;
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#00A651]/50 hover:bg-white/[0.06] hover:shadow-[0_10px_40px_-12px_rgba(0,166,81,0.45)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#00A651]/10 text-[#00A651] transition-colors group-hover:bg-[#00A651]/20">
            <Icone className="size-4" aria-hidden="true" />
          </span>
          {t.marca}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${qualidadeTone(
            t.qualidade,
          )}`}
        >
          {t.qualidade}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-black uppercase italic leading-tight tracking-tighter text-white">
        {t.marca === "Apple" ? "iPhone" : t.marca} {t.modelo}
      </h3>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">
        Cód. {t.codigo} • {t.tipo || "Celular"}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          {estoque ? (
            <span className="inline-flex items-center gap-1 text-[#00A651]">
              <PackageCheck className="size-3.5" aria-hidden="true" /> Em estoque
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gray-500">
              <Clock className="size-3.5" aria-hidden="true" /> Sob encomenda
            </span>
          )}
        </div>
        <p className="mt-1 text-2xl font-black text-[#00A651]">{brl(t.preco)}</p>
        <a
          href={waLink(t)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-black uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:bg-[#1ea855]"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Orçamento no WhatsApp
        </a>
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
    document.title =
      "Telas Originais e Premium — Tabela de Preços 08/2026 | HC Tech InfoCell";
    const desc =
      "Troca de tela para iPhone, Samsung, Xiaomi, Motorola e mais em São Bernardo do Campo. Telas originais e premium com garantia de 90 dias, troca em até 40 minutos e tabela de preços atualizada.";
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
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
      const alias =
        t.marca === "Apple" ? "iphone apple" : t.marca === "Redmi" ? "xiaomi redmi" : t.marca;
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    // overflow-x-clip (em vez de hidden) preserva o position: sticky dos filtros
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center px-4 pb-16 pt-32 text-center sm:px-6 sm:pb-20 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "url('/hero-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00A651]/30 bg-[#00A651]/10 px-4 py-2 backdrop-blur-sm">
            <ShieldCheck size={16} className="text-[#00A651]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A651]">
              Garantia real de 90 dias
            </span>
          </div>

          <h1 className="text-4xl font-black uppercase italic leading-[0.95] tracking-tighter text-white sm:text-5xl md:text-7xl">
            Telas Originais
            <br />
            <span className="text-[#00A651] drop-shadow-[0_0_15px_rgba(0,166,81,0.5)]">
              e Premium
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-gray-300 sm:text-lg md:text-xl">
            Qualidade garantida para seu smartphone. Troca rápida, garantia real e atendimento
            direto pelo WhatsApp em São Bernardo do Campo.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar modelo: iPhone 12, A15, Redmi Note 11, Moto G84..."
                aria-label="Buscar modelo de tela"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 pl-12 pr-4 text-base text-white shadow-xl placeholder:text-gray-400 backdrop-blur-sm focus-visible:border-[#00A651] focus-visible:ring-2 focus-visible:ring-[#00A651]"
              />
            </div>
            {q ? (
              <p className="mt-3 text-sm font-medium text-gray-400" aria-live="polite">
                <strong className="text-[#00A651]">{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "tela encontrada" : "telas encontradas"} na tabela —{" "}
                <a href="#tabela" className="font-black text-[#00A651] hover:underline">
                  ver resultados
                </a>
              </p>
            ) : (
              <p className="mt-3 text-sm font-medium text-gray-400">
                {telas.length} telas na tabela. Digite o modelo ou o número do aparelho.
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {highlights.map((h) => (
              <div
                key={h.text}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm"
              >
                <h.icon className="size-4 text-[#00A651]" />
                {h.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selos de confiança */}
      <section aria-label="Garantias" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {FALAS.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center transition hover:border-[#00A651]/50 hover:bg-white/[0.06]"
            >
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#00A651]">
                {item.title}
              </h2>
              <p className="mt-3 text-base font-medium leading-relaxed text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabela completa */}
      <section id="tabela" className="scroll-mt-24 border-y border-white/10 bg-zinc-900/20">
        <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 sm:pt-20">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00A651]">
            Tabela 08/2026
          </span>
          <h2 className="mt-2 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl md:text-5xl">
            Tabela completa <span className="text-[#00A651]">de telas</span>
          </h2>
          <p className="mt-3 max-w-3xl text-base font-medium text-gray-400">
            {telas.length} telas para iPhone, Samsung, Xiaomi, Redmi, POCO, Motorola, Realme, LG e
            tablets. Filtre por marca, tipo de tela ou faixa de preço.
          </p>
        </div>

        {/* Barra de filtros */}
        <div
          aria-label="Busca e filtros"
          className="z-30 border-y border-white/10 bg-[#050505]/95 backdrop-blur-md md:sticky md:top-[82px]"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative lg:max-w-md lg:flex-1">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Busque por modelo: iPhone 12, A15, Redmi Note 11, Moto G84..."
                  aria-label="Buscar modelo de tela na tabela"
                  className="h-11 rounded-2xl border border-white/10 bg-white/[0.06] pl-9 pr-10 text-sm text-white placeholder:text-gray-500 focus-visible:border-[#00A651] focus-visible:ring-2 focus-visible:ring-[#00A651] sm:h-12 sm:text-base"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    aria-label="Limpar busca"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition-colors hover:text-white"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  aria-label="Filtrar por marca"
                  className="h-11 rounded-2xl border border-white/10 bg-[#0B0B0B] px-3 text-xs font-bold text-white focus:border-[#00A651] focus:outline-none sm:h-12 sm:px-4 sm:text-sm"
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
                  className="h-11 rounded-2xl border border-white/10 bg-[#0B0B0B] px-3 text-xs font-bold text-white focus:border-[#00A651] focus:outline-none sm:h-12 sm:px-4 sm:text-sm"
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
                  className="h-11 rounded-2xl border border-white/10 bg-[#0B0B0B] px-3 text-xs font-bold text-white focus:border-[#00A651] focus:outline-none sm:h-12 sm:px-4 sm:text-sm"
                >
                  {FAIXAS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {temFiltro && (
                  <Button
                    variant="outline"
                    onClick={limpar}
                    className="h-11 gap-2 rounded-2xl border-white/15 bg-transparent px-3 text-xs font-bold uppercase tracking-wide text-gray-300 hover:border-[#00A651] hover:bg-[#00A651] hover:text-white sm:h-12 sm:px-4 sm:text-sm"
                  >
                    <X className="size-4" aria-hidden="true" /> Limpar filtros
                  </Button>
                )}
              </div>
            </div>

            <p aria-live="polite" className="mt-2 text-xs font-bold uppercase tracking-wide text-gray-500 sm:mt-3 sm:text-sm">
              <strong className="text-[#00A651]">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "tela encontrada" : "telas encontradas"}
              {marca !== "all" && ` em ${marca}`}
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-lg font-black uppercase italic tracking-tighter text-white">
                Nenhuma tela encontrada
              </p>
              <p className="mt-2 text-base font-medium text-gray-400">
                Tente outro termo ou fale com a gente — temos acesso a modelos fora da tabela.
              </p>
              <a
                href={buildWhatsAppUrl(
                  "Olá! Não encontrei minha tela na tabela. Podem me ajudar?",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-14 items-center gap-2 rounded-2xl bg-[#25D366] px-8 text-base font-black uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.02] hover:bg-[#1ea855]"
              >
                <MessageCircle className="size-5" aria-hidden="true" /> Consultar no WhatsApp
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.slice(0, limite).map((t) => (
                  <TelaCard key={`${t.codigo}-${t.modelo}-${t.qualidade}-${t.preco}`} t={t} />
                ))}
              </div>
              {filtered.length > limite && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setLimite((l) => l + 60)}
                    className="h-14 rounded-2xl border-[#00A651] bg-transparent px-8 text-base font-black uppercase tracking-wider text-[#00A651] transition-all hover:bg-[#00A651] hover:text-white"
                  >
                    Ver mais telas ({filtered.length - limite} restantes)
                  </Button>
                </div>
              )}
            </>
          )}

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            Preços de referência (08/2026), sujeitos a alteração sem aviso. Mão de obra inclusa no
            orçamento de balcão.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        aria-label="Perguntas frequentes"
        className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00A651]/30 bg-[#00A651]/10 px-4 py-2">
            <HelpCircle className="size-4 text-[#00A651]" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A651]">
              Tire suas dúvidas
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl md:text-5xl">
            Perguntas <span className="text-[#00A651]">frequentes</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-gray-400">
            Respostas rápidas sobre troca de telas, prazos e garantia.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 sm:px-6"
        >
          {FAQ.map((item, idx) => (
            <AccordionItem
              key={`faq-${idx}`}
              value={`item-${idx}`}
              className="border-b border-white/10 last:border-b-0"
            >
              <AccordionTrigger className="py-4 text-left text-sm font-black uppercase tracking-wide text-white hover:no-underline sm:text-base [&[data-state=open]>svg]:text-[#00A651]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-gray-400">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-16 text-center sm:px-6 sm:pb-20">
        <div className="rounded-3xl border border-[#00A651]/20 bg-[#00A651]/10 p-8 backdrop-blur-sm sm:p-12">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Ainda com dúvidas?
          </h2>
          <p className="mt-4 text-base font-medium text-gray-300 sm:text-lg">
            Fale direto conosco pelo WhatsApp e receba seu orçamento em minutos.
          </p>
          <a
            href={buildWhatsAppUrl("Olá! Quero um orçamento para troca de tela.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-2xl bg-[#25D366] px-8 text-base font-black uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.02] hover:bg-[#1ea855]"
          >
            <MessageCircle className="size-5" /> Falar no WhatsApp
          </a>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 px-4 pb-10 text-xs font-bold uppercase tracking-widest text-gray-600 sm:px-6">
        <Zap className="size-3.5 text-[#00A651]" aria-hidden="true" />
        HC Tech InfoCell • São Bernardo do Campo — SP
      </div>

      <Footer />
      <WhatsAppButton />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
};

export default TelasPage;
