import type { Cliente } from "@/sistema/os-shared";
import {
  EXPORT_HEAD,
  IMPORT_FIELDS,
  exportRow,
  findDuplicates,
  isValidCNPJ,
  isValidCPF,
  isValidEmail,
  isValidPhone,
  maskDoc,
  maskPhone,
  onlyDigits,
  parseCSV,
  toCSV,
} from "./utils";

export interface ClienteResumo extends Cliente {
  totalOS: number;
  ultimaOS: string | null;
}

export type ClienteFormData = Pick<Cliente,
  | "nome"
  | "tipo_pessoa"
  | "documento"
  | "rg_ie"
  | "nome_fantasia"
  | "data_nascimento"
  | "telefone"
  | "telefone2"
  | "whatsapp"
  | "email"
  | "cep"
  | "endereco"
  | "numero"
  | "complemento"
  | "bairro"
  | "cidade"
  | "uf"
  | "observacoes"
  | "tags"
  | "status"
  | "motivo_bloqueio"
>;

export type FiltroStatus = "todos" | Cliente["status"];

export interface ClienteImportacaoLinha {
  linha: number;
  cliente: ClienteFormData;
  erros: string[];
  duplicado: string | null;
}

export function clienteFormVazio(): ClienteFormData {
  return {
    nome: "",
    tipo_pessoa: "PF",
    documento: null,
    rg_ie: null,
    nome_fantasia: null,
    data_nascimento: null,
    telefone: null,
    telefone2: null,
    whatsapp: null,
    email: null,
    cep: null,
    endereco: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidade: null,
    uf: null,
    observacoes: null,
    tags: [],
    status: "ativo",
    motivo_bloqueio: null,
  };
}

function escaparFiltro(valor: string) {
  return valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function buildClientesSearchFilter(search: string) {
  const texto = escaparFiltro(search);
  const digitos = onlyDigits(search);
  const filtro = ["nome", "telefone", "telefone2", "whatsapp", "documento", "email"]
    .map((campo) => `${campo}.ilike."%${texto}%"`);
  if (digitos) {
    const telefoneMascarado = escaparFiltro(maskPhone(digitos));
    const cpfMascarado = escaparFiltro(maskDoc(digitos, "PF"));
    const cnpjMascarado = escaparFiltro(maskDoc(digitos, "PJ"));
    for (const campo of ["telefone", "telefone2", "whatsapp"]) {
      filtro.push(`${campo}.ilike."%${telefoneMascarado}%"`);
    }
    filtro.push(`documento.ilike."%${cpfMascarado}%"`, `documento.ilike."%${cnpjMascarado}%"`);
  }
  return filtro.join(",");
}

const normalizarCabecalho = (valor: string) => valor.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\/\s*/g, "/");

function valoresImportados(cabecalhos: string[], valores: string[]): ClienteFormData {
  const cliente = clienteFormVazio();
  for (const campo of IMPORT_FIELDS) {
    const alias = campo.aliases.map(normalizarCabecalho);
    const index = cabecalhos.findIndex((cabecalho) => alias.includes(cabecalho));
    if (index < 0) continue;
    const valor = valores[index]?.trim() ?? "";
    if (campo.key === "tags") {
      cliente.tags = valor.split(/[|,]/).map((tag) => tag.trim()).filter(Boolean);
    } else if (campo.key === "tipo_pessoa") {
      const tipo = normalizarCabecalho(valor);
      cliente.tipo_pessoa = ["pj", "pessoa juridica"].includes(tipo) ? "PJ" : "PF";
    } else if (campo.key === "status") {
      const status = valor.toLocaleLowerCase("pt-BR");
      if (["ativo", "inativo", "bloqueado"].includes(status)) cliente.status = status as Cliente["status"];
    } else if (campo.key in cliente) {
      Object.assign(cliente, { [campo.key]: valor || null });
    }
  }
  const telefone2Index = cabecalhos.findIndex((cabecalho) => ["telefone 2", "telefone secundario", "telefone secundário"].map(normalizarCabecalho).includes(cabecalho));
  if (telefone2Index >= 0) cliente.telefone2 = valores[telefone2Index]?.trim() || null;
  const statusIndex = cabecalhos.indexOf("status");
  if (statusIndex >= 0) {
    const status = valores[statusIndex]?.trim().toLocaleLowerCase("pt-BR");
    if (["ativo", "inativo", "bloqueado"].includes(status)) cliente.status = status as Cliente["status"];
  }
  return cliente;
}

