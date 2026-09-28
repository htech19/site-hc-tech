ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_pessoa text NOT NULL DEFAULT 'PF',
  ADD COLUMN IF NOT EXISTS documento text,
  ADD COLUMN IF NOT EXISTS rg_ie text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS telefone2 text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS classificacao text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS motivo_bloqueio text,
  ADD COLUMN IF NOT EXISTS consentimento_lgpd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimento_data timestamptz,
  ADD COLUMN IF NOT EXISTS aceita_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS aceita_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS aceita_sms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS limite_credito numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS clientes_user_doc_idx ON public.clientes(user_id, documento);
CREATE INDEX IF NOT EXISTS ordens_servico_cliente_idx ON public.ordens_servico(cliente_id);

CREATE TABLE public.cliente_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text,
  telefone text,
  whatsapp text,
  email text,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_contatos TO authenticated;
GRANT ALL ON public.cliente_contatos TO service_role;
ALTER TABLE public.cliente_contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contatos" ON public.cliente_contatos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.cliente_interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'nota',
  descricao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.cliente_interacoes TO authenticated;
GRANT ALL ON public.cliente_interacoes TO service_role;
ALTER TABLE public.cliente_interacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own interacoes" ON public.cliente_interacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own interacoes" ON public.cliente_interacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own interacoes" ON public.cliente_interacoes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.cliente_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  path text NOT NULL,
  tamanho bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.cliente_anexos TO authenticated;
GRANT ALL ON public.cliente_anexos TO service_role;
ALTER TABLE public.cliente_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own anexos" ON public.cliente_anexos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Own cliente anexos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cliente-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own cliente anexos insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cliente-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own cliente anexos delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cliente-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);