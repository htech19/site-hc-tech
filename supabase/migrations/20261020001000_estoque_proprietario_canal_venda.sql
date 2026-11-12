-- =============================================================================
-- Estoque: PROPRIETARIO e CANAL DE VENDA (corretiva — aditiva, idempotente)
-- =============================================================================
-- Contexto (auditoria 2026-10-20): a migration 0003 registrou a criação de
-- `estoque` e o ALTER de `proprietario`/`canal_de_venda`, mas esse ALTER foi
-- executado manualmente no projeto `chllhailtkuffciaanlx` e NUNCA chegou ao
-- projeto em que a aplicação roda (`fiwbbhrrkongcryyqjmv`, lido de
-- VITE_SUPABASE_URL). Sintoma: toda INSERT em `estoque` falhava com 400
-- ("column estoque.proprietario does not exist") — módulo de entrada quebrado
-- em produção.
--
-- Esta migration torna o estado correto reproduzível em qualquer projeto:
-- * `proprietario` / `canal_de_venda`: NOT NULL com default (a table está
--   vazia; defaults iguais aos do formulário — store.ts).
-- * `categoria` / `subcategoria`: anuláveis (migration 20261020000000).
-- * Nenhuma coluna removida; RLS `Users manage own estoque` inalterado.
--
-- Pode ser aplicada mais de uma vez (IF NOT EXISTS).
-- =============================================================================

alter table public.estoque
  add column if not exists proprietario text not null default 'HC TECH',
  add column if not exists canal_de_venda text not null default 'Loja física';

alter table public.estoque
  add column if not exists categoria text,
  add column if not exists subcategoria text;

comment on column public.estoque.proprietario is
  'Dono da mercadoria: HC TECH, FASTCELL, MERCADO LIVRE (campo separado do canal de venda).';
comment on column public.estoque.canal_de_venda is
  'Canal onde o item é vendido: Loja física, Mercado Livre, WhatsApp, Site, Venda direta, Outros.';
comment on column public.estoque.categoria is
  'Slug do tipo de item escolhido em cards (ex.: telas, acessorios, aparelho_cliente). Categorias: src/sistema/data/categoriasEstoque.ts';
comment on column public.estoque.subcategoria is
  'Subcategoria/opção específica dentro do grupo de categoria escolhido.';
