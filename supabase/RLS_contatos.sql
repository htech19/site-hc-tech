-- Políticas RLS para isolamento de contatos por usuário
-- Executar no Supabase SQL Editor

ALTER TABLE cliente_contatos ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: usuário só vê seus próprios contatos
CREATE POLICY "Users can view their own contacts"
ON cliente_contatos
FOR SELECT
USING (auth.uid() = user_id);

-- Política de INSERT: contato só pode ser criado pelo proprietário
CREATE POLICY "Users can insert their own contacts"
ON cliente_contatos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: apenas proprietário pode atualizar
CREATE POLICY "Users can update their own contacts"
ON cliente_contatos
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política de DELETE: apenas proprietário pode remover
CREATE POLICY "Users can delete their own contacts"
ON cliente_contatos
FOR DELETE
USING (auth.uid() = user_id);
