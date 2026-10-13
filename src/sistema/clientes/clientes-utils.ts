export interface ClienteResumo {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  created_at: string;
  totalOS: number;
  ultimaOS: string | null;
}

export interface ClienteFormData {
  nome: string;
  telefone: string;
  email: string;
}

export type FiltroContato = "todos" | "telefone" | "email";

export function buildClientesSearchFilter(search: string) {
  const escaped = search.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const pattern = `"%${escaped}%"`;
  return [`nome.ilike.${pattern}`, `telefone.ilike.${pattern}`, `email.ilike.${pattern}`].join(",");
}

function parseCsvRows(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV inválido: há um campo entre aspas sem fechamento.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

const normalizarCabecalho = (value: string) => value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function parseClientesCsv(text: string): ClienteFormData[] {
  const primeiraLinha = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (primeiraLinha.match(/;/g)?.length ?? 0) > (primeiraLinha.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows = parseCsvRows(text, delimiter);
  if (rows.length < 2) throw new Error("O CSV precisa ter cabeçalho e ao menos um cliente.");
  const cabecalhos = rows[0].map(normalizarCabecalho);
  const nomeIndex = cabecalhos.indexOf("nome");
  const telefoneIndex = cabecalhos.findIndex((header) => header === "telefone" || header === "celular");
  const emailIndex = cabecalhos.indexOf("email");
  if (nomeIndex < 0 || telefoneIndex < 0) throw new Error("O cabeçalho deve conter nome e telefone (ou celular). E-mail é opcional.");
  return rows.slice(1).map((values, index) => {
    const nome = values[nomeIndex]?.trim() ?? "";
    const telefone = values[telefoneIndex]?.trim() ?? "";
    const email = emailIndex < 0 ? "" : values[emailIndex]?.trim() ?? "";
    if (!nome || !telefone) throw new Error(`Linha ${index + 2}: nome e telefone são obrigatórios.`);
    return { nome, telefone, email };
  });
}

function escaparCampoCsv(value: string | null | undefined) {
  const text = value ?? "";
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function serializeClientesCsv(clientes: Array<Pick<ClienteResumo, "nome" | "telefone" | "email" | "created_at">>) {
  const linhas = [["nome", "telefone", "email", "created_at"], ...clientes.map((cliente) => [cliente.nome, cliente.telefone, cliente.email ?? "", cliente.created_at])];
  return `\uFEFF${linhas.map((linha) => linha.map(escaparCampoCsv).join(";")).join("\r\n")}`;
}