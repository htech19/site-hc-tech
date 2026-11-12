# PRÓXIMOS PASSOS — Auditoria do código local + alinhamento com produção

> Estado em 2026-10-20 · Branch `feature/ecommerce-hc-tech` (pushada; único
> arquivo não rastreado: `DATABASE-SUMMARY.md`).
> Marque os itens conforme concluir e **registre o resultado no próprio item**.
> Contexto global: `docs/CONTEXTO-PROJETO.md` · Decisões: `docs/DECISOES-ARQUITETURA.md`.
> Regra: nenhuma alteração destrutiva, nenhum dado apagado, nada publicado sem validação.

---

## FASE A — Auditoria do código local (somente leitura, sem alterar nada)

- [ ] **A1. Inventário do módulo Estoque atual** — confirmar arquivos, linhas e
  comportamento contra `docs/ERP-ESTOQUE-PLANO.md` §1.1:
  `src/sistema/pages/SistemaEstoquePage.tsx`,
  `src/sistema/components/Estoque{Form,List,Alert}.tsx`,
  bloco `useEstoque()` em `src/integrations/supabase/sistema.ts`,
  `criarItemEstoque/atualizarItemEstoque/excluirItemEstoque` em `store.ts`,
  `EstoqueItem`/`adaptarEstoque()` em `types.ts`.
  Registro: _a preencher_.

- [x] **A2. Confirmar que nada do ERP está implementado ainda** — procurar
  `products`, `product_categories`, `inventory_owners`, `inventory_balances`,
  `EstoqueTabs` no código (2026-10-20: **ausentes** ✔) e migrations novas em
  `supabase/migrations/` (esperado: só `20261008000000_create_sistema_tables.sql` ✔).

- [x] **A3. Baseline de qualidade** — executado em 2026-10-20:
  - `tsc --noEmit -p tsconfig.app.json` → **0 erros** após correções (antes: 11);
  - `npx vitest run` → **47/47 verdes**;
  - `npm run build` → **OK (~7 s)**.
  Correções aplicadas (sem supressões, sem tocar em dados):
  1. `src/components/ui/searchable-select.tsx` — reescrito (tag `</button>`
     fechada com `</div>`, API `Command.Item/Group/Input` inexistente neste
     projeto, exports duplicados, react-query v4 em projeto v5, catálogo
     hardcoded);
  2. `src/sistema/types.ts` — `MetricasDashboard` sem `solicitacoes`;
  3. `src/integrations/supabase/types.ts` — tipos de `estoque` desatualizados
     (faltavam `proprietario` e `canal_de_venda`, colunas da migration 0003).

- [ ] **A4. Mapear usos de `FormSelect`** — listar todos os campos de opção que
  ainda usam `FormSelect` (candidatos a migração para `SearchableSelect`),
  incluindo filtros. Lista vai para o final deste arquivo.

- [ ] **A5. Integração Estoque × OS hoje** — verificar como a OS consome peças
  hoje (hoje: texto livre) e registrar os pontos de toque futuros da Etapa 5
  (`ordem_servico_pecas`, baixa na aprovação/use do serviço).

- [ ] **A6. Componentes reutilizáveis disponíveis** — confirmar
  `DataTable`, `FormInput`/`FormTextarea`/`FormSelect`, `Modal`,
  `SearchableSelect`, `useCatalogoQuery`, `tabs.tsx` (shadcn) antes de criar
  qualquer coisa nova.

- [ ] **A7. Segurança** — revisar `SECURITY.md`, status do `.env` rastreado,
  ausência de `SERVICE_ROLE_KEY` em qualquer arquivo versionado, e harness
  `_wizardPreview.tsx` + `wizard-preview.html` (remover antes de publicar).

- [ ] **A8. Arquivos sujos do working tree** — `tsconfig.*.tsbuildinfo`,
  `wizard-preview.html`, `freebuff-sistema.md` (3,3 MB) — decidir destino
  (gitignore/remoção) sem tocar em código.

## FASE B — Auditoria do banco (Supabase remoto)

> ⚠️ Dois projetos: runtime real **`fiwbbhrrkongcryyqjmv`** (o que importa) ×
> `chllhailtkuffciaanlx` (config.toml/CI/integração). Auditar o real; a
> integração atual só alcança `chll…` (403 no real).

