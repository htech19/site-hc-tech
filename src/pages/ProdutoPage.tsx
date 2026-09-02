import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MessageCircle, ShoppingCart, ShieldCheck, Truck } from "lucide-react";
import Header from "@/components/Header";
import { useSeo } from "@/hooks/useSeo";
import { useCart } from "@/contexts/CartContext";
import { products } from "@/data/store-products";
import { findProductBySlug, getProductPath, getProductSlug } from "@/data/product-slugs";
import { getCategorySlug } from "@/data/store-categories";

export default function ProdutoPage() {
  const { slug } = useParams();
  const product = findProductBySlug(slug);
  const { addToCart } = useCart();

  const related = useMemo(
    () =>
      product
        ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6)
        : [],
    [product]
  );

  useSeo({
    title: product ? `${product.name} — ${product.price} | HC Tech Store` : "Produto | HC Tech Store",
    description: product
      ? `${product.name} (${product.category}) por ${product.price} na HC Tech Store. Compre pelo WhatsApp com entrega para todo o Brasil.`
      : "Produto da HC Tech Store.",
    path: product ? getProductPath(product) : "/loja",
  });

  if (!product) return <Navigate to="/loja" replace />;

  const categorySlug = getCategorySlug(product.category);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-5">
          <Link to="/loja" className="hover:text-[#00A651] transition-colors flex items-center gap-1">
            <ChevronLeft size={12} /> Loja
          </Link>
          <span>/</span>
          <Link to={`/loja/${categorySlug}`} className="hover:text-[#00A651] transition-colors">
            {product.category}
          </Link>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-6 md:gap-10"
        >
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-white/10">
            <img
              src={product.image}
              alt={`${product.name} — ${product.category} | HC Tech`}
              loading="lazy"
              decoding="async"
              width={1000}
              height={1000}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[#00A651] text-[10px] font-black uppercase tracking-widest">
              {product.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-white mt-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-[#00A651] text-3xl md:text-4xl font-black tracking-tight mt-4">
              {product.price}
            </p>

            <div className="flex flex-wrap gap-3 mt-5 text-[11px] font-bold text-gray-300">
              <span className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-full px-3 py-1.5">
                <ShieldCheck size={13} className="text-[#00A651]" /> Produto garantido
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-full px-3 py-1.5">
                <Truck size={13} className="text-[#00A651]" /> Entrega para todo Brasil
              </span>
            </div>

            <p className="text-gray-400 text-sm mt-5 leading-relaxed">
              {product.name} disponível na HC Tech Store, categoria {product.category}. Atendimento
              rápido pelo WhatsApp, pagamento via PIX e retirada em São Bernardo do Campo.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href={product.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#00A651] hover:bg-[#008c44] text-black font-black py-3.5 rounded-xl uppercase text-sm tracking-widest transition-colors"
              >
                <MessageCircle size={18} /> Comprar via WhatsApp
              </a>
              <button
                onClick={() => addToCart(product)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#00A651]/10 hover:bg-[#00A651] text-[#00A651] hover:text-black border border-[#00A651]/30 font-black py-3.5 rounded-xl uppercase text-sm tracking-widest transition-all"
              >
                <ShoppingCart size={18} /> Adicionar ao carrinho
              </button>
            </div>
          </div>
        </motion.div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-white mb-4">
              Produtos relacionados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/produto/${getProductSlug(item)}`}
                  className="group flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-white/5 hover:border-[#00A651]/40 transition-all"
                >
                  <div className="aspect-square bg-zinc-800/50 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[11px] font-bold text-white line-clamp-2 leading-snug min-h-[2rem]">
                      {item.name}
                    </h3>
                    <p className="text-[#00A651] text-sm font-black mt-1">{item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
