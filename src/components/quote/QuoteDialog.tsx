import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppUrl, QUOTE_EVENT } from "@/config/contact";
import {
  ATENDIMENTOS, CATEGORIAS, CONTATOS, ESTADOS, HISTORICO, MARCAS, PERIODOS, SERVICOS, SINTOMAS,
  hasImei, maskPhone, type Categoria,
} from "./quote-data";

const STEPS = ["Cliente", "Equipamento", "Defeito", "Atendimento", "Revisão"];
const OUTRO = "Outro";

const initial = {
  nome: "", telefone: "", email: "", preferencia_contato: "WhatsApp",
  categoria: "" as Categoria | "", marcaSel: "", marcaOutra: "", modelo: "",
  numero_serie: "", imei1: "", imei2: "", estado_geral: "", info_adicional: "",
  servicoSel: "", servicoOutro: "", descricao_defeito: "", sintomas: [] as string[], sintomaOutro: "",
  historico: [] as string[],
  atendimento: "", periodo_contato: "", observacoes: "", consentimento_lgpd: false,
};
type Form = typeof initial;

const field =
  "w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A651]/60";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-300";

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={label}>{title}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
        active ? "border-[#00A651] bg-[#00A651]/20 text-white" : "border-white/10 bg-black/40 text-gray-300 hover:border-[#00A651]/50"
      }`}
    >
      {children}
    </button>
  );
}

const marcaFinal = (f: Form) => (f.marcaSel === OUTRO ? f.marcaOutra.trim() : f.marcaSel);
const servicoFinal = (f: Form) => (f.servicoSel === OUTRO ? f.servicoOutro.trim() : f.servicoSel);

function validate(step: number, f: Form): string | null {
  const phone = f.telefone.replace(/\D/g, "");
  if (step === 0) {
    if (f.nome.trim().length < 3) return "Informe seu nome completo.";
    if (phone.length < 10) return "Informe o telefone com DDD.";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return "E-mail inválido.";
  }
  if (step === 1) {
    if (!f.categoria) return "Escolha a categoria do equipamento.";
    if (!marcaFinal(f)) return "Informe a marca.";
    if (!f.modelo.trim()) return "Informe o modelo (ou digite 'Não sei').";
    for (const k of ["imei1", "imei2"] as const) {
      const d = f[k].replace(/\D/g, "");
      if (d && d.length !== 15) return "O IMEI deve ter 15 dígitos (disque *#06# no celular).";
    }
  }
  if (step === 2) {
    if (!servicoFinal(f)) return "Informe o tipo de problema ou serviço.";
    if (f.descricao_defeito.trim().length < 5) return "Descreva o defeito.";
  }
  if (step === 3) {
    if (!f.atendimento) return "Escolha a forma de atendimento.";
    if (!f.consentimento_lgpd) return "É necessário aceitar o tratamento dos dados para enviar.";
  }
  return null;
}

function buildMessage(f: Form, protocolo: string) {
  const sint = [...f.sintomas, f.sintomaOutro.trim()].filter(Boolean);
  const lines = [
    `*Solicitação de orçamento — HC Tech Infocell*`,
    `Protocolo: ${protocolo}`,
    ``,
    `*Cliente:* ${f.nome.trim()}`,
    `*Telefone:* ${f.telefone}`,
    `*Equipamento:* ${f.categoria} ${marcaFinal(f)} ${f.modelo.trim()}`,
    `*Serviço:* ${servicoFinal(f)}`,
    `*Defeito:* ${f.descricao_defeito.trim()}`,
    sint.length ? `*Sintomas:* ${sint.join(", ")}` : "",
    f.historico.length ? `*Histórico:* ${f.historico.join(", ")}` : "",
    `*Atendimento:* ${f.atendimento}`,
  ].filter((l) => l !== "" || true);
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}

async function errorMessage(error: unknown): Promise<string> {
  try {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    }
  } catch { /* ignore */ }
  return "Não foi possível enviar agora. Seus dados foram mantidos — tente novamente.";
}

export default function QuoteDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(initial);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [modelos, setModelos] = useState<{ marca: string; modelo: string }[]>([]);
  const token = useRef(crypto.randomUUID());
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(QUOTE_EVENT, h);
    return () => window.removeEventListener(QUOTE_EVENT, h);
  }, []);

  // Reaproveita o catálogo de telas existente para sugerir modelos (carregado só quando necessário)
  useEffect(() => {
    if (!open || modelos.length) return;
    import("@/data/telas").then((m) =>
      setModelos(m.telas.map((t) => ({ marca: t.marca.toLowerCase(), modelo: t.modelo })))
    );
  }, [open, modelos.length]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: "sintomas" | "historico", v: string) =>
    setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  const marcaAtual = marcaFinal(f).toLowerCase();
  const sugestoes = useMemo(() => {
    if (!f.categoria || (f.categoria !== "Celular" && f.categoria !== "iPhone" && f.categoria !== "Tablet")) return [];
    const set = new Set<string>();
    modelos.forEach((m) => {
      if (m.marca === marcaAtual) set.add(m.modelo);
    });
    return Array.from(set).sort().slice(0, 400);
  }, [modelos, marcaAtual, f.categoria]);

  const goto = (n: number) => {
    setStep(n);
    setError(null);
    bodyRef.current?.scrollTo({ top: 0 });
  };
  const next = () => {
    const e = validate(step, f);
    if (e) return setError(e);
    goto(step + 1);
  };

  const openWhats = (p: string) => {
    const w = window.open(buildWhatsAppUrl(buildMessage(f, p)), "_blank", "noopener,noreferrer");
    supabase.functions.invoke("solicitar-orcamento", { body: { action: "whatsapp_aberto", client_token: token.current } }).catch(() => {});
    return w;
  };

  const submit = async () => {
    if (sending) return;
    for (let i = 0; i < 4; i++) {
      const e = validate(i, f);
      if (e) { goto(i); return setError(e); }
    }
    setSending(true);
    setError(null);
    const sint = [...f.sintomas, f.sintomaOutro.trim()].filter(Boolean);
    const { data, error: err } = await supabase.functions.invoke("solicitar-orcamento", {
      body: {
        client_token: token.current,
        nome: f.nome, telefone: f.telefone, email: f.email, preferencia_contato: f.preferencia_contato,
        periodo_contato: f.periodo_contato, categoria: f.categoria, marca: marcaFinal(f), modelo: f.modelo,
        numero_serie: f.numero_serie, imei1: f.imei1, imei2: f.imei2, estado_geral: f.estado_geral,
        info_adicional: f.info_adicional, servico: servicoFinal(f), descricao_defeito: f.descricao_defeito,
        sintomas: sint, historico: f.historico, atendimento: f.atendimento, observacoes: f.observacoes,
        consentimento_lgpd: f.consentimento_lgpd,
      },
    });
    setSending(false);
    if (err || !data?.protocolo) {
      setError(await errorMessage(err));
      return;
    }
    setProtocolo(data.protocolo);
    openWhats(data.protocolo);
  };

  const reset = () => {
    setF(initial);
    setProtocolo(null);
    setStep(0);
    setError(null);
    token.current = crypto.randomUUID();
  };

  const cat = f.categoria;
  const marcas = cat ? MARCAS[cat] : [];
  const sintomas = cat ? SINTOMAS[cat] : [];
  const servicos = cat ? SERVICOS[cat] : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-2xl flex-col gap-0 overflow-hidden border-[#00A651]/30 bg-zinc-950 p-0 text-white">
        <DialogHeader className="border-b border-white/10 p-5 pb-4">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
            Solicitar <span className="text-[#00A651]">orçamento</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Gratuito e sem compromisso. Leva menos de 2 minutos.
          </DialogDescription>
          {!protocolo && (
            <ol className="mt-3 flex items-center gap-1.5" aria-label="Progresso">
              {STEPS.map((s, i) => (
                <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
                  <div className={`h-1.5 rounded-full ${i <= step ? "bg-[#00A651]" : "bg-white/10"}`} />
                  <span className={`mt-1 hidden text-[10px] uppercase tracking-wider sm:block ${i === step ? "text-[#00A651]" : "text-gray-500"}`}>{s}</span>
                </li>
              ))}
            </ol>
          )}
          {!protocolo && <p className="text-xs font-semibold text-[#00A651] sm:hidden">Etapa {step + 1} de {STEPS.length}: {STEPS[step]}</p>}
        </DialogHeader>

        <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">
          {protocolo ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#00A651]/20 text-[#00A651]"><Check size={30} /></div>
              <h3 className="text-lg font-black uppercase">Orçamento registrado</h3>
              <div className="rounded-2xl border border-[#00A651]/30 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Seu protocolo</p>
                <p className="select-all text-2xl font-black tracking-wider text-[#00A651]">{protocolo}</p>
              </div>
              <p className="text-sm text-gray-300">
                Abrimos o WhatsApp com a mensagem pronta. <strong className="text-white">Você ainda precisa tocar em “Enviar”</strong> para que a gente receba.
              </p>
              <a
                href={buildWhatsAppUrl(buildMessage(f, protocolo))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => supabase.functions.invoke("solicitar-orcamento", { body: { action: "whatsapp_aberto", client_token: token.current } }).catch(() => {})}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-black uppercase text-white hover:brightness-110"
              >
                <MessageCircle size={18} /> Abrir WhatsApp novamente
              </a>
              <p className="text-xs text-gray-500">Guarde o protocolo. Seu orçamento já está salvo mesmo que o WhatsApp não abra.</p>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="min-h-[44px] flex-1 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5">Continuar navegando</button>
                <button onClick={reset} className="min-h-[44px] flex-1 rounded-xl border border-[#00A651]/40 text-sm text-[#00A651] hover:bg-[#00A651]/10">Novo orçamento</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {step === 0 && (
                <>
                  <Field title="Nome completo *"><input className={field} value={f.nome} maxLength={120} autoComplete="name" onChange={(e) => set("nome", e.target.value)} /></Field>
                  <Field title="Telefone / WhatsApp com DDD *"><input className={field} inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={f.telefone} onChange={(e) => set("telefone", maskPhone(e.target.value))} /></Field>
                  <Field title="E-mail (opcional)"><input className={field} type="email" autoComplete="email" maxLength={255} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
                  <Field title="Preferência de contato">
                    <div className="grid grid-cols-3 gap-2">{CONTATOS.map((c) => <Chip key={c} active={f.preferencia_contato === c} onClick={() => set("preferencia_contato", c)}>{c}</Chip>)}</div>
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <Field title="Categoria *">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {CATEGORIAS.map((c) => (
                        <Chip key={c} active={f.categoria === c} onClick={() => setF((p) => ({ ...p, categoria: c, marcaSel: c === "iPhone" ? "Apple" : "", marcaOutra: "", modelo: "", servicoSel: "", sintomas: [], imei1: "", imei2: "" }))}>{c}</Chip>
                      ))}
                    </div>
                  </Field>
                  {cat && (
                    <>
                      <Field title="Marca *">
                        <select className={field} value={f.marcaSel} onChange={(e) => set("marcaSel", e.target.value)}>
                          <option value="">Selecione…</option>
                          {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
                          <option value={OUTRO}>Outro</option>
                        </select>
                        {f.marcaSel === OUTRO && <input className={`${field} mt-2`} placeholder="Digite a marca" maxLength={60} value={f.marcaOutra} onChange={(e) => set("marcaOutra", e.target.value)} />}
                      </Field>
                      <Field title="Modelo *" hint={sugestoes.length ? "Digite para pesquisar na lista ou escreva o seu modelo." : "Digite o modelo exatamente como está no aparelho."}>
                        <input className={field} list="quote-modelos" maxLength={100} value={f.modelo} onChange={(e) => set("modelo", e.target.value)} />
                        <datalist id="quote-modelos">{sugestoes.map((m) => <option key={m} value={m} />)}</datalist>
                      </Field>
                      <Field title="Número de série (opcional)"><input className={field} maxLength={60} value={f.numero_serie} onChange={(e) => set("numero_serie", e.target.value)} /></Field>
                      {hasImei(cat) && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field title="IMEI 1 (opcional)" hint="Disque *#06# para ver."><input className={field} inputMode="numeric" maxLength={15} value={f.imei1} onChange={(e) => set("imei1", e.target.value.replace(/\D/g, ""))} /></Field>
                          <Field title="IMEI 2 (opcional)"><input className={field} inputMode="numeric" maxLength={15} value={f.imei2} onChange={(e) => set("imei2", e.target.value.replace(/\D/g, ""))} /></Field>
                        </div>
                      )}
                      <Field title="Estado geral">
                        <select className={field} value={f.estado_geral} onChange={(e) => set("estado_geral", e.target.value)}>
                          <option value="">Selecione…</option>
                          {ESTADOS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </Field>
                      <Field title="Informações adicionais"><textarea className={`${field} resize-none`} rows={2} maxLength={600} value={f.info_adicional} onChange={(e) => set("info_adicional", e.target.value)} /></Field>
                      <p className="text-[11px] text-gray-500">Não pedimos senhas do aparelho nem de contas pessoais.</p>
                    </>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <Field title="Tipo de problema ou serviço *">
                    <select className={field} value={f.servicoSel} onChange={(e) => set("servicoSel", e.target.value)}>
                      <option value="">Selecione…</option>
                      {servicos.map((m) => <option key={m} value={m}>{m}</option>)}
                      <option value={OUTRO}>Outro problema</option>
                    </select>
                    {f.servicoSel === OUTRO && <input className={`${field} mt-2`} placeholder="Descreva o serviço" maxLength={120} value={f.servicoOutro} onChange={(e) => set("servicoOutro", e.target.value)} />}
                  </Field>
                  <Field title="Descrição detalhada do defeito *"><textarea className={`${field} resize-none`} rows={4} maxLength={1500} value={f.descricao_defeito} onChange={(e) => set("descricao_defeito", e.target.value)} /></Field>
                  <Field title="O que você observa?" hint="Hipóteses para ajudar na triagem — o diagnóstico real só é feito após a avaliação técnica.">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sintomas.map((s) => <Chip key={s} active={f.sintomas.includes(s)} onClick={() => toggle("sintomas", s)}>{s}</Chip>)}
                    </div>
                    <input className={`${field} mt-2`} placeholder="Outro sintoma (opcional)" maxLength={120} value={f.sintomaOutro} onChange={(e) => set("sintomaOutro", e.target.value)} />
                  </Field>
                  <Field title="Histórico do aparelho">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{HISTORICO.map((s) => <Chip key={s} active={f.historico.includes(s)} onClick={() => toggle("historico", s)}>{s}</Chip>)}</div>
                  </Field>
                </>
              )}

              {step === 3 && (
                <>
                  <Field title="Forma de atendimento *">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{ATENDIMENTOS.map((a) => <Chip key={a} active={f.atendimento === a} onClick={() => set("atendimento", a)}>{a}</Chip>)}</div>
                  </Field>
                  <Field title="Melhor período para contato">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{PERIODOS.map((a) => <Chip key={a} active={f.periodo_contato === a} onClick={() => set("periodo_contato", a)}>{a}</Chip>)}</div>
                  </Field>
                  <Field title="Observações adicionais"><textarea className={`${field} resize-none`} rows={3} maxLength={600} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Field>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-gray-300">
                    <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#00A651]" checked={f.consentimento_lgpd} onChange={(e) => set("consentimento_lgpd", e.target.checked)} />
                    <span>
                      Autorizo a HC Tech Infocell a usar meus dados somente para responder a este orçamento e prestar o serviço (LGPD). Veja a{" "}
                      <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-[#00A651] underline">política de privacidade</a>. *
                    </span>
                  </label>
                </>
              )}

              {step === 4 && (
                <div className="space-y-2 text-sm">
                  <p className="text-xs text-gray-400">Confira os dados antes de enviar. Toque em “Corrigir” para editar.</p>
                  {[
                    { t: "Cliente", i: 0, v: `${f.nome} • ${f.telefone}${f.email ? ` • ${f.email}` : ""}` },
                    { t: "Equipamento", i: 1, v: `${f.categoria} ${marcaFinal(f)} ${f.modelo}${f.imei1 ? ` • IMEI ${f.imei1}` : ""}${f.estado_geral ? ` • ${f.estado_geral}` : ""}` },
                    { t: "Defeito", i: 2, v: `${servicoFinal(f)} — ${f.descricao_defeito}${f.sintomas.length ? ` (${f.sintomas.join(", ")})` : ""}` },
                    { t: "Atendimento", i: 3, v: `${f.atendimento}${f.periodo_contato ? ` • ${f.periodo_contato}` : ""}` },
                  ].map((r) => (
                    <div key={r.t} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#00A651]">{r.t}</p>
                        <p className="break-words text-gray-200">{r.v}</p>
                      </div>
                      <button type="button" onClick={() => goto(r.i)} className="shrink-0 text-xs text-[#00A651] underline">Corrigir</button>
                    </div>
                  ))}
                </div>
              )}

              {error && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            </div>
          )}
        </div>

        {!protocolo && (
          <div className="flex gap-2 border-t border-white/10 p-4">
            {step > 0 && (
              <button type="button" onClick={() => goto(step - 1)} disabled={sending} className="flex min-h-[48px] items-center gap-1 rounded-xl border border-white/10 px-4 text-sm text-gray-300 hover:bg-white/5">
                <ChevronLeft size={16} /> Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-xl bg-[#00A651] text-sm font-black uppercase text-white hover:bg-[#008c44]">
                Continuar <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={sending} className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#00A651] text-sm font-black uppercase text-white hover:bg-[#008c44] disabled:opacity-60">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} {sending ? "Enviando…" : "Enviar e abrir WhatsApp"}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
