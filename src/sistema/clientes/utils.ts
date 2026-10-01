import type { Cliente } from "@/sistema/os-shared";

export const onlyDigits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

export function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function maskCNPJ(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
export const maskDoc = (v: string, tipo: "PF" | "PJ") => (tipo === "PJ" ? maskCNPJ(v) : maskCPF(v));
export function maskPhone(v: string) {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}
export const maskCEP = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export function isValidCPF(v: string) {
  const c = onlyDigits(v);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}
export function isValidCNPJ(v: string) {
  const c = onlyDigits(v);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((a, x, i) => a + x * Number(c[i]), 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isValidPhone = (v: string) => {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, "");
  return d.length === 10 || d.length === 11;
};

export const waNumber = (v: string | null | undefined) => {
  const d = onlyDigits(v);
  if (!d) return "";
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
};
export const waUrl = (phone: string, text = "") =>
  `https://wa.me/${waNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Duplicidade por telefone/whatsapp, e-mail e CPF/CNPJ */
export function findDuplicates(
  c: { id?: string; telefone?: string | null; whatsapp?: string | null; email?: string | null; documento?: string | null },
  list: Cliente[],
) {
  const phones = [c.telefone, c.whatsapp].map((p) => onlyDigits(p).slice(-11)).filter((p) => p.length >= 10);
  const email = (c.email ?? "").trim().toLowerCase();
  const doc = onlyDigits(c.documento);
  const out: { cliente: Cliente; motivo: string }[] = [];
  for (const o of list) {
    if (o.id === c.id) continue;
    const motivos: string[] = [];
    if (doc && onlyDigits(o.documento) === doc) motivos.push("CPF/CNPJ");
    if (email && (o.email ?? "").trim().toLowerCase() === email) motivos.push("e-mail");
    const op = [o.telefone, o.whatsapp].map((p) => onlyDigits(p).slice(-11)).filter((p) => p.length >= 10);
    if (phones.some((p) => op.includes(p))) motivos.push("telefone");
    if (motivos.length) out.push({ cliente: o, motivo: motivos.join(", ") });
  }
  return out;
}

/* ---------------- Templates de mensagem ---------------- */
export const MSG_TEMPLATES: { id: string; label: string; text: string }[] = [
  { id: "boas_vindas", label: "Boas-vindas", text: "Olá, {nome}! Aqui é da HC Tech. Obrigado por escolher nossa assistência. Qualquer dúvida, estamos à disposição." },
  { id: "orcamento", label: "Orçamento pronto", text: "Olá, {nome}! O orçamento do seu aparelho na HC Tech está pronto. Podemos seguir com o reparo?" },
  { id: "pronto", label: "Aparelho pronto para retirada", text: "Olá, {nome}! Seu aparelho já está pronto para retirada na HC Tech." },
  { id: "cobranca", label: "Lembrete de pagamento", text: "Olá, {nome}! Passando para lembrar de um pagamento pendente com a HC Tech. Podemos ajudar?" },
  { id: "pos_venda", label: "Pós-atendimento", text: "Olá, {nome}! Tudo certo com o seu aparelho após o serviço na HC Tech? Sua opinião é muito importante." },
  { id: "aniversario", label: "Aniversário", text: "Feliz aniversário, {nome}! A equipe HC Tech deseja um ótimo dia." },
];
export const fillTemplate = (t: string, c: Pick<Cliente, "nome">) => t.replace(/\{nome\}/g, c.nome.split(" ")[0]);

/* ---------------- CSV ---------------- */
export function parseCSV(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = ""; rows.push(row); row = [];
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
const csvCell = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
  return /[";\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCSV = (rows: unknown[][], sep = ";") => "\uFEFF" + rows.map((r) => r.map(csvCell).join(sep)).join("\r\n");

/* ---------------- XLSX (leitura, sem dependências) ---------------- */
async function inflateRaw(data: Uint8Array) {
  const ds = new DecompressionStream("deflate-raw");
  const buf = await new Response(new Blob([data as BlobPart]).stream().pipeThrough(ds)).arrayBuffer();
  return new TextDecoder().decode(buf);
}
async function unzip(buf: ArrayBuffer): Promise<Record<string, string>> {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Arquivo Excel inválido");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files: Record<string, string> = {};
  for (let n = 0; n < count; n++) {
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.slice(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (!/^xl\/(sharedStrings\.xml|worksheets\/sheet1\.xml)$/.test(name)) continue;
    const lnl = dv.getUint16(off + 26, true), lel = dv.getUint16(off + 28, true);
    const data = u8.slice(off + 30 + lnl + lel, off + 30 + lnl + lel + csize);
    files[name] = method === 0 ? new TextDecoder().decode(data) : await inflateRaw(data);
  }
  return files;
}
export async function parseXLSX(buf: ArrayBuffer): Promise<string[][]> {
  const files = await unzip(buf);
  const parser = new DOMParser();
  const shared: string[] = [];
  if (files["xl/sharedStrings.xml"]) {
    const d = parser.parseFromString(files["xl/sharedStrings.xml"], "application/xml");
    d.querySelectorAll("si").forEach((si) => shared.push(Array.from(si.querySelectorAll("t")).map((t) => t.textContent ?? "").join("")));
  }
  const sheet = files["xl/worksheets/sheet1.xml"];
  if (!sheet) throw new Error("Planilha não encontrada");
  const d = parser.parseFromString(sheet, "application/xml");
  const colIdx = (ref: string) => ref.replace(/\d/g, "").split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const rows: string[][] = [];
  d.querySelectorAll("sheetData > row").forEach((r) => {
    const row: string[] = [];
    r.querySelectorAll("c").forEach((c) => {
      const t = c.getAttribute("t");
      const v = c.querySelector("v")?.textContent ?? c.querySelector("is t")?.textContent ?? "";
      row[colIdx(c.getAttribute("r") ?? "A")] = t === "s" ? shared[Number(v)] ?? "" : v;
    });
    rows.push(Array.from(row, (x) => x ?? ""));
  });
  return rows.filter((r) => r.some((c) => String(c).trim()));
}

/* ---------------- Excel (SpreadsheetML, abre no Excel/LibreOffice/Sheets) ---------------- */
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function toExcelXML(rows: unknown[][]) {
  const body = rows
    .map((r) => `<Row>${r.map((v) => {
      const s = v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
      const num = typeof v === "number";
      return `<Cell><Data ss:Type="${num ? "Number" : "String"}">${xmlEsc(s)}</Data></Cell>`;
    }).join("")}</Row>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Clientes"><Table>${body}</Table></Worksheet></Workbook>`;
}

/* ---------------- vCard 3.0 ---------------- */
const vEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
export function toVCard(list: Cliente[]) {
  return list.map((c) => {
    const l = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vEsc(c.nome)}`, `N:${vEsc(c.nome)};;;;`];
    if (c.tipo_pessoa === "PJ") l.push(`ORG:${vEsc(c.nome_fantasia || c.nome)}`);
    if (c.telefone) l.push(`TEL;TYPE=CELL:${c.telefone}`);
    if (c.telefone2) l.push(`TEL;TYPE=HOME:${c.telefone2}`);
    if (c.whatsapp && c.whatsapp !== c.telefone) l.push(`TEL;TYPE=CELL,WHATSAPP:${c.whatsapp}`);
    if (c.email) l.push(`EMAIL;TYPE=INTERNET:${c.email}`);
    if (c.endereco || c.cidade) l.push(`ADR;TYPE=HOME:;${vEsc(c.complemento ?? "")};${vEsc([c.endereco, c.numero].filter(Boolean).join(", "))};${vEsc(c.cidade ?? "")};${vEsc(c.uf ?? "")};${c.cep ?? ""};Brasil`);
    if (c.data_nascimento) l.push(`BDAY:${c.data_nascimento}`);
    if (c.tags?.length) l.push(`CATEGORIES:${c.tags.map(vEsc).join(",")}`);
    if (c.observacoes) l.push(`NOTE:${vEsc(c.observacoes)}`);
    l.push("END:VCARD");
    return l.join("\r\n");
  }).join("\r\n");
}

/* ---------------- Google Contacts CSV ---------------- */
export function toGoogleCSV(list: Cliente[]) {
  const head = ["Name", "Given Name", "Family Name", "Organization 1 - Name", "E-mail 1 - Type", "E-mail 1 - Value", "Phone 1 - Type", "Phone 1 - Value", "Phone 2 - Type", "Phone 2 - Value", "Address 1 - Type", "Address 1 - Street", "Address 1 - City", "Address 1 - Region", "Address 1 - Postal Code", "Address 1 - Country", "Birthday", "Notes", "Group Membership"];
  const rows = list.map((c) => {
    const [g, ...f] = c.nome.split(" ");
    return [c.nome, g, f.join(" "), c.tipo_pessoa === "PJ" ? c.nome_fantasia || c.nome : "", c.email ? "* Other" : "", c.email ?? "", c.telefone ? "Mobile" : "", c.telefone ?? "", c.whatsapp ? "WhatsApp" : "", c.whatsapp ?? "", c.endereco ? "Home" : "", [c.endereco, c.numero, c.bairro].filter(Boolean).join(", "), c.cidade ?? "", c.uf ?? "", c.cep ?? "", c.endereco ? "Brasil" : "", c.data_nascimento ?? "", c.observacoes ?? "", ["* myContacts", ...(c.tags ?? [])].join(" ::: ")];
  });
  return toCSV([head, ...rows], ",");
}

export function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------- Campos de importação/exportação ---------------- */
export const IMPORT_FIELDS: { key: keyof Cliente; label: string; aliases: string[] }[] = [
  { key: "nome", label: "Nome *", aliases: ["nome", "name", "cliente", "razao social", "razão social", "full name"] },
  { key: "tipo_pessoa", label: "Tipo (PF/PJ)", aliases: ["tipo", "tipo pessoa", "pf/pj"] },
  { key: "documento", label: "CPF/CNPJ", aliases: ["cpf", "cnpj", "cpf/cnpj", "documento"] },
  { key: "telefone", label: "Telefone", aliases: ["telefone", "celular", "phone", "phone 1 - value", "fone"] },
  { key: "whatsapp", label: "WhatsApp", aliases: ["whatsapp", "zap", "phone 2 - value"] },
  { key: "email", label: "E-mail", aliases: ["email", "e-mail", "e-mail 1 - value", "mail"] },
  { key: "cep", label: "CEP", aliases: ["cep", "postal code", "address 1 - postal code"] },
  { key: "endereco", label: "Endereço", aliases: ["endereco", "endereço", "rua", "logradouro", "address 1 - street"] },
  { key: "numero", label: "Número", aliases: ["numero", "número", "nº"] },
  { key: "bairro", label: "Bairro", aliases: ["bairro"] },
  { key: "cidade", label: "Cidade", aliases: ["cidade", "city", "address 1 - city"] },
  { key: "uf", label: "UF", aliases: ["uf", "estado", "region", "address 1 - region"] },
  { key: "tags", label: "Tags", aliases: ["tags", "etiquetas", "group membership"] },
  { key: "observacoes", label: "Observações", aliases: ["observacoes", "observações", "obs", "notes", "notas"] },
];

export const EXPORT_HEAD = ["Nome", "Tipo", "CPF/CNPJ", "Nome fantasia", "Telefone", "Telefone 2", "WhatsApp", "E-mail", "CEP", "Endereço", "Número", "Complemento", "Bairro", "Cidade", "UF", "Tags", "Classificação", "Status", "Limite de crédito", "Consentimento LGPD", "Observações", "Cadastro"];
export const exportRow = (c: Cliente) => [c.nome, c.tipo_pessoa, c.documento ? maskDoc(c.documento, c.tipo_pessoa) : "", c.nome_fantasia, c.telefone, c.telefone2, c.whatsapp, c.email, c.cep, c.endereco, c.numero, c.complemento, c.bairro, c.cidade, c.uf, c.tags, c.classificacao, c.status, Number(c.limite_credito ?? 0), c.consentimento_lgpd ? "Sim" : "Não", c.observacoes, new Date(c.created_at).toLocaleDateString("pt-BR")];