- [ ] **B1. Schema real vs migrations** — listar tabelas/colunas/índices do
  projeto remoto (`information_schema`) e comparar com `drizzle/0000-0002` +
  `supabase/0003`. Registrar divergências em `DATABASE-SUMMARY.md`.

- [ ] **B2. RLS** — conferir `pg_policies` de todas as 13 tabelas; confirmar
  `auth.uid() = user_id` e ausência de política anon perigosa (exceto as
  intencionais de `orcamento_solicitacoes` via `has_role`).

- [ ] **B3. Contagem de linhas** — registrar nº de linhas por tabela (baseline
  de preservação: nada pode diminuir).

- [ ] **B4. Migrations 0000–0002 aplicadas?** — se o remote não as tiver,
  registrar que precisam ser aplicadas manualmente **antes** de qualquer
  migration nova do ERP.

- [ ] **B5. Usuários/roles** — confirmar usuários de auth e papéis em
  `user_roles` (necessário para testar `/sistema`).

## FASE C — Alinhamento com a produção

- [ ] **C1. Definir qual branch é produção** — `deploy.yml` publica apenas em
  `main`; a branch `feature/ecommerce-hc-tech` **não** dispara deploy
  (commit `1e81a48` era vazio). Decidir: merge para `main` ou troca explícita
  do gatilho do workflow. Registrar a decisão em `DECISOES-ARQUITETURA.md`.

- [ ] **C2. Verificar o que está no ar** — abrir `https://www.hctechinfocell.com.br`,
  comparar com `dist/` local e com a branch; checar console/erros e se o
  `/sistema/login` responde.

- [ ] **C3. Diff local × produção** — `git log main..feature/ecommerce-hc-tech`
  e `git diff main...feature/ecommerce-hc-tech --stat`; lista exata do que
  será publicado no próximo merge.

- [ ] **C4. Secrets do GitHub Actions** — confirmar `SUPABASE_ACCESS_TOKEN` e
  `SUPABASE_DB_PASSWORD` (sem eles `migrations.yml` só avisa e o deploy
  continua) e `VITE_GA_MEASUREMENT_ID` (vars).

- [ ] **C5. Remover andames antes de publicar** — `_wizardPreview.tsx`,
  `wizard-preview.html` (servidos publicamente no build).

- [ ] **C6. Publicação** — build + testes verdes ⇒ merge para `main` (ou
  workflow ajustado) **somente após aprovação do usuário**; validar URL
  publicada, conteúdo e fluxo de orçamento ponta a ponta.

## FASE D — Fase 1 do ERP (aguardando aprovação do usuário)

- [ ] **D1. Apresentar o SQL completo da migration** (catálogos
  `inventory_owners`/`sales_channels`/`product_categories`/`brands`/
  `device_models`/`suppliers`, `products` + compatibilidade,
  `inventory_balances`/`inventory_movements`, `marketplace_*`) com índices, FKs
  e RLS — conforme `ERP-ESTOQUE-PLANO.md` §3 e §6.3. **Não aplicar** antes da
  aprovação.
- [ ] **D2. Estrutura do `SearchableSelect`** — ✅ existe e foi reparado em
  2026-10-20 (`src/components/ui/searchable-select.tsx`): busca, teclado,
  criação inline com duplicidade case-insensitive, `useCatalogoQuery` apontando
  para as tabelas da Etapa 2 (lista vazia até a migration).
- [ ] **D3. Estrutura do `EstoqueTabs`** — propor
  `src/sistema/estoque/EstoqueLayout.tsx` + abas (Visão Geral · Aparelhos de
  Clientes · Estoque Comercial · Movimentações · Mercado Livre · Relatórios),
  preservando o CRUD atual como aba "Aparelhos de Clientes".
- [ ] **D4. Obter aprovação** → então Etapa 2 (migrations de catálogos + tela
  de catálogos), depois formulários e integrações (Etapas 3–5).

---

## Log de execução (append)

