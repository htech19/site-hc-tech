import { useState, useEffect, useRef } from "react";
import { X, Star, Zap, TrendingUp, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Paleta ───────────────────────────────────────────────
const C = {
  bg:      "#1A1A1A",
  card:    "#212121",
  card2:   "#2a2a2a",
  border:  "#333",
  green:   "#00A651",
  silver:  "#C0C2C0",
  white:   "#FFFFFF",
  muted:   "#666",
  dim:     "#444",
};

// ─── Dados ────────────────────────────────────────────────
const categories = ["Todos","Capas","Películas","Carregadores","Fones","Cabos","Armazenamento","Informática"];

const products = [
  { id:1,  name:"Capa Anti-Impacto Samsung A55",      category:"Capas",        price:"R$ 34,90", oldPrice:"R$ 49,90", badge:"top",    desc:"Proteção militar grau A, bordas elevadas, TPU reforçado, compatível com carregamento sem fio.",        svgPrompt:"draw a dark smartphone protective case product, solid matte black material with green accent corners, top-down view, minimalist tech product photo style, dark background" },
  { id:2,  name:"Capa MagSafe iPhone 15 Pro",         category:"Capas",        price:"R$ 79,90",                      badge:"novo",   desc:"Anel MagSafe integrado, silicone premium, microfibra interna, compatível com todos acessórios Apple.",  svgPrompt:"draw a premium silicone iPhone case with magnetic ring visible, sleek black with subtle green glow, product photography style, dark background" },
  { id:3,  name:"Capa Transparente Redmi Note 13",    category:"Capas",        price:"R$ 24,90", oldPrice:"R$ 39,90", badge:"oferta", desc:"Anti-amarelamento, reforço nas quinas, exibe o design original do aparelho sem perder proteção.",       svgPrompt:"draw a transparent clear phone case product, showing phone outline inside, modern tech product style, dark background with subtle light reflection" },
  { id:4,  name:"Capa Carteira Moto G84",             category:"Capas",        price:"R$ 54,90",                                      desc:"Flip com compartimentos para cartões, couro sintético premium, fechamento magnético.",                   svgPrompt:"draw a leather wallet flip phone case, dark brown leather texture, card slots visible, closed position, product photo dark background" },
  { id:5,  name:"Película 3D Vidro Samsung S24",      category:"Películas",    price:"R$ 39,90", oldPrice:"R$ 59,90", badge:"top",    desc:"Cobertura total 3D, cola UV, dureza 9H, oleofóbica, kit completo com aplicador incluso.",               svgPrompt:"draw a tempered glass screen protector product, floating on dark background, glass reflection visible, 9H hardness label, tech product style" },
  { id:6,  name:"Película Hidrogel iPhone 15 Pro Max",category:"Películas",    price:"R$ 34,90",                      badge:"novo",   desc:"Flexível com auto-regeneração de microarranhões, instalação sem bolhas, guia posicionador.",             svgPrompt:"draw a hydrogel flexible screen protector, semi-transparent, floating, showing flexibility, dark tech product background" },
  { id:7,  name:"Película Privacidade 180°",          category:"Películas",    price:"R$ 44,90",                                      desc:"Bloqueia visão lateral em 180°, ideal para transporte público e uso corporativo, dureza 9H.",            svgPrompt:"draw a privacy screen protector product, showing blocked side view angles with dark gradient, smartphone screen visible only from front, dark background" },
  { id:8,  name:"Película Cerâmica Fosca Moto G73",   category:"Películas",    price:"R$ 27,90", oldPrice:"R$ 39,90", badge:"oferta", desc:"Acabamento fosco anti-reflexo, reduz marcas de dedos, excelente para jogos e digitação.",               svgPrompt:"draw a matte ceramic screen protector, soft matte finish texture, dark grey product on dark background, minimal tech product photography" },
  { id:9,  name:"Carregador GaN 65W 3 Portas",        category:"Carregadores", price:"R$ 129,90",oldPrice:"R$ 189,90",badge:"top",    desc:"GaN compacto, 2× USB-C + 1× USB-A, carrega notebook + celular + tablet ao mesmo tempo.",              svgPrompt:"draw a compact GaN USB-C charger adapter product, white cube shape with 3 ports visible, green LED indicator, dark background product photo" },
  { id:10, name:"Carregador Turbo 67W Xiaomi",        category:"Carregadores", price:"R$ 89,90",                                      desc:"Turbo 67W para Xiaomi, Redmi e POCO, de 0 a 100% em apenas 40 minutos.",                               svgPrompt:"draw a fast charging USB-C power adapter, compact rectangular shape, glowing orange speed indicator, dark product background" },
  { id:11, name:"Carregador Veicular 45W USB-C",      category:"Carregadores", price:"R$ 54,90", oldPrice:"R$ 79,90", badge:"oferta", desc:"Power Delivery 45W, USB-C + USB-A simultâneos, proteção contra sobrecarga e superaquecimento.",        svgPrompt:"draw a car USB-C charger adapter, cylindrical metallic design, glowing green LED, dark product photo background" },
  { id:12, name:"Base Sem Fio 15W Qi2",               category:"Carregadores", price:"R$ 99,90",                      badge:"novo",   desc:"Qi2 15W, compatível com iPhone MagSafe e Android, LED indicador de status.",                           svgPrompt:"draw a wireless charging pad, circular flat design, green LED ring glow, smartphone silhouette charging on top, dark background" },
  { id:13, name:"Powerbank 20000mAh 22.5W PD",        category:"Carregadores", price:"R$ 149,90",                     badge:"top",    desc:"20000mAh com PD 22.5W, 2× USB-A + USB-C + Micro-USB, carrega notebooks slim.",                         svgPrompt:"draw a large power bank battery pack, rectangular matte black design, multiple ports, LED battery indicator, dark tech product background" },
  { id:14, name:"Fone TWS ANC Bluetooth 5.3",         category:"Fones",        price:"R$ 189,90",oldPrice:"R$ 259,90",badge:"top",    desc:"ANC com modo transparência, driver 12mm com graves potentes, 36h de bateria total com estojo.",         svgPrompt:"draw premium wireless earbuds with charging case open, white earbuds with green accent, dark background product photography" },
  { id:15, name:"Fone Over-Ear ANC Premium",          category:"Fones",        price:"R$ 349,90",                     badge:"novo",   desc:"Over-ear com ANC adaptativo, almofadas memory foam, até 40h de reprodução contínua.",                   svgPrompt:"draw premium over-ear headphones, matte black design, cushioned ear cups, folded compact position, dark background product photo" },
  { id:16, name:"Headset Gamer USB 7.1 Surround",     category:"Fones",        price:"R$ 159,90",                                     desc:"Surround 7.1 virtual, microfone retrátil com ANC, almofadas memory foam ultra-macias.",                 svgPrompt:"draw a gaming headset with RGB lighting, large ear cups, retractable microphone, matte black with green RGB accent, dark background" },
  { id:17, name:"Fone com Fio USB-C Hi-Fi",           category:"Fones",        price:"R$ 49,90",                      badge:"oferta", desc:"DAC integrado USB-C, frequência 20Hz–20kHz, driver 10mm com graves encorpados.",                        svgPrompt:"draw wired in-ear earphones with USB-C connector, black cable, ear tips displayed, minimal product photography dark background" },
  { id:18, name:"Cabo USB-C 100W 2m Nylon",           category:"Cabos",        price:"R$ 49,90", oldPrice:"R$ 69,90", badge:"top",    desc:"100W, revestimento nylon premium, carga rápida + transferência 480Mbps, durável e flexível.",           svgPrompt:"draw a braided nylon USB-C cable coiled neatly, dark background, showing both USB-C connectors, premium product photo style" },
  { id:19, name:"Cabo Lightning MFi 1m Apple",        category:"Cabos",        price:"R$ 59,90",                                      desc:"Certificado MFi Apple, carregamento rápido para todos os iPhones, PVC reforçado.",                      svgPrompt:"draw an Apple Lightning cable coiled, white cable on dark background, showing Lightning and USB-A connectors, product photography" },
  { id:20, name:"Cabo Magnético 3 em 1 240W",         category:"Cabos",        price:"R$ 79,90",                      badge:"novo",   desc:"240W com pontas intercambiáveis USB-C + Lightning + Micro-USB, LED indicador de carga.",               svgPrompt:"draw a magnetic charging cable with 3 interchangeable tips floating, LED light on connector, dark tech product background" },
  { id:21, name:"Cabo HDMI 2.1 8K 2m",               category:"Cabos",        price:"R$ 89,90",                      badge:"oferta", desc:"8K@60Hz e 4K@120Hz, ideal para PS5, Xbox Series X e monitores gaming de alta taxa de atualização.",     svgPrompt:"draw a premium HDMI cable with gold-plated connectors, dark braided cable coiled, showing 8K label badge, dark product background" },
  { id:22, name:"Cartão MicroSD 256GB Samsung",       category:"Armazenamento",price:"R$ 99,90", oldPrice:"R$ 149,90",badge:"top",    desc:"A2 V30, leitura 160MB/s, gravação 120MB/s, para fotos 4K, jogos e apps exigentes.",                    svgPrompt:"draw a microSD memory card product, Samsung brand look, 256GB label, tiny card on dark background with subtle glow, tech product style" },
  { id:23, name:"Pen Drive 128GB USB 3.2 Kingston",   category:"Armazenamento",price:"R$ 44,90",                                      desc:"USB 3.2 Gen 1, leitura 200MB/s, carcaça metálica resistente, compacto e durável.",                      svgPrompt:"draw a metallic USB flash drive, 128GB, cap removed showing connector, silver metallic finish, dark product photo background" },
  { id:24, name:"SSD Externo Portátil 1TB USB-C",     category:"Armazenamento",price:"R$ 299,90",                     badge:"novo",   desc:"Leitura 1050MB/s, gravação 1000MB/s, resistente a quedas, compacto 8×4cm.",                            svgPrompt:"draw a portable external SSD drive, slim rectangular matte black design, USB-C port visible, 1TB label, dark tech background" },
  { id:25, name:"Hub USB-C 8 em 1 HDMI 4K",          category:"Armazenamento",price:"R$ 149,90",oldPrice:"R$ 199,90",badge:"oferta", desc:"HDMI 4K + 3× USB-A + PD 100W + SD + MicroSD + Ethernet Gigabit, para notebooks e iPads.",              svgPrompt:"draw a USB-C hub adapter with multiple ports, slim aluminum design, showing all ports labeled, dark product background" },
  { id:26, name:"Mouse Sem Fio Silencioso 2.4GHz",    category:"Informática",  price:"R$ 59,90",                      badge:"top",    desc:"Clique silencioso, receptor nano USB, DPI 800/1200/1600 ajustável, bateria AA dura 12 meses.",           svgPrompt:"draw a sleek wireless computer mouse, matte black design, side view, subtle green LED DPI indicator, dark background product photo" },
  { id:27, name:"Teclado Mecânico TKL RGB ABNT2",     category:"Informática",  price:"R$ 219,90",oldPrice:"R$ 289,90",badge:"oferta", desc:"Switches Red lineares, RGB por tecla, cabo USB-C removível, layout ABNT2 completo.",                   svgPrompt:"draw a compact TKL mechanical keyboard, RGB backlit keys, dark background, top-down slightly angled view, premium product photography" },
  { id:28, name:"Webcam Full HD 1080p 60fps",         category:"Informática",  price:"R$ 189,90",                     badge:"novo",   desc:"1080p a 60fps, microfone estéreo ANC, auto-foco rápido, correção automática de iluminação.",            svgPrompt:"draw a premium webcam mounted on monitor, sleek cylindrical black design, front view showing lens, dark background" },
  { id:29, name:"Roteador Wi-Fi 6 AX3000 Dual Band",  category:"Informática",  price:"R$ 329,90",                     badge:"top",    desc:"OFDMA + MU-MIMO, alcance de 200m², 4 antenas externas, porta WAN Gigabit.",                            svgPrompt:"draw a modern Wi-Fi 6 router with 4 antennas, dark matte design, green LED status lights, dark background product photo" },
  { id:30, name:"Suporte Notebook Alumínio",          category:"Informática",  price:"R$ 89,90", oldPrice:"R$ 119,90",badge:"oferta", desc:"6 alturas ajustáveis, alumínio aeronáutico, ventilação integrada, reduz temperatura em até 4°C.",       svgPrompt:"draw an aluminum laptop stand, adjustable height, silver metallic finish, ventilation slots visible, dark background product photo" },
];

const badgeConfig: Record<string,{label:string,icon:any,bg:string,border:string,text:string}> = {
  top:    { label:"+ Vendido", icon:TrendingUp, bg:"rgba(0,166,81,.18)",  border:"rgba(0,166,81,.5)",   text:"#00A651" },
  oferta: { label:"Oferta",    icon:Zap,        bg:"rgba(220,38,38,.18)", border:"rgba(220,38,38,.5)",  text:"#f87171" },
  novo:   { label:"Novo",      icon:Star,       bg:"rgba(192,194,192,.15)",border:"rgba(192,194,192,.4)",text:"#C0C2C0" },
};

// ─── Imagem IA ────────────────────────────────────────────
function AIProductImage({ product }: { product: any }) {
  const [svgContent, setSvgContent] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const generated = useRef(false);

  useEffect(() => {
    if (generated.current) return;
    generated.current = true;
    setLoading(true);

    const systemPrompt = `You are an SVG product illustration artist. Create beautiful, realistic-looking SVG product illustrations for a dark-themed tech store.
Rules:
- Return ONLY raw SVG code, nothing else, no markdown, no explanation
- SVG must be exactly: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">...</svg>
- Use dark backgrounds (#1a1a1a, #111, #222)
- Use #00A651 green as accent/glow color
- Make it look like a real product photo: centered object, subtle shadows, slight glow
- Use gradients, shadows and highlights to make it look 3D and photorealistic
- Keep shapes clean and recognizable
- No text labels inside the SVG`;

    const userPrompt = `Create an SVG product illustration: ${product.svgPrompt}. Category: ${product.category}. Make it look premium, dark background, green (#00A651) accent lighting.`;

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data?.content?.[0]?.text || "";
        const match = text.match(/<svg[\s\S]*<\/svg>/i);
        if (match) setSvgContent(match[0]);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const base: React.CSSProperties = {
    width:"100%", height:"100%",
    display:"flex", alignItems:"center", justifyContent:"center",
    background:"#161616", position:"relative", overflow:"hidden",
  };

  if (loading) return (
    <div style={base}>
      <svg width="32" height="32" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#333" strokeWidth="3"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#00A651" strokeWidth="3"
          strokeDasharray="22 66" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );

  if (error || !svgContent) return (
    <div style={base}>
      <ShoppingBag size={28} style={{ color:"#00A651", opacity:0.5 }}/>
    </div>
  );

  return (
    <div style={base}>
      <div style={{ width:"100%", height:"100%" }}
        dangerouslySetInnerHTML={{ __html: svgContent.replace(/<svg/, '<svg style="width:100%;height:100%"') }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HERO SECTION — fundo fixo com hero-bg.jpg
// Importe este componente no seu page.tsx / App.tsx
// ─────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section
      id="home"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // ↓ caminho relativo ao assets — Vite resolve automaticamente
        backgroundImage: "url('/src/assets/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        // ↓ isso faz a imagem ficar FIXA enquanto o restante da página rola
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay gradiente escuro */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(170deg, rgba(26,26,26,0.5) 0%, rgba(26,26,26,0.88) 100%)",
        zIndex: 1,
      }}/>

      {/* Linha verde decorativa no rodapé do hero */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0, height: 2, zIndex: 2,
        background: "linear-gradient(90deg, transparent, #00A651, transparent)",
      }}/>

      {/* Conteúdo */}
      <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 24px", maxWidth:720 }}>
        <motion.p
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
          style={{ color:"#00A651", fontWeight:700, fontSize:13, letterSpacing:"0.2em",
            textTransform:"uppercase", marginBottom:16 }}
        >
          Acessórios & Eletrônicos
        </motion.p>
        <motion.h1
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.65, delay:.1 }}
          style={{
            fontSize: "clamp(38px,6.5vw,76px)", fontWeight:900,
            color: C.white, margin:"0 0 18px", lineHeight:1.08,
            textShadow:"0 6px 40px rgba(0,0,0,.9)",
          }}
        >
          HC Tech<br/>
          <span style={{ color:"#00A651" }}>Solutions</span>
        </motion.h1>
        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.35 }}
          style={{ color:C.silver, fontSize:"clamp(14px,2vw,18px)", marginBottom:40, lineHeight:1.6 }}
        >
          As melhores marcas em capas, películas, carregadores e muito mais.
        </motion.p>
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.55 }}
          style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}
        >
          <a href="#produtos" style={{
            padding:"14px 36px", borderRadius:99, background:"#00A651",
            color:"#fff", fontWeight:800, fontSize:14, textDecoration:"none",
            boxShadow:"0 0 28px rgba(0,166,81,.55)", letterSpacing:"0.04em",
          }}>
            Ver Produtos
          </a>
          <a href="https://wa.me/5511940562933" target="_blank" rel="noopener noreferrer" style={{
            padding:"14px 36px", borderRadius:99,
            background:"transparent", color:C.white, fontWeight:700, fontSize:14,
            textDecoration:"none", border:"1.5px solid rgba(255,255,255,.25)",
            backdropFilter:"blur(8px)",
          }}>
            Falar no WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// PRODUCTS SECTION — carrossel horizontal, 1 fileira
