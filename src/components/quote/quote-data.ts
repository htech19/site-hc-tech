export const CATEGORIAS = ["Celular", "iPhone", "Tablet", "Notebook", "Computador"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ATENDIMENTOS = ["Entrega no balcão", "Retirada (leva e traz)", "Envio pelo correio", "Agendamento"];
export const CONTATOS = ["WhatsApp", "Ligação", "E-mail"];
export const PERIODOS = ["Manhã", "Tarde", "Noite", "Qualquer horário"];
export const ESTADOS = ["Funcionando parcialmente", "Não liga", "Tela quebrada", "Molhado / oxidado", "Com marcas de uso", "Outro"];
export const HISTORICO = ["Queda", "Contato com líquido", "Reparo anterior"];

export const hasImei = (c: string) => c === "Celular" || c === "iPhone" || c === "Tablet";

export const MARCAS: Record<Categoria, string[]> = {
  Celular: ["Samsung", "Motorola", "Xiaomi", "Redmi", "POCO", "Realme", "LG"],
  iPhone: ["Apple"],
  Tablet: ["Samsung", "Apple", "Lenovo", "Multilaser", "Xiaomi"],
  Notebook: ["Dell", "Lenovo", "HP", "Acer", "Asus", "Samsung", "Apple", "Positivo"],
  Computador: ["Dell", "Lenovo", "HP", "Acer", "Asus", "Positivo", "Montado (genérico)"],
};

export const SERVICOS: Record<Categoria, string[]> = {
  Celular: ["Troca de tela", "Troca de bateria", "Conector de carga", "Reparo em placa", "Software / sistema", "Diagnóstico e orçamento"],
  iPhone: ["Troca de tela", "Troca de bateria", "Conector de carga", "Face ID / câmera", "Reparo em placa", "Software / sistema", "Diagnóstico e orçamento"],
  Tablet: ["Troca de tela", "Troca de bateria", "Conector de carga", "Software / sistema", "Diagnóstico e orçamento"],
  Notebook: ["Troca de tela", "Troca de teclado", "Troca de bateria", "Upgrade SSD / memória", "Limpeza e pasta térmica", "Reparo em placa-mãe / BIOS", "Software / sistema", "Diagnóstico e orçamento"],
  Computador: ["Montagem de PC", "Upgrade SSD / memória", "Limpeza e pasta térmica", "Fonte / placa de vídeo", "Software / sistema", "Diagnóstico e orçamento"],
};

// Hipóteses para triagem — nunca um diagnóstico confirmado.
export const SINTOMAS: Record<Categoria, string[]> = {
  Celular: ["Tela quebrada ou sem imagem", "Não liga", "Não carrega", "Bateria dura pouco", "Caiu na água"],
  iPhone: ["Tela quebrada ou sem imagem", "Não liga / maçã travada", "Não carrega", "Bateria dura pouco", "Caiu na água"],
  Tablet: ["Tela quebrada ou sem imagem", "Não liga", "Não carrega", "Bateria dura pouco", "Touch não responde"],
  Notebook: ["Não liga", "Sem imagem na tela", "Superaquecimento / lentidão", "Não carrega a bateria", "Teclado com falhas"],
  Computador: ["Não liga", "Sem vídeo", "Lento ou travando", "Superaquecimento / barulho", "Reinicia sozinho"],
};

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
