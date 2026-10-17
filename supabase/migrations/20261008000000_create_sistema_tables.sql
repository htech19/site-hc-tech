-- =============================================================================
-- MIGRATION 0003 — MÓDULO /sistema completo (HC TECH)
-- =============================================================================
-- Objetivo: suportar os 9 módulos do HTML de referência
-- (`Complementos site/hc-tech.html`).
--
-- ESCOPO / DECISÕES REGISTRADAS EM REVISÃO:
--   * `ordens_servico.status` permanece em MINÚSCULO (compatibilidade com dados
--     existentes). A UI exibe em MAIÚSCULO — mapeamento feito em
--     src/sistema/types.ts.
--   * Mantemos a tabela `caixa_movimentos` já existente (o spec a chama de
--     `caixa_movimentacoes`; renomear quebraria dados em produção).
--   * Estoque, Orçamentos e Devoluções ganham TABELAS PRÓPRIAS com vínculo à OS
--     (decisão do usuário), em vez de serem apenas filtros de status.
--   * Esta migration é IDEMPOTENTE: pode ser executada mais de uma vez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ordens_servico: libera os status que o sistema já usa mas que o CHECK
--    original bloqueava ('em_andamento', 'estoque', 'devolucao') e adiciona
--    colunas previstas no spec.
-- -----------------------------------------------------------------------------
ALTER TABLE public.ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_status_check
  CHECK (status IN (
    'pendente', 'aprovado', 'em_andamento', 'concluida',
    'estoque', 'devolucao', 'cancelada'
  ));

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS data_conclusao timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS ordens_servico_updated_at ON public.ordens_servico;
CREATE TRIGGER ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS ordens_servico_status_idx ON public.ordens_servico(status);
CREATE INDEX IF NOT EXISTS ordens_servico_data_entrada_idx ON public.ordens_servico(data_entrada);

