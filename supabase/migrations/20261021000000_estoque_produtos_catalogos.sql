-- =============================================================================
-- ESTOQUE — COLUNAS DE PRODUTO + CATÁLOGOS CENTRALIZADOS (aditiva, idempotente)
-- =============================================================================
-- Contexto (auditoria 2026-10-21): o módulo de Estoque persistia apenas
-- aparelho/quantidade/defeito/condicao/observacao (+proprietario/canal da
-- migration corretiva). A importação da tabela real da loja exige SKU, preço,
-- custo, fornecedor, marca/modelo separados do "aparelho compatível", além de
-- listas centralizadas no banco (cadastros devem vir do Supabase, não de
-- arrays fixos no frontend) e histórico de movimentações.
--
-- Regras preservadas:
-- * Nenhuma coluna/tabela existente é removida ou renomeada; linhas intactas.
-- * RLS `auth.uid() = user_id` (padrão do projeto) em TODAS as tabelas novas.
-- * Nenhum dado fictício: os seeds vivem em supabase/seed/, não aqui.
-- * Pode ser aplicada mais de uma vez (IF NOT EXISTS em tudo).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) estoque: colunas de produto (mercadoria de venda) — todas anuláveis ou
--    com default, para não quebrar os itens de custódia (aparelho de cliente)
--    já cadastrados.
-- -----------------------------------------------------------------------------
alter table public.estoque
  add column if not exists sku text,
  add column if not exists marca text,
  add column if not exists modelo text,
  add column if not exists preco_venda numeric(12,2),
  add column if not exists custo numeric(12,2),
  add column if not exists fornecedor text,
  add column if not exists localizacao text,
  add column if not exists unidade text not null default 'un',
  add column if not exists ativo boolean not null default true;

comment on column public.estoque.sku is
  'Código interno/fornecedor do produto (ex.: KD-788, LEY-1681). NULL = sem código informado.';
comment on column public.estoque.marca is
  'Marca DO PRODUTO (ex.: JBL, Kaidi, Baseus). NÃO confundir com a marca do aparelho compatível — essa vai em estoque_compatibilidade.';
comment on column public.estoque.modelo is
  'Modelo DO PRODUTO (código comercial quando não houver SKU).';
comment on column public.estoque.preco_venda is
  'Preço de venda informado na tabela real da loja. NULL = preço sob consulta / não informado.';
comment on column public.estoque.custo is
  'Custo de aquisição. NULL = não informado (nunca estimar).';
comment on column public.estoque.fornecedor is
  'Fornecedor informado no cadastro. NULL = não informado.';
comment on column public.estoque.ativo is
  'Desativação lógica: produto antigo sai das listas sem apagar o histórico.';

create index if not exists estoque_produto_idx
  on public.estoque (user_id, sku) where sku is not null;
create index if not exists estoque_categoria_idx
  on public.estoque (user_id, categoria) where categoria is not null;
create index if not exists estoque_marca_idx
  on public.estoque (user_id, marca) where marca is not null;

-- -----------------------------------------------------------------------------
-- 2) estoque_opcoes — cadastro centralizado de TODAS as listas suspensas.
--    `tipo` é aberto (texto) para cobrir categoria, subcategoria, marca,
--    modelo, fornecedor, proprietario, canal_de_venda, qualidade, cor,
--    localizacao, unidade, situacao, tipo_movimentacao, etc.
-- -----------------------------------------------------------------------------
create table if not exists public.estoque_opcoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  valor text NOT NULL,
  -- Para opções com escopo (ex.: subcategoria dentro de uma categoria).
  referencia text,
  ativo boolean NOT NULL default true,
  created_at timestamptz NOT NULL default now(),
  constraint estoque_opcoes_valor_nao_vazio check (length(btrim(valor)) > 0)
);

create unique index if not exists estoque_opcoes_unica
  on public.estoque_opcoes (user_id, tipo, coalesce(referencia, ''), lower(btrim(valor)));

create index if not exists estoque_opcoes_tipo_idx
  on public.estoque_opcoes (user_id, tipo) where ativo;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_opcoes TO authenticated;
GRANT ALL ON public.estoque_opcoes TO service_role;
ALTER TABLE public.estoque_opcoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own estoque_opcoes" ON public.estoque_opcoes;
CREATE POLICY "Users manage own estoque_opcoes" ON public.estoque_opcoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

