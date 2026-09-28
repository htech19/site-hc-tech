import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Cliente } from "@/sistema/os-shared";
import {
  maskDoc, maskPhone, maskCEP, onlyDigits, isValidCPF, isValidCNPJ, isValidEmail, isValidPhone, findDuplicates,
} from "./utils";

export type Contato = { id?: string; nome: string; cargo: string; telefone: string; whatsapp: string; email: string; principal: boolean };

const empty = {
  tipo_pessoa: "PF" as "PF" | "PJ", nome: "", nome_fantasia: "", documento: "", rg_ie: "", data_nascimento: "",
  telefone: "", telefone2: "", whatsapp: "", email: "",
  cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  observacoes: "", tags: [] as string[], classificacao: "", status: "ativo" as Cliente["status"], motivo_bloqueio: "",
  consentimento_lgpd: false, aceita_whatsapp: true, aceita_email: true, aceita_sms: false, aceita_marketing: false,
  limite_credito: "0",
};
type Form = typeof empty;

const CLASSIFICACOES = ["Varejo", "Corporativo", "VIP", "Revenda", "Recorrente"];

export default function ClienteFormDialog({
  open, onOpenChange, editing, all, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Cliente | null; all: Cliente[]; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(empty);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("dados");
  const [cepLoading, setCepLoading] = useState(false);
  const [dupConfirmed, setDupConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({}); setTab("dados"); setDupConfirmed(false); setTagInput("");
    if (editing) {
      setForm({
        ...empty,
        ...Object.fromEntries(Object.entries(editing).map(([k, v]) => [k, v ?? (k in empty ? (empty as any)[k] : "")])),
        documento: editing.documento ? maskDoc(editing.documento, editing.tipo_pessoa) : "",
        limite_credito: String(editing.limite_credito ?? 0),
        tags: editing.tags ?? [],
      } as Form);
      supabase.from("cliente_contatos").select("*").eq("cliente_id", editing.id).order("created_at").then(({ data }) =>
        setContatos((data ?? []).map((c) => ({ id: c.id, nome: c.nome, cargo: c.cargo ?? "", telefone: c.telefone ?? "", whatsapp: c.whatsapp ?? "", email: c.email ?? "", principal: c.principal }))),
      );
    } else {
      setForm(empty); setContatos([]);
    }
  }, [open, editing]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const buscarCep = async () => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) { setErrors((e) => ({ ...e, cep: "CEP não encontrado" })); return; }
      setForm((f) => ({ ...f, endereco: d.logradouro || f.endereco, bairro: d.bairro || f.bairro, cidade: d.localidade || f.cidade, uf: d.uf || f.uf }));
      setErrors((e) => { const { cep: _, ...rest } = e; return rest; });
    } catch {
      toast({ title: "Não foi possível consultar o CEP", description: "Preencha o endereço manualmente.", variant: "destructive" });
    } finally { setCepLoading(false); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t) && t.length <= 30) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.nome.trim().length < 2) e.nome = "Informe o nome (mín. 2 caracteres)";
    if (form.nome.length > 150) e.nome = "Máximo 150 caracteres";
    if (form.documento) {
      const ok = form.tipo_pessoa === "PJ" ? isValidCNPJ(form.documento) : isValidCPF(form.documento);
      if (!ok) e.documento = form.tipo_pessoa === "PJ" ? "CNPJ inválido" : "CPF inválido";
    }
    for (const k of ["telefone", "telefone2", "whatsapp"] as const)
      if (form[k] && !isValidPhone(form[k])) e[k] = "Telefone inválido (DDD + número)";
    if (form.email && !isValidEmail(form.email)) e.email = "E-mail inválido";
    if (form.cep && onlyDigits(form.cep).length !== 8) e.cep = "CEP deve ter 8 dígitos";
    if (form.uf && !/^[A-Za-z]{2}$/.test(form.uf)) e.uf = "UF com 2 letras";
    const lim = Number(form.limite_credito.replace(",", "."));
    if (Number.isNaN(lim) || lim < 0) e.limite_credito = "Valor inválido";
    if (form.status === "bloqueado" && !form.motivo_bloqueio.trim()) e.motivo_bloqueio = "Informe o motivo do bloqueio";
    contatos.forEach((c, i) => {
      if (!c.nome.trim()) e[`contato_${i}`] = "Contato sem nome";
      else if (c.email && !isValidEmail(c.email)) e[`contato_${i}`] = "E-mail do contato inválido";
      else if (c.telefone && !isValidPhone(c.telefone)) e[`contato_${i}`] = "Telefone do contato inválido";
    });
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      setTab(["nome", "documento"].includes(first) ? "dados" : first.startsWith("contato_") ? "contatos" : first === "limite_credito" || first === "motivo_bloqueio" ? "financeiro" : "endereco");
    }
    return !Object.keys(e).length;
  };

  const dups = findDuplicates({ id: editing?.id, telefone: form.telefone, whatsapp: form.whatsapp, email: form.email, documento: form.documento }, all);

  const save = async () => {
    if (!validate()) return;
    if (dups.length && !dupConfirmed) { setTab("dados"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user!.id;
    const t = (v: string) => v.trim() || null;
    const payload = {
      tipo_pessoa: form.tipo_pessoa, nome: form.nome.trim(), nome_fantasia: t(form.nome_fantasia),
      documento: onlyDigits(form.documento) || null, rg_ie: t(form.rg_ie), data_nascimento: form.data_nascimento || null,
      telefone: t(form.telefone), telefone2: t(form.telefone2), whatsapp: t(form.whatsapp), email: t(form.email.toLowerCase()),
      cep: t(form.cep), endereco: t(form.endereco), numero: t(form.numero), complemento: t(form.complemento),
      bairro: t(form.bairro), cidade: t(form.cidade), uf: t(form.uf.toUpperCase()),
      observacoes: t(form.observacoes), tags: form.tags, classificacao: t(form.classificacao),
      status: form.status, motivo_bloqueio: form.status === "bloqueado" ? t(form.motivo_bloqueio) : null,
      consentimento_lgpd: form.consentimento_lgpd,
      consentimento_data: form.consentimento_lgpd ? (editing?.consentimento_lgpd ? editing.consentimento_data : new Date().toISOString()) : null,
      aceita_whatsapp: form.aceita_whatsapp, aceita_email: form.aceita_email, aceita_sms: form.aceita_sms, aceita_marketing: form.aceita_marketing,
      limite_credito: Number(form.limite_credito.replace(",", ".")) || 0,
    };
    let id = editing?.id;
    if (editing) {
      const { error } = await supabase.from("clientes").update(payload).eq("id", editing.id);
      if (error) return fail(error.message);
    } else {
      const { data, error } = await supabase.from("clientes").insert({ ...payload, user_id: uid }).select("id").single();
      if (error) return fail(error.message);
      id = data.id;
    }
    // contatos: sincroniza
    const keep = contatos.filter((c) => c.id).map((c) => c.id!);
    if (editing) {
      const q = supabase.from("cliente_contatos").delete().eq("cliente_id", id!);
      const { error } = keep.length ? await q.not("id", "in", `(${keep.join(",")})`) : await q;
      if (error) return fail(error.message);
    }
    for (const c of contatos) {
      const row = { nome: c.nome.trim(), cargo: t(c.cargo), telefone: t(c.telefone), whatsapp: t(c.whatsapp), email: t(c.email), principal: c.principal };
      const { error } = c.id
        ? await supabase.from("cliente_contatos").update(row).eq("id", c.id)
        : await supabase.from("cliente_contatos").insert({ ...row, cliente_id: id!, user_id: uid });
      if (error) return fail(error.message);
    }
    // auditoria
    const changes: string[] = [];
    if (editing) {
      if (editing.status !== form.status) changes.push(`status: ${editing.status} → ${form.status}`);
      if (editing.consentimento_lgpd !== form.consentimento_lgpd) changes.push(`consentimento LGPD ${form.consentimento_lgpd ? "concedido" : "revogado"}`);
      if (Number(editing.limite_credito) !== payload.limite_credito) changes.push(`limite de crédito: ${editing.limite_credito} → ${payload.limite_credito}`);
    }
    await supabase.from("cliente_interacoes").insert({
      cliente_id: id!, user_id: uid, tipo: "sistema",
      descricao: editing ? `Cadastro atualizado${changes.length ? ` (${changes.join("; ")})` : ""}` : "Cliente cadastrado",
    });
    setSaving(false);
    toast({ title: editing ? "Cliente atualizado" : "Cliente cadastrado" });
    onOpenChange(false);
    onSaved();
  };
  const fail = (msg: string) => {
    setSaving(false);
    toast({ title: "Erro ao salvar cliente", description: msg, variant: "destructive" });
  };


  const field = (k: keyof Form, label: string, opts: { mask?: (v: string) => string; type?: string; placeholder?: string; className?: string; onBlur?: () => void; maxLength?: number } = {}) => (
    <div className={`space-y-1.5 ${opts.className ?? ""}`}>
      <Label htmlFor={`cf-${k}`}>{label}</Label>
      <Input
        id={`cf-${k}`}
        type={opts.type ?? "text"}
        value={form[k] as string}
        placeholder={opts.placeholder}
        maxLength={opts.maxLength ?? 200}
        onBlur={opts.onBlur}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `cf-${k}-err` : undefined}
        onChange={(e) => set(k, (opts.mask ? opts.mask(e.target.value) : e.target.value) as never)}
        className={errors[k] ? "border-red-500" : ""}
      />
      {errors[k] && <p id={`cf-${k}-err`} className="text-xs text-red-600">{errors[k]}</p>}
    </div>
  );

  const setContato = (i: number, patch: Partial<Contato>) => setContatos((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>

        {dups.length > 0 && (
          <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Possível duplicidade:</p>
              <ul className="text-sm list-disc pl-4">
                {dups.slice(0, 3).map((d) => <li key={d.cliente.id}>{d.cliente.nome} — mesmo {d.motivo}</li>)}
              </ul>
              <label className="flex items-center gap-2 mt-2 text-sm">
                <Switch checked={dupConfirmed} onCheckedChange={setDupConfirmed} aria-label="Salvar mesmo assim" /> Salvar mesmo assim
              </label>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-5 w-full h-auto">
            <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados</TabsTrigger>
            <TabsTrigger value="endereco" className="text-xs sm:text-sm">Contato</TabsTrigger>
            <TabsTrigger value="contatos" className="text-xs sm:text-sm">Pessoas</TabsTrigger>
            <TabsTrigger value="prefs" className="text-xs sm:text-sm">LGPD</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs sm:text-sm">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>Tipo de pessoa</Label>
              <Select value={form.tipo_pessoa} onValueChange={(v: "PF" | "PJ") => setForm((f) => ({ ...f, tipo_pessoa: v, documento: maskDoc(f.documento, v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PF">Pessoa física</SelectItem><SelectItem value="PJ">Pessoa jurídica</SelectItem></SelectContent>
              </Select>
            </div>
            {field("documento", form.tipo_pessoa === "PJ" ? "CNPJ" : "CPF", { mask: (v) => maskDoc(v, form.tipo_pessoa), placeholder: form.tipo_pessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00" })}
            {field("nome", form.tipo_pessoa === "PJ" ? "Razão social *" : "Nome completo *", { className: "sm:col-span-2", maxLength: 150 })}
            {form.tipo_pessoa === "PJ" && field("nome_fantasia", "Nome fantasia", { className: "sm:col-span-2" })}
            {field("rg_ie", form.tipo_pessoa === "PJ" ? "Inscrição estadual" : "RG", { maxLength: 20 })}
            {form.tipo_pessoa === "PF" && field("data_nascimento", "Data de nascimento", { type: "date" })}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cf-tag">Tags</Label>
              <div className="flex gap-2">
                <Input id="cf-tag" value={tagInput} maxLength={30} placeholder="Ex.: iPhone, indicação..." onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                <Button type="button" variant="outline" onClick={addTag}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" aria-label={`Remover tag ${t}`} onClick={() => set("tags", form.tags.filter((x) => x !== t))}><X size={12} /></button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Classificação</Label>
              <Select value={form.classificacao || "none"} onValueChange={(v) => set("classificacao", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem classificação</SelectItem>
                  {CLASSIFICACOES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="endereco" className="grid grid-cols-1 sm:grid-cols-6 gap-4 pt-2">
            {field("telefone", "Celular", { mask: maskPhone, placeholder: "(11) 99999-9999", className: "sm:col-span-3", type: "tel" })}
            {field("whatsapp", "WhatsApp", { mask: maskPhone, placeholder: "(11) 99999-9999", className: "sm:col-span-3", type: "tel" })}
            {field("telefone2", "Telefone fixo / recado", { mask: maskPhone, className: "sm:col-span-3", type: "tel" })}
            {field("email", "E-mail", { type: "email", className: "sm:col-span-3", maxLength: 255 })}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cf-cep">CEP {cepLoading && <Loader2 className="inline h-3 w-3 animate-spin" />}</Label>
              <Input id="cf-cep" value={form.cep} placeholder="00000-000" onChange={(e) => set("cep", maskCEP(e.target.value))} onBlur={buscarCep} className={errors.cep ? "border-red-500" : ""} aria-invalid={!!errors.cep} />
              {errors.cep && <p className="text-xs text-red-600">{errors.cep}</p>}
            </div>
            {field("endereco", "Logradouro", { className: "sm:col-span-4" })}
            {field("numero", "Número", { className: "sm:col-span-2", maxLength: 10 })}
            {field("complemento", "Complemento", { className: "sm:col-span-4" })}
            {field("bairro", "Bairro", { className: "sm:col-span-3" })}
            {field("cidade", "Cidade", { className: "sm:col-span-2" })}
            {field("uf", "UF", { className: "sm:col-span-1", maxLength: 2, mask: (v) => v.toUpperCase() })}
            <div className="space-y-1.5 sm:col-span-6">
              <Label htmlFor="cf-obs">Observações</Label>
              <Textarea id="cf-obs" value={form.observacoes} maxLength={2000} rows={3} onChange={(e) => set("observacoes", e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="contatos" className="space-y-3 pt-2">
            <p className="text-sm text-gray-500">Pessoas adicionais (responsável, financeiro, familiar...).</p>
            {contatos.map((c, i) => (
              <div key={c.id ?? i} className="border rounded-md p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input aria-label="Nome do contato" placeholder="Nome *" value={c.nome} maxLength={120} onChange={(e) => setContato(i, { nome: e.target.value })} />
                <Input aria-label="Cargo / relação" placeholder="Cargo / relação" value={c.cargo} maxLength={60} onChange={(e) => setContato(i, { cargo: e.target.value })} />
                <Input aria-label="Telefone do contato" placeholder="Telefone" value={c.telefone} onChange={(e) => setContato(i, { telefone: maskPhone(e.target.value) })} />
                <Input aria-label="WhatsApp do contato" placeholder="WhatsApp" value={c.whatsapp} onChange={(e) => setContato(i, { whatsapp: maskPhone(e.target.value) })} />
                <Input aria-label="E-mail do contato" placeholder="E-mail" type="email" value={c.email} maxLength={255} onChange={(e) => setContato(i, { email: e.target.value })} />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={c.principal} onCheckedChange={(v) => setContato(i, { principal: v })} /> Principal</label>
                  <Button type="button" size="icon" variant="ghost" className="text-red-600" aria-label="Remover contato" onClick={() => setContatos((cs) => cs.filter((_, j) => j !== i))}><Trash2 size={15} /></Button>
                </div>
                {errors[`contato_${i}`] && <p className="text-xs text-red-600 sm:col-span-2">{errors[`contato_${i}`]}</p>}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setContatos((cs) => [...cs, { nome: "", cargo: "", telefone: "", whatsapp: "", email: "", principal: cs.length === 0 }])}>
              <Plus size={15} className="mr-1" /> Adicionar contato
            </Button>
          </TabsContent>

          <TabsContent value="prefs" className="space-y-4 pt-2">
            <label className="flex items-start gap-3 border rounded-md p-3">
              <Switch checked={form.consentimento_lgpd} onCheckedChange={(v) => set("consentimento_lgpd", v)} />
              <span className="text-sm">
                <span className="font-medium block">Consentimento LGPD</span>
                Cliente autorizou o armazenamento e uso dos dados para atendimento.
                {editing?.consentimento_data && form.consentimento_lgpd && <span className="block text-xs text-gray-500">Registrado em {new Date(editing.consentimento_data).toLocaleString("pt-BR")}</span>}
              </span>
            </label>
            <p className="text-sm font-medium">Canais de comunicação aceitos</p>
            {([["aceita_whatsapp", "WhatsApp"], ["aceita_email", "E-mail"], ["aceita_sms", "SMS / ligação"], ["aceita_marketing", "Promoções e marketing"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                {l}<Switch checked={form[k]} onCheckedChange={(v) => set(k, v)} aria-label={l} />
              </label>
            ))}
          </TabsContent>

          <TabsContent value="financeiro" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select value={form.status} onValueChange={(v: Cliente["status"]) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field("limite_credito", "Limite de crédito (R$)", { mask: (v) => v.replace(/[^\d,.]/g, ""), maxLength: 12 })}
            {form.status === "bloqueado" && field("motivo_bloqueio", "Motivo do bloqueio *", { className: "sm:col-span-2" })}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || (dups.length > 0 && !dupConfirmed)} className="bg-[#00A651] hover:bg-[#008c44] text-white">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
