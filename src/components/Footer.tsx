import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Send, 
  Link2, 
  Globe, 
  MapPin, 
  MessageCircle,
  Twitter
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Facebook size={24} />, url: "https://www.facebook.com/hctechcelulareinfo", label: "Facebook" },
    { icon: <Instagram size={24} />, url: "https://www.instagram.com/hctechinfocell/", label: "Instagram" },
    { icon: <Send size={24} />, url: "https://t.me/Hunlockbr", label: "Telegram" },
    { icon: <Youtube size={24} />, url: "https://www.youtube.com/channel/UCeF0ILTAnUUBV1TdEteyICA", label: "Youtube" },
    { icon: <Globe size={24} />, url: "https://hctechinfocell.blogspot.com/", label: "Blogger" },
    { icon: <Link2 size={24} />, url: "https://linktr.ee/hctechcell", label: "Linktree" },
    { icon: <Twitter size={24} />, url: "https://x.com/HUnlockbr", label: "X (Twitter)" },
  ];

  return (
    <footer id="contato" className="bg-black border-t border-white/10 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
        
        {/* COLUNA 1: LOGO E BIO */}
        <div className="space-y-6">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/logo.png" alt="HC Tech Logo" className="h-12 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <span className="text-3xl font-black italic uppercase tracking-tighter hidden">
              HC<span className="text-[#00A651]">TECH</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
            Assistência técnica especializada em São Bernardo do Campo. Excelência em hardware e software.
          </p>
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <MapPin size={16} className="text-[#00A651]" />
            São Bernardo do Campo - SP
          </div>
        </div>

        {/* COLUNA 2: REDES SOCIAIS (Ícones Maiores) */}
        <div>
          <h4 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8">Siga nossas redes</h4>
          <div className="flex flex-wrap gap-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-[#00A651] hover:shadow-[0_0_20px_rgba(0,166,81,0.3)] transition-all duration-300"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* COLUNA 3: CONTATO DIRETO */}
        <div className="space-y-6">
          <h4 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8">Atendimento</h4>
          <a 
            href="https://wa.me/5511977934634" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-4 bg-[#00A651]/10 border border-[#00A651]/20 rounded-2xl hover:bg-[#00A651] transition-all duration-500"
          >
            <div className="bg-[#00A651] p-3 rounded-xl text-white group-hover:bg-black transition-colors">
              <MessageCircle size={24} />
            </div>
            <div>
              <span className="block text-[10px] font-black text-[#00A651] group-hover:text-white uppercase tracking-widest">WhatsApp Business</span>
              <span className="text-white font-black text-lg">(11) 97793-4634</span>
            </div>
          </a>
        </div>
      </div>

      {/* RODAPÉ FINAL */}
      <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em]">
          © {currentYear} HC TECH SOLUTIONS. Todos os direitos reservados.
        </p>
        <div className="flex gap-8">
          <Link to="/" className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Privacidade</Link>
          <Link to="/" className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Termos</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
