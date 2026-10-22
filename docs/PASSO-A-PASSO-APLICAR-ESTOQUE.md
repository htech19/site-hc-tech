# Passo a passo — aplicar o estoque no projeto real (Lovable Cloud)

**Banco alvo:** `fiwbbhrrkongcryyqjmv` — é **Lovable Cloud**, não um projeto da sua conta
Supabase (por isso o painel do supabase.com responde "You do not have access to this project").
Confirmado pelo bundle publicado do app: ele chama `https://fiwbbhrrkongcryyqjmv.supabase.co`.

**Arquivo:** [supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql](../supabase/APLICAR-ESTOQUE-no-SQL-Editor.sql)
— aditivo e idempotente (roda N vezes sem duplicar nem apagar).

---

## 1. Onde colar

1. <https://lovable.dev> → projeto **HC Tech InfoCell**.
2. Barra **Visualização** → menu `⋯` → **Mais**.
3. Na coluna de ícones à esquerda: **Database**.
4. Botão **Manage** → **SQL editor**.

## 2. Antes de rodar (decide se precisa editar algo)

Cole e rode só isto:

```sql
select id, email, created_at from auth.users order by created_at;
```

| Resultado | O que fazer |
|---|---|
| **1 linha** | Siga para o passo 3. Nada para editar. |
| **2+ linhas** | Copie o `id` do dono real e troque `nullif('', '')` por `nullif('SEU-UUID', '')` nas **duas** linhas `OVERRIDE_DONO` (as duas, com o mesmo UUID). |
| **0 linhas** | Entre uma vez no sistema para existir dono. |

## 3. Rodar

1. Abra o arquivo, `Ctrl+A`, `Ctrl+C`.
2. Cole no SQL editor e rode com **Run** ou **Ctrl+Enter**.
3. O Lovable mostra **"Confirm destructive operation"** (ele dispara com a palavra `DELETE`
   que aparece no `grant`/comentários). Clique **Run anyway**.
4. Sucesso = o painel **Results** mostra a lista de colunas de `public.estoque`.

> O editor tem limite prático de colagem: se o texto chegar truncado, cole em 3 partes
> (preflight+migrations / seed de opções / seed de produtos+verificação) e rode cada uma.

## 4. Verificar

```sql
select
  (select count(*) from public.estoque)                            as produtos_187,
  (select count(*) from public.estoque_opcoes)                     as opcoes_93,
  (select count(*) from public.estoque_compatibilidade)            as compat_5,
  (select count(*) from public.estoque where preco_venda is null)  as preco_pendente_5,
  (select count(*) from public.estoque where custo is not null)    as custo_informado_0,
  (select count(*) from public.estoque where quantidade <> 0)      as com_saldo_0,
  (select count(distinct user_id) from public.estoque)             as donos_1;
```

Esperado: **187 · 93 · 5 · 5 · 0 · 0 · 1**.

## 5. Confirmar no app

`http://localhost:5173/sistema/estoque` → 187 registros, 13 páginas, `Proprietário = HC TECH`,
`Canal Venda = Loja física`, SKU e preço preenchidos. O alerta "Estoque baixo em 187 item(ns)"
é esperado: nenhuma quantidade foi inventada.

## 6. Dois bugs que só apareciam num banco vazio (corrigidos)

| Sintoma | Causa | Correção |
|---|---|---|
| `42703: column "proprietario" of relation "estoque" does not exist` | `create table if not exists` **não** adiciona colunas a uma tabela que já existe; o preflight fazia `alter column ... set default` numa coluna inexistente | preflight agora faz `add column if not exists` antes |
| 187 produtos gravados, **0 compatibilidades** | o insert de compatibilidades lê `public.estoque` no snapshot do mesmo statement e não enxerga as linhas que o CTE acabou de inserir | join passou a unir `inseridos` (RETURNING) + linhas já existentes |

Ambos foram reproduzidos num `begin … rollback` no projeto de teste antes da correção.

## 7. O que o script não faz

- Não inventa custo (`custo = NULL`) nem saldo (`quantidade = 0` + "REVISAR" na observação).
- Não remove coluna, tabela, linha nem policy; não altera RLS (`auth.uid() = user_id`).
- Preços "sob consulta" ficam `NULL` com pendência na observação (5 casos).
