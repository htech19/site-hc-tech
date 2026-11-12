-- =====================================================
-- MIGRATION: SISTEMA DE GESTAO FINANCEIRA HC TECH
-- Adiciona campos financeiros aos orcamentos e OS
-- =====================================================

-- 1. Tabela de movimentacoes de estoque (historico)
CREATE TABLE IF NOT EXISTS estoque_movimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  estoque_id UUID NOT NULL REFERENCES estoque(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER NOT NULL,
  quantidade_final INTEGER NOT NULL,
  motivo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar campos financeiros a orcamentos
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS custo_pecas DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS frete_aquisicao DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS custos_adicionais DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS custo_total_operacao DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS valor_venda_pecas DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS valor_mao_obra DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS acrescimo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS valor_final DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS lucro_bruto DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS mensagem_cliente TEXT;

-- 3. Adicionar campos financeiros a ordens_servico
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS custo_pecas DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS frete_aquisicao DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS custos_adicionais DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS custo_total_operacao DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS valor_venda_pecas DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS valor_mao_obra DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS acrescimo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS lucro_bruto DECIMAL(10,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(5,2) DEFAULT 0;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;
