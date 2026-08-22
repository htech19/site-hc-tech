import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Menu,
  X,
} from "lucide-react";

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

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#0056b3]/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-[#0056b3]">
            HC<span className="text-[#25D366]">Tech</span>
          </span>
          <span className="hidden text-sm font-medium text-slate-500 sm:inline">InfoCell</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#modelos" className="text-sm font-semibold text-slate-600 hover:text-[#0056b3]">
            Modelos
          </a>
          <a href="#especificacoes" className="text-sm font-semibold text-slate-600 hover:text-[#0056b3]">
            Especificações
          </a>
          <a href="#contato" className="text-sm font-semibold text-slate-600 hover:text-[#0056b3]">
            Contato
          </a>
          <Button
            asChild
            size="sm"
            className="gap-2 bg-[#25D366] font-bold text-white hover:bg-[#1ea855]"
          >
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Quero um orçamento para troca de tela.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
        </nav>

        <button
          className="rounded-md p-2 text-slate-600 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#0056b3]/10 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a
              href="#modelos"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-[#0056b3]"
            >
              Modelos
            </a>
            <a
              href="#especificacoes"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-[#0056b3]"
            >
              Especificações
            </a>
            <a
              href="#contato"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-700 hover:text-[#0056b3]"
            >
              Contato
            </a>
            <Button
              asChild
              className="w-full gap-2 bg-[#25D366] font-bold text-white hover:bg-[#1ea855]"
            >
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Quero um orçamento para troca de tela.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" /> Falar no WhatsApp
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer id="contato" className="bg-slate-900 py-12 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-black">
              HC<span className="text-[#25D366]">Tech</span> InfoCell
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Especialista em troca de telas de smartphones em São Bernardo do Campo.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Contato</h4>
            <p className="mt-2 text-sm text-slate-400">WhatsApp: (11) 94056-2933</p>
            <p className="text-sm text-slate-400">São Bernardo do Campo — SP</p>
          </div>
          <div>
            <h4 className="font-semibold">Atendimento</h4>
            <p className="mt-2 text-sm text-slate-400">Segunda a Sábado</p>
            <p className="text-sm text-slate-400">09:00 às 18:00</p>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} HC Tech InfoCell. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
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
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0056b3] to-[#003d80] pb-16 pt-12 text-white sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#25D366]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-black leading-tight sm:text-5xl md:text-6xl">
              Telas Originais e Premium
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
              Qualidade garantida para seu smartphone. Troca rápida, garantia real e
              atendimento direto pelo WhatsApp.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar modelo: iPhone 11, Samsung A30, Moto G8..."
                  className="h-12 w-full rounded-full border-0 bg-white pl-10 pr-4 text-slate-900 shadow-lg placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#25D366]"
                />
              </div>
              <p className="mt-2 text-xs text-blue-100 sm:text-sm">
                Digite o modelo ou número do aparelho.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {highlights.map((h) => (
                <div
                  key={h.text}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur"
                >
                  <h.icon className="size-4 text-[#25D366]" />
                  {h.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section id="modelos" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Modelos em destaque</h2>
            <p className="mt-1 text-sm text-slate-500">Toque em um modelo para ver as especificações.</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={prev}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-[#0056b3] hover:text-[#0056b3]"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-[#0056b3] hover:text-[#0056b3]"
              aria-label="Próximo"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-12 text-center">
            <p className="text-slate-600">Nenhum modelo encontrado.</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm font-semibold text-[#0056b3] hover:underline"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div
            ref={carouselRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filtered.map((device) => {
              const active = device.id === selected.id;
              return (
                <button
                  key={device.id}
                  onClick={() => goTo(device.id)}
                  className={`group relative flex w-[160px] flex-shrink-0 snap-center flex-col items-center rounded-2xl border p-4 transition-all sm:w-[200px] ${
                    active
                      ? "border-[#0056b3] bg-blue-50 shadow-lg ring-1 ring-[#0056b3]/20"
                      : "border-slate-200 bg-white hover:border-[#0056b3]/50 hover:shadow-md"
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
                    className={`mt-3 text-sm font-bold ${active ? "text-[#0056b3]" : "text-slate-800"}`}
                  >
                    {device.model}
                  </span>
                  <span className="text-xs text-slate-500">a partir de {device.priceFrom}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Specs Card */}
      <section id="especificacoes" className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-xl">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-8 sm:p-12">
                  <img
                    src={selected.image}
                    alt={selected.model}
                    width={400}
                    height={500}
                    className="max-h-[320px] object-contain drop-shadow-2xl sm:max-h-[400px]"
                  />
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                  <span className="w-fit rounded-full bg-[#0056b3]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0056b3]">
                    {selected.brand}
                  </span>
                  <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                    {selected.model}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.modelNumber}</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">Tamanho</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{selected.size}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">Tecnologia</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{selected.type}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">Resolução</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{selected.resolution}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-sm text-slate-500">a partir de</span>
                    <span className="text-3xl font-black text-[#0056b3]">{selected.priceFrom}</span>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handleCopyBudget}
                      className="h-12 flex-1 gap-2 bg-[#25D366] px-6 text-base font-bold text-white shadow-lg shadow-[#25D366]/25 hover:bg-[#1ea855]"
                    >
                      {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
                      Copiar Orçamento
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 gap-2 border-[#0056b3] px-6 text-base font-bold text-[#0056b3] hover:bg-[#0056b3] hover:text-white"
                    >
                      <a href="/telas" target="_blank" rel="noopener noreferrer">
                        Ver tabela completa
                      </a>
                    </Button>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Ao clicar, o texto do orçamento é copiado e o WhatsApp é aberto automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust badges */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Garantia de 90 dias", desc: "Cobertura real contra defeitos de fabricação." },
            { title: "Troca express", desc: "Maioria dos modelos prontos em até 40 minutos." },
            { title: "Peças selecionadas", desc: "Telas originais e premium com qualidade comprovada." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-[#0056b3]">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
