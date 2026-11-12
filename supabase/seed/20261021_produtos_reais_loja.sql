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
