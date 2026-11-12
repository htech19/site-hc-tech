# CONTEXTO DO PROJETO — HC Tech (site + sistema interno)

> **Purpose:** single entry point to restore full project context after losing chat
> history (Lovable/Freebuff). Read this file first, then the linked docs.
> **Rule (critical):** every architectural decision, progress update and phase
> outcome MUST be written to a `.md` file in this repo — chat history is
> considered volatile. Update this file whenever the state below changes.
>
> Last recovered: 2026-10-20 · Branch: `feature/ecommerce-hc-tech`

---

## 1. Index of documentation (read in this order)

| # | File | What it holds |
|---|------|---------------|
| 1 | `docs/CONTEXTO-PROJETO.md` (this file) | Global context: stack, modules, DB, deploy, current state |
| 2 | `docs/DECISOES-ARQUITETURA.md` | Append-only log of architectural decisions |
| 3 | `docs/PROXIMOS-PASSOS.md` | Audit checklist (local code) + production alignment + phase roadmap |
| 4 | `docs/ERP-ESTOQUE-PLANO.md` | Full ERP/Estoque diagnosis + 8-implementation-stage plan (809 lines) — **the plan of record for the ERP** |
| 5 | `docs/HANDOFF-SISTEMA.md` | Exact replication inventory of the `/sistema` subsystem (files, schema, steps) |
| 6 | `WORKSUMMARY.md` | Session log of 2026-10-20 (migration 0003, wizard bugfix, SearchableSelect) |
| 7 | `DATABASE-SUMMARY.md` | Map of Supabase tables, RLS policies and connections |
| 8 | `roadmap.md` | Short marketing/site checklist (home page, publish) |
| 9 | `AGENTS.md` | Repo-level agent rules (orçamentos edge function, WhatsApp number) |
| 10 | `SECURITY.md` | Security notes |

---

## 2. What the project is

Two products in **one Vite/React repo**:

1. **Public site + online quote** — institutional site, services, floating
   "Solicitar Orçamento" widget (ChatWidget), quote wizard.
2. **`/sistema`** — internal management system (login-gated): Dashboard, OS,
   Clientes (CRM), Serviços/Tabela de Preços, Orçamentos, **Estoque**, Caixa,
   Devoluções, Relatórios, Solicitações do site.

### Stack
- **Frontend:** React + TypeScript + Vite, Tailwind, Radix/shadcn-ui, TanStack Query, Zustand, react-window
- **Backend:** Supabase (PostgreSQL) — projeto documentado/CI: `chllhailtkuffciaanlx` (`site-hc-lovable-freebuff`). ⚠️ O runtime real da app é **`fiwbbhrrkongcryyqjmv`** (ver §3/§6).
- **ORM/migrations:** Drizzle (legacy `drizzle/migrations/0000–0002`) + Supabase CLI (`supabase/migrations/` — only this folder is applied by CI)
- **Tests:** vitest (`npx vitest run` → 47 tests passing as of 2026-10-20)
- **Repo:** `https://github.com/htech19/site-hc-tech` · local `C:\Users\hunlock\Documents\LOJA_HC\Site\site-hc-tech`
- Package manager in CI: **bun** (`bun install --frozen-lockfile`); local lockfiles: `bun.lock` + `package-lock.json`

### Key architecture (do not duplicate)
- **Reads:** `src/integrations/supabase/sistema.ts` — all TanStack Query hooks (`useOS`, `useClientes`, `useEstoque`, `useCaixa`, `useDevolucoes`, `useMetricasDashboard`, …), query keys `['sistema', <entity>]`, `staleTime: 30s`.
- **Writes:** `src/sistema/store.ts` (Zustand) — all CRUD mutations + `invalidateQueries` + toasts.
- **Domain:** `src/sistema/types.ts` — types + DB↔UI adapters (snake_case↔camelCase, status mapping).
- **UI primitives:** `src/components/ui/*` (shadcn). Reusable searchable dropdown already exists: **`src/components/ui/searchable-select.tsx`** (`SearchableSelect` + `useCatalogoQuery`).
- **Auth:** Supabase Auth (`src/sistema/auth.tsx`), RLS `auth.uid() = user_id` on every table.
- **Price truth:** Tabela de Telas 08/2026 (`src/sistema/data/telas.ts` + `services/precosService.ts`); never invent prices.

---

## 3. Database state (verified)

13 tables in `public`, all with RLS. Full map in `DATABASE-SUMMARY.md`.

- Migrations `0000–0002` → `drizzle/migrations/` (NOT read by `supabase db push`; apply manually on a fresh DB).
- Migration `0003` → `supabase/migrations/20261008000000_create_sistema_tables.sql` — **already applied** to remote (2026-10-20, `supabase db push` exit 0): created `estoque`, `orcamentos`, `devolucoes`; added `estoque.proprietario` + `estoque.canal_de_venda` (both NOT NULL); widened `ordens_servico.status` CHECK; added `caixa_movimentos.os_id`.
- **`public.estoque` is the "Aparelhos de Clientes" (custódia/conserto) table** — it must be preserved; it is NOT the commercial stock.
- No ERP/commercial tables exist yet (`products`, `product_categories`, `inventory_owners`, `inventory_balances`, `inventory_movements`, etc. — see §5 and plan §3).

---

## 4. Deploy / production topology (alignment target)