export function validarCliente(cliente: ClienteFormData, exigirTelefone = true) {
  const erros: string[] = [];
  if (!cliente.nome.trim()) erros.push("Nome é obrigatório.");
  if (exigirTelefone && !cliente.telefone?.trim()) erros.push("Telefone é obrigatório.");
  if (cliente.telefone && !isValidPhone(cliente.telefone)) erros.push("Telefone deve ter DDD e 10 ou 11 dígitos.");
  if (cliente.telefone2 && !isValidPhone(cliente.telefone2)) erros.push("Telefone secundário inválido.");
  if (cliente.whatsapp && !isValidPhone(cliente.whatsapp)) erros.push("WhatsApp inválido.");
  if (cliente.email && !isValidEmail(cliente.email)) erros.push("E-mail inválido.");
  if (cliente.documento) {
    const valido = cliente.tipo_pessoa === "PJ" ? isValidCNPJ(cliente.documento) : isValidCPF(cliente.documento);
    if (!valido) erros.push(cliente.tipo_pessoa === "PJ" ? "CNPJ inválido." : "CPF inválido.");
  }
  if (cliente.status === "bloqueado" && !cliente.motivo_bloqueio?.trim()) erros.push("Informe o motivo do bloqueio.");
  return erros;
}

export function parseClientesCsv(texto: string): ClienteImportacaoLinha[] {
  const tabela = parseCSV(texto);
  if (tabela.length < 2) throw new Error("O arquivo precisa conter cabeçalho e ao menos uma linha.");
  const cabecalhos = tabela[0].map(normalizarCabecalho);
  const temNome = IMPORT_FIELDS.find((campo) => campo.key === "nome")!.aliases.some((alias) => cabecalhos.includes(normalizarCabecalho(alias)));
  if (!temNome) throw new Error("Não encontrei a coluna obrigatória Nome no cabeçalho.");
  if (tabela.length - 1 > 500) throw new Error("Importe no máximo 500 registros por arquivo para garantir uma gravação única.");

  const vistos = new Map<string, number>();
  return tabela.slice(1).map((valores, indice) => {
    const cliente = valoresImportados(cabecalhos, valores);
    const erros = validarCliente(cliente);
    const tipoAliases = IMPORT_FIELDS.find((campo) => campo.key === "tipo_pessoa")!.aliases.map(normalizarCabecalho);
    const tipoIndex = cabecalhos.findIndex((cabecalho) => tipoAliases.includes(cabecalho));
    if (tipoIndex >= 0 && !["pf", "pj", "pessoa fisica", "pessoa juridica"].includes(normalizarCabecalho(valores[tipoIndex] ?? ""))) {
      erros.push("Tipo de pessoa deve ser PF ou PJ.");
    }
    const statusAliases = IMPORT_FIELDS.find((campo) => campo.key === "status")!.aliases.map(normalizarCabecalho);
    const statusIndex = cabecalhos.findIndex((cabecalho) => statusAliases.includes(cabecalho));
    if (statusIndex >= 0 && !["ativo", "inativo", "bloqueado"].includes(valores[statusIndex]?.trim().toLocaleLowerCase("pt-BR") ?? "")) {
      erros.push("Status deve ser ativo, inativo ou bloqueado.");
    }
    const documento = onlyDigits(cliente.documento);
    const email = cliente.email?.trim().toLocaleLowerCase("pt-BR") ?? "";
    const telefones = [cliente.telefone, cliente.telefone2, cliente.whatsapp]
      .map((valor) => onlyDigits(valor).slice(-11))
      .filter((valor) => valor.length >= 10);
    const chaves = [
      documento && `doc:${documento}`,
      email && `email:${email}`,
      ...telefones.map((telefone) => `tel:${telefone}`),
    ].filter(Boolean) as string[];
    let duplicado: string | null = null;
    for (const chave of chaves) {
      const linhaOriginal = vistos.get(chave);
      if (linhaOriginal) {
        duplicado = `Duplicado no arquivo (linha ${linhaOriginal}).`;
        break;
      }
    }
    for (const chave of chaves) vistos.set(chave, indice + 2);
    return { linha: indice + 2, cliente, erros, duplicado };
  });
}

export function descreverDuplicidades(cliente: ClienteFormData, existentes: Cliente[]) {
  return findDuplicates(cliente, existentes).map(({ cliente: existente, motivo }) => `${existente.nome} (${motivo})`);
}

export function serializeClientesCsv(clientes: Cliente[]) {
  return toCSV([EXPORT_HEAD, ...clientes.map(exportRow)]);
}