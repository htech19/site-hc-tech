import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import {
  BASE_PRECOS,
  buscarPreco,
  detectarModelo,
  detectarServico,
  formatarRespostaVenda,
  rotuloServico,
  type ServicoKey,
} from "./precos.ts";

// ──────────────────────────────────────────────────────────────
// MAIA — Atendente comercial HC Tech
// Fluxo: contexto (histórico) → detectar modelo+serviço → BUSCAR base
// → responder venda. Fallback nunca trava nem reinicia.
// ──────────────────────────────────────────────────────────────

const WA = "https://wa.me/5511977934634";

type ChatMsg = { role: "user" | "assistant"; content: string };

// Saudações que NÃO devem disparar resposta de boas-vindas se já há contexto
const SAUDACOES = ["oi", "olá", "ola", "opa", "bom dia", "boa tarde", "boa noite", "hey", "hello", "eai", "e ai"];
const AGRADECIMENTOS = ["obrigado", "obrigada", "valeu", "vlw", "agradecido", "thanks"];

function ehSaudacao(t: string) {
  const x = t.toLowerCase().trim();
  return SAUDACOES.some((s) => x === s || x.startsWith(s + " ") || x.startsWith(s + "!"));
}
function ehAgradecimento(t: string) {
  const x = t.toLowerCase();
  return AGRADECIMENTOS.some((s) => x.includes(s));
}

// Procura no histórico o último modelo/serviço já mencionado pelo cliente
function extrairContexto(history: ChatMsg[]): {
  modeloEntry: ReturnType<typeof detectarModelo>;
  servico: ServicoKey | null;
} {
  let modeloEntry: ReturnType<typeof detectarModelo> = null;
  let servico: ServicoKey | null = null;
  // Varre do mais recente pro mais antigo, considera mensagens do user
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.role !== "user") continue;
    if (!modeloEntry) modeloEntry = detectarModelo(m.content);
    if (!servico) servico = detectarServico(m.content);
    if (modeloEntry && servico) break;
  }
  return { modeloEntry, servico };
}

function listaModelosSugeridos(limite = 6): string {
  return BASE_PRECOS.slice(0, limite)
    .map((m) => "• " + m.apelidos[0])
    .join("\n");
}

// ──────────── Handler ────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { message, history } = await req.json();
    if (!message || typeof message !== "string") {
      return json({ error: "Mensagem inválida" }, 400);
    }

    const trimmed = message.slice(0, 400).trim();
    const hist: ChatMsg[] = Array.isArray(history)
      ? history.filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      : [];

    const temContextoAnterior = hist.some((m) => m.role === "user");

    // 1) Detectar na MENSAGEM atual
    const modeloAtual = detectarModelo(trimmed);
    const servicoAtual = detectarServico(trimmed);

    // 2) Recuperar contexto do histórico
    const ctx = extrairContexto(hist);

    // 3) Mesclar: prioridade pra mensagem atual, fallback pro histórico
    const modeloEntry = modeloAtual ?? ctx.modeloEntry;
    const servico = servicoAtual ?? ctx.servico;

    // ─── Caso A: temos modelo + serviço → buscar base e responder venda
    if (modeloEntry && servico) {
      const item = buscarPreco(modeloEntry.entry, servico);
      if (item) {
        return json({
          reply: formatarRespostaVenda(modeloEntry.canonico, servico, item),
          source: "base",
        });
      }
      // Modelo existe mas serviço não cadastrado pra ele
      return json({
        reply:
          `Para ${modeloEntry.canonico}, ${rotuloServico(servico)} ainda não está na base. ` +
          `Conseguimos verificar pra você rapidamente. Quer que eu te conecte com um técnico no WhatsApp?\n${WA}`,
        source: "fallback:servico-ausente",
      });
    }

    // ─── Caso B: só serviço (falta modelo)
    if (servico && !modeloEntry) {
      return json({
        reply:
          `Perfeito, ${rotuloServico(servico).toLowerCase()}. Para te passar valor e prazo exatos, ` +
          `me diz a marca e o modelo do aparelho (ex: iPhone 12, Samsung A51, Redmi Note 11).`,
        source: "ask:modelo",
      });
    }

    // ─── Caso C: só modelo (falta serviço)
    if (modeloEntry && !servico) {
      const servicosDisponiveis = Object.keys(modeloEntry.entry.servicos)
        .map((s) => "• " + rotuloServico(s as ServicoKey))
        .join("\n");
      return json({
        reply:
          `Beleza, ${modeloEntry.canonico}! Qual o problema?\n${servicosDisponiveis}`,
        source: "ask:servico",
      });
    }

    // ─── Caso D: agradecimento
    if (ehAgradecimento(trimmed)) {
      return json({ reply: "Por nada! 🤝 Qualquer coisa estou por aqui.", source: "thanks" });
    }

    // ─── Caso E: saudação
    if (ehSaudacao(trimmed)) {
      // Se já há contexto, não reinicia
      if (temContextoAnterior) {
        return json({
          reply: "Tô aqui 👋 Me conta a marca, o modelo e o defeito que sigo o atendimento.",
          source: "greeting:resume",
        });
      }
      return json({
        reply:
          "👋 Olá! Aqui é a Maia, da HC Tech. Me passa marca, modelo e o defeito (ex: \"tela iPhone 12\") que já te passo o valor.",
        source: "greeting",
      });
    }

    // ─── Caso F: nada detectado → fallback inteligente, sem reiniciar
    return json({
      reply:
        `Pra te ajudar rapidinho, me diz o modelo e o defeito. Exemplos:\n` +
        `• "tela iPhone 12"\n• "bateria Samsung A51"\n• "não carrega Redmi Note 11"\n\n` +
        `Modelos populares na nossa base:\n${listaModelosSugeridos()}\n\n` +
        `Se preferir falar com um humano: ${WA}`,
      source: "fallback:ask",
    });
  } catch (e) {
    console.error("maia-chat error:", e);
    return new Response(
      JSON.stringify({
        reply: `Tive um probleminha aqui, mas seguimos! Me passa o modelo e o defeito que continuo o atendimento. Se preferir: ${WA}`,
        source: "error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
