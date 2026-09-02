import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame, MessageCircle } from "lucide-react";
import type { Product } from "@/data/store-products";
import { getProductSlug } from "@/data/product-slugs";

interface Props {
  products: Product[];
  title?: string;
}

export default function FeaturedCarousel({ products, title = "Mais Vendidos / Destaques" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  // Autoplay com loop contínuo e pausa ao passar o mouse / interagir
  useEffect(() => {
    if (paused || products.length === 0) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
      }
    }, 3500);
    return () => window.clearInterval(id);
  }, [paused, products.length]);

  if (products.length === 0) return null;

  return (
    <section
      className="mt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="flex items-center gap-2 text-sm md:text-base font-black uppercase tracking-widest text-white">
          <Flame size={16} className="text-[#00A651]" /> {title}
        </h2>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scrollBy(-1)}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-gray-300 hover:text-black hover:bg-[#00A651] transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-gray-300 hover:text-black hover:bg-[#00A651] transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <article
            key={product.id}
            className="snap-start shrink-0 w-[46%] sm:w-[30%] lg:w-[23%] xl:w-[18%] flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-white/5 hover:border-[#00A651]/40 transition-all duration-300"
          >
            <div className="relative aspect-square bg-zinc-800/50 overflow-hidden">
              <Link to={`/produto/${getProductSlug(product)}`} className="block w-full h-full">
                <img
                  src={product.image}
                  alt={`${product.name} — ${product.category} | HC Tech`}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={800}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <span className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-lg">
                <Flame size={9} /> Destaque
              </span>
            </div>
            <div className="p-3 flex flex-col flex-1">
              <span className="text-[#00A651] text-[8px] font-black uppercase tracking-wider line-clamp-1">
                {product.category}
              </span>
              <h3 className="text-xs md:text-sm font-bold text-white mt-1 mb-2 line-clamp-2 min-h-[2.5rem] leading-snug">
                <Link to={`/produto/${getProductSlug(product)}`} className="hover:text-[#00A651] transition-colors">
                  {product.name}
                </Link>
              </h3>
              <p className="text-[#00A651] text-base font-black tracking-tight">{product.price}</p>
              <a
                href={product.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto pt-3 flex items-center justify-center gap-1.5 w-full bg-[#00A651]/10 hover:bg-[#00A651] text-[#00A651] hover:text-black font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl transition-all border border-[#00A651]/30 hover:border-[#00A651]"
              >
                <MessageCircle size={12} /> Comprar
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
