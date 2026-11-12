CREATE TABLE IF NOT EXISTS public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  proprietario text NOT NULL,
  canal_de_venda text NOT NULL,
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