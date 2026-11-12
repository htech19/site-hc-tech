ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS data_entrada date NOT NULL DEFAULT CURRENT_DATE;

CREATE TABLE public.caixa_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida')),
  valor numeric NOT NULL CHECK (valor >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caixa_movimentos TO authenticated;
GRANT ALL ON public.caixa_movimentos TO service_role;
ALTER TABLE public.caixa_movimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own caixa" ON public.caixa_movimentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.servico_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servico_tipos TO authenticated;
GRANT ALL ON public.servico_tipos TO service_role;
ALTER TABLE public.servico_tipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own servico_tipos" ON public.servico_tipos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);