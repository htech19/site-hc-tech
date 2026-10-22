-- =============================================================================
-- APLICAR ESTOQUE (PREFLIGHT + MIGRATIONS + SEEDS) NO SQL EDITOR — PROJETO REAL
-- =============================================================================
-- PROJETO ALVO: fiwbbhrrkongcryyqjmv (onde a aplicacao roda, lido de VITE_SUPABASE_URL)
--   A integracao OAuth desta sessao so alcanca o projeto chllhailtkuffciaanlx (403 no real),
--   por isso este script e para aplicar no SQL Editor do projeto real.
--
-- O QUE ESTE ARQUIVO FAZ (tudo aditivo e idempotente — roda N vezes sem quebrar):
--   0) PREFLIGHT: garante a tabela `estoque` no formato final (cobre os 3
--      estados possíveis do banco: sem tabela / tabela da 0003 / tabela da 0004).
--   1) categoria + subcategoria (migration 20261020000000).
--   2) proprietario + canal_de_venda (migration 20261020001000) — este ALTER
--      NUNCA foi aplicado no projeto real; sem ele o INSERT falha.
--   3) colunas de produto (sku, marca, modelo, preco_venda, custo, fornecedor,
--      localizacao, unidade, ativo) + estoque_opcoes + estoque_compatibilidade
--      + estoque_movimentos + trigger de movimentacao (migration 20261021000000).
--   4) SEED: 93 opcoes de cadastro + 187 PRODUTOS REAIS da loja.
--      Custo/quantidade NAO inventados: custo=NULL, quantidade=0 + REVISAR na
--      observacao; precos sob consulta/faixa ficam NULL com pendencia.
--
-- NADA EXISTENTE E REMOVIDO: nenhuma coluna/tabela e dropada, nenhuma linha e
-- apagada, nenhuma policy e alterada fora do padrao auth.uid() = user_id.
--
-- COMO USAR
--   1. Supabase -> SQL Editor -> New query (projeto fiwbbhrrkongcryyqjmv).
--   2. Cole TODO o conteudo deste arquivo e clique Run.
--   3. Confira o bloco VERIFICACAO no final (totais esperados).
--   4. Pode rodar quantas vezes quiser — e idempotente.
-- =============================================================================



-- =============================================================================
-- PREFLIGHT
-- =============================================================================
-- =============================================================================
-- PREFLIGHT — estado mínimo garantido antes das migrations (idempotente)
-- =============================================================================
-- O projeto real (`fiwbbhrrkongcryyqjmv`) pode estar em 3 estados diferentes:
--   (a) sem a tabela `estoque`       -> criada aqui no formato final;
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



-- =============================================================================
-- MIGRATION 1/3 — categoria + subcategoria
-- =============================================================================
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



-- =============================================================================
-- MIGRATION 2/3 — proprietario + canal_de_venda (a que nunca chegou ao projeto real)
-- =============================================================================
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



-- =============================================================================
-- MIGRATION 3/3 — colunas de produto + catalogos + trigger de movimentos
-- =============================================================================
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



-- =============================================================================
-- SEED — estoque_opcoes (93 listas centralizadas)
-- =============================================================================
-- =============================================================================
-- SEED — estoque_opcoes (listas centralizadas do Estoque) — idempotente
-- =============================================================================
-- Roda APÓS a migration 20261021000000. Não apaga nada: ON CONFLICT DO NOTHING.
-- user_id: dono do sistema (primeiro usuário de auth.users — no Dashboard o
-- auth.uid() é NULL, então resolvemos explicitamente).
--
-- Fontes:
-- * Proprietários/canais: regra do negócio (§4 do prompt + spec ERP).
-- * Marcas: lista de referência do usuário + marcas REAIS identificadas na
--   tabela da loja (Lehmox, Altomex, Lelong, Logic, Olyps, Eletromex, IT-Blue)
--   + união das bases do orçamento (celular/notebook).
-- * Subcategorias novas: necessárias para classificar os produtos reais sem
--   forçar categorias genéricas (as 226 do catálogo estático continuam).
-- =============================================================================