| Layer | Where | Trigger |
|---|---|---|
| Production site | GitHub Pages with `CNAME = hctechinfocell.com.br` (Cloudflare fronts the DNS) | `.github/workflows/deploy.yml` → **`push to `main` only**; builds with bun, `dist/` + SPA `404.html` fallback |
| Migrations in CI | `.github/workflows/migrations.yml` | manual confirmation, needs `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` secrets |
| Local preview | `bun run dev` (Freebuff startup script) | — |
| Freebuff Sites manifests | `site-manifest.json` / `manifest.json` → `./dist/assets` | optional Workers-based publishing path |

**Important:** current work happens on `feature/ecommerce-hc-tech`, which is
pushed to `origin` but is **not** the branch that deploys. The empty commit
`1e81a48 "trigger production deploy: feature/ecommerce-hc-tech branch is now
production"` did NOT change the workflow — `deploy.yml` still listens to `main`.
⇒ Publishing requires either merging to `main` or consciously changing the
workflow branch. This is item #1 of the production alignment checklist.

**Never publish to production without validation** (golden rule #13).

---

## 5. Active workstream — ERP de Estoque (the current big task)

Goal: evolve the existing Estoque module into a full ERP **without rebuilding or
breaking anything**. Plan of record: `docs/ERP-ESTOQUE-PLANO.md`
(diagnóstico concluído, **nada implementado** além do abaixo).

### Golden rules (unbreakable)
1. Two separate stock views: **Aparelhos de Clientes** (`estoque` atual) vs **Estoque Comercial** (new tables).
2. Every commercial product has saldo **per proprietário**: HC TECH / FASTCELL / MERCADO LIVRE (`canal_de_venda` is a *separate* field from owner).
3. All option fields use a reusable **SearchableSelect** (typing, autocomplete, keyboard nav, inline creation, case-insensitive duplicate prevention).
4. Preserve all OS/Clientes/Finanças data; evolve existing tables instead of duplicating.
5. **No fake data** — structure only.

### Status by stage
| Stage | Status |
|---|---|
| 1 Diagnóstico | ✅ done — `docs/ERP-ESTOQUE-PLANO.md` |
| 2 Catálogos + SearchableSelect | 🟡 partial — `SearchableSelect` component exists and was **repaired 2026-10-20** (it did not compile); catalog migrations (`inventory_owners`, `sales_channels`, `product_categories`, `brands`, `device_models`, `product_types`, `suppliers`, ...) **not yet created**; catálogo data not seeded |
| 3 Produtos + SKU + compatibilidade | ⬜ pending |
| 4 Proprietários, saldos, movimentações | ⬜ pending |
| 5 Integração com OS (baixa de peça na aprovação) | ⬜ pending |
| 6 Dashboard, relatórios, importação em massa | ⬜ pending |
| 7 Mercado Livre (estrutura `marketplace_*`, OAuth prep) | ⬜ pending |
| 8 Testes + validação produção | ⬜ pending |

### Fase 1 deliverables requested (awaiting user approval)
1. ⏳ SQL migration script for the new ERP tables (planned in `ERP-ESTOQUE-PLANO.md` §3 + §6.3; to be emitted as `supabase/migrations/202610*_inventory_*.sql` etc.) — **presented for approval, not applied**
2. ✅ `SearchableSelect` structure — exists in `src/components/ui/searchable-select.tsx` (rewritten 2026-10-20: compiles against local `command.tsx` + react-query v5, no fake catalog data, inline creation with case-insensitive duplicate prevention)
3. ⏳ `EstoqueTabs` structure (6 tabs: Visão Geral · Aparelhos de Clientes · Estoque Comercial · Movimentações · Mercado Livre · Relatórios) — proposed in `ERP-ESTOQUE-PLANO.md` §5–6 as `src/sistema/estoque/EstoqueLayout.tsx` + `paginas/*`, **not coded yet**

### Baseline verified 2026-10-20 (after audit)
- `tsc --noEmit -p tsconfig.app.json` → **0 errors** (was 11: broken `searchable-select.tsx` + missing types)
- `npx vitest run` → **47/47 passing**
- `npm run build` → **OK (~7s)**

No migration, no new table and no UI change may be applied before the user
approves Fase 1.

---

## 6. Known risks / TODO carried over

- **Dois projetos Supabase em conflito** (ver §3): runtime real `fiwbbhrrkongcryyqjmv` × projeto documentado/CI `chllhailtkuffciaanlx`. Enquanto não resolvido: gravar no Estoque retorna 400 no ambiente real e a integração de DB não alcança o projeto real (403).

- `.env` is **tracked in Git** (contains public anon key only — but keep `SERVICE_ROLE_KEY` out of it forever). `.gitignore` only ignores `.env.local`.
- Harness files `_wizardPreview.tsx` + `wizard-preview.html` are scaffolding, publicly served — remove before production deploy.
- Two migration folders (`drizzle/` vs `supabase/`) with overlapping numbering.
- `tsconfig.*.tsbuildinfo` not gitignored.
- TypeScript errors fixed on 2026-10-20 (baseline now 0): broken `searchable-select.tsx`, missing `solicitacoes` in `MetricasDashboard`, stale `estoque` types missing `proprietario`/`canal_de_venda`. `vite build` still does not run `tsc` — keep typechecking in CI.
- `clientes/utils.ts` vs `clientes/clientes-utils.ts` overlap (findDuplicates vs descreverDuplicidades).

---

## 7. How to resume after losing chat history

1. Read this file (§5 = what is in flight, §4 = how to publish).
2. Read `docs/PROXIMOS-PASSOS.md` for the current checklist.
3. `git log --oneline -10` + `git status` to see where work stopped.
4. Run `npx vitest run` and `npm run build` to confirm baseline green.
5. **Write your progress/decisions back to `.md` before ending a session.**
