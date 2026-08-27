import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageCircle,
  ShieldCheck,
  Clock,
  MapPin,
  Check,
  HelpCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";


const WHATSAPP = "5511940562933";
const LANDING_URL = "https://www.hctechinfocell.com.br/telas";

interface Device {
  id: string;
  model: string;
  brand: string;
  size: string;
  type: string;
  resolution: string;
  modelNumber: string;
  priceFrom: string;
  image: string;
}

const devices: Device[] = [
  {
    id: "iphone-11",
    model: "iPhone 11",
    brand: "Apple",
    size: '6.1"',
    type: "Liquid Retina IPS LCD",
    resolution: "828 x 1792",
    modelNumber: "A2111 / A2223",
    priceFrom: "R$ 449,00",
    image: "/images/landing-telas/iphone-11.png",
  },
  {
    id: "iphone-x",
    model: "iPhone X",
    brand: "Apple",
    size: '5.8"',
    type: "Super Retina HD OLED",
    resolution: "1125 x 2436",
    modelNumber: "A1865 / A1901",
    priceFrom: "R$ 399,00",
    image: "/images/landing-telas/iphone-x.png",
  },
  {
    id: "samsung-a30",
    model: "Samsung A30",
    brand: "Samsung",
    size: '6.4"',
    type: "Super AMOLED",
    resolution: "1080 x 2340",
    modelNumber: "SM-A305G / SM-A305GT",
    priceFrom: "R$ 329,00",
    image: "/images/landing-telas/samsung-a30.png",
  },
  {
    id: "moto-g8",
    model: "Motorola G8",
    brand: "Motorola",
    size: '6.4"',
    type: "IPS LCD Max Vision",
    resolution: "720 x 1560",
    modelNumber: "XT2045 / XT2045-1",
    priceFrom: "R$ 279,00",
    image: "/images/landing-telas/moto-g8.png",
  },
];

const highlights = [
  { icon: ShieldCheck, text: "90 dias de garantia" },
  { icon: Clock, text: "Troca em até 40 min" },
  { icon: MapPin, text: "São Bernardo do Campo" },
];

function formatBudget(device: Device) {
  return `Olá! Gostaria de um orçamento para a tela do ${device.model}.\nEspecificações: ${device.type}, ${device.size}, ${device.resolution}.\nLink: ${LANDING_URL}`;
}

