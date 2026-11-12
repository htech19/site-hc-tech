CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.orcamento_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text NOT NULL UNIQUE,
  client_token uuid NOT NULL UNIQUE,
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  preferencia_contato text,
  periodo_contato text,
  categoria text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  numero_serie text,
  imei1 text,
  imei2 text,
  estado_geral text,
  info_adicional text,
  servico text NOT NULL,
  descricao_defeito text NOT NULL,
  sintomas text[] NOT NULL DEFAULT '{}',
  historico text[] NOT NULL DEFAULT '{}',
  atendimento text NOT NULL,
  observacoes text,
  consentimento_lgpd boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'recebido',
  whatsapp_status text NOT NULL DEFAULT 'preparado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orcamento_solicitacoes_created_idx ON public.orcamento_solicitacoes (created_at DESC);
CREATE INDEX orcamento_solicitacoes_tel_idx ON public.orcamento_solicitacoes (telefone, created_at DESC);

GRANT SELECT, UPDATE ON public.orcamento_solicitacoes TO authenticated;
GRANT ALL ON public.orcamento_solicitacoes TO service_role;
ALTER TABLE public.orcamento_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read solicitacoes" ON public.orcamento_solicitacoes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update solicitacoes" ON public.orcamento_solicitacoes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orcamento_solicitacoes_updated_at
  BEFORE UPDATE ON public.orcamento_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.confirmar_whatsapp_solicitacao(_token uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.orcamento_solicitacoes SET whatsapp_status = 'aberto' WHERE client_token = _token AND whatsapp_status = 'preparado';
$$;
REVOKE ALL ON FUNCTION public.confirmar_whatsapp_solicitacao(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_whatsapp_solicitacao(uuid) TO service_role;