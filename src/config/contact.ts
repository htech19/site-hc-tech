// Número comercial oficial do WhatsApp (formato internacional, sem símbolos).
export const WHATSAPP_NUMBER = "5511977934634";

export const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const QUOTE_EVENT = "hc:open-quote";
export const openQuote = () => window.dispatchEvent(new Event(QUOTE_EVENT));
