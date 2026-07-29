import { useState } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

const ContactSection = () => {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    modelo: "",
    problema: "",
    mensagem: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Olá! Meu nome é ${form.nome}.%0ATelefone: ${form.telefone}%0AModelo: ${form.modelo}%0AProblema: ${form.problema}%0AMensagem: ${form.mensagem}`;
    window.open(`https://wa.me/5511940562933?text=${msg}`, "_blank");
  };

  const inputClasses =
  "w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all";

  return (
    <section id="contato" className="py-20 md:py-28 text-secondary-foreground bg-sidebar-foreground">
      <div className="container mx-auto px-4 bg-popover-foreground">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10">
          
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-primary">
            Fale <span className="text-primary">Conosco</span>
          </h2>
          <p className="text-muted-foreground text-base">Preencha o formulário e envie direto pelo WhatsApp.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto space-y-4">
          
          <input name="nome" placeholder="Seu nome" value={form.nome} onChange={handleChange} required className={inputClasses} />
          <input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} required className={inputClasses} />
          <input name="modelo" placeholder="Modelo do aparelho" value={form.modelo} onChange={handleChange} required className={inputClasses} />
          <select name="problema" value={form.problema} onChange={handleChange} required className={inputClasses}>
            <option value="">Tipo de problema</option>
            <option value="Tela quebrada">Tela quebrada</option>
            <option value="Bateria">Bateria</option>
            <option value="Não liga">Não liga</option>
            <option value="Conector de carga">Conector de carga</option>
            <option value="Problema de software">Problema de software</option>
            <option value="Reparo em placa">Reparo em placa</option>
            <option value="Outro">Outro</option>
          </select>
          <textarea
            name="mensagem"
            placeholder="Descreva o problema..."
            value={form.mensagem}
            onChange={handleChange}
            rows={4}
            className={inputClasses + " resize-none"} />
          
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold btn-hover glow-green">
            
            <Send size={18} />
            Enviar pelo WhatsApp
          </button>
        </motion.form>
      </div>
    </section>);

};

export default ContactSection;