| Data | Item | Resultado |
|---|---|---|
| 2026-10-20 | Contexto | Docs `CONTEXTO-PROJETO.md`, `DECISOES-ARQUITETURA.md`, `PROXIMOS-PASSOS.md` criados |
| 2026-10-20 | A1 | Inventário do módulo Estoque confere com `ERP-ESTOQUE-PLANO.md` §1.1 |
| 2026-10-20 | A2 | Nenhuma tabela/componente do ERP existe ainda ✔ |
| 2026-10-20 | A3 | Baseline **tsc 0 / 47-47 tests / build OK** após 3 correções (ver A3) |
| 2026-10-20 | D2 | `SearchableSelect` reparado (não compilava antes) |
| 2026-10-20 | Teste no navegador (baseline) | Dev server :8080 HTTP 200; home renderiza por completo (inclui seção SOBRE NÓS nova); `/sistema/login` renderiza form E-mail/Senha/Entrar; guarda de rota OK (`/sistema/estoque` → redirect p/ login); **console sem erros** (apenas warnings React Router v7 flags, pré-existentes). Screenshot indisponível neste ambiente (webview não compõe frames). |
| 2026-10-20 | Cards de categoria no Estoque | Implementado: `src/sistema/data/categoriasEstoque.ts` (13 cards = 12 grupos do §4 do spec + Aparelho de cliente; **226 subcategorias** completas), `EstoqueForm` em 2 passos com cards no padrão visual do orçamento (border-2 `#00FF88`, ícone+rótulo+descrição), subcategoria via `SearchableSelect` com criação inline, migration `20261020000000` + corretiva `20261020001000`. Verificações: tsc 0, **58/58 testes** (11 novos), build OK, fluxo validado no navegador (cards → filtro "amoled" → Super AMOLED → chip referência → campos → Voltar/Cancelar) |
| 2026-10-20 | **ALERTA: dois projetos Supabase** | O app roda em `fiwbbhrrkongcryyqjmv` (lido de VITE_SUPABASE_URL no runtime), mas `config.toml`, integração conectada e documentação apontam para `chllhailtkuffciaanlx`. Probe somente-leitura no projeto real: `orcamentos/devolucoes/data_conclusao/total_os/os_id` existem ✔, mas **`estoque.proprietario`/`canal_de_venda` NÃO existem** ✘ → gravar entrada no Estoque está **quebrado em produção** (INSERT → 400) desde a 0003 (o ALTER foi aplicado no projeto errado). `estoque` tem 0 linhas. Migração corretiva criada; aplicação pendente no Dashboard pelo usuário (integração retorna 403 no projeto real). |
| 2026-10-20 | Marca/Modelo no cadastro de itens (lógica do orçamento) | `ComboBusca` extraído de `WizardNovaOS` para `src/sistema/components/ComboBusca.tsx` (reuso sem duplicar; testes do wizard continuam verdes). Passo 2 do `EstoqueForm` agora tem **Marca** e **Modelo** com dropdown pesquisável usando as MESMAS bases do orçamento (`MARCAS_CELULAR` ∪ `MARCAS_NOTEBOOK` = 36 marcas; modelos da Tabela de Telas + `MODELOS_POR_MARCA`, filtrados pela marca — ex.: 137 modelos Samsung) e **compõe o campo Aparelho** ("Samsung A15"). Regra: escolher da lista recompõe sempre; digitação livre nunca apaga texto manual; melhor esforço de pré-preenchimento ao editar item salvo. Verificações: tsc 0, **61/61 testes** (+3), build OK, navegador validado (Samsung → A15 → Aparelho “Samsung A15”, sem erros novos no console). |
| 2026-10-20 | Teste no navegador (telas internas) | Sessão ativa existente no browser → sem precisar de login: **Dashboard** OK (3 OS, 4 solicitações, faturamento R$ 195, gráfico por status, últimas OS — dados reais); **`/sistema/estoque`** OK (busca, contadores 0/0, estado vazio); **modal "Nova Entrada no Estoque"** abre com APARELHO*/QUANTIDADE*/DEFEITO/CONDIÇÃO/OBSERVAÇÃO e fecha normalmente; **console sem erros**. Achados: (a) `EstoqueForm` **não expõe** `proprietario`/`canal_de_venda` — o `store.ts` grava defaults silenciosos ("HC TECH"/"Loja física"), hoje invisíveis na UI; (b) warning de acessibilidade Radix: `DialogContent` sem `Description`/`aria-describedby` (pré-existente). |
