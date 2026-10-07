import { useState, useMemo } from "react";
import { Search, Smartphone, Cpu, Zap, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { peliculas } from "@/data/peliculas";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────
   Tokens de cor — HC Tech brand (sistema unificado)
───────────────────────────────────────────── */
const C = {
  green:       "#00A651",
  greenDim:    "rgba(0,166,81,0.10)",
  greenBorder: "rgba(0,166,81,0.25)",
  greenGlow:   "rgba(0,166,81,0.45)",
  silver:      "#C0C2C0",
  silverMuted: "rgba(192,194,192,0.55)",
  bg:          "#1A1A1A",
  card:        "#222222",
  cardHover:   "#262626",
  border:      "rgba(255,255,255,0.07)",
  muted:       "#6B7280",
  foreground:  "#F3F4F6",
};

/* ─────────────────────────────────────────────
   FilmsTable
───────────────────────────────────────────── */
const FilmsTable = () => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return peliculas;
    const q = search.toLowerCase();
    return peliculas.filter(
      (f) =>
        f.model.toLowerCase().includes(q) ||
        f.compat.toLowerCase().includes(q) ||
        f.busca.some((b) => b.includes(q))
    );
  }, [search]);

  return (
    <section
      id="peliculas"
      style={{ backgroundColor: C.bg, padding: "5rem 0", position: "relative" }}
    >
      {/* Glow de fundo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "rgba(0,166,81,0.04)",
          borderRadius: "50%",
          filter: "blur(150px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="container mx-auto px-4"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* ── Cabeçalho ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: "2.5rem" }}
        >
          {/* Chip */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.875rem",
              borderRadius: "9999px",
              background: C.greenDim,
              border: `1px solid ${C.greenBorder}`,
              color: C.green,
              fontSize: "11px",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            <Cpu size={13} style={{ animation: "pulse 2s infinite" }} />
            Busca Inteligente I.A.
          </div>

          <h2
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              fontWeight: 700,
              color: C.foreground,
              marginBottom: "0.75rem",
              lineHeight: 1.2,
            }}
          >
            Tabela de{" "}
            <span style={{ color: C.green }}>Compatibilidade</span>
          </h2>

          <p style={{ color: C.silverMuted, fontSize: "0.9375rem" }}>
            Encontre a película ideal —{" "}
            <span style={{ color: C.green, fontWeight: 600 }}>
              {peliculas.length}+
            </span>{" "}
            modelos cadastrados.
          </p>

          {/* Divisor decorativo */}
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

        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>

          {/* ── Search ── */}
          <div className="relative group" style={{ marginBottom: "1.5rem" }}>
            {/* Glow foco */}
            <div
              className="absolute -inset-0.5 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
              style={{
                background: `linear-gradient(to right, rgba(0,166,81,0.35), rgba(0,166,81,0.08))`,
              }}
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
                placeholder="Buscar por modelo (ex: iPhone 14, Galaxy A54, Moto G52...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent py-3.5 px-3 text-sm focus:outline-none"
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

          {/* ── Contador de resultados ── */}
          {search && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <Zap size={13} style={{ color: C.green }} />
              <p style={{ fontSize: "0.875rem", color: C.muted }}>
                <span style={{ color: C.foreground, fontWeight: 600 }}>
                  {filtered.length}
                </span>{" "}
                resultado(s)
              </p>
            </div>
          )}

          {/* ── Cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    borderRadius: "1rem",
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.muted,
                  }}
                >
                  <Smartphone size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.2 }} />
                  <p style={{ fontSize: "0.875rem" }}>Nenhum modelo encontrado para sua busca.</p>
                </motion.div>
              ) : (
                (search ? filtered : filtered.slice(0, 20)).map((f, i) => (
                  <motion.div
                    key={`${f.model}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.015, ease: "easeOut" }}
                    layout
                    className="group"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "1rem",
                      padding: "1rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      transition: "border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease",
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
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: "2.25rem",
                          height: "2.25rem",
                          borderRadius: "0.625rem",
                          background: C.greenDim,
                          border: `1px solid ${C.greenBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "0.125rem",
                        }}
                      >
                        <Smartphone size={15} style={{ color: C.green }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Nome + marca */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <h3
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9375rem",
                              color: C.foreground,
                              margin: 0,
                            }}
                          >
                            {f.model}
                          </h3>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                              background: "rgba(192,194,192,0.08)",
                              color: C.silver,
                              border: "1px solid rgba(192,194,192,0.15)",
                              fontWeight: 500,
                            }}
                          >
                            {f.marca}
                          </span>
                        </div>

                        {/* Tags de compatibilidade */}
                        <div
                          style={{
                            marginTop: "0.5rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.375rem",
                          }}
                        >
                          {f.compatList.map((c, ci) => (
                            <span
                              key={ci}
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.625rem",
                                borderRadius: "0.5rem",
                                background: "rgba(0,166,81,0.08)",
                                color: C.green,
                                border: `1px solid ${C.greenBorder}`,
                                fontWeight: 500,
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hover action */}
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        marginTop: "0.75rem",
                        paddingTop: "0.75rem",
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      <a
                        href={`https://wa.me/5511977934634?text=Olá! Preciso de película para ${f.model}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                        style={{ color: C.green, width: "fit-content" }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                      >
                        <MessageCircle size={12} />
                        Pedir orçamento
                      </a>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* ── Ver todos ── */}
          {!search && filtered.length > 20 && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link
                to="/peliculas"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  background: C.green,
                  color: "#fff",
                  boxShadow: `0 0 24px ${C.greenGlow}`,
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 40px rgba(0,166,81,0.70)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 24px ${C.greenGlow}`;
                }}
              >
                Ver todos os {filtered.length} modelos
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FilmsTable;
