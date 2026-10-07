import React from 'react';
import { motion } from "framer-motion";
import { 
  MessageCircle, ShoppingBag, Zap, Send, Smartphone, 
  Laptop, Monitor, CheckCircle, ShieldCheck, Clock, Award,
  PhoneCall, Search, Settings, Truck
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { products } from "@/data/store-products";

const Index = () => {
  const topVendas = products.slice(0, 10);

  // Lista de marcas para o carrossel
  const marcas = [
    "APPLE", "SAMSUNG", "XIAOMI", "MOTOROLA", "ASUS", 
    "DELL", "LENOVO", "HP", "ACER", "INTEL", "AMD", "NVIDIA"
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-black overflow-x-hidden text-white">
      
      {/* BACKGROUND FIXO */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-45" 
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* HERO SECTION */}
        <section id="inicio" className="min-h-screen flex items-center justify-center px-6 text-center pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00A651]/10 border border-[#00A651]/20 mb-8 backdrop-blur-sm">
              <Zap size={14} className="text-[#00A651]" />
              <span className="text-[#00A651] font-black uppercase tracking-[0.3em] text-[10px]">ORÇAMENTO GRÁTIS • SÃO BERNARDO DO CAMPO</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.95] text-white">
              ASSISTÊNCIA TÉCNICA<br/>
              <span className="text-[#00A651] drop-shadow-[0_0_15px_rgba(0,166,81,0.5)]">ESPECIALIZADA</span><br/>
              <span className="text-white/90">CELULARES & NOTEBOOKS</span>
            </h1>

            <div className="flex flex-col gap-6 mt-14 items-center">
              <p className="text-[#00A651] font-black text-[10px] uppercase tracking-[0.4em] mb-[-10px]">
                SOLICITE SEU ORÇAMENTO PELA SUA REDE PREFERIDA
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-3xl px-4">
                <a 
                  href="https://wa.me/5511977934634" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-[#25D366] text-white font-black uppercase italic rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)]"
                >
                  <MessageCircle size={24} /> 
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] opacity-80 mb-1 font-bold">Atendimento via</span>
                    <span className="text-sm tracking-tighter font-black">WhatsApp</span>
                  </div>
                </a>

                <a 
                  href="https://t.me/hctechinfocell_bot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-[#24A1DE] text-white font-black uppercase italic rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(36,161,222,0.3)]"
                >
                  <Send size={24} /> 
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] opacity-80 mb-1 font-bold">Atendimento via</span>
                    <span className="text-sm tracking-tighter font-black">Telegram</span>
                  </div>
                </a>
              </div>

              <Link 
                to="/loja" 
                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-12 py-4 rounded-2xl font-black uppercase text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm mt-4 tracking-[0.2em]"
              >
                <ShoppingBag size={18} /> ACESSAR NOSSA LOJA
              </Link>
            </div>
          </motion.div>
        </section>

        {/* PROCESSO */}
        <section id="processo-como-funciona" className="py-24 px-8 bg-zinc-900/40 backdrop-blur-sm border-y border-white/5">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-16">
              PROCESSO - <span className="text-[#00A651]">COMO FUNCIONA</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <PhoneCall size={40} />, title: "Contato", text: "Agende seu serviço pelo WhatsApp ou Telegram." },
                { icon: <Search size={40} />, title: "Diagnóstico", text: "Análise técnica detalhada do seu equipamento." },
                { icon: <Settings size={40} />, title: "Reparo", text: "Manutenção com peças de alta qualidade." },
                { icon: <Truck size={40} />, title: "Entrega", text: "Seu aparelho pronto com garantia total." }
              ].map((step, i) => (
                <div key={i} className="p-8 bg-black/40 border border-white/5 rounded-3xl">
                  <div className="text-[#00A651] mb-6 flex justify-center">{step.icon}</div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-4">{step.title}</h3>
                  <p className="text-gray-400 text-sm font-medium uppercase">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NOSSOS SERVIÇOS */}
        <section id="servicos" className="py-32 px-8 bg-black/20">
          <div className="max-w-7xl mx-auto text-center">
            <span className="text-[#00A651] font-black text-xs uppercase tracking-[0.4em]">Expertise Técnica</span>
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter mt-4 mb-20">
              NOSSOS <span className="text-[#00A651]">SERVIÇOS</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Laptop size={32} />,
                  title: "Notebooks & Laptops",
                  items: [
                    { name: "Reparo de Placa-Mãe e BIOS", desc: "Especialistas em micro-soldagem e gravação de BIOS" },
                    { name: "Manutenção Preventiva", desc: "Limpeza interna e troca de pasta térmica" },
                    { name: "Upgrades de Hardware", desc: "Instalação de SSD (HD), Memória RAM e dobradiças" },
                    { name: "Substituição de Componentes", desc: "Telas, Teclados e Baterias de alta performance" },
                  ],
                },
                {
                  icon: <Monitor size={32} />,
                  title: "PC Desktop & Gaming",
                  items: [
                    { name: "Montagem de PCs Customizados", desc: "Máquinas montadas sob medida para trabalho ou games" },
                    { name: "Upgrade de Performance", desc: "Melhore o desempenho do seu setup atual" },
                    { name: "Cable Management", desc: "Organização profissional de cabos e fluxo de ar" },
                    { name: "Diagnóstico Avançado", desc: "Testes completos de hardware e atualização de Drivers/BIOS" },
                  ],
                },
                {
                  icon: <Smartphone size={32} />,
                  title: "Smartphones Android",
                  items: [
                    { name: "Troca de Tela Rápida", desc: "Telas Originais e Premium com garantia" },
                    { name: "Reparo Especializado", desc: "Conector de carga, baterias e micro-soldagem de placa" },
                    { name: "Soluções de Software", desc: "Remoção de vírus, aparelhos que não ligam e recuperação de sistema" },
                  ],
                },
                {
                  icon: <Zap size={32} />,
                  title: "Apple iPhone",
                  items: [
                    { name: "Telas Premium OLED", desc: "Qualidade de imagem e toque original" },
                    { name: "Especialista em Bateria", desc: "Substituição com Saúde em 100%" },
                    { name: "Reparo Avançado", desc: "Face ID, Reballing BGA e micro-soldagem em placas" },
                    { name: "Estética e Conservação", desc: "Troca de vidro traseiro/frontal e limpeza interna profunda" },
                  ],
                },
              ].map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 text-left hover:border-[#00A651]/40 transition-all duration-500 group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-[#00A651]/15 rounded-2xl flex items-center justify-center text-[#00A651] group-hover:bg-[#00A651] group-hover:text-white transition-all duration-500">
                      {cat.icon}
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic leading-tight">{cat.title}</h3>
                  </div>
                  <div className="space-y-4 flex-1">
                    {cat.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                        <CheckCircle size={16} className="text-[#00A651] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-bold text-sm block">{item.name}</span>
                          <span className="text-gray-500 text-xs">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href={`https://wa.me/5511977934634?text=Olá! Gostaria de um orçamento para o serviço de ${cat.title}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 w-full py-3.5 rounded-xl bg-[#00A651]/10 border border-[#00A651]/20 text-[#00A651] font-black text-xs uppercase tracking-widest text-center hover:bg-[#00A651] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> SOLICITAR ORÇAMENTO
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO DE MARCAS - NOVA */}
        <section className="py-20 bg-[#050505]/40 border-y border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 mb-10 text-center">
            <span className="text-[#00A651] font-black text-[10px] uppercase tracking-[0.5em]">Hardware & Software</span>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mt-2">MARCAS QUE <span className="text-[#00A651]">ATENDEMOS</span></h3>
          </div>
          
          <div className="relative flex overflow-x-hidden">
            <motion.div 
              className="flex gap-20 whitespace-nowrap items-center"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 30, repeat: Infinity }}
            >
              {[...marcas, ...marcas].map((marca, i) => (
                <span key={i} className="text-gray-600 hover:text-[#00A651] transition-colors font-black text-3xl md:text-5xl italic tracking-tighter uppercase opacity-30 hover:opacity-100 cursor-default">
                  {marca}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SOBRE NÓS */}
        <section id="sobre-nos" className="py-32 px-8 bg-zinc-900/20 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-10">
              SOBRE <span className="text-[#00A651]">NÓS</span>
            </h2>
            <p className="text-gray-300 font-medium leading-relaxed uppercase tracking-wide mb-8">
              A HC Tech Infocell é uma empresa dedicada a fornecer soluções de alta qualidade para diversas necessidades de tecnologia. Localizada em São Bernardo do Campo, oferecemos reparos especializados por profissionais com formação em TI, serviço de leva e traz e garantia total em todos os procedimentos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
              <div className="flex flex-col items-center gap-3">
                <ShieldCheck className="text-[#00A651]" size={32} />
                <span className="text-sm font-black uppercase tracking-widest">Garantia no Serviço</span>
                <span className="text-gray-500 text-[10px] uppercase tracking-wide">Peças e mão de obra</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Clock className="text-[#00A651]" size={32} />
                <span className="text-sm font-black uppercase tracking-widest">Orçamento Grátis</span>
                <span className="text-gray-500 text-[10px] uppercase tracking-wide">Diagnóstico sem compromisso</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Award className="text-[#00A651]" size={32} />
                <span className="text-sm font-black uppercase tracking-widest">Alta Precisão</span>
                <span className="text-gray-500 text-[10px] uppercase tracking-wide">Micro-soldagem e reballing</span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTATO */}
        <section id="contato" className="py-32 px-8 border-t border-white/5 text-center">
          <div className="max-w-4xl mx-auto bg-zinc-900/40 p-12 rounded-3xl border border-[#00A651]/20">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8">PRONTO PARA REPARAR?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/5511977934634" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] px-10 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">WhatsApp</a>
              <a href="https://t.me/hctechinfocell_bot" target="_blank" rel="noopener noreferrer" className="bg-[#24A1DE] px-10 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">Telegram</a>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
