-- =============================================================================
-- FOTOS DE ENTRADA E SAÍDA - ORDENS DE SERVIÇO E SOLICITAÇÕES
-- =============================================================================
-- Adiciona campos para fotos de entrada (quando o aparelho chega) e saída 
-- (quando o aparelho é entregue) nas tabelas de OS e Solicitações.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) TABELA ordens_servico: fotos de entrada e saída
-- -----------------------------------------------------------------------------
ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS foto_entrada text,
  ADD COLUMN IF NOT EXISTS foto_saida text;

COMMENT ON COLUMN public.ordens_servico.foto_entrada IS 'Foto do aparelho no momento da entrada (quando recebido pelo cliente)';
COMMENT ON COLUMN public.ordens_servico.foto_saida IS 'Foto do aparelho no momento da saída (após conclusão do serviço)';

-- -----------------------------------------------------------------------------
-- 2) TABELA orcamento_solicitacoes: fotos de entrada e saída
-- -----------------------------------------------------------------------------
ALTER TABLE public.orcamento_solicitacoes
  ADD COLUMN IF NOT EXISTS foto_entrada text,
  ADD COLUMN IF NOT EXISTS foto_saida text;

COMMENT ON COLUMN public.orcamento_solicitacoes.foto_entrada IS 'Foto do aparelho no momento da entrada (quando recebido pelo cliente)';
COMMENT ON COLUMN public.orcamento_solicitacoes.foto_saida IS 'Foto do aparelho no momento da saída (após conclusão do serviço)';

-- -----------------------------------------------------------------------------
-- 3) RLS para as novas colunas (já habilitado nas tabelas, apenas garantir)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ordens_servico' AND policyname = 'Users can view own orders'
  ) THEN
    CREATE POLICY 'Users can view own orders' ON public.ordens_servico
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ordens_servico' AND policyname = 'Users can insert own orders'
  ) THEN
    CREATE POLICY 'Users can insert own orders' ON public.ordens_servico
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ordens_servico' AND policyname = 'Users can update own orders'
  ) THEN
    CREATE POLICY 'Users can update own orders' ON public.ordens_servico
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ordens_servico' AND policyname = 'Users can delete own orders'
  ) THEN
    CREATE POLICY 'Users can delete own orders' ON public.ordens_servico
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;