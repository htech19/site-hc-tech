# Prompt para aplicar o Estoque no Supabase (outra LLM com acesso ao banco)

Use o bloco abaixo **como a mensagem inteira** enviada à outra LLM. Ele manda apenas
executar um arquivo SQL já validado e reportar o resultado — não permite nenhuma
outra mudança no banco nem no código.

Arquivo a anexar (ou deixar acessível no repositório):
[supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql](../supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql) — ~67.000 bytes, idempotente.

---

## PROMPT (copie daqui para baixo)

Você tem acesso ao Supabase. Sua tarefa é **executar um único arquivo SQL já pronto**
em um projeto Supabase e me devolver a verificação. Você **não deve alterar nada
além disso** — nem schema, nem dados, nem código de aplicação.

### Projeto alvo

- Projeto Supabase: `fiwbbhrrkongcryyqjmv` (produção, onde a aplicação roda).
- **Confirme o ref do projeto antes de executar** (`MCP: list_projects` ou
  `select current_database(), current_user`). Se o projeto acessível tiver outro
  ref, **pare** e me avise — não aplique em projeto diferente sem minha confirmação.
- Use uma conexão com permissão de DDL (postgres / service role / SQL Editor).
  Nunca imprima chaves, connection strings ou tokens no chat.

### Fonte única de verdade

O SQL está no arquivo `supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql`
(anexado a esta mensagem; se não estiver, peça que eu anexe — **não reconstrua
o SQL por conta própria nem invente comandos**).

Esse arquivo já foi executado integralmente em um projeto Supabase de teste
(sem erros, resultando em 187 produtos e 93 opções). Ele é para ser rodado
exatamente como está.

O arquivo tem 5 blocos, nesta ordem, e todos são **aditivos e idempotentes**
(podem rodar mais de uma vez sem efeito colateral):

1. `PREFLIGHT` — cria `public.estoque` se não existir, no formato final, com
   GRANT + RLS `auth.uid() = user_id`.
2. `MIGRATION 1/3` — adiciona `categoria`, `subcategoria` (nullable).
3. `MIGRATION 2/3` — adiciona `proprietario` e `canal_de_venda` (`not null`,
   defaults `'HC TECH'` / `'Loja física'`).
4. `MIGRATION 3/3` — adiciona `sku, marca, modelo, preco_venda, custo, fornecedor,
   localizacao, unidade, ativo`; cria `estoque_opcoes`, `estoque_compatibilidade`,
   `estoque_movimentos` + trigger de movimentação.
5. `SEED` — 93 opções de cadastro + 187 produtos reais da loja, com
   `ON CONFLICT DO NOTHING`.

### Regras invioláveis

- **Execute somente esse arquivo.** Não rode outras migrations, não crie/renomeie
  tabelas, não altere policies, não edite/apague linhas existentes.
- **Nada destrutivo:** nenhum `DROP`, `TRUNCATE`, `DELETE`, `UPDATE` em massa.
  Se você achar que algo precisa ser apagado, **pare e me pergunte**.
- **Não invente dados.** Custo e saldo dos produtos entram como `NULL`/`0` de
  propósito (pendência `REVISAR` na observação). Não preencha preço, custo ou
  quantidade "para ficar bonito".
- Não altere código da aplicação, variáveis de ambiente, nem outro projeto.
- Se o seu cliente SQL não aceitar o arquivo inteiro (multi-statement), divida
  **exatamente** nos 5 marcadores `-- ===...` / títulos `PREFLIGHT`,
  `MIGRATION 1/3`, `MIGRATION 2/3`, `MIGRATION 3/3`, `SEED` e rode na mesma ordem,
  sem modificar nenhuma linha. O bloco final `VERIFICACAO` é só leitura.

### Procedimento

1. Antes de rodar, registre o estado atual (só leitura):
   - a tabela `public.estoque` existe?
   - se existir: `select count(*) from public.estoque;` e a lista de colunas
     de `information_schema.columns`.
2. Execute o arquivo inteiro em uma única transação, se a ferramenta permitir.
3. Cole aqui: (a) o resultado das consultas do bloco `VERIFICACAO`,
   (b) a lista final de colunas de `public.estoque`, (c) qualquer mensagem de erro
   **completa** (código + texto), sem resumir.

### Valores esperados (referência de um banco limpo)

| Item | Esperado |
|---|---|
| `count(*) from public.estoque` | **187** |
| `preco_venda is null` | **5** (preços "sob consulta"/faixa) |
| `custo is not null` | **0** (não inventado) |
| `quantidade <> 0` | **0** (saldo pendente de revisão) |
| `count(*) from public.estoque_opcoes` | **93** |
| `count(*) from public.estoque_compatibilidade` | **5** |
| `count(*) from public.estoque_movimentos` | **0** (pode ser >0 se houve teste de trigger) |
| Colunas em `public.estoque` | **21** (8 da tabela base + `proprietario, canal_de_venda, categoria, subcategoria` + `sku, marca, modelo, preco_venda, custo, fornecedor, localizacao, unidade, ativo`) |
| Duplicados de `sku` | 0 linhas |

Se o banco **já tinha** produtos antes, o total pode ser maior que 187 — nesse caso
não "corrija" apagando nada; apenas relate os números com a diferença.

### Erros comuns e o que fazer

- `42501 / permission denied` → a conexão não tem DDL. Use o SQL Editor do
  Dashboard ou peça a connection string de `postgres` (sem me mostrar o valor).
- `column "proprietario" does not exist` → você rodou o `SEED` antes do
  `MIGRATION 2/3`. Rode o arquivo inteiro na ordem.
- `syntax error at or near "values"` → o arquivo foi editado/quebrado. **Pare**,
  restaure o original e me avise; não reescreva o SQL.
- `relation "public.estoque_opcoes" does not exist` → o `MIGRATION 3/3` não rodou.
- `PGRST` no schema cache → normal logo após DDL; o arquivo já traz
  `notify pgrst, 'reload schema'` no fim. Reabra o app e recarregue.

### Formato do retorno

1. Ref do projeto em que você executou + confirmação de que é `fiwbbhrrkongcryyqjmv`.
2. Estado antes (tabela existia? quantas linhas?).
3. Resultado da `VERIFICACAO` (tabela ou texto cru).
4. Lista final de colunas de `public.estoque`.
5. Erros, se houver (texto completo) — ou "nenhum erro".
6. Confirmação explícita: "nenhuma outra alteração foi feita no banco ou no código".

### Critério de conclusão

A tarefa está concluída quando o arquivo rodou sem erro **e** os números acima
batem (dentro da tolerância explicada). Se algo não bater, **não tente consertar
sozinho**: relate o que viu e pare.

## FIM DO PROMPT

---

## Prompts de acompanhamento (opcionais)

**Se a outra LLM disser que não tem o arquivo:**

> O SQL está em `supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql` no repositório do
> projeto. Se você não tem acesso ao repositório, pare e me peça para anexar o
> arquivo — não escreva SQL alternativo.

**Se ela pedir para "ajustar" algo:**

> Não ajuste. Execute o arquivo como está e apenas relate o resultado. Qualquer
> mudança de schema/dados além desse arquivo está fora do escopo.
