import { ShoppingCart, Trash2, Minus, Plus, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, isOpen, setIsOpen } = useCart();

  const parsePrice = (p: string) =>
    Number(String(p).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const whatsappCheckout = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let total = 0;

    const lines = items.map((i, idx) => {
      const unit = parsePrice(i.product.price);
      const subtotal = unit * i.quantity;
      total += subtotal;
      const link = `${origin}/loja/${getCategorySlug(i.product.category)}`;
      return [
        `${idx + 1}. ${i.product.name}`,
        `   • Quantidade: ${i.quantity}`,
        `   • Valor unitário: ${formatBRL(unit)}`,
        `   • Valor total: ${formatBRL(subtotal)}`,
        `   • Link: ${link}`,
      ].join("\n");
    });

    const text = [
      "Olá! Gostaria de finalizar minha compra na HC Tech Store.",
      "",
      "*Itens do pedido:*",
      lines.join("\n\n"),
      "",
      `*Total de itens:* ${totalItems}`,
      `*Valor total do pedido:* ${formatBRL(total)}`,
      "",
      "Podem confirmar disponibilidade, forma de pagamento (PIX) e entrega?",
    ].join("\n");

    window.open(`https://wa.me/5511940562933?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border/50 flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart size={20} className="text-primary" />
            Carrinho ({totalItems})
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            Seus produtos selecionados
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart size={48} className="text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsOpen(false)}>
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border/20"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.product.category}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded hover:bg-accent/20 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded hover:bg-accent/20 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border/30 pt-4 space-y-3">
              <Button className="w-full" size="lg" onClick={whatsappCheckout}>
                <MessageCircle size={18} />
                Consultar pelo WhatsApp
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearCart}>
                Limpar carrinho
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