-- #############################################################################
-- DONO DOS DADOS (user_id) — regra explicita, sem "pegar o mais antigo":
--   1. Se OVERRIDE_DONO tiver um UUID, usa esse UUID.
--   2. Se estiver vazio e o projeto tiver EXATAMENTE 1 usuario em auth.users,
--      usa esse usuario.
--   3. Se houver 2+ usuarios e OVERRIDE_DONO estiver vazio, NAO grava nada e
--      aborta com mensagem pedindo o UUID — evita dados no dono errado.
--   Ver a lista: select id, email, created_at from auth.users order by created_at;
-- #############################################################################
with cfg as (
  select nullif('', '')::uuid as user_id  -- <<< OVERRIDE_DONO (UUID ou '')
),
dono as (
  select coalesce(
    (select user_id from cfg),
    case
      when (select count(*) from auth.users) = 1 then (select id from auth.users)
    end
  ) as user_id
),
opcoes (tipo, valor, referencia) as (
  -- Proprietários (titularidade da mercadoria — nunca confundir com canal)
  values
    ('proprietario', 'HC TECH', null),
    ('proprietario', 'FASTCELL', null),
    ('proprietario', 'MERCADO LIVRE', null),

  -- Canais de venda (canal de comercialização — separado do proprietário)
    ('canal_de_venda', 'Loja física', null),
    ('canal_de_venda', 'Mercado Livre', null),
    ('canal_de_venda', 'WhatsApp', null),
    ('canal_de_venda', 'Site HC TECH', null),
    ('canal_de_venda', 'Venda direta', null),

  -- Unidades de medida
    ('unidade', 'un', null),
    ('unidade', 'cx', null),
    ('unidade', 'par', null),
    ('unidade', 'kit', null),
    ('unidade', 'pç', null),

  -- Situações de item
    ('situacao', 'Novo', null),
    ('situacao', 'Usado bom', null),
    ('situacao', 'Recondicionado', null),
    ('situacao', 'Para peças', null),

  -- Qualidades
    ('qualidade', 'Original', null),
    ('qualidade', 'Premium', null),
    ('qualidade', 'Compatível', null),
    ('qualidade', 'Genérico', null),

  -- Tipos de movimentação
    ('tipo_movimentacao', 'ENTRADA', null),
    ('tipo_movimentacao', 'SAIDA', null),
    ('tipo_movimentacao', 'AJUSTE', null),

  -- -------------------------------------------------------------------------
  -- MARCAS — referência do usuário + marcas REAIS da tabela da loja
  -- -------------------------------------------------------------------------
    ('marca', 'Apple', null), ('marca', 'Samsung', null), ('marca', 'Motorola', null),
    ('marca', 'Xiaomi', null), ('marca', 'Redmi', null), ('marca', 'POCO', null),
    ('marca', 'Realme', null), ('marca', 'Oppo', null), ('marca', 'Vivo', null),
    ('marca', 'Huawei', null), ('marca', 'Honor', null), ('marca', 'LG', null),
    ('marca', 'Nokia', null), ('marca', 'ASUS', null), ('marca', 'Lenovo', null),
    ('marca', 'Dell', null), ('marca', 'HP', null), ('marca', 'Acer', null),
    ('marca', 'MSI', null), ('marca', 'Razer', null), ('marca', 'Microsoft Surface', null),
    ('marca', 'Vaio', null), ('marca', 'Sony', null), ('marca', 'Sony VAIO', null),
    ('marca', 'Compaq', null), ('marca', 'Toshiba', null), ('marca', 'ROG Phone', null),
    ('marca', 'OnePlus', null), ('marca', 'Alcatel', null), ('marca', 'TCL', null),
    ('marca', 'Infinix', null), ('marca', 'Tecno', null), ('marca', 'Itel', null),
    ('marca', 'Positivo', null), ('marca', 'Multilaser', null), ('marca', 'Intelbras', null),
    ('marca', 'JBL', null), ('marca', 'Philips', null), ('marca', 'Havit', null),
    ('marca', 'QCY', null), ('marca', 'Baseus', null), ('marca', 'UGREEN', null),
    ('marca', 'Geonav', null), ('marca', 'Kingston', null), ('marca', 'SanDisk', null),
    ('marca', 'TP-Link', null), ('marca', 'Redragon', null),
    -- Marcas identificadas na tabela REAL da loja (2026-10-21)
    ('marca', 'Kaidi', null), ('marca', 'Lehmox', null), ('marca', 'Altomex', null),
    ('marca', 'Lelong', null), ('marca', 'Logic', null), ('marca', 'Olyps', null),
    ('marca', 'Eletromex', null), ('marca', 'IT-Blue', null),

  -- -------------------------------------------------------------------------
  -- SUBCATEGORIAS NOVAS — exigidas pelos produtos reais (escopo: acessorios)
  -- -------------------------------------------------------------------------
    ('subcategoria', 'Cabos de áudio e vídeo', 'acessorios'),
    ('subcategoria', 'Cabos de força', 'acessorios'),
    ('subcategoria', 'Cabos de rede', 'acessorios'),
    ('subcategoria', 'Cabos de dados', 'acessorios'),
    ('subcategoria', 'Cabos HDMI', 'acessorios'),
    ('subcategoria', 'Periféricos de computador', 'acessorios'),
    ('subcategoria', 'Suportes de TV', 'acessorios'),
    ('subcategoria', 'Lanternas e iluminação', 'acessorios'),
    ('subcategoria', 'Baterias e pilhas', 'acessorios'),
    ('subcategoria', 'Películas de câmera', 'acessorios'),
    ('subcategoria', 'Som automotivo', 'acessorios'),
    ('subcategoria', 'Controles remotos', 'acessorios'),
    ('subcategoria', 'Câmeras de vigilância', 'acessorios'),
    ('subcategoria', 'Drones', 'acessorios')
)
insert into public.estoque_opcoes (user_id, tipo, valor, referencia)
select d.user_id, o.tipo, o.valor, o.referencia
from opcoes o cross join dono d
on conflict (user_id, tipo, coalesce(referencia, ''), lower(btrim(valor)))
  do nothing;

-- FALHA EXPLICITA: sem isso, um projeto com 2+ usuarios terminaria em silencio
-- sem nenhuma opcao gravada (dono nulo) e o erro so apareceria no app.
do $$
declare
  v_total int;
  v_usuarios int;
begin
  select count(*) into v_total from public.estoque_opcoes;
  if v_total = 0 then
    select count(*) into v_usuarios from auth.users;
    raise exception
      'SEED DE OPCOES NAO GRAVOU NADA (% usuario(s) em auth.users). Preencha a linha OVERRIDE_DONO do bloco SEED 1 com o UUID do dono (select id, email from auth.users) e rode novamente.',
      v_usuarios;
  end if;
end $$;



-- =============================================================================
-- SEED — 187 produtos reais da loja
-- =============================================================================
-- =============================================================================
-- SEED — PRODUTOS REAIS DA LOJA HC TECH (tabela "tabela site nova.md") — idempotente
-- =============================================================================
-- Fonte: lista de preços real da loja fornecida pelo usuário (2026-10-21),
-- reorganizada em categorias. Cada linha da lista virou 1 registro de estoque.
--
-- Regras de honestidade aplicadas (prompt §5):
-- * NADA foi inventado. Preço = preço de VENDA informado na lista.
-- * Custo: NÃO informado na tabela → NULL (campo pendente).
-- * Quantidade: NÃO informada na tabela → 0 + "REVISAR" em observacao
--   (a tabela é uma lista de preços, não um inventário contado).
-- * "Sob consulta" → preco_venda NULL + pendência em observacao.
-- * Faixas de preço ("R$ 5,00 a R$ 16,00") → preco_venda NULL + pendência.
-- * Produtos agrupados com "cada" (ex.: LEF-1217/1030/1057) → registros
--   SEPARADOS por SKU (não presumir que são o mesmo produto).
-- * Marca do PRODUTO só quando inequívoca no código (KD/KNC→Kaidi? NÃO:
--   KD-752/KD-632 são Kaidi pela tabela, mas KNC-828 não tem marca
--   confirmada → marca NULL e pendência). Marca do APARELHO COMPATÍVEL
--   (ex.: iPhone, Samsung TV) vai em estoque_compatibilidade.
--
-- Roda APÓS a migration 20261021000000. user_id = dono do sistema.
-- Dedup por (user_id, sku) quando há SKU, senão por (user_id, aparelho).
-- =============================================================================

