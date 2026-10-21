// Monta supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql a partir da migration e dos
// seeds. Evita transcrever ~57 KB de SQL à mão (risco de erro de digitação).
// Uso: node scripts/gerar-aplicar-estoque.mjs
import { readFileSync, writeFileSync, statSync } from "node:fs";

const mig = readFileSync("supabase/migrations/20261021000000_estoque_produtos_catalogos.sql", "utf8");
const ops = readFileSync("supabase/seed/20261021_estoque_opcoes.sql", "utf8");
const prod = readFileSync("supabase/seed/20261021_produtos_reais_loja.sql", "utf8");

const header = [
  "-- =============================================================================",
  "-- APLICAR ESTOQUE (MIGRATION + SEEDS) NO SQL EDITOR DO SUPABASE — PROJETO REAL",
  "-- =============================================================================",
  "-- PROJETO ALVO: fiwbbhrrkongcryyqjmv (onde a aplicacao roda, lido de VITE_SUPABASE_URL)",
  "--   A integracao OAuth so alcanca o projeto chllhailtkuffciaanlx (403 no real),",
  "--   por isso este script e para colar manualmente no Dashboard do projeto real.",
  "--",
  "-- O QUE ESTE ARQUIVO FAZ (tudo aditivo e idempotente — roda N vezes sem quebrar):",
  "--   1) estoque: colunas de PRODUTO (sku, marca, modelo, preco_venda, custo,",
  "--      fornecedor, localizacao, unidade, ativo) — nada existente e removido;",
  "--      RLS e dados intactos.",
  "--   2) estoque_opcoes: listas suspensas centralizadas (marcas, proprietarios,",
  "--      canais, subcategorias...) com RLS proprio.",
  "--   3) estoque_compatibilidade: uma peca compativel com VARIOS aparelhos.",
  "--   4) estoque_movimentos: historico de entrada/saida (preenchido por trigger).",
  "--   5) SEED de opcoes (93) e dos 187 PRODUTOS REAIS da loja (tabela site nova).",
  "--      Custo/quantidade NAO inventados: custo=NULL, quantidade=0 + REVISAR na",
  "--      observacao; precos sob consulta/faixa ficam NULL com pendencia.",
  "--",
  "-- COMO USAR",
  "--   1. Supabase -> SQL Editor -> New query (projeto fiwbbhrrkongcryyqjmv).",
  "--   2. Cole TODO o conteudo e clique Run.",
  "--   3. Confira o bloco VERIFICACAO no final (totais esperados).",
  "-- =============================================================================",
  "",
  "",
].join("\n");

const verify = [
  "",
  "-- =============================================================================",
  "-- VERIFICACAO (rodar junto; mostra os totais esperados)",
  "-- =============================================================================",
  "select",
  "  (select count(*) from public.estoque) as total_produtos,",
  "  (select count(*) from public.estoque where preco_venda is null) as preco_pendente,",
  "  (select count(*) from public.estoque_opcoes) as total_opcoes,",
  "  (select count(*) from public.estoque_compatibilidade) as total_compat,",
  "  (select count(*) from public.estoque_movimentos) as total_movimentos;",
  "",
].join("\n");

const destino = "supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql";
writeFileSync(destino, header + mig + "\n\n" + ops + "\n\n" + prod + verify);
console.log("gerado:", destino, "-", statSync(destino).size, "bytes");
