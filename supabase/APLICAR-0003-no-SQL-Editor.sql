-- =============================================================================
-- APLICAR 0003 NO SQL EDITOR DO SUPABASE
-- =============================================================================
-- POR QUE ESTE ARQUIVO EXISTE
--   A migração `supabase/migrations/0003_create_sistema_tables.sql` nunca foi
--   aplicada ao banco remoto. Resultado medido na API REST do projeto:
--
--     GET /rest/v1/orcamentos   -> HTTP 404  PGRST205 (tabela não existe)
--     GET /rest/v1/estoque      -> HTTP 404  PGRST205
--     GET /rest/v1/devolucoes   -> HTTP 404  PGRST205
--
--   As migrações 0000, 0001 e 0002 ESTÃO aplicadas (as colunas `marca`,
--   `quantidade`, `observacao`, `created_at` de ordens_servico respondem 200).
--   Só a 0003 falta.
--
-- COMO USAR
--   1. Abra o painel do Supabase -> SQL Editor -> New query.
--   2. Cole TODO o conteúdo deste arquivo.
--   3. Rode (Run). É IDEMPOTENTE: pode rodar quantas vezes quiser, sem efeito
--      colateral em dados existentes.
--   4. Confira o resultado do bloco VERIFICAÇÃO no final: as 3 tabelas novas
--      devem aparecer com `existe = true`.
--
--   Isto substitui `drizzle-kit push`/`migrate`: o `drizzle.config.ts` lê
--   `LOVABLE_DB_MIGRATION_URL`, que não está definida neste ambiente.
--
-- ESCOPO (idêntico à 0003, com as dependências incluídas para ser autossuficiente)
--   1. ordens_servico: libera status novos + data_conclusao/updated_at
--   2. caixa_movimentos: vínculo opcional com a OS
--   3. estoque          (tabela nova)
--   4. orcamentos       (tabela nova)
--   5. devolucoes       (tabela nova)
--   6. totalizador de OS por cliente (coluna + trigger)
--   7. BACKFILL OPCIONAL — leia o aviso antes de rodar
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. DEPENDÊNCIAS
--    `set_updated_at()` foi criada na 0001. Redefinimos aqui com CREATE OR
--    REPLACE para que este script funcione mesmo se a 0001 não tiver rodado.
--    Definição idêntica à da 0001 — não altera comportamento.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- 1. ordens_servico
--    Libera os status que o sistema já usa mas que o CHECK original bloqueava,
--    e adiciona as colunas previstas no spec.
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
-- 2. caixa_movimentos: vínculo opcional com a OS
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
-- 4. ORÇAMENTOS — vinculados a uma OS, com status Pendente/Aprovado/Reprovado
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
-- 6. TOTALIZADOR DE OS POR CLIENTE (coluna + trigger)
-- -----------------------------------------------------------------------------
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS total_os integer NOT NULL DEFAULT 0;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS ultima_os date;

CREATE OR REPLACE FUNCTION public.update_cliente_total_os()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Recalcula o total do cliente afetado após INSERT/UPDATE.
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
-- 7. BACKFILL — ***OPCIONAL***
-- =============================================================================
-- ATENÇÃO: este bloco COPIA dados das ordens de serviço já existentes para as
-- tabelas novas. Ele cria registros que antes não existiam:
--
--   * estoque    <- OS com status 'estoque'
--   * devolucoes <- OS com status 'devolucao'
--   * orcamentos <- OS com valor > 0 (pode ser MUITOS registros)
--
-- Isso era uma decisão registrada da migração original: as views Estoque /
-- Orçamentos / Devoluções eram derivadas de `status` no HTML de referência, e o
-- backfill preserva esse histórico.
--
-- SE VOCÊ NÃO QUER esses registros históricos, APAGUE tudo entre os marcadores
-- [INICIO BACKFILL] e [FIM BACKFILL] antes de rodar. O resto do script funciona
-- igual sem ele.
--
-- Cada INSERT só roda se a tabela destino estiver VAZIA, então rodar duas vezes
-- não duplica nada.
-- =============================================================================

-- ============================ [INICIO BACKFILL] =============================
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
-- ============================= [FIM BACKFILL] ===============================


-- -----------------------------------------------------------------------------
-- 8. RECARREGA O CACHE DE SCHEMA DA API
--    Sem isto, a API REST pode continuar devolvendo PGRST205 por alguns
--    instantes mesmo com as tabelas criadas.
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';


-- -----------------------------------------------------------------------------
-- 9. VERIFICAÇÃO — as 3 colunas `existe` devem vir `true`
-- -----------------------------------------------------------------------------
SELECT
  'orcamentos' AS tabela,
  to_regclass('public.orcamentos') IS NOT NULL AS existe,
  (SELECT count(*) FROM public.orcamentos) AS registros
UNION ALL
SELECT
  'estoque',
  to_regclass('public.estoque') IS NOT NULL,
  (SELECT count(*) FROM public.estoque)
UNION ALL
SELECT
  'devolucoes',
  to_regclass('public.devolucoes') IS NOT NULL,
  (SELECT count(*) FROM public.devolucoes)
UNION ALL
SELECT
  'ordens_servico.updated_at',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ordens_servico' AND column_name = 'updated_at'
  ),
  NULL::bigint
UNION ALL
SELECT
  'clientes.total_os',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'total_os'
  ),
  NULL::bigint
UNION ALL
SELECT
  'caixa_movimentos.os_id',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'caixa_movimentos' AND column_name = 'os_id'
  ),
  NULL::bigint;