-- #############################################################################
-- DONO DOS DADOS (user_id) — mesma regra do seed de opcoes:
--   1. OVERRIDE_DONO com UUID -> usa esse UUID.
--   2. vazio + EXATAMENTE 1 usuario em auth.users -> usa esse usuario.
--   3. vazio + 2 ou mais usuarios -> NAO grava nada e aborta com mensagem.
--   Use o MESMO UUID em OVERRIDE_DONO aqui e no bloco SEED 1 (opcoes), senao
--   as listas e os produtos ficam em donos diferentes.
-- #############################################################################
with cfg as (
  select nullif('', '')::uuid as user_id  -- <<< OVERRIDE_DONO (UUID ou '')
),
dono as (
  select coalesce(
    (select user_id from cfg),
    case
      when (select count(*) from auth.users) = 1 then (select id from auth.users)
    end
  ) as user_id
),
produtos (
  aparelho, categoria, subcategoria, sku, marca, modelo,
  preco_venda, quantidade, observacao, compat_marca, compat_modelo
) as (
  -- -----------------------------------------------------------------------
  -- 🎧 ÁUDIO (Fones, Headsets e Caixas de Som)
  -- -----------------------------------------------------------------------
  values
    ('Fone de Ouvido com Fio LEF-1217', 'acessorios', 'Fones com fio', 'LEF-1217', null, 'LEF-1217', 3.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone de Ouvido com Fio LEF-1030', 'acessorios', 'Fones com fio', 'LEF-1030', null, 'LEF-1030', 3.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone de Ouvido com Fio LEF-1057', 'acessorios', 'Fones com fio', 'LEF-1057', null, 'LEF-1057', 3.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone de Ouvido com Fio LE-295', 'acessorios', 'Fones com fio', 'LE-295', null, 'LE-295', 3.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone de Ouvido com Fio ST-1020', 'acessorios', 'Fones com fio', 'ST-1020', null, 'ST-1020', 3.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone de Ouvido HD Estéreo LEF-1002', 'acessorios', 'Fones com fio', 'LEF-1002', null, 'LEF-1002', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone de Ouvido Bluetooth P9', 'acessorios', 'Fones Bluetooth', 'P9', null, 'P9', 22.00, 0, 'REVISAR: quantidade não informada. Marca do produto não confirmada (P9 é modelo genérico).', null, null),
    ('Headset de Gatinho LEF-1058', 'acessorios', 'Headsets', 'LEF-1058', null, 'LEF-1058', 25.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone Bluetooth KNC-5601', 'acessorios', 'Fones Bluetooth', 'KNC-5601', null, 'KNC-5601', 24.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Fone Bluetooth KD-788', 'acessorios', 'Fones Bluetooth', 'KD-788', 'Kaidi', 'KD-788', 27.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone Bluetooth LE-391-1', 'acessorios', 'Fones Bluetooth', 'LE-391-1', null, 'LE-391-1', 28.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone Bluetooth KNC-5602', 'acessorios', 'Fones Bluetooth', 'KNC-5602', null, 'KNC-5602', 32.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Fone Bluetooth KNC-5603', 'acessorios', 'Fones Bluetooth', 'KNC-5603', null, 'KNC-5603', 32.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Fone Bluetooth J-90 Pro', 'acessorios', 'Fones Bluetooth', 'J-90 Pro', null, 'J-90 Pro', 35.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Fone Bluetooth KD-790', 'acessorios', 'Fones Bluetooth', 'KD-790', 'Kaidi', 'KD-790', 36.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone Bluetooth LE-366B', 'acessorios', 'Fones Bluetooth', 'LE-366B', null, 'LE-366B', 38.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone Bluetooth LE-362', 'acessorios', 'Fones Bluetooth', 'LE-362', null, 'LE-362', 38.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fone Bluetooth LE-365', 'acessorios', 'Fones Bluetooth', 'LE-365', null, 'LE-365', 38.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixinha de Som KNC-826', 'acessorios', 'Caixas de som Bluetooth', 'KNC-826', null, 'KNC-826', 38.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Headset Bluetooth Kaidi KD-752', 'acessorios', 'Headsets', 'KD-752', 'Kaidi', 'KD-752', 46.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som KNC-828', 'acessorios', 'Caixas de som Bluetooth', 'KNC-828', null, 'KNC-828', 48.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Caixinha de Som KNC-827', 'acessorios', 'Caixas de som Bluetooth', 'KNC-827', null, 'KNC-827', 54.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Fone TWS Auricular Kaidi KD-7026', 'acessorios', 'Fones TWS', 'KD-7026', 'Kaidi', 'KD-7026', 60.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Headphone Bluetooth KD-750', 'acessorios', 'Headsets', 'KD-750', 'Kaidi', 'KD-750', 63.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Headset Gamer Kaidi KD-632', 'acessorios', 'Headsets', 'KD-632', 'Kaidi', 'KD-632', 100.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixinha de Som LES-887', 'acessorios', 'Caixas de som Bluetooth', 'LES-887', null, 'LES-887', 12.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Caixinha de Som LES-888', 'acessorios', 'Caixas de som Bluetooth', 'LES-888', null, 'LES-888', 15.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Caixinha de Som LES-Q3', 'acessorios', 'Caixas de som Bluetooth', 'LES-Q3', null, 'LES-Q3', 22.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Alto-falante LEY-1916', 'acessorios', 'Caixas de som Bluetooth', 'LEY-1916', 'Lehmox', 'LEY-1916', 28.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixinha de Som AL-652', 'acessorios', 'Caixas de som Bluetooth', 'AL-652', 'Altomex', 'AL-652', 31.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixinha de Som AL-958', 'acessorios', 'Caixas de som Bluetooth', 'AL-958', 'Altomex', 'AL-958', 36.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som AL-8999', 'acessorios', 'Caixas de som Bluetooth', 'AL-8999', 'Altomex', 'AL-8999', 78.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som AL-3829', 'acessorios', 'Caixas de som Bluetooth', 'AL-3829', 'Altomex', 'AL-3829', 90.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som AL-9999', 'acessorios', 'Caixas de som Bluetooth', 'AL-9999', 'Altomex', 'AL-9999', 120.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som KD-821', 'acessorios', 'Caixas de som Bluetooth', 'KD-821', 'Kaidi', 'KD-821', 84.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som KD-850', 'acessorios', 'Caixas de som Bluetooth', 'KD-850', 'Kaidi', 'KD-850', 156.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som KD-833', 'acessorios', 'Caixas de som Bluetooth', 'KD-833', 'Kaidi', 'KD-833', 250.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Boombox Eletromex 50W', 'acessorios', 'Caixas de som Bluetooth', 'Boombox 50W', 'Eletromex', 'Boombox 50W', 110.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Caixa de Som para Carro 20W', 'acessorios', 'Som automotivo', 'Carro 20W', null, 'Carro 20W', 83.00, 0, 'REVISAR: quantidade não informada na lista. Marca não informada.', null, null),
    ('Caixa de Som AM-552 3000W', 'acessorios', 'Caixas de som Bluetooth', 'AM-552', null, 'AM-552', 131.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Caixa de Som X1', 'acessorios', 'Caixas de som Bluetooth', 'X1', null, 'X1', 12.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),

  -- -----------------------------------------------------------------------
  -- 🔌 CABOS E ADAPTADORES
  -- -----------------------------------------------------------------------
    ('Adaptador P2/Lightning', 'acessorios', 'Adaptadores', null, null, null, 3.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo de Áudio KAIDI P2 para P2 1m KD-29', 'acessorios', 'Cabos de áudio e vídeo', 'KD-29', 'Kaidi', 'KD-29', 20.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cabo de Áudio e Vídeo LEY-64', 'acessorios', 'Cabos de áudio e vídeo', 'LEY-64', 'Lehmox', 'LEY-64', 15.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cabo de Rede/Conexão Altomex Azul', 'acessorios', 'Cabos de rede', null, 'Altomex', null, 25.00, 0, 'REVISAR: quantidade não informada. Sem SKU na lista.', null, null),
    ('Cabo de Força LEY-217', 'acessorios', 'Cabos de força', 'LEY-217', 'Lehmox', 'LEY-217', 5.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cabo HDMI Eletro 4K 2m v2.0', 'acessorios', 'Cabos HDMI', null, null, '4K 2m v2.0', null, 0, 'PENDÊNCIA: preço "sob consulta" na lista. REVISAR: quantidade não informada.', null, null),
    ('Cabo HDMI LEY-10 5m', 'acessorios', 'Cabos HDMI', 'LEY-10', 'Lehmox', 'LEY-10', 14.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Adaptador Lightning para P2 3.5mm LEHMOX LEY-234', 'acessorios', 'Adaptadores', 'LEY-234', 'Lehmox', 'LEY-234', 15.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, 'Apple iPhone (Lightning)'),
    ('Adaptador Dual Lightning Audio & Charge J-008', 'acessorios', 'Adaptadores', 'J-008', null, 'J-008', 20.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB/V8 Sem Silicone', 'acessorios', 'Cabos Micro USB', null, null, null, 4.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/V8 Com Silicone', 'acessorios', 'Cabos Micro USB', null, null, 'Com Silicone', 5.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/V8 2m', 'acessorios', 'Cabos Micro USB', null, null, '2m', 7.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/V8 Padrão', 'acessorios', 'Cabos Micro USB', null, null, 'Padrão', 11.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/V8 3m', 'acessorios', 'Cabos Micro USB', null, null, '3m', 8.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/Tipo-C Sem Silicone', 'acessorios', 'Cabos USB-C', null, null, null, 4.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/Tipo-C Com Silicone', 'acessorios', 'Cabos USB-C', null, null, 'Com Silicone', 5.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/Tipo-C Padrão', 'acessorios', 'Cabos USB-C', null, null, 'Padrão', 11.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo USB/Tipo-C 2m', 'acessorios', 'Cabos USB-C', null, null, '2m', 9.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cabo Tipo-C/Tipo-C', 'acessorios', 'Cabos USB-C', null, null, null, null, 0, 'PENDÊNCIA: faixa de preço R$ 5,00 a R$ 16,00 (varia por modelo) — definir preço unitário. REVISAR: quantidade não informada.', null, null),
    ('Cabo USB/Lightning Sem Silicone', 'acessorios', 'Cabos Lightning', null, null, null, 4.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB/Lightning Com Silicone', 'acessorios', 'Cabos Lightning', null, null, 'Com Silicone', 5.50, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB/Lightning 2m', 'acessorios', 'Cabos Lightning', null, null, '2m', 9.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB/Lightning 3m', 'acessorios', 'Cabos Lightning', null, null, '3m', 11.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB para Lightning LOGIC Timão Corinthians', 'acessorios', 'Cabos Lightning', null, 'Logic', null, 25.00, 0, 'REVISAR: quantidade não informada. Sem SKU na lista.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB para Lightning KAIDI com Tela Digital KD-104A', 'acessorios', 'Cabos Lightning', 'KD-104A', 'Kaidi', 'KD-104A', 30.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, 'Apple iPhone (Lightning)'),
    ('Cabo Tipo-C para Tipo-C KAIDI Turbo PD 60W KD-27', 'acessorios', 'Cabos USB-C', 'KD-27', 'Kaidi', 'KD-27', 35.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cabo Micro USB KAIDI Carregamento Rápido 1m KD-39M', 'acessorios', 'Cabos Micro USB', 'KD-39M', 'Kaidi', 'KD-39M', 25.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cabo USB Tipo-C KAIDI Carregamento Rápido 1m KD-39C', 'acessorios', 'Cabos USB-C', 'KD-39C', 'Kaidi', 'KD-39C', 25.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cabo Tipo-C/Lightning com Mostrador de Watts', 'acessorios', 'Cabos Lightning', null, null, 'Com Mostrador de Watts', null, 0, 'PENDÊNCIA: faixa de preço R$ 6,00 a R$ 17,00 — definir preço unitário. REVISAR: quantidade não informada.', null, 'Apple iPhone (Lightning)'),
    ('Cabo USB/Lightning com Mostrador de Watts', 'acessorios', 'Cabos Lightning', null, null, 'Com Mostrador de Watts', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, 'Apple iPhone (Lightning)'),
    ('Cabo de Dados USB LEY-1527', 'acessorios', 'Cabos de dados', 'LEY-1527', 'Lehmox', 'LEY-1527', 5.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),

  -- -----------------------------------------------------------------------
  -- 🔋 CARREGADORES E FONTES
  -- -----------------------------------------------------------------------
    ('Fonte para LED LEY-220', 'acessorios', 'Fontes', 'LEY-220', 'Lehmox', 'LEY-220', 5.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Carregador Portátil Universal LEHMOX LEY-235', 'acessorios', 'Carregadores', 'LEY-235', 'Lehmox', 'LEY-235', 7.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fonte de Carregamento Duplo USB', 'acessorios', 'Fontes', null, null, 'Duplo USB', 10.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador Veicular KD-501S', 'acessorios', 'Carregadores', 'KD-501S', 'Kaidi', 'KD-501S', 10.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Carregador Veicular KD-501A', 'acessorios', 'Carregadores', 'KD-501A', 'Kaidi', 'KD-501A', 10.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Carregador Rápido Micro/V8', 'acessorios', 'Carregadores', null, null, 'Rápido Micro/V8', 12.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador Rápido Tipo-C', 'acessorios', 'Carregadores', null, null, 'Rápido Tipo-C', 12.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador Rápido Duplo USB', 'acessorios', 'Carregadores', null, null, 'Rápido Duplo USB', 12.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador KD-556C', 'acessorios', 'Carregadores', 'KD-556C', 'Kaidi', 'KD-556C', 12.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Carregador 33W iPhone/Micro(V8)', 'acessorios', 'Carregadores', null, null, '33W iPhone/Micro(V8)', 11.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador 33W iPhone/Lightning', 'acessorios', 'Carregadores', null, null, '33W iPhone/Lightning', 11.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Carregador Turbo iPhone/Lightning', 'acessorios', 'Carregadores', null, null, 'Turbo iPhone/Lightning', 13.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Carregador 50W com Cabo Tipo-C/Tipo-C', 'acessorios', 'Carregadores', null, null, '50W C/C', 13.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador 30W com Cabo Tipo-C/Tipo-C (Entrada USB e Tipo-C)', 'acessorios', 'Carregadores', null, null, '30W C/C', 14.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Fonte de Carregamento com Saída Tipo-C', 'acessorios', 'Fontes', null, null, 'Saída Tipo-C', 15.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Fonte de Carregamento USB e Tipo-C', 'acessorios', 'Fontes', null, null, 'USB e Tipo-C', 16.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador com Cabo Tipo-C/Tipo-C', 'acessorios', 'Carregadores', null, null, 'Cabo C/C', 16.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador Turbo com Cabo Tipo-C', 'acessorios', 'Carregadores', null, null, 'Turbo C', 17.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Carregador Veicular com Cabo USB/Lightning', 'acessorios', 'Carregadores', null, null, 'Veicular USB/Lightning', 17.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Carregador Veicular com Cabo Tipo-C/Lightning', 'acessorios', 'Carregadores', null, null, 'Veicular C/Lightning', 19.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, 'Apple iPhone (Lightning)'),
    ('Fonte Universal LEY-668', 'acessorios', 'Fontes', 'LEY-668', 'Lehmox', 'LEY-668', 17.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Carregador Portátil Universal LEY-27', 'acessorios', 'Carregadores', 'LEY-27', 'Lehmox', 'LEY-27', 25.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Carregador KAIDI Turbo 20W KD-670', 'acessorios', 'Carregadores', 'KD-670', 'Kaidi', 'KD-670', null, 0, 'PENDÊNCIA: preço "sob consulta" na lista. REVISAR: quantidade não informada.', null, null),

  -- -----------------------------------------------------------------------
  -- 📱 POWER BANKS
  -- -----------------------------------------------------------------------
    ('Power Bank 5000mAh KD-951', 'acessorios', 'Power banks', 'KD-951', 'Kaidi', 'KD-951', 36.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 10000mAh KNC-8881', 'acessorios', 'Power banks', 'KNC-8881', null, 'KNC-8881', 46.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Power Bank 10000mAh KD-952', 'acessorios', 'Power banks', 'KD-952', 'Kaidi', 'KD-952', 45.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 10000mAh Genérico', 'acessorios', 'Power banks', null, null, 'Genérico', 58.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Power Bank 10000mAh KD-991', 'acessorios', 'Power banks', 'KD-991', 'Kaidi', 'KD-991', 58.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 10000mAh KD-01P', 'acessorios', 'Power banks', 'KD-01P', 'Kaidi', 'KD-01P', 54.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 10000mAh PB-8901', 'acessorios', 'Power banks', 'PB-8901', null, 'PB-8901', 60.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Power Bank 10000mAh KD-998', 'acessorios', 'Power banks', 'KD-998', 'Kaidi', 'KD-998', 69.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 10000mAh KD-999', 'acessorios', 'Power banks', 'KD-999', 'Kaidi', 'KD-999', 72.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 20000mAh Genérico', 'acessorios', 'Power banks', null, null, 'Genérico 20000mAh', 62.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Power Bank 20000mAh KD-955', 'acessorios', 'Power banks', 'KD-955', 'Kaidi', 'KD-955', 65.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 20000mAh KNC-922', 'acessorios', 'Power banks', 'KNC-922', null, 'KNC-922', 78.00, 0, 'REVISAR: quantidade não informada. Marca não confirmada no cadastro.', null, null),
    ('Power Bank 20000mAh KD-922', 'acessorios', 'Power banks', 'KD-922', 'Kaidi', 'KD-922', 165.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Power Bank 2000mAh Genérico', 'acessorios', 'Power banks', null, null, 'Genérico 2000mAh', 62.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),

  -- -----------------------------------------------------------------------
  -- 💾 ARMAZENAMENTO
  -- -----------------------------------------------------------------------
    ('Cartão de Memória 8GB AL-MO-8', 'acessorios', 'Cartões de memória', 'AL-MO-8', 'Altomex', 'AL-MO-8', 15.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cartão de Memória 8GB Genérico', 'acessorios', 'Cartões de memória', null, null, 'Genérico 8GB', 15.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Pendrive 8GB AL-8U-8', 'acessorios', 'Pendrives', 'AL-8U-8', 'Altomex', 'AL-8U-8', 15.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Pendrive 16GB EL-BU-16', 'acessorios', 'Pendrives', 'EL-BU-16', null, 'EL-BU-16', 18.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Pendrive 32GB Genérico', 'acessorios', 'Pendrives', null, null, 'Genérico 32GB', 19.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cartão de Memória 16GB Genérico', 'acessorios', 'Cartões de memória', null, null, 'Genérico 16GB', 24.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Pendrive 64GB AL-8U-64', 'acessorios', 'Pendrives', 'AL-8U-64', 'Altomex', 'AL-8U-64', 24.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cartão de Memória 32GB Genérico', 'acessorios', 'Cartões de memória', null, null, 'Genérico 32GB', 32.00, 0, 'REVISAR: quantidade não informada. Sem SKU/marca na lista.', null, null),
    ('Cartão de Memória 64GB AL-M-64', 'acessorios', 'Cartões de memória', 'AL-M-64', 'Altomex', 'AL-M-64', 63.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Cartão de Memória 128GB AL-M-128', 'acessorios', 'Cartões de memória', 'AL-M-128', 'Altomex', 'AL-M-128', 81.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Pendrive 128GB LE-PD128', 'acessorios', 'Pendrives', 'LE-PD128', null, 'LE-PD128', 42.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),

  -- -----------------------------------------------------------------------
  -- ⌨️ PERIFÉRICOS DE COMPUTADOR
  -- -----------------------------------------------------------------------
    ('Mouse a Pilha Simples LEY-28', 'acessorios', 'Periféricos de computador', 'LEY-28', 'Lehmox', 'LEY-28', 6.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Mouse com Fio Simples LEY-1512', 'acessorios', 'Periféricos de computador', 'LEY-1512', 'Lehmox', 'LEY-1512', 7.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Mouse com Fio com LED LEY-172', 'acessorios', 'Periféricos de computador', 'LEY-172', 'Lehmox', 'LEY-172', 12.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Mini Teclado LEY-1604', 'acessorios', 'Periféricos de computador', 'LEY-1604', 'Lehmox', 'LEY-1604', 17.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Mini Teclado AL-313', 'acessorios', 'Periféricos de computador', 'AL-313', 'Altomex', 'AL-313', 19.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Teclado Gamer RGB LEY-2088', 'acessorios', 'Periféricos de computador', 'LEY-2088', 'Lehmox', 'LEY-2088', 32.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Teclado Simples LEY-171', 'acessorios', 'Periféricos de computador', 'LEY-171', 'Lehmox', 'LEY-171', 47.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Teclado Simples LEY-177', 'acessorios', 'Periféricos de computador', 'LEY-177', 'Lehmox', 'LEY-177', 50.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Teclado Mecânico RGB LEY-2080', 'acessorios', 'Periféricos de computador', 'LEY-2080', 'Lehmox', 'LEY-2080', 100.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Kit Teclado e Mouse a Pilha LEY-2081', 'acessorios', 'Periféricos de computador', 'LEY-2081', 'Lehmox', 'LEY-2081', 105.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),

  -- -----------------------------------------------------------------------
  -- 📐 SUPORTES
  -- -----------------------------------------------------------------------
    ('Suporte de Celular para Carro LEY-1681', 'acessorios', 'Suportes veiculares', 'LEY-1681', 'Lehmox', 'LEY-1681', 7.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Carro LEY-1650', 'acessorios', 'Suportes veiculares', 'LEY-1650', 'Lehmox', 'LEY-1650', 8.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Carro LEY-1653', 'acessorios', 'Suportes veiculares', 'LEY-1653', 'Lehmox', 'LEY-1653', 8.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Carro IT-Blue LE-014', 'acessorios', 'Suportes veiculares', 'LE-014', 'IT-Blue', 'LE-014', 8.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Carro LEY-1645', 'acessorios', 'Suportes veiculares', 'LEY-1645', 'Lehmox', 'LEY-1645', 9.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Carro LEY-1695', 'acessorios', 'Suportes veiculares', 'LEY-1695', 'Lehmox', 'LEY-1695', 9.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de TV LEY-1642', 'acessorios', 'Suportes de TV', 'LEY-1642', 'Lehmox', 'LEY-1642', 10.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Carro LEY-1694', 'acessorios', 'Suportes veiculares', 'LEY-1694', 'Lehmox', 'LEY-1694', 11.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Moto/Bicicleta LEY-1602', 'acessorios', 'Suportes veiculares', 'LEY-1602', 'Lehmox', 'LEY-1602', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Moto com Fio LEY-2259', 'acessorios', 'Suportes veiculares', 'LEY-2259', 'Lehmox', 'LEY-2259', 12.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Moto com Fio LEY-1665', 'acessorios', 'Suportes veiculares', 'LEY-1665', 'Lehmox', 'LEY-1665', 12.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Moto LEY-2258', 'acessorios', 'Suportes veiculares', 'LEY-2258', 'Lehmox', 'LEY-2258', 10.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Moto LEY-2112', 'acessorios', 'Suportes veiculares', 'LEY-2112', 'Lehmox', 'LEY-2112', 18.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Celular para Moto LEY-1959', 'acessorios', 'Suportes veiculares', 'LEY-1959', 'Lehmox', 'LEY-1959', 19.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),

  -- -----------------------------------------------------------------------
  -- 💡 ILUMINAÇÃO
  -- -----------------------------------------------------------------------
    ('Lanterna LEY-2275', 'acessorios', 'Lanternas e iluminação', 'LEY-2275', 'Lehmox', 'LEY-2275', 8.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Lanterna LEY-1715', 'acessorios', 'Lanternas e iluminação', 'LEY-1715', 'Lehmox', 'LEY-1715', 12.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Lanterna LEY-2221', 'acessorios', 'Lanternas e iluminação', 'LEY-2221', 'Lehmox', 'LEY-2221', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Lâmpada AL-B15', 'acessorios', 'Lanternas e iluminação', 'AL-B15', 'Altomex', 'AL-B15', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Suporte de Lâmpada AL-B1440', 'acessorios', 'Lanternas e iluminação', 'AL-B1440', 'Altomex', 'AL-B1440', 14.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Lanterna AL-B1297', 'acessorios', 'Lanternas e iluminação', 'AL-B1297', 'Altomex', 'AL-B1297', 21.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fita de LED LEY-5050', 'acessorios', 'Lanternas e iluminação', 'LEY-5050', 'Lehmox', 'LEY-5050', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Fita de LED AL-5050RGB', 'acessorios', 'Lanternas e iluminação', 'AL-5050RGB', 'Altomex', 'AL-5050RGB', 25.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Lanterna AL-B1990', 'acessorios', 'Lanternas e iluminação', 'AL-B1990', 'Altomex', 'AL-B1990', 66.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),

  -- -----------------------------------------------------------------------
  -- 🎒 ACESSÓRIOS DIVERSOS
  -- -----------------------------------------------------------------------
    ('Bateria de Lítio 3V LE-BT2025 LEHMOX (cartela)', 'acessorios', 'Baterias e pilhas', 'LE-BT2025', 'Lehmox', 'LE-BT2025', 5.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Película de Câmera Olyps iPhone 13/13 mini', 'acessorios', 'Películas de câmera', null, 'Olyps', null, 10.00, 0, 'REVISAR: quantidade não informada. Sem SKU na lista.', 'Apple', 'iPhone 13 / 13 mini'),
    ('Bastão de Selfie AL-2752', 'acessorios', 'Acessórios diversos', 'AL-2752', 'Altomex', 'AL-2752', 13.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Espelho ST-740', 'acessorios', 'Acessórios diversos', 'ST-740', null, 'ST-740', 18.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Espelho ST-738', 'acessorios', 'Acessórios diversos', 'ST-738', null, 'ST-738', 19.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Máquina de Cabelo AL-2927', 'acessorios', 'Acessórios diversos', 'AL-2927', 'Altomex', 'AL-2927', 23.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Tripé LEY-3110A', 'acessorios', 'Acessórios diversos', 'LEY-3110A', 'Lehmox', 'LEY-3110A', 22.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Tripé LEY-3110B', 'acessorios', 'Acessórios diversos', 'LEY-3110B', 'Lehmox', 'LEY-3110B', 28.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Marmita Elétrica LEY-2200 de Inox', 'acessorios', 'Acessórios diversos', 'LEY-2200', 'Lehmox', 'LEY-2200', 58.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Capa Space Collection iPhone 15 Pro Max', 'acessorios', 'Capas', null, null, 'Space Collection', null, 0, 'PENDÊNCIA: preço "sob consulta" na lista. REVISAR: quantidade não informada.', 'Apple', 'iPhone 15 Pro Max'),

  -- -----------------------------------------------------------------------
  -- 🚗 SOM AUTOMOTIVO E ELETRÔNICOS
  -- -----------------------------------------------------------------------
    ('Controle Remoto FBG-8050', 'acessorios', 'Controles remotos', 'FBG-8050', null, 'FBG-8050', 7.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Controle Remoto TV Smart Toshiba FBG-9025', 'acessorios', 'Controles remotos', 'FBG-9025', null, 'FBG-9025', 10.00, 0, 'REVISAR: quantidade não informada. Marca do controle não informada (compatível Toshiba).', 'Toshiba', 'TV Smart'),
    ('Controle Remoto TV Smart Toshiba FBG-7925', 'acessorios', 'Controles remotos', 'FBG-7925', null, 'FBG-7925', 10.00, 0, 'REVISAR: quantidade não informada. Marca do controle não informada (compatível Toshiba).', 'Toshiba', 'TV Smart'),
    ('Controle Remoto Samsung Smart TV FBG-9007', 'acessorios', 'Controles remotos', 'FBG-9007', null, 'FBG-9007', 11.00, 0, 'REVISAR: quantidade não informada. Marca do controle não informada (compatível Samsung).', 'Samsung', 'Smart TV'),
    ('Controle Ar-Condicionado Lelong LE-7430', 'acessorios', 'Controles remotos', 'LE-7430', 'Lelong', 'LE-7430', 14.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Controle Ar-Condicionado Lelong LE-7437', 'acessorios', 'Controles remotos', 'LE-7437', 'Lelong', 'LE-7437', 18.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Câmera AL-D890', 'acessorios', 'Câmeras de vigilância', 'AL-D890', 'Altomex', 'AL-D890', 40.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Câmera Altomex 5 Antenas', 'acessorios', 'Câmeras de vigilância', null, 'Altomex', '5 Antenas', 62.00, 0, 'REVISAR: quantidade não informada. Sem SKU na lista.', null, null),
    ('Som Automotivo LEY-1854', 'acessorios', 'Som automotivo', 'LEY-1854', 'Lehmox', 'LEY-1854', 62.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('MP5 Automotivo LEY-1852', 'acessorios', 'Som automotivo', 'LEY-1852', 'Lehmox', 'LEY-1852', 69.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Drone AL-2725', 'acessorios', 'Drones', 'AL-2725', 'Altomex', 'AL-2725', 120.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Drone AL-2768', 'acessorios', 'Drones', 'AL-2768', 'Altomex', 'AL-2768', 130.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Som MP5 Player Automotivo LEY-2070', 'acessorios', 'Som automotivo', 'LEY-2070', 'Lehmox', 'LEY-2070', 160.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),
    ('Som Automotivo MP3 LEY-1920', 'acessorios', 'Som automotivo', 'LEY-1920', 'Lehmox', 'LEY-1920', 175.00, 0, 'REVISAR: quantidade não informada na lista. Custo não informado.', null, null),

  -- -----------------------------------------------------------------------
  -- ⌚ SMARTWATCHES
  -- -----------------------------------------------------------------------
    ('Smartwatch KW51 Ultra T', 'acessorios', 'Smartwatches', 'KW51-Ultra-T', null, 'KW51 Ultra T', 39.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch G 5 Mini T', 'acessorios', 'Smartwatches', 'G-5Mini-T', null, 'G 5 Mini T', 39.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch S10 Pro', 'acessorios', 'Smartwatches', 'S10-Pro', null, 'S10 Pro', 39.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch Bei Ultra Mini O', 'acessorios', 'Smartwatches', 'Bei-Ultra-Mini-O', null, 'Bei Ultra Mini O', 98.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch Ultra 4 Pro', 'acessorios', 'Smartwatches', 'Ultra-4-Pro', null, 'Ultra 4 Pro', 115.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch T', 'acessorios', 'Smartwatches', 'Smartwatch-T', null, 'T', 120.00, 0, 'REVISAR: quantidade não informada. Marca/modelo pouco descritivos na lista.', null, null),
    ('Smartwatch 10 Mini', 'acessorios', 'Smartwatches', '10-Mini', null, '10 Mini', 126.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch WL Xmini', 'acessorios', 'Smartwatches', 'WL-Xmini', null, 'WL Xmini', 126.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch S10', 'acessorios', 'Smartwatches', 'S10', null, 'S10', 130.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null),
    ('Smartwatch KW62 Max', 'acessorios', 'Smartwatches', 'KW62-Max', null, 'KW62 Max', 138.00, 0, 'REVISAR: quantidade não informada. Marca não informada na lista.', null, null)
),
inseridos as (
  insert into public.estoque (
    user_id, aparelho, categoria, subcategoria, sku, marca, modelo,
    preco_venda, custo, quantidade, proprietario, canal_de_venda, observacao
  )
  select
    d.user_id, p.aparelho, p.categoria, p.subcategoria, p.sku, p.marca, p.modelo,
    p.preco_venda, null, p.quantidade, 'HC TECH', 'Loja física',
    p.observacao
  from produtos p cross join dono d
  where not exists (
    select 1 from public.estoque e
    where e.user_id = d.user_id
      and (
        (p.sku is not null and e.sku = p.sku)
        or (p.sku is null and e.aparelho = p.aparelho)
      )
  )
  returning id, sku, aparelho
)
-- Compatibilidades (marca/modelo do APARELHO, não do produto)
insert into public.estoque_compatibilidade (user_id, estoque_id, aparelho_marca, aparelho_modelo)
select d.user_id, e.id, p.compat_marca, p.compat_modelo
from produtos p
cross join dono d
join (
  -- Duas fontes de propósito: o snapshot deste statement NÃO enxerga as linhas
  -- que o CTE `inseridos` acabou de gravar. Sem o UNION, um banco vazio (o caso
  -- do projeto real) grava 187 produtos e 0 compatibilidades; com ele, o seed
  -- funciona tanto na primeira execução quanto em re-runs.
  select id, sku, aparelho from inseridos
  union all
  select e2.id, e2.sku, e2.aparelho
  from public.estoque e2
  join dono d2 on e2.user_id = d2.user_id
) e
  on (p.sku is not null and e.sku = p.sku) or (p.sku is null and e.aparelho = p.aparelho)
where p.compat_marca is not null
  and not exists (
    select 1 from public.estoque_compatibilidade c
    where c.estoque_id = e.id
      and lower(btrim(c.aparelho_marca)) = lower(btrim(p.compat_marca))
      and lower(btrim(c.aparelho_modelo)) = lower(btrim(p.compat_modelo))
  );

-- FALHA EXPLICITA: evita terminar em silencio sem produtos (dono nulo por
-- ambiguidade de usuarios).
do $$
declare
  v_total int;
  v_usuarios int;
begin
  select count(*) into v_total from public.estoque;
  if v_total = 0 then
    select count(*) into v_usuarios from auth.users;
    raise exception
      'SEED DE PRODUTOS NAO GRAVOU NADA (% usuario(s) em auth.users). Preencha a linha OVERRIDE_DONO do bloco SEED 2 (mesmo UUID usado no SEED 1) e rode novamente.',
      v_usuarios;
  end if;
end $$;



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
