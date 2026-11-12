import { Link } from "react-router-dom";
import QuoteButton from "@/components/quote/QuoteButton";
import { useState } from "react";
import { 
  Facebook, Instagram, Youtube, Send, Globe, 
  Link as LinkIcon, Twitter, Menu, X 
} from "lucide-react";

const socialLinks = [
  { icon: <Facebook size={16} />, url: "https://www.facebook.com/hctechcelulareinfo", color: "hover:text-[#1877F2]" },
  { icon: <Instagram size={16} />, url: "https://www.instagram.com/hctechinfocell/", color: "hover:text-[#E4405F]" },
  { icon: <Twitter size={16} />, url: "https://x.com/HUnlockbr", color: "hover:text-white" },
  { icon: <Send size={16} />, url: "https://t.me/Hunlockbr", color: "hover:text-[#24A1DE]" },
  { icon: <Youtube size={16} />, url: "https://www.youtube.com/channel/UCeF0ILTAnUUBV1TdEteyICA", color: "hover:text-[#FF0000]" },
  { icon: <Globe size={16} />, url: "https://hctechinfocell.blogspot.com/", color: "hover:text-[#ff5722]" },
  { icon: <LinkIcon size={16} />, url: "https://linktr.ee/hctechcell", color: "hover:text-[#43ee62]" },
];

const navLinks = [
  { label: "INÍCIO", href: "/#inicio" },
  { label: "NOSSOS SERVIÇOS", href: "/#servicos" },
  { label: "LOJA", href: "/loja" },
  { label: "QUEM SOMOS", href: "/#sobre-nos" },
  { label: "CONTATO", href: "/#contato" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md border-b border-white/10">
      {/* Barra de redes sociais */}
      <div className="hidden md:flex justify-center gap-3 py-1 border-b border-white/5 bg-black/60">
        {socialLinks.map((social, i) => (
          <a
            key={i}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-gray-600 transition-all duration-300 hover:scale-110 ${social.color}`}
          >
            {social.icon}
          </a>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="text-2xl font-black italic tracking-tighter">
          HC<span className="text-[#00A651]">TECH</span>
        </Link>

        {/* NAV DESKTOP */}
        <nav className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) =>
            // Verifica se o link é para outra página (como /loja) ou para uma âncora na mesma página
            link.href.startsWith("/") && !link.href.includes("#") ? (
              <Link
                key={link.label}
                to={link.href}
                className="text-xs font-black text-gray-300 hover:text-[#00A651] transition-colors uppercase tracking-widest"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-black text-gray-300 hover:text-[#00A651] transition-colors uppercase tracking-widest"
              >
                {link.label}
              </a>
            )
          )}
          <QuoteButton compact />
        </nav>

        {/* MOBILE TOGGLE */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white"
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-white/5 px-6 py-8 space-y-6">
          {navLinks.map((link) =>
            link.href.startsWith("/") && !link.href.includes("#") ? (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-black text-gray-300 hover:text-[#00A651] transition-colors uppercase tracking-widest"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-black text-gray-300 hover:text-[#00A651] transition-colors uppercase tracking-widest"
              >
                {link.label}
              </a>
            )
          )}
          <div onClick={() => setMobileOpen(false)}><QuoteButton compact /></div>
          <div className="flex gap-4 pt-4 border-t border-white/10">
            {socialLinks.map((social, i) => (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-500 transition-all ${social.color}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
