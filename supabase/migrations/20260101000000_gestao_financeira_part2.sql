-- 4. Tabelas auxiliares para itens do orcamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('PECA', 'SERVICO')),
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  custo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  fornecedor TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcamento_frete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  rateio_pecas JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Politicas RLS
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_frete ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver orcamentos" ON orcamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios podem inserir orcamentos" ON orcamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios podem atualizar orcamentos" ON orcamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios podem deletar orcamentos" ON orcamentos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios podem ver orcamento_itens" ON orcamento_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios podem inserir orcamento_itens" ON orcamento_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios podem atualizar orcamento_itens" ON orcamento_itens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios podem deletar orcamento_itens" ON orcamento_itens FOR DELETE TO authenticated USING (true);