comment on table public.estoque_opcoes is
  'Listas suspensas centralizadas do Estoque (marcas, subcategorias, fornecedores, proprietários, canais...). Opções antigas são desativadas (ativo=false), nunca apagadas.';

-- -----------------------------------------------------------------------------
-- 3) estoque_compatibilidade — uma peça é compatível com VÁRIOS modelos de
--    aparelho sem duplicar o cadastro do produto.
-- -----------------------------------------------------------------------------
create table if not exists public.estoque_compatibilidade (
  id uuid primary key default gen_random_uuid(),
  user_id uuid NOT NULL,
  estoque_id uuid NOT NULL references public.estoque(id) on delete cascade,
  aparelho_marca text NOT NULL,
  aparelho_modelo text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  constraint estoque_compatibilidade_nao_vazio check (
    length(btrim(aparelho_marca)) > 0 and length(btrim(aparelho_modelo)) > 0
  )
);

create unique index if not exists estoque_compatibilidade_unica
  on public.estoque_compatibilidade (estoque_id, lower(btrim(aparelho_marca)), lower(btrim(aparelho_modelo)));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_compatibilidade TO authenticated;
GRANT ALL ON public.estoque_compatibilidade TO service_role;
ALTER TABLE public.estoque_compatibilidade ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own estoque_compatibilidade" ON public.estoque_compatibilidade;
CREATE POLICY "Users manage own estoque_compatibilidade" ON public.estoque_compatibilidade
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

comment on table public.estoque_compatibilidade is
  'Relação N:N entre produto em estoque e modelos de aparelho compatíveis (peças). Marca/modelo AQUI são do APARELHO, não do produto.';

-- -----------------------------------------------------------------------------
-- 4) estoque_movimentos — histórico de entrada/saída/ajuste por item.
--    O saldo continua em estoque.quantidade; esta tabela é o rastro.
-- -----------------------------------------------------------------------------
create table if not exists public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid NOT NULL,
  estoque_id uuid NOT NULL references public.estoque(id) on delete cascade,
  tipo text NOT NULL,
  quantidade integer NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL default now(),
  constraint estoque_movimentos_tipo check (tipo in ('ENTRADA', 'SAIDA', 'AJUSTE')),
  constraint estoque_movimentos_qtd_positiva check (quantidade > 0)
);

create index if not exists estoque_movimentos_item_idx
  on public.estoque_movimentos (estoque_id, created_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentos TO authenticated;
GRANT ALL ON public.estoque_movimentos TO service_role;
ALTER TABLE public.estoque_movimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own estoque_movimentos" ON public.estoque_movimentos;
CREATE POLICY "Users manage own estoque_movimentos" ON public.estoque_movimentos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

comment on table public.estoque_movimentos is
  'Histórico de movimentações do estoque. Preenchido automaticamente por trigger a partir das mudanças de estoque.quantidade.';

-- -----------------------------------------------------------------------------
-- 5) Trigger: toda criação/mudança de saldo gera o movimento correspondente.
--    SECURITY INVOKER (padrão): o RLS continua valendo para o usuário final.
-- -----------------------------------------------------------------------------
create or replace function public.estoque_registrar_movimento()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.quantidade > 0 then
      insert into public.estoque_movimentos (user_id, estoque_id, tipo, quantidade, motivo)
      values (new.user_id, new.id, 'ENTRADA', new.quantidade, 'Entrada inicial');
    end if;
  elsif tg_op = 'UPDATE' and new.quantidade is distinct from old.quantidade then
    insert into public.estoque_movimentos (user_id, estoque_id, tipo, quantidade, motivo)
    values (
      new.user_id,
      new.id,
      case when new.quantidade > old.quantidade then 'ENTRADA' else 'SAIDA' end,
      abs(new.quantidade - old.quantidade),
      case when new.quantidade > old.quantidade then 'Reposição' else 'Saída' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists estoque_movimento_trigger on public.estoque;
create trigger estoque_movimento_trigger
  after insert or update on public.estoque
  for each row execute function public.estoque_registrar_movimento();

-- -----------------------------------------------------------------------------
-- 6) Recarrega o schema cache do PostgREST.
-- -----------------------------------------------------------------------------
notify pgrst, 'reload schema';