export default function TelasLandingPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(devices[0].id);
  const [copied, setCopied] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Troca de Tela para Smartphone | HC Tech InfoCell";
    const desc =
      "Troca de tela para iPhone, Samsung e Motorola em São Bernardo do Campo. Telas originais e premium com garantia de 90 dias. Orçamento rápido pelo WhatsApp.";
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return devices;
    return devices.filter(
      (d) =>
        d.model.toLowerCase().includes(term) ||
        d.brand.toLowerCase().includes(term) ||
        d.modelNumber.toLowerCase().includes(term),
    );
  }, [search]);

  const selected = useMemo(
    () => devices.find((d) => d.id === selectedId) || devices[0],
    [selectedId],
  );

  const currentIndex = useMemo(
    () => filtered.findIndex((d) => d.id === selected.id),
    [filtered, selected.id],
  );

  const goTo = (id: string) => {
    setSelectedId(id);
    const idx = filtered.findIndex((d) => d.id === id);
    if (carouselRef.current && idx >= 0) {
      const card = carouselRef.current.children[idx] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  };

  const next = () => {
    const idx = (currentIndex + 1) % filtered.length;
    if (filtered[idx]) goTo(filtered[idx].id);
  };

  const prev = () => {
    const idx = (currentIndex - 1 + filtered.length) % filtered.length;
    if (filtered[idx]) goTo(filtered[idx].id);
  };

  const handleCopyBudget = async () => {
    const text = formatBudget(selected);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.changedTouches[0].screenX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-black text-white">
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
            Telas Originais<br />
            <span className="text-[#00A651] drop-shadow-[0_0_15px_rgba(0,166,81,0.5)]">e Premium</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-gray-300 sm:text-lg md:text-xl">
            Qualidade garantida para seu smartphone. Troca rápida, garantia real e atendimento direto pelo WhatsApp em São Bernardo do Campo.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar modelo: iPhone 11, Samsung A30, Moto G8..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 pl-12 pr-4 text-base text-white shadow-xl placeholder:text-gray-400 backdrop-blur-sm focus-visible:border-[#00A651] focus-visible:ring-2 focus-visible:ring-[#00A651]"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-400">
              Digite o modelo ou número do aparelho.
            </p>
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

      {/* Carousel */}
      <section id="modelos" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#00A651]">Destaques</span>
            <h2 className="mt-2 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl md:text-5xl">
              Modelos em <span className="text-[#00A651]">destaque</span>
            </h2>
            <p className="mt-2 text-base font-medium text-gray-400">Toque em um modelo para ver as especificações.</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={prev}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white transition hover:border-[#00A651] hover:text-[#00A651]"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-white transition hover:border-[#00A651] hover:text-[#00A651]"
              aria-label="Próximo"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-center">
            <p className="text-lg font-bold text-gray-300">Nenhum modelo encontrado.</p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-base font-bold text-[#00A651] hover:underline"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div
            ref={carouselRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filtered.map((device) => {
              const active = device.id === selected.id;
              return (
                <button
                  key={device.id}
                  onClick={() => goTo(device.id)}
                  className={`group relative flex w-[170px] flex-shrink-0 snap-center flex-col items-center rounded-3xl border p-5 transition-all sm:w-[220px] ${
                    active
                      ? "border-[#00A651] bg-[#00A651]/10 shadow-[0_0_30px_rgba(0,166,81,0.2)] ring-1 ring-[#00A651]/30"
                      : "border-white/10 bg-white/[0.03] hover:border-[#00A651]/50 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="relative aspect-[3/4] w-full">
                    <img
                      src={device.image}
                      alt={device.model}
                      loading="lazy"
                      width={300}
                      height={400}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span
                    className={`mt-4 text-base font-black uppercase tracking-tighter ${active ? "text-[#00A651]" : "text-white"}`}
                  >
                    {device.model}
                  </span>
                  <span className="mt-1 text-sm font-bold text-gray-400">a partir de {device.priceFrom}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Specs Card */}
      <section id="especificacoes" className="bg-zinc-900/30 py-16 backdrop-blur-sm sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <Card className="overflow-hidden rounded-3xl border border-white/10 bg-[#050505]/80 shadow-2xl">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                <div className="flex items-center justify-center bg-gradient-to-br from-[#00A651]/10 to-transparent p-8 sm:p-12">
                  <img
                    src={selected.image}
                    alt={selected.model}
                    width={400}
                    height={500}
                    className="max-h-[300px] object-contain drop-shadow-2xl sm:max-h-[420px]"
                  />
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                  <span className="w-fit rounded-full bg-[#00A651]/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#00A651]">
                    {selected.brand}
                  </span>
                  <h2 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl md:text-5xl">
                    {selected.model}
                  </h2>
                  <p className="mt-2 text-base font-bold text-gray-400">{selected.modelNumber}</p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">Tamanho</p>
                      <p className="mt-2 text-xl font-black text-white">{selected.size}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">Tecnologia</p>
                      <p className="mt-2 text-lg font-black text-white leading-tight">{selected.type}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-500">Resolução</p>
                      <p className="mt-2 text-xl font-black text-white">{selected.resolution}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-baseline gap-3">
                    <span className="text-base font-bold text-gray-400">a partir de</span>
                    <span className="text-4xl font-black text-[#00A651]">{selected.priceFrom}</span>
                  </div>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <Button
                      onClick={handleCopyBudget}
                      className="h-14 flex-1 gap-2 rounded-2xl bg-[#25D366] px-6 text-base font-black uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/25 hover:bg-[#1ea855] hover:scale-[1.02] transition-all"
                    >
                      {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
                      Copiar Orçamento
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-14 gap-2 rounded-2xl border-[#00A651] bg-transparent px-6 text-base font-black uppercase tracking-wider text-[#00A651] hover:bg-[#00A651] hover:text-white transition-all"
                    >
                      <Link to="/telas" target="_blank" rel="noopener noreferrer">
                        Ver tabela completa
                      </Link>
                    </Button>
                  </div>

                  <p className="mt-5 text-sm font-medium text-gray-500">
                    Ao clicar, o texto do orçamento é copiado e o WhatsApp é aberto automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust badges */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Garantia de 90 dias", desc: "Cobertura real contra defeitos de fabricação." },
            { title: "Troca express", desc: "Maioria dos modelos prontos em até 40 minutos." },
            { title: "Peças selecionadas", desc: "Telas originais e premium com qualidade comprovada." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center transition hover:border-[#00A651]/50 hover:bg-white/[0.06]"
            >
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[#00A651]">{item.title}</h3>
              <p className="mt-3 text-base font-medium text-gray-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="rounded-3xl border border-[#00A651]/20 bg-[#00A651]/10 p-8 backdrop-blur-sm sm:p-12">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl">
            Ainda com dúvidas?
          </h2>
          <p className="mt-4 text-base font-medium text-gray-300 sm:text-lg">
            Fale direto conosco pelo WhatsApp e receba seu orçamento em minutos.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Quero um orçamento para troca de tela.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-2xl bg-[#25D366] px-8 text-base font-black uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/25 hover:bg-[#1ea855] hover:scale-[1.02] transition-all"
          >
            <MessageCircle className="size-5" />
            Falar no WhatsApp
          </a>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
