import { motion } from "framer-motion";
import { 
  Instagram, Facebook, Send, Youtube, 
  Globe, Link as LinkIcon, Twitter 
} from "lucide-react";

const socialLinks = [
  { icon: <Facebook size={35} />, url: "https://www.facebook.com/hctechcelulareinfo", color: "hover:text-[#1877F2]" },
  { icon: <Instagram size={35} />, url: "https://www.instagram.com/hctechinfocell/", color: "hover:text-[#E4405F]" },
  { icon: <Twitter size={35} />, url: "https://x.com/HUnlockbr", color: "hover:text-white" },
  { icon: <Send size={35} />, url: "https://t.me/Hunlockbr", color: "hover:text-[#24A1DE]" },
  { icon: <Youtube size={35} />, url: "https://www.youtube.com/channel/UCeF0ILTAnUUBV1TdEteyICA", color: "hover:text-[#FF0000]" },
  { icon: <Globe size={35} />, url: "https://hctechinfocell.blogspot.com/", color: "hover:text-[#ff5722]" },
  { icon: <LinkIcon size={35} />, url: "https://linktr.ee/hctechcell", color: "hover:text-[#43ee62]" },
];

export default function HeroSection() {
  return (
    <section className="relative bg-black pt-32 pb-10 overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        
        {/* ÍCONES SOCIAIS MODERNOS */}
        <div className="flex flex-wrap justify-center gap-10 mb-16">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-zinc-600 transition-all duration-300 hover:scale-125 ${social.color}`}
            >
              {social.icon}
            </a>
          ))}
        </div>

        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-6xl md:text-8xl font-black italic text-white mb-6"
        >
          DESTAQUES <span className="text-green-500">HC TECH</span>
        </motion.h1>

        {/* VITRINE TECH LENTA */}
        <div className="mt-20 border-y border-zinc-900 py-10">
          <motion.div 
            animate={{ x: ["0%", "-100%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 60 }}
            className="flex gap-20 whitespace-nowrap"
          >
            {["APPLE", "SAMSUNG", "XIAOMI", "REPARO", "SOFTWARE"].map((item, i) => (
              <span key={i} className="text-5xl font-black italic text-zinc-800">{item}</span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
