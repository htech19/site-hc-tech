# Database and Supabase Connections Map — HC Tech Sistema

> ⚠️ **Correção de auditoria (2026-10-20):** o projeto listado abaixo
> (`chllhailtkuffciaanlx`) é o do `config.toml`/CI, **mas a aplicação roda em
> `fiwbbhrrkongcryyqjmv`** (VITE_SUPABASE_URL). Ver `docs/CONTEXTO-PROJETO.md`
> §3/§6 e `docs/DECISOES-ARQUITETURA.md` #017 antes de confiar nas verificações
> abaixo — o ALTER de `estoque.proprietario`/`canal_de_venda` foi aplicado no
> projeto errado e a migration corretiva é `20261020001000`.

## Project Overview
- **Supabase Project ID**: `chllhailtkuffciaanlx`
- **Environment Variables** (`.env.example`):
  - `VITE_SUPABASE_PROJECT_ID`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_GA_MEASUREMENT_ID`

## Database Schema by Migration

### Migration 0000 — `drizzle/0000_create_sistema_tables.sql`
Core system tables (initial setup):

| Table | Key Columns | RLS Policy |
|-------|-------------|------------|
| `public.clientes` | `id`, `user_id`, `nome`, `documento`, `email`, `telefone`, `created_at` | `Users manage own clientes` |
| `public.ordens_servico` | `id`, `cliente_id`, `status`, `valor`, `defeito`, `data_entrada`, `quantidade`, `telefone`, `created_at` | `Users manage own OS` |
| `public.servicos` | `id`, `nome`, `descricao`, `preco`, `created_at` | `Authenticated can read servicos` |

### Migration 0001 — `drizzle/0001_clientes_modulo_completo.sql`
Extended client management with contacts, interactions, and anexos:

| Table | Key Columns | RLS Policy |
|-------|-------------|------------|
| `public.cliente_contatos` | `id`, `cliente_id`, `tipo`, `valor`, `descricao`, `created_at` | `Users manage own contatos` |
| `public.cliente_interacoes` | `id`, `cliente_id`, `descricao`, `data`, `created_at` | Read own interações; Users manage own |
| `public.cliente_anexos` | `id`, `cliente_id`, `nome_arquivo`, `caminho_arquivo`, `created_at` | `Users manage own anexos` |
| Function: `public.set_updated_at()` | Trigger for `clientes_updated_at` on `clientes` | — |

### Migration 0002 — `drizzle/0002_sistema_gestao_completa.sql`
Additional system tables:

| Table | Key Columns | RLS Policy |
|-------|-------------|------------|
| `public.caixa_movimentos` | `id`, `user_id`, `data`, `descricao`, `tipo` (`entrada`/`saida`), `valor`, `created_at` | `Users manage own caixa` |
| `public.servico_tipos` | `id`, `user_id`, `nome`, `created_at` | `Users manage own servico_tipos` |

### Migration 0003 — `supabase/migrations/20261008000000_create_sistema_tables.sql`
Core Estoque, Orçamentos, and Devoluções tables (applied via `supabase db push`):

| Table | Key Columns | RLS Policy |
|-------|-------------|------------|
| `public.estoque` | `id`, `user_id`, `proprietario`, `canal_de_venda`, `aparelho`, `quantidade`, `defeito`, `condicao`, `observacao`, `created_at` | `Users manage own estoque` |
| `public.orcamentos` | `id`, `user_id`, `os_id`, `cliente_id`, `descricao`, `valor`, `status`, `data_orcamento`, `created_at`, `updated_at` | `Users manage own orcamentos` |
| `public.devolucoes` | `id`, `user_id`, `os_id`, `aparelho`, `cliente`, `defeito`, `observacao`, `data_devolucao`, `created_at` | `Users manage own devolucoes` |

**Columns added via ALTER TABLE to `public.estoque`:**
- `proprietario` text NOT NULL
- `canal_de_venda` text NOT NULL

## Row Level Security (RLS) Summary

All tables use consistent RLS policy pattern: `Users manage own [tabela_name]`

| Table | Policy Name | Auth Context |
|-------|-------------|--------------|
| `public.clientes` | `Users manage own clientes` | `auth.uid() = user_id` |
| `public.ordens_servico` | `Users manage own OS` | `auth.uid() = user_id` |
| `public.servicos` | `Authenticated can read servicos` | `true` (open read) |
| `public.cliente_contatos` | `Users manage own contatos` | `auth.uid() = user_id` |
| `public.cliente_interacoes` | `Users read own interacoes` | `auth.uid() = user_id` |
| `public.cliente_anexos` | `Users manage own anexos` | `auth.uid() = user_id` |
| `public.caixa_movimentos` | `Users manage own caixa` | `auth.uid() = user_id` |
| `public.servico_tipos` | `Users manage own servico_tipos` | `auth.uid() = user_id` |
| `public.estoque` | `Users manage own estoque` | `auth.uid() = user_id` |
| `public.orcamentos` | `Users manage own orcamentos` | `auth.uid() = user_id` |
| `public.devolucoes` | `Users manage own devolucoes` | `auth.uid() = user_id` |

**Service Role**: Has ALL permissions on all tables (bypasses RLS).

## Supabase Service Configuration

### `supabase/config.toml`
```toml
project_id = "chllhailtkuffciaanlx"
[functions.solicitar-orcamento]
verify_jwt = true
```

### Edge Functions
- `solicitar-orcamento`: Public quote requests go only through this edge function (service role insert); table has no anon access, admins read via `has_role` — keeps customer data private.

### Auth Configuration
- Sign in with Freebuff used for user authentication
- JWT verification enabled for `solicitar-orcamento` function
- `auth.uid()` used as RLS policy reference across all tables

## Data Flow Summary

### Estoque Module
- TypeScript ↔ Supabase: Queries and writes via `supabase-js` client
- Tables: `estoque` (with `proprietario`, `canal_de_venda` columns)
- RLS: Users can only manage their own records (`auth.uid() = user_id`)
- Service role has full CRUD access

### Orçamentos Module
- Wizard flow: tipo equipamento → dados → cliente → revisão → finalização
- Tables: `orcamentos`, linked to `ordens_servico` (`os_id`) and `clientes` (`cliente_id`)
- Bug fix: `SolicitacaoOrcamentoWizard.tsx:279` — `useCallback` deps changed from `[formulario, onSolicitacaoRegistrada]` to `[formulario]`
- Edge function: `solicitar-orcamento` handles quote requests with service role insert

### Devoluções Module
- Tables: `devolucoes` linked to `ordens_servico` (`os_id`)
- RLS: Users manage own devolucoes

### Clientes Module
- Tables: `clientes`, `cliente_contatos`, `cliente_interacoes`, `cliente_anexos`
- Full CRUD via TypeScript store (`src/sistema/store.ts`)

### Orchestration
- Central store: `src/sistema/store.ts` — all Supabase queries go through this
- Drizzle ORM for type-safe migrations
- Supabase JS client: `src/integrations/supabase/client.ts`

## Connection Diagram

```
User Interface
      ↓
Vite/React App (localhost:5173)
      ↓
src/integrations/supabase/client.ts
      ↓
Supabase JS Client (anon key for reads, service role for writes)
      ↓
PostgREST API → public schema tables
      ↓
RLS Policies (auth.uid() = user_id filtering)
      ↓
Database Tables (estoque, orcamentos, devoluções, clientes, etc.)
```

## Verification Status

| Component | Status | Verification Method |
|-----------|--------|---------------------|
| Migration 0003 applied | ✅ | `supabase db push` EXIT=0 |
| Tables: estoque, orcamentos, devoluções | ✅ | `information_schema.tables` |
| Columns: proprietario, canal_de_venda | ✅ | `ALTER TABLE` verification |
| RLS policies | ✅ | `pg_policies` query |
| TypeScript type checks | ⚠️ | 8 type errors found in tsc; vite build does not run tsc |
| Build | ✅ | `npm run build` EXIT=0 |
| Tests | ✅ | `npx vitest run` — 47/47 passing |
| Git sync | ✅ | 2 commits pushed to `https://github.com/htech19/site-hc-tech` |