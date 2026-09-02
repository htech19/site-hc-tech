import { useState, useMemo } from "react";
import { Search, MessageCircle, Heart, Eye, ShoppingCart, Flame, Tag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { useSeo } from "@/hooks/useSeo";
import { categoryList, findCategoryBySlug } from "@/data/store-categories";
import { getProductSlug } from "@/data/product-slugs";
import { products, type Product } from "../data/store-products";
import lojaHero from "@/assets/loja-hero.jpg";

// Regra simples de "popularidade": 3 primeiros = mais vendidos
const TOP_SELLERS = new Set(products.slice(0, 3).map((p) => p.id));
// Promoção: 6 produtos mais baratos
const parsePrice = (p: string) => Number(p.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
const PROMOS = new Set(
  [...products].sort((a, b) => parsePrice(a.price) - parsePrice(b.price)).slice(0, 6).map((p) => p.id)
);

const FEATURED_CATEGORIES = ["Eletrônicos", "Smartwatches", "Fones & Headsets", "Caixas de Som", "Power Banks"];

export default function LojaPage() {
  const { slug } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [quickView, setQuickView] = useState<Product | null>(null);

  const activeCategory = slug ? findCategoryBySlug(slug) : categoryList[0];
  const selectedCategory = activeCategory?.name ?? "Todos";

  useSeo({
    title: activeCategory?.title ?? "HC Tech Store",
    description: activeCategory?.description ?? "Acessórios e gadgets na HC Tech Store.",
    path: slug ? `/loja/${slug}` : "/loja",
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const featured = useMemo(() => {
    const base =
      selectedCategory === "Todos"
        ? products.filter((p) => FEATURED_CATEGORIES.includes(p.category))
        : products.filter((p) => p.category === selectedCategory);
    return base.slice(0, 12);
  }, [selectedCategory]);

  const toggleFav = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (slug && !activeCategory) return <Navigate to="/loja" replace />;


  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* CAPA / HERO DA LOJA */}
      <section className="relative pt-20 overflow-hidden">
        <div className="relative h-[280px] md:h-[360px]">
          <img
            src={lojaHero}
            alt="HC Tech Store"
            className="absolute inset-0 w-full h-full object-cover"
            width={1920}
            height={640}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/60" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A651]/15 border border-[#00A651]/30 backdrop-blur-sm mb-4"
            >
              <ShoppingCart size={12} className="text-[#00A651]" />
              <span className="text-[#00A651] font-black text-[10px] uppercase tracking-[0.3em]">
                Loja Oficial · Entrega para todo Brasil
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
            >
              HC TECH <span className="text-[#00A651] drop-shadow-[0_0_20px_rgba(0,166,81,0.6)]">STORE</span>
              {selectedCategory !== "Todos" && (
                <span className="block text-lg md:text-2xl mt-2 not-italic tracking-normal text-gray-200">
                  {selectedCategory}
                </span>
              )}
            </motion.h1>
            <p className="text-gray-300 text-sm md:text-base mt-3 max-w-xl font-medium">
              {activeCategory?.description ?? "Acessórios, fones, carregadores e gadgets selecionados."}
            </p>

          </div>
        </div>
      </section>

      <main className="pb-16 px-4 max-w-7xl mx-auto -mt-8 relative z-20">
        {/* BUSCA + FILTROS (card flutuante sobre a capa) */}
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
          <div className="relative max-w-2xl mx-auto w-full mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar produto, marca ou modelo..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-[#00A651] transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <nav className="flex flex-wrap justify-center gap-2" aria-label="Categorias da loja">
            {categoryList.map((category) => (
              <Link
                key={category.slug}
                to={category.slug === "todos" ? "/loja" : `/loja/${category.slug}`}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === category.name
                    ? "bg-[#00A651] text-black shadow-[0_0_15px_rgba(0,166,81,0.4)]"
                    : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* MAIS VENDIDOS / DESTAQUES */}
        <FeaturedCarousel products={featured} />


        {/* CONTADOR */}
        <div className="flex items-center justify-between mt-8 mb-5 px-1">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}
          </p>
          {favorites.size > 0 && (
            <span className="text-[10px] text-[#00A651] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Heart size={12} fill="currentColor" /> {favorites.size} favorito{favorites.size > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* GRID DE PRODUTOS - mais denso */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const isTop = TOP_SELLERS.has(product.id);
              const isPromo = PROMOS.has(product.id);
              const isFav = favorites.has(product.id);

              return (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="group relative flex flex-col h-full bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-white/5 hover:border-[#00A651]/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,166,81,0.15)] hover:-translate-y-1"
                >
                  {/* SELOS */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                    {isTop && (
                      <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-lg">
                        <Flame size={9} /> Mais Vendido
                      </span>
                    )}
                    {isPromo && (
                      <span className="flex items-center gap-1 bg-[#00A651] text-black text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-lg">
                        <Tag size={9} /> Promoção
                      </span>
                    )}
                  </div>

                  {/* BOTÃO FAVORITO */}
                  <button
                    onClick={() => toggleFav(product.id)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Favoritar"
                  >
                    <Heart
                      size={14}
                      className={isFav ? "text-[#00A651]" : "text-white"}
                      fill={isFav ? "currentColor" : "none"}
                    />
                  </button>

                  {/* IMAGEM + AÇÕES SOBREPOSTAS */}
                  <div className="relative aspect-square bg-zinc-800/50 overflow-hidden">
                    <Link to={`/produto/${getProductSlug(product)}`} className="block w-full h-full">
                      <img
                        src={product.image}
                        alt={`${product.name} — ${product.category} | HC Tech`}
                        loading="lazy"
                        decoding="async"
                        width={800}
                        height={800}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </Link>
                    {/* Overlay de ações no hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setQuickView(product)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-[#00A651] hover:border-[#00A651] transition-all"
                        aria-label="Visualizar"
                      >
                        <Eye size={16} className="text-white" />
                      </button>
                      <a
                        href={product.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-[#00A651] flex items-center justify-center hover:scale-110 transition-transform"
                        aria-label="Comprar"
                      >
                        <ShoppingCart size={16} className="text-black" />
                      </a>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="p-3 flex flex-col flex-1">
                    <span className="text-[#00A651] text-[8px] font-black uppercase tracking-wider line-clamp-1">
                      {product.category}
                    </span>
                    <h3 className="text-xs md:text-sm font-bold text-white mt-1 mb-2 line-clamp-2 min-h-[2.5rem] leading-snug">
                      <Link to={`/produto/${getProductSlug(product)}`} className="hover:text-[#00A651] transition-colors">
                        {product.name}
                      </Link>
                    </h3>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-[#00A651] text-base font-black tracking-tight">{product.price}</p>
                    </div>

                    <a
                      href={product.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto pt-3 flex items-center justify-center gap-1.5 w-full bg-[#00A651]/10 hover:bg-[#00A651] text-[#00A651] hover:text-black font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl transition-all border border-[#00A651]/30 hover:border-[#00A651]"
                    >
                      <MessageCircle size={12} /> Comprar
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 mt-6">
            <Search className="mx-auto text-gray-600 mb-3" size={32} />
            <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
            <p className="text-gray-600 text-xs mt-1">Tente outra busca ou categoria.</p>
          </div>
        )}
      </main>

      {/* MODAL QUICK VIEW */}
      <AnimatePresence>
        {quickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickView(null)}
            className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-[#00A651]/30 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-square bg-zinc-900">
                <img src={quickView.image} alt={quickView.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => setQuickView(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur flex items-center justify-center hover:bg-black"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <span className="text-[#00A651] text-[10px] font-black uppercase tracking-widest">
                  {quickView.category}
                </span>
                <h3 className="text-lg font-black text-white mt-1 mb-3">{quickView.name}</h3>
                <p className="text-[#00A651] text-3xl font-black tracking-tight mb-5">{quickView.price}</p>
                <a
                  href={quickView.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#00A651] hover:bg-[#008c44] text-black font-black py-3.5 rounded-xl transition-colors uppercase text-sm tracking-widest"
                >
                  <MessageCircle size={18} /> Comprar via WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