// ─────────────────────────────────────────────────────────
export default function ProductsSection() {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<any|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filter === "Todos" ? products : products.filter(p => p.category === filter);

  const scroll = (dir: "left"|"right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -620 : 620, behavior:"smooth" });
  };

  return (
    <section id="produtos" style={{ background:C.bg, padding:"80px 0" }}>
      <style>{`.hcs-track::-webkit-scrollbar{display:none}`}</style>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 24px" }}>

        {/* Header */}
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{ textAlign:"center", marginBottom:36 }}>
          <h2 style={{
            fontSize:"clamp(26px,4vw,40px)", fontWeight:800, margin:"0 0 8px",
            background:`linear-gradient(90deg, ${C.white} 40%, ${C.green})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>
            Produtos & Acessórios
          </h2>
          <p style={{ color:C.muted, fontSize:13 }}>Os mais buscados do mercado — imagens geradas por IA ✦</p>
        </motion.div>

        {/* Filtros */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:6, marginBottom:28 }}>
          {categories.map(cat => {
            const active = filter === cat;
            return (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding:"6px 16px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer",
                background: active ? C.green : "transparent",
                color: active ? "#fff" : C.silver,
                border:`1.5px solid ${active ? C.green : C.dim}`,
                boxShadow: active ? "0 0 12px rgba(0,166,81,.4)" : "none",
                transition:"all .22s",
              }}>{cat}</button>
            );
          })}
        </div>

        {/* ── Carrossel ── */}
        <div style={{ position:"relative" }}>

          {/* Fade esquerda */}
          <div style={{
            position:"absolute", left:0, top:0, bottom:8, width:40, zIndex:5, pointerEvents:"none",
            background:"linear-gradient(90deg, #1A1A1A, transparent)",
          }}/>
          {/* Fade direita */}
          <div style={{
            position:"absolute", right:0, top:0, bottom:8, width:40, zIndex:5, pointerEvents:"none",
            background:"linear-gradient(270deg, #1A1A1A, transparent)",
          }}/>

          {/* Seta esquerda */}
          <button onClick={() => scroll("left")} style={{
            position:"absolute", left:-18, top:"50%", transform:"translateY(-60%)",
            zIndex:10, width:36, height:36, borderRadius:"50%",
            background:C.card2, border:`1.5px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:C.white, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,0,0,.55)",
            transition:"border-color .2s",
          }}
          onMouseEnter={e=>(e.currentTarget.style.borderColor=C.green)}
          onMouseLeave={e=>(e.currentTarget.style.borderColor=C.border)}>
            <ChevronLeft size={17}/>
          </button>

          {/* Track horizontal */}
          <div
            ref={scrollRef}
            className="hcs-track"
            style={{
              display:"flex", gap:12,
              overflowX:"auto",
              scrollSnapType:"x mandatory",
              msOverflowStyle:"none",
              scrollbarWidth:"none",
              paddingBottom:6,
            }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(product => {
                const badge = product.badge ? badgeConfig[product.badge] : null;
                const BadgeIcon = badge?.icon;
                return (
                  <motion.div
                    key={product.id} layout
                    initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.92}}
                    transition={{duration:.17}}
                    onClick={() => setSelected(product)}
                    whileHover={{ y:-5, boxShadow:`0 12px 32px rgba(0,166,81,.3)` }}
                    style={{
                      flex:"0 0 180px", width:180,
                      scrollSnapAlign:"start",
                      background:C.card, borderRadius:14,
                      overflow:"hidden", border:`1px solid ${C.border}`,
                      cursor:"pointer", position:"relative",
                      transition:"border-color .25s",
                    }}
                  >
                    {badge && BadgeIcon && (
                      <div style={{
                        position:"absolute", top:8, right:8, zIndex:2,
                        display:"flex", alignItems:"center", gap:3,
                        padding:"3px 7px", borderRadius:99, fontSize:9, fontWeight:700,
                        background:badge.bg, border:`1px solid ${badge.border}`, color:badge.text,
                      }}>
                        <BadgeIcon size={8}/>{badge.label}
                      </div>
                    )}

                    {/* Imagem 1:1 compacta */}
                    <div style={{ width:"100%", height:155, overflow:"hidden" }}>
                      <AIProductImage product={product}/>
                    </div>

                    <div style={{ padding:"10px 11px 14px" }}>
                      <p style={{ fontSize:9, color:C.muted, margin:"0 0 3px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                        {product.category}
                      </p>
                      <h3 style={{
                        fontSize:12, fontWeight:700, color:C.white, margin:"0 0 8px",
                        display:"-webkit-box", WebkitLineClamp:2,
                        WebkitBoxOrient:"vertical", overflow:"hidden", lineHeight:1.35,
                      }}>
                        {product.name}
                      </h3>
                      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                        <span style={{ fontSize:14, fontWeight:800, color:C.green }}>{product.price}</span>
                        {product.oldPrice && (
                          <span style={{ fontSize:10, color:C.dim, textDecoration:"line-through" }}>{product.oldPrice}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Seta direita */}
          <button onClick={() => scroll("right")} style={{
            position:"absolute", right:-18, top:"50%", transform:"translateY(-60%)",
            zIndex:10, width:36, height:36, borderRadius:"50%",
            background:C.card2, border:`1.5px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:C.white, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,0,0,.55)",
            transition:"border-color .2s",
          }}
          onMouseEnter={e=>(e.currentTarget.style.borderColor=C.green)}
          onMouseLeave={e=>(e.currentTarget.style.borderColor=C.border)}>
            <ChevronRight size={17}/>
          </button>
        </div>

        {/* Contagem */}
        <p style={{ textAlign:"center", color:C.muted, fontSize:11, marginTop:18 }}>
          {filtered.length} produto{filtered.length !== 1 ? "s" : ""} • use as setas ou arraste para navegar
        </p>

        {/* ── Modal ── */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{
                position:"fixed", inset:0, zIndex:50,
                display:"flex", alignItems:"center", justifyContent:"center", padding:16,
                background:"rgba(0,0,0,.88)", backdropFilter:"blur(12px)",
              }}
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{scale:.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.88,opacity:0}}
                transition={{type:"spring",damping:22,stiffness:300}}
                onClick={e => e.stopPropagation()}
                style={{
                  background:C.card2, borderRadius:20, overflow:"hidden",
                  maxWidth:420, width:"100%",
                  border:`1.5px solid ${C.green}`,
                  boxShadow:`0 0 50px rgba(0,166,81,.35)`,
                  position:"relative",
                }}
              >
                <button onClick={() => setSelected(null)} style={{
                  position:"absolute", zIndex:10, top:12, right:12,
                  background:"rgba(0,0,0,.6)", border:`1px solid ${C.dim}`,
                  borderRadius:"50%", width:32, height:32, color:C.white, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <X size={15}/>
                </button>

                <div style={{ width:"100%", height:220, position:"relative" }}>
                  <AIProductImage product={selected}/>
                  <div style={{
                    position:"absolute", bottom:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg, transparent, ${C.green}, transparent)`,
                  }}/>
                </div>

                <div style={{ padding:"20px 24px 28px" }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:99,
                      background:"rgba(0,166,81,.12)", color:C.green, border:"1px solid rgba(0,166,81,.3)",
                    }}>{selected.category}</span>
                    {selected.badge && (() => {
                      const b = badgeConfig[selected.badge];
                      const Icon = b.icon;
                      return (
                        <span style={{
                          display:"flex", alignItems:"center", gap:4,
                          fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:99,
                          background:b.bg, color:b.text, border:`1px solid ${b.border}`,
                        }}><Icon size={10}/>{b.label}</span>
                      );
                    })()}
                  </div>

                  <h3 style={{ fontSize:20, fontWeight:800, color:C.white, margin:"0 0 10px" }}>
                    {selected.name}
                  </h3>
                  <p style={{ fontSize:13, color:"#888", lineHeight:1.7, margin:"0 0 18px" }}>
                    {selected.desc}
                  </p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:20 }}>
                    <span style={{ fontSize:26, fontWeight:900, color:C.green }}>{selected.price}</span>
                    {selected.oldPrice && (
                      <span style={{ fontSize:14, color:C.dim, textDecoration:"line-through" }}>{selected.oldPrice}</span>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/5511940562933?text=Olá! Tenho interesse: ${selected.name}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center",
                      width:"100%", padding:"14px 0", borderRadius:12,
                      background:C.green, color:"#fff", fontWeight:800, fontSize:14,
                      textDecoration:"none", letterSpacing:"0.04em",
                      boxShadow:`0 0 24px rgba(0,166,81,.55)`,
                    }}
                  >
                    Comprar via WhatsApp
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
