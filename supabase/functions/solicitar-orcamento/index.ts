import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const CATEGORIAS = ["Celular", "iPhone", "Tablet", "Notebook", "Computador"];
const ATENDIMENTOS = ["Entrega no balcão", "Retirada (leva e traz)", "Envio pelo correio", "Agendamento"];
const CONTATOS = ["WhatsApp", "Ligação", "E-mail"];
const PERIODOS = ["Manhã", "Tarde", "Noite", "Qualquer horário"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => x.trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems) : [];

function makeProtocol() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const rand = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  return `HC-${ymd}-${rand}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "Requisição inválida" }, 400);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const token = str(b.client_token, 40);
  if (!UUID.test(token)) return json({ error: "Identificador inválido" }, 400);

  // Segunda ação: cliente informa que o WhatsApp foi aberto (não confirma o envio da mensagem)
  if (b.action === "whatsapp_aberto") {
    await supabase
      .from("orcamento_solicitacoes")
      .update({ whatsapp_status: "aberto" })
      .eq("client_token", token)
      .eq("whatsapp_status", "preparado");
    return json({ ok: true });
  }

  // Validação
  const nome = str(b.nome, 120);
  const telefone = str(b.telefone, 20).replace(/\D/g, "");
  const email = str(b.email, 255);
  const categoria = str(b.categoria, 30);
  const marca = str(b.marca, 60);
  const modelo = str(b.modelo, 100);
  const servico = str(b.servico, 120);
  const descricao = str(b.descricao_defeito, 1500);
  const atendimento = str(b.atendimento, 40);
  const imei1 = str(b.imei1, 20).replace(/\D/g, "");
  const imei2 = str(b.imei2, 20).replace(/\D/g, "");

  const errors: string[] = [];
  if (nome.length < 3) errors.push("Informe o nome completo.");
  if (telefone.length < 10 || telefone.length > 11) errors.push("Informe o telefone com DDD.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail inválido.");
  if (!CATEGORIAS.includes(categoria)) errors.push("Categoria inválida.");
  if (!marca) errors.push("Informe a marca.");
  if (!modelo) errors.push("Informe o modelo.");
  if (!servico) errors.push("Informe o tipo de problema ou serviço.");
  if (descricao.length < 5) errors.push("Descreva o defeito.");
  if (!ATENDIMENTOS.includes(atendimento)) errors.push("Forma de atendimento inválida.");
  if (imei1 && imei1.length !== 15) errors.push("IMEI 1 deve ter 15 dígitos.");
  if (imei2 && imei2.length !== 15) errors.push("IMEI 2 deve ter 15 dígitos.");
  if (b.consentimento_lgpd !== true) errors.push("É necessário aceitar o tratamento dos dados.");
  if (errors.length) return json({ error: errors.join(" ") }, 400);

  // Reenvio: devolve o protocolo já existente
  const { data: existing } = await supabase
    .from("orcamento_solicitacoes")
    .select("protocolo")
    .eq("client_token", token)
    .maybeSingle();
  if (existing) return json({ protocolo: existing.protocolo, duplicado: true });

  // Limite simples por telefone: 5 por hora
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("orcamento_solicitacoes")
    .select("id", { count: "exact", head: true })
    .eq("telefone", telefone)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) return json({ error: "Muitas solicitações para este telefone. Tente novamente mais tarde." }, 429);

  const pref = str(b.preferencia_contato, 20);
  const periodo = str(b.periodo_contato, 20);

  for (let attempt = 0; attempt < 5; attempt++) {
    const protocolo = makeProtocol();
    const { error } = await supabase.from("orcamento_solicitacoes").insert({
      protocolo,
      client_token: token,
      nome,
      telefone,
      email: email || null,
      preferencia_contato: CONTATOS.includes(pref) ? pref : null,
      periodo_contato: PERIODOS.includes(periodo) ? periodo : null,
      categoria,
      marca,
      modelo,
      numero_serie: str(b.numero_serie, 60) || null,
      imei1: imei1 || null,
      imei2: imei2 || null,
      estado_geral: str(b.estado_geral, 60) || null,
      info_adicional: str(b.info_adicional, 600) || null,
      servico,
      descricao_defeito: descricao,
      sintomas: list(b.sintomas, 8, 120),
      historico: list(b.historico, 5, 60),
      atendimento,
      observacoes: str(b.observacoes, 600) || null,
      consentimento_lgpd: true,
    });
    if (!error) return json({ protocolo });
    if (error.code === "23505") {
      // protocolo repetido ou reenvio simultâneo
      const { data: again } = await supabase.from("orcamento_solicitacoes").select("protocolo").eq("client_token", token).maybeSingle();
      if (again) return json({ protocolo: again.protocolo, duplicado: true });
      continue;
    }
    console.error("insert error", error.message);
    return json({ error: "Não foi possível salvar o orçamento. Tente novamente." }, 500);
  }
  return json({ error: "Não foi possível gerar o protocolo. Tente novamente." }, 500);
});