-- -----------------------------------------------------------------------------
-- 2. caixa_movimentos: vínculo opcional com a OS (spec: CaixaMovimentacao.osId)
-- -----------------------------------------------------------------------------
ALTER TABLE public.caixa_movimentos
  ADD COLUMN IF NOT EXISTS os_id uuid REFERENCES public.ordens_servico(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS caixa_movimentos_data_idx ON public.caixa_movimentos(data);

-- -----------------------------------------------------------------------------
-- 3. ESTOQUE — aparelhos parados/para venda com defeito e condição
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  aparelho text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
  defeito text,
  condicao text,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT ALL ON public.estoque TO service_role;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own estoque" ON public.estoque;
CREATE POLICY "Users manage own estoque" ON public.estoque FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. ORÇAMENTOS — vinculados a uma OS, com status Aprovado/Reprovado/Pendente
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  descricao text,
  valor numeric(10,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado')),
  data_orcamento date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own orcamentos" ON public.orcamentos;
CREATE POLICY "Users manage own orcamentos" ON public.orcamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS orcamentos_updated_at ON public.orcamentos;
CREATE TRIGGER orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. DEVOLUÇÕES — aparelhos devolvidos ao cliente (sempre ligados a uma OS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devolucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  aparelho text NOT NULL,
  cliente text NOT NULL,
  defeito text,
  observacao text,
  data_devolucao date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devolucoes TO authenticated;
GRANT ALL ON public.devolucoes TO service_role;
ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own devolucoes" ON public.devolucoes;
CREATE POLICY "Users manage own devolucoes" ON public.devolucoes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS devolucoes_os_idx ON public.devolucoes(os_id);

-- -----------------------------------------------------------------------------
-- 6. TOTALIZADOR DE OS POR CLIENTE
--    Coluna + trigger conforme spec FASE 8. A aplicação também calcula por
--    agregação (fallback que funciona mesmo sem esta migration aplicada).
-- -----------------------------------------------------------------------------
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS total_os integer NOT NULL DEFAULT 0;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ultima_os date;

CREATE OR REPLACE FUNCTION public.update_cliente_total_os()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Apaguei o total antigo do cliente afetado antes de recalcular.
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.cliente_id IS NOT NULL THEN
    UPDATE public.clientes c
    SET total_os = sub.total,
        ultima_os = sub.ultima
    FROM (
      SELECT cliente_id,
             COALESCE(SUM(quantidade), 0)::int AS total,
             MAX(data_entrada) AS ultima
      FROM public.ordens_servico
      WHERE cliente_id = NEW.cliente_id
      GROUP BY cliente_id
    ) sub
    WHERE c.id = sub.cliente_id;
  END IF;

  -- Para DELETE (e UPDATE que trocou de cliente), recalcula também o cliente antigo.
  IF TG_OP IN ('DELETE', 'UPDATE') AND OLD.cliente_id IS NOT NULL
     AND (TG_OP = 'DELETE' OR OLD.cliente_id IS DISTINCT FROM NEW.cliente_id) THEN
    UPDATE public.clientes c
    SET total_os = COALESCE(sub.total, 0),
        ultima_os = sub.ultima
    FROM (
      SELECT cliente_id,
             COALESCE(SUM(quantidade), 0)::int AS total,
             MAX(data_entrada) AS ultima
      FROM public.ordens_servico
      WHERE cliente_id = OLD.cliente_id
      GROUP BY cliente_id
    ) sub
    WHERE c.id = sub.cliente_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_cliente_total_os ON public.ordens_servico;
CREATE TRIGGER trigger_update_cliente_total_os
AFTER INSERT OR UPDATE OR DELETE ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.update_cliente_total_os();

-- -----------------------------------------------------------------------------
-- 7. BACKFILL — mantém compatibilidade com os dados já existentes.
--    As views Estoque/Orçamentos/Devoluções eram derivadas de `status` no HTML
--    original; popularmos as tabelas novas a partir delas APENAS se vazias
--    (idempotente e seguro para reexecução).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- 7.1 Estoque
  IF NOT EXISTS (SELECT 1 FROM public.estoque) THEN
    INSERT INTO public.estoque (user_id, aparelho, quantidade, defeito, observacao)
    SELECT user_id, aparelho, COALESCE(quantidade, 1), defeito, observacao
    FROM public.ordens_servico
    WHERE status = 'estoque';
  END IF;

  -- 7.2 Devoluções
  IF NOT EXISTS (SELECT 1 FROM public.devolucoes) THEN
    INSERT INTO public.devolucoes (user_id, os_id, aparelho, cliente, defeito, observacao, data_devolucao)
    SELECT user_id, id, aparelho,
           COALESCE(cliente_nome, 'Não informado'),
           defeito, observacao, COALESCE(data_entrada, CURRENT_DATE)
    FROM public.ordens_servico
    WHERE status = 'devolucao';
  END IF;

  -- 7.3 Orçamentos (OS com valor > 0 = orçamento emitido)
  IF NOT EXISTS (SELECT 1 FROM public.orcamentos) THEN
    INSERT INTO public.orcamentos (user_id, os_id, cliente_id, descricao, valor, status, data_orcamento)
    SELECT user_id, id, cliente_id, observacao, COALESCE(valor, 0),
           CASE
             WHEN status = 'concluida' THEN 'aprovado'
             WHEN status = 'cancelada' THEN 'reprovado'
             ELSE 'pendente'
           END,
           COALESCE(data_entrada, CURRENT_DATE)
    FROM public.ordens_servico
    WHERE COALESCE(valor, 0) > 0;
  END IF;

  -- 7.4 Recalcula o totalizador de OS por cliente para os dados antigos
  UPDATE public.clientes c
  SET total_os = COALESCE(sub.total, 0),
      ultima_os = sub.ultima
  FROM (
    SELECT cliente_id,
           COALESCE(SUM(quantidade), 0)::int AS total,
           MAX(data_entrada) AS ultima
    FROM public.ordens_servico
    WHERE cliente_id IS NOT NULL
    GROUP BY cliente_id
  ) sub
  WHERE c.id = sub.cliente_id;
END;
$$;
