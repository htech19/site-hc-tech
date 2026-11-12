-- =============================================================================
-- Estoque: colunas de CATEGORIA e SUBCATEGORIA (aditiva, idempotente)
-- =============================================================================
-- Objetivo: permitir classificar o item de estoque pelo "tipo de item" escolhido
-- em cards no cadastro (catálogo §4.1–§4.12 + estágios de aparelho de cliente
-- do §2A da especificação do ERP de Estoque).
--
-- Regras preservadas:
-- * Nenhuma coluna existente é removida ou renomeada; linhas existentes ficam
--   intactas (ambas as colunas são ANULÁVEIS e sem default).
-- * A política RLS `Users manage own estoque` (auth.uid() = user_id) cobre a
--   tabela inteira — nada muda em segurança.
-- * Nenhum dado fictício: categorias são gravadas apenas pelo usuário.
--
-- Pode ser aplicada mais de uma vez (IF NOT EXISTS).
-- =============================================================================

alter table public.estoque
  add column if not exists categoria text,
  add column if not exists subcategoria text;

comment on column public.estoque.categoria is
  'Slug do tipo de item escolhido em cards (ex.: telas, acessorios, aparelho_cliente). Categorias: src/sistema/data/categoriasEstoque.ts';
comment on column public.estoque.subcategoria is
  'Subcategoria/opção específica dentro do grupo de categoria escolhido.';
