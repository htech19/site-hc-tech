// Monta supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql a partir do preflight, das
// migrations e dos seeds. Evita transcrever ~60 KB de SQL à mão (risco de erro
// de digitação) e garante que TODA migration necessária entre no arquivo.
//
// Uso: node scripts/gerar-aplicar-estoque.mjs
import { readFileSync, writeFileSync, statSync } from "node:fs";

const ler = (p) => readFileSync(p, "utf8");

// -----------------------------------------------------------------------------
// PREFLIGHT — garante que a tabela `estoque` exista e esteja no formato final
// antes das demais migrations. Idempotente: não toca em tabela existente.
// -----------------------------------------------------------------------------
const preflight = `-- =============================================================================
-- PREFLIGHT — estado mínimo garantido antes das migrations (idempotente)
-- =============================================================================
-- O projeto real (\`fiwbbhrrkongcryyqjmv\`) pode estar em 3 estados diferentes:
--   (a) sem a tabela \`estoque\`       -> criada aqui no formato final;
--   (b) com a tabela da migration 0003 (sem proprietario/canal_de_venda);
--   (c) com a tabela da migration 20261008000000 (com as colunas NOT NULL
--       sem default).
-- Este bloco cobre os 3 casos sem remover nem renomear nada.
-- =============================================================================

create table if not exists public.estoque (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  proprietario text not null default 'HC TECH',
  canal_de_venda text not null default 'Loja física',
  aparelho text not null,
  quantidade integer not null default 1 check (quantidade >= 0),
  defeito text,
  condicao text,
  observacao text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.estoque to authenticated;
grant all on public.estoque to service_role;
alter table public.estoque enable row level security;
drop policy if exists "Users manage own estoque" on public.estoque;
create policy "Users manage own estoque" on public.estoque for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tabela preexistente NÃO ganha colunas por "create table if not exists":
-- as duas colunas podem faltar (é exatamente o estado do projeto real), então
-- são criadas aqui antes de qualquer "alter column" — sem isso o script aborta
-- com 42703 "column proprietario does not exist".
alter table public.estoque
  add column if not exists proprietario text not null default 'HC TECH',
  add column if not exists canal_de_venda text not null default 'Loja física';

-- Defaults também nas tabelas que já existiam sem eles (o INSERT do app
-- sempre envia os dois campos, mas o default evita falha em inserts diretos).
alter table public.estoque alter column proprietario set default 'HC TECH';
alter table public.estoque alter column canal_de_venda set default 'Loja física';
`;

// -----------------------------------------------------------------------------
// MIGRATIONS — todas as que o seed depende, na ordem cronológica.
// -----------------------------------------------------------------------------
const migrations = [
  ["supabase/migrations/20261020000000_estoque_categoria.sql", "MIGRATION 1/3 — categoria + subcategoria"],
  ["supabase/migrations/20261020001000_estoque_proprietario_canal_venda.sql", "MIGRATION 2/3 — proprietario + canal_de_venda (a que nunca chegou ao projeto real)"],
  ["supabase/migrations/20261021000000_estoque_produtos_catalogos.sql", "MIGRATION 3/3 — colunas de produto + catalogos + trigger de movimentos"],
];

const seeds = [
  ["supabase/seed/20261021_estoque_opcoes.sql", "SEED — estoque_opcoes (93 listas centralizadas)"],
  ["supabase/seed/20261021_produtos_reais_loja.sql", "SEED — 187 produtos reais da loja"],
];

const header = [
  "-- =============================================================================",
  "-- APLICAR ESTOQUE (PREFLIGHT + MIGRATIONS + SEEDS) NO SQL EDITOR — PROJETO REAL",
  "-- =============================================================================",
  "-- PROJETO ALVO: fiwbbhrrkongcryyqjmv (onde a aplicacao roda, lido de VITE_SUPABASE_URL)",
  "--   A integracao OAuth desta sessao so alcanca o projeto chllhailtkuffciaanlx (403 no real),",
  "--   por isso este script e para aplicar no SQL Editor do projeto real.",
  "--",
  "-- O QUE ESTE ARQUIVO FAZ (tudo aditivo e idempotente — roda N vezes sem quebrar):",
  "--   0) PREFLIGHT: garante a tabela `estoque` no formato final (cobre os 3",
  "--      estados possíveis do banco: sem tabela / tabela da 0003 / tabela da 0004).",
  "--   1) categoria + subcategoria (migration 20261020000000).",
  "--   2) proprietario + canal_de_venda (migration 20261020001000) — este ALTER",
  "--      NUNCA foi aplicado no projeto real; sem ele o INSERT falha.",
  "--   3) colunas de produto (sku, marca, modelo, preco_venda, custo, fornecedor,",
  "--      localizacao, unidade, ativo) + estoque_opcoes + estoque_compatibilidade",
  "--      + estoque_movimentos + trigger de movimentacao (migration 20261021000000).",
  "--   4) SEED: 93 opcoes de cadastro + 187 PRODUTOS REAIS da loja.",
  "--      Custo/quantidade NAO inventados: custo=NULL, quantidade=0 + REVISAR na",
  "--      observacao; precos sob consulta/faixa ficam NULL com pendencia.",
  "--",
  "-- NADA EXISTENTE E REMOVIDO: nenhuma coluna/tabela e dropada, nenhuma linha e",
  "-- apagada, nenhuma policy e alterada fora do padrao auth.uid() = user_id.",
  "--",
  "-- COMO USAR",
  "--   1. Supabase -> SQL Editor -> New query (projeto fiwbbhrrkongcryyqjmv).",
  "--   2. Cole TODO o conteudo deste arquivo e clique Run.",
  "--   3. Confira o bloco VERIFICACAO no final (totais esperados).",
  "--   4. Pode rodar quantas vezes quiser — e idempotente.",
  "-- =============================================================================",
  "",
  "",
].join("\n");

const bloco = (titulo, corpo) =>
  `\n-- =============================================================================\n-- ${titulo}\n-- =============================================================================\n${corpo}\n`;

const verificar = `
-- =============================================================================
-- VERIFICACAO (o resultado esperado vem logo abaixo de cada item)
-- =============================================================================
select
  (select count(*) from public.estoque) as total_produtos_esperado_187,
  (select count(*) from public.estoque where preco_venda is null) as preco_pendente_esperado_5,
  (select count(*) from public.estoque where custo is not null) as custo_informado_esperado_0,
  (select count(*) from public.estoque where quantidade <> 0) as com_saldo_esperado_0,
  (select count(*) from public.estoque_opcoes) as total_opcoes_esperado_93,
  (select count(*) from public.estoque_compatibilidade) as total_compat_esperado_5,
  (select count(*) from public.estoque_movimentos) as total_movimentos_esperado_0;

-- Nenhum duplicado de produto (SKU repetido no mesmo dono):
select sku, count(*)
from public.estoque
where sku is not null
group by sku
having count(*) > 1;

-- Colunas de produto presentes (todas devem aparecer):
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'estoque'
order by ordinal_position;
`;

const partes = [header, bloco("PREFLIGHT", preflight)];
for (const [arquivo, titulo] of migrations) {
  partes.push(bloco(titulo, ler(arquivo)));
}
for (const [arquivo, titulo] of seeds) {
  partes.push(bloco(titulo, ler(arquivo)));
}
partes.push(verificar);

const destino = "supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql";
writeFileSync(destino, partes.join("\n"));
console.log("gerado:", destino, "-", statSync(destino).size, "bytes");
