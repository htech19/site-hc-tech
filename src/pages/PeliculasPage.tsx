import { useState, useMemo, useEffect } from "react";
import { Search, Smartphone, ArrowLeft, Cpu, Zap, Instagram, MessageCircle, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { peliculas } from "@/data/peliculas";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   Tokens de cor — HC Tech brand (sistema unificado)
───────────────────────────────────────────── */
const C = {
  green:        "#00A651",
  greenDim:     "rgba(0,166,81,0.10)",
  greenBorder:  "rgba(0,166,81,0.25)",
  greenHover:   "rgba(0,166,81,0.45)",
  greenGlow:    "0 0 24px rgba(0,166,81,0.45)",
  greenGlowStr: "0 0 40px rgba(0,166,81,0.70)",
  silver:       "#C0C2C0",
  silverMuted:  "rgba(192,194,192,0.55)",
  bg:           "#1A1A1A",
  card:         "#222222",
  cardHover:    "#262626",
  border:       "rgba(255,255,255,0.07)",
  muted:        "#6B7280",
  foreground:   "#F3F4F6",
};

/* ─────────────────────────────────────────────
   Gradientes por marca
───────────────────────────────────────────── */
const brandColors: Record<string, string> = {
  Apple:    "from-[#3a3a3a] to-[#555]",
  Samsung:  "from-[#1a3a8f] to-[#2a5ac0]",
  Motorola: "from-[#0e6e8c] to-[#12a0b0]",
  Xiaomi:   "from-[#e05a00] to-[#f07a20]",
  Realme:   "from-[#c49000] to-[#e0b020]",
  Poco:     "from-[#c49000] to-[#b06010]",
  Redmi:    "from-[#b02020] to-[#d04030]",
  LG:       "from-[#902040] to-[#c03060]",
  Asus:     "from-[#204080] to-[#3060a0]",
  Oppo:     "from-[#107050] to-[#189070]",
  Lenovo:   "from-[#a02020] to-[#c03030]",
};

const getBrandGradient = (marca: string) =>
  brandColors[marca] || "from-[#00A651] to-[#007a3d]";

const allBrands = [...new Set(peliculas.map((p) => p.marca))].sort();

/* ─────────────────────────────────────────────
   Animações
───────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

/* ─────────────────────────────────────────────
   PeliculasPage
───────────────────────────────────────────── */
const PeliculasPage = () => {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  /* Força fundo escuro no html/body — evita override do tema Tailwind */
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevHtml = root.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    root.style.backgroundColor = "#1A1A1A";
    body.style.backgroundColor = "#1A1A1A";
    root.style.colorScheme = "dark";
    return () => {
      root.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = peliculas;
    if (selectedBrand) list = list.filter((p) => p.marca === selectedBrand);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.model.toLowerCase().includes(q) ||
          p.compat.toLowerCase().includes(q) ||
          p.busca.some((b) => b.includes(q))
      );
    }
    return list;
  }, [search, selectedBrand]);

  const results = search || selectedBrand ? filtered : filtered.slice(0, 30);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background: C.bg,
        backgroundColor: "#1A1A1A",
      }}
    >

      {/* ── Fundo decorativo ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(${C.green} 1px, transparent 1px), linear-gradient(90deg, ${C.green} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="fixed top-20 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(0,166,81,0.05)" }} />
      <div className="fixed bottom-20 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(0,166,81,0.05)" }} />

      {/* ────────────────────────────────────────
          HEADER — glass morphism (sistema Menubar)
      ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(26,26,26,0.85)",
          borderBottom: `1px solid ${C.border}`,
          boxShadow: "0 1px 12px rgba(0,0,0,0.4)",
        }}
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-16">

          {/* Esquerda: voltar + logo */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium rounded-md px-2 py-1 transition-colors duration-150"
              style={{ color: C.muted }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = C.foreground;
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = C.muted;
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>

            <div className="h-5 w-px" style={{ background: C.border }} />

            <span className="text-lg font-extrabold tracking-tight">
              <span style={{ color: C.green }}>HC</span>
              <span style={{ color: C.silver }}> Tech</span>
            </span>
          </div>

          {/* Direita: social chips */}
          <div className="flex items-center gap-2">
            {[
              {
                href: "https://wa.me/5511940562933?text=Olá! Vi a tabela de compatibilidade e gostaria de um orçamento.",
                icon: <MessageCircle size={14} />,
                label: "WhatsApp",
              },
              {
                href: "https://instagram.com/hctechinfocell",
                icon: <Instagram size={14} />,
                label: "Instagram",
              },
            ].map(({ href, icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                style={{
                  background: C.greenDim,
                  color: C.green,
                  border: `1px solid ${C.greenBorder}`,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = C.green;
                  el.style.color = "#fff";
                  el.style.borderColor = C.green;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = C.greenDim;
                  el.style.color = C.green;
                  el.style.borderColor = C.greenBorder;
                }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────
          MAIN
      ──────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-10 md:py-16 relative z-10">

        {/* ── Hero ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          {/* Chip "Powered by IA" */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{
              background: C.greenDim,
              border: `1px solid ${C.greenBorder}`,
              color: C.green,
            }}
          >
            <Cpu size={13} className="animate-pulse" />
            Powered by I.A. — Busca Inteligente
          </div>

          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight"
            style={{ color: C.foreground }}
          >
            Tabela de{" "}
            <span style={{ color: C.green }}>Compatibilidade</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-base" style={{ color: C.muted }}>
            Encontre a película ideal para o seu aparelho. Nossa base inteligente cruza dados de{" "}
            <span style={{ color: C.green, fontWeight: 600 }}>{peliculas.length}+</span> modelos em tempo real.
          </p>

          {/* Divisor verde (igual ao ServicesSection) */}
          <div
            style={{
              width: "3rem",
              height: "2px",
              backgroundColor: C.green,
              margin: "1.25rem auto 0",
              borderRadius: "2px",
              boxShadow: `0 0 8px ${C.green}`,
            }}
          />
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl mx-auto mb-6"
        >
          <div className="relative group">
            {/* Glow de foco */}
            <div
              className="absolute -inset-0.5 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
              style={{ background: `linear-gradient(to right, rgba(0,166,81,0.35), rgba(0,166,81,0.08))` }}
            />
            <div
              className="relative flex items-center rounded-2xl overflow-hidden transition-colors duration-150"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <Search size={18} className="ml-4 flex-shrink-0" style={{ color: C.muted }} />
              <input
                type="text"
                placeholder="Digite o modelo do seu celular..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent py-4 px-3 text-sm focus:outline-none"
                style={{ color: C.foreground }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mr-3 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150"
                  style={{ color: C.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.foreground)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Brand Filter Chips ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {[{ label: "Todos", value: null }, ...allBrands.map((b) => ({ label: b, value: b }))].map(
              ({ label, value }) => {
                const active = selectedBrand === value;
                return (
                  <button
                    key={label}
                    onClick={() => setSelectedBrand(value)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                    style={
                      active
                        ? {
                            background: C.green,
                            color: "#fff",
                            boxShadow: C.greenGlow,
                            border: "1px solid transparent",
                          }
                        : {
                            background: C.card,
                            color: C.muted,
                            border: `1px solid ${C.border}`,
                          }
                    }
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = C.greenBorder;
                        (e.currentTarget as HTMLButtonElement).style.color = C.foreground;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                        (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>
        </motion.div>

        {/* ── Contador de resultados ── */}
        {(search || selectedBrand) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto mb-4 flex items-center gap-2"
          >
            <Zap size={13} style={{ color: C.green }} />
            <span className="text-sm" style={{ color: C.muted }}>
              <span style={{ color: C.foreground, fontWeight: 600 }}>{filtered.length}</span> resultado(s) encontrado(s)
            </span>
          </motion.div>
        )}

        {/* ── Cards de resultado ── */}
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 rounded-2xl"
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  color: C.muted,
                }}
              >
                <Smartphone size={40} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium" style={{ color: C.foreground }}>Nenhum modelo encontrado.</p>
                <p className="text-sm mt-1">Tente buscar outro modelo ou marca.</p>
              </motion.div>
            ) : (
              results.map((f, i) => (
                <motion.div
                  key={`${f.model}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.012, ease: "easeOut" }}
                  layout
                  className="group rounded-2xl p-4 md:p-5 transition-all duration-150"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = C.greenBorder;
                    el.style.backgroundColor = C.cardHover;
                    el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${C.greenBorder}`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = C.border;
                    el.style.backgroundColor = C.card;
                    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar marca */}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getBrandGradient(f.marca)} flex items-center justify-center flex-shrink-0 shadow-sm`}
                    >
                      <Smartphone size={17} className="text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-sm md:text-base" style={{ color: C.foreground }}>
                          {f.model}
                        </h2>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "rgba(192,194,192,0.08)",
                            color: C.silver,
                            border: "1px solid rgba(192,194,192,0.15)",
                          }}
                        >
                          {f.marca}
                        </span>
                      </div>

                      {/* Tags de compatibilidade — verde translúcido */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.compatList.map((c, ci) => (
                          <span
                            key={ci}
                            className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{
                              background: "rgba(0,166,81,0.08)",
                              color: C.green,
                              border: `1px solid ${C.greenBorder}`,
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick actions — aparecem no hover */}
                  <div
                    className="flex items-center gap-3 mt-3 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <a
                      href={`https://wa.me/5511940562933?text=Olá! Preciso de película para ${f.model}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                      style={{ color: C.green }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                    >
                      <MessageCircle size={12} />
                      Solicitar orçamento
                    </a>
                    <span style={{ color: C.border, fontSize: "0.75rem" }}>•</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${f.model} — Compatível com: ${f.compat}`)}
                      className="flex items-center gap-1.5 text-xs transition-colors duration-150"
                      style={{ color: C.muted }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.foreground)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
                    >
                      <Share2 size={12} />
                      Copiar
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Hint: mostrar mais */}
        {!search && !selectedBrand && filtered.length > 30 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm mt-10"
            style={{ color: C.muted }}
          >
            Mostrando 30 de{" "}
            <span style={{ color: C.green, fontWeight: 600 }}>{filtered.length}</span>{" "}
            modelos. Use a busca ou filtre por marca.
          </motion.p>
        )}

        {/* ── CTA Social ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mx-auto mt-16"
        >
          <div
            className="rounded-2xl p-6 md:p-8 text-center relative overflow-hidden"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(0,166,81,0.06) 0%, transparent 60%)" }}
            />

            <div className="relative z-10">
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: C.foreground }}>
                Não encontrou seu modelo?
              </h3>
              <p className="text-sm mb-6" style={{ color: C.muted }}>
                Fale com a gente! Temos milhares de películas em estoque.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Botão primário — WhatsApp */}
                <a
                  href="https://wa.me/5511940562933?text=Olá! Preciso de ajuda para encontrar minha película."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: C.green,
                    color: "#fff",
                    boxShadow: C.greenGlow,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = C.greenGlowStr;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = C.greenGlow;
                  }}
                >
                  <MessageCircle size={17} />
                  Chamar no WhatsApp
                </a>

                {/* Botão secundário — Instagram */}
                <a
                  href="https://instagram.com/hctechinfocell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: "transparent",
                    color: C.green,
                    border: `2px solid ${C.greenBorder}`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = C.greenDim;
                    el.style.borderColor = C.greenHover;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "transparent";
                    el.style.borderColor = C.greenBorder;
                  }}
                >
                  <Instagram size={17} />
                  Seguir no Instagram
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-6 mt-12"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs" style={{ color: C.muted }}>
            © {new Date().getFullYear()}{" "}
            <span style={{ color: C.green }}>HC Tech</span>
            {" "}— Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PeliculasPage;
