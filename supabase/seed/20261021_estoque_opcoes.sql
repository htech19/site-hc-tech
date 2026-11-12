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
