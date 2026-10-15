# HANDOFF — Módulo `/sistema` (HC Tech InfoCell)

> Documento de replicação. Descreve **tudo** que foi construído no subsistema
> interno `/sistema` deste repositório, com o inventário exato de arquivos,
> o schema de banco, as dependências e o passo a passo para reproduzir o mesmo
> estado em outro caminho (pasta, branch ou máquina).
>
> Último commit do repositório: `9e2f6a2 feat(clientes): completa paginação e ações em massa`
> (2026-10-13). **Todo o trabalho descrito aqui está no working tree e ainda
> NÃO foi commitado.**

---

## 1. Objetivo do trabalho

Construir o **sistema interno de gestão** da assistência técnica (HC Tech) —
antes inexistente — como um subsistema dentro do mesmo projeto Vite/React do
site institucional + loja. A referência funcional é `Complementos site/hc-tech.html`
(HTML de referência com 9 módulos), citada nos comentários do código.

Premissas que foram seguidas:

| Regra | Onde se aplica |
|---|---|
| **Todas as strings em PT-BR** | todo `src/sistema/**` |
| Tabela de Telas 08/2026 é a **fonte da verdade** de preço | `data/telas.ts`, `services/precosService.ts` |
| **Nunca inventar preço** — combinação não encontrada ⇒ "sujeito à avaliação técnica" | `services/precosService.ts` |
| Autenticação preservada (Supabase Auth existente) | `auth.tsx`, `SistemaLayout.tsx` |
| RLS por `auth.uid() = user_id` em toda tabela nova | migrations |
| Query keys hierárquicas `['sistema', <entidade>]` + `staleTime: 30s` | `queryClient.ts`, `integrations/supabase/sistema.ts` |

---

## 2. Estado atual do repositório (o ponto de partida da replicação)

O projeto **não tem nada disso commitado**. Ao replicar, você precisa levar:

- **68 arquivos novos** dentro de `src/sistema/` (≈ **13.237 linhas**);
- **arquivos novos fora de `src/sistema/`** (lista na §4);
- **19 arquivos rastreados modificados** (`git diff --stat`: +1195 / −1303 linhas);
- **2 arquivos removidos**;
- **1 migration SQL nova**;
- **3 dependências novas** no `package.json`.

⚠️ **Atenção de segurança:** o arquivo `.env` **está rastreado no Git**
(`git ls-files .env` confirma). Ele contém a URL do projeto Supabase e a
`VITE_SUPABASE_PUBLISHABLE_KEY` (chave *anon*, que é pública por design e por
isso vaza no bundle de qualquer forma — visível em `/src/main.tsx` servido pelo
Vite). Não é um segredo crítico, mas o `.gitignore` só ignora `.env.local` —
se em algum momento houver `SERVICE_ROLE_KEY` ali, isso vira incidente.

---

## 3. Arquitetura do módulo

```
src/sistema/
├── types.ts              (755)  Domínio + adaptadores banco↔UI (snake_case ↔ camelCase, status)
├── auth.tsx              (27)   SistemaAuthProvider / useSistemaAuth (Supabase session)
├── queryClient.ts        (26)   QueryClient ÚNICO compartilhado com App.tsx (evita ciclo)
├── store.ts              (674)  Zustand: estado global + TODAS as mutações CRUD + toasts
├── store/
│   └── useOrcamentoStore.ts (331) Zustand + persist(localStorage): rascunho do wizard de orçamento
├── os-shared.tsx         (93)   Tipos OS/Cliente, STATUS_LABEL, StatusBadge, formatBRL, formatData, osNum
├── SistemaLayout.tsx     (60)   Guarda de rota + shell (sidebar + header + toast)
├── data/
│   ├── telas.ts          (237)  Tabela de Telas 08/2026 + normalização tolerante + autocomplete
│   ├── catalogos.ts      (357)  Catálogos: marcas, TIPOS_TELA, tipos de equipamento etc.
│   └── baseConhecimentoCausas.ts (615) Base de conhecimento de causas prováveis (diagnóstico)
├── services/
│   ├── precosService.ts      (326) consultarPreco() / gerarProtocoloSolicitacao() + MAPA_QUALIDADE_TELA
│   ├── tipoTelaService.ts    (146) Lógica PURA de opções do dropdown Tipo de Tela
│   └── tipoTelaService.test.ts (107) 8 testes vitest dessa lógica pura
├── clientes/
│   ├── clientes-utils.ts (200)  CSV import/export, validação CPF/telefone/e-mail, duplicidade, filtros
│   ├── clientes-utils.test.ts (96) 11 testes vitest
│   ├── utils.ts          (253)  findDuplicates, waUrl, templates de mensagem
│   ├── ClienteFormDialog.tsx (364)
│   └── test-consulta-selecao-massa.md (52) Nota de diagnóstico sobre seleção em massa
├── components/
│   ├── orcamentos/
│   │   ├── SolicitacaoOrcamentoWizard.tsx (1160)  Wizard público de solicitação de orçamento
│   │   └── WizardNovaOS.tsx              (586)   Wizard interno de Nova OS
│   ├── SistemaSidebar.tsx (193) Menu lateral — 4 seções, 10 itens (exporta SECOES_MENU)
│   ├── SistemaHeader.tsx  (148) Topbar (busca global, atalho Nova OS)
│   ├── DataTable.tsx      (228) Tabela genérica (paginação, seleção, react-window)
│   ├── FormInput.tsx      (190)
│   ├── Modal.tsx          (102)
│   ├── LoadingSpinner.tsx (75)
│   ├── ToastNotification.tsx (66)
│   ├── OSForm/OSList/OSFilters/OSActions/OSStatusBadge/OSByStatusChart/RecentOSList
│   ├── ClienteForm/ClienteList/ClienteDetailsDialog/ClienteImportDialog/ClienteOSHistory
│   ├── EstoqueForm/EstoqueList/EstoqueAlert
│   ├── CaixaForm/CaixaSummary/CaixaMovimentacaoList
│   ├── DevolucaoForm/DevolucaoList
│   ├── ServicoForm/ServicoList
│   ├── OrcamentoForm/OrcamentoList/OrcamentoStatusBadge
│   └── RelatorioGeral/RelatorioExportButton/RelatorioPrintButton/DashboardMetrics/TopDevicesTable
└── pages/
    ├── SistemaLoginPage.tsx     (82)  Login (e-mail/senha via Supabase Auth)
    ├── SistemaDashboardPage.tsx (90)  Métricas, OS por status, últimos atendimentos
    ├── SistemaOsPage.tsx        (170) Ordens de Serviço
    ├── SistemaClientesPage.tsx  (493) CRM: paginação, seleção em massa, import/export CSV
    ├── SistemaOrcamentosPage.tsx(918) Orçamentos + wizard
    ├── SistemaEstoquePage.tsx   (98)
    ├── SistemaServicosPage.tsx  (57)  Cadastro de tipos de serviço
    ├── SistemaTabelaPrecosPage.tsx (100) Tabela de preços (pública ao time)
    ├── SistemaCaixaPage.tsx     (70)
    ├── SistemaDevolucoesPage.tsx(71)
    └── SistemaRelatoriosPage.tsx(140)
```

### Divisão de responsabilidades (importante para não duplicar lógica)

| Camada | Arquivo | Papel |
|---|---|---|
| **Leitura** | `src/integrations/supabase/sistema.ts` (434) | Todos os hooks TanStack Query: `useOS`, `useClientes`, `useClientesLeves`, `useOrcamentos`, `useEstoque`, `useCaixa`, `useDevolucoes`, `useTiposServico`, `useMetricasDashboard`, `useOSPorStatus`, `useUltimasOS`, `useAparelhosMaisAtendidos`, `useRelatorioGeral` |
| **Escrita** | `src/sistema/store.ts` | Mutações CRUD + `invalidateQueries(['sistema', ...])` + notificações (toast) |
| **Estado de UI** | `src/sistema/store.ts` | Modais abertos, filtros, sidebar, notificações |
| **Domínio** | `src/sistema/types.ts` | Tipos + adaptadores (`adaptarOS`, `adaptarCaixa`, `paraStatusBanco`, `paraStatusUI`, `ORDENACAO_STATUS`) |

---

## 4. Inventário exato de mudanças

### 4.1 Arquivos novos que NÃO estão em `src/sistema/`

| Arquivo | Papel |
|---|---|
| `src/integrations/supabase/sistema.ts` (434 linhas, 15,6 KB) | Camada de integração Supabase (hooks de leitura do módulo) |
| `supabase/migrations/0003_create_sistema_tables.sql` (232 linhas) | Migration idempotente do módulo |
| `tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo` | Artefatos de build — **não levar**, são regenerados (e deveriam estar no `.gitignore`) |
| `_wizardPreview.tsx`, `wizard-preview.html` | Harness temporário de preview do wizard — **descartável**, ver §9 |

### 4.2 Arquivos rastreados modificados

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Rotas do `/sistema` reescritas: `SistemaGestaoPage` (arquivo único com prop `kind`) foi substituída por 6 páginas dedicadas; `QueryClient` local trocado por `getQueryClient()` de `@/sistema/queryClient` |
| `src/integrations/supabase/types.ts` | +150 linhas: tipos das tabelas novas (`estoque`, `orcamentos`, `devolucoes`) e colunas acrescentadas |
| `src/integrations/supabase/previewAuthStorage.ts` | Correção de escopo de `timer` (declaração movida para dentro do callback) |
| `src/pages/TelasPage.tsx` | Import de `@/data/telas` → `@/sistema/data/telas` |
| `src/data/telas.ts` | **REMOVIDO** — movido para `src/sistema/data/telas.ts` |
| `src/sistema/pages/SistemaGestaoPage.tsx` | **REMOVIDO** (323 linhas) — substituído pelas páginas dedicadas |
| `src/sistema/SistemaLayout.tsx` | Reescrito (166 linhas alteradas): guarda de auth + shell escuro + toasts |
| `src/sistema/clientes/clientes-utils.ts` | +241/−? : filtros de busca, validação, CSV |
| `src/sistema/clientes/clientes-utils.test.ts` | +96 : testes |
| `src/sistema/clientes/utils.ts` | Correção de tipo em `findDuplicates` (`telefone2`) |
| `src/sistema/components/ClienteForm.tsx` | +127 |
| `src/sistema/components/ClienteList.tsx` | +46 |
| `src/sistema/components/ClienteOSHistory.tsx` | +26 |
| `src/sistema/pages/SistemaClientesPage.tsx` | +446/−? : paginação, seleção em massa, import/export |
| `src/sistema/pages/SistemaDashboardPage.tsx` | +215 : métricas |
| `src/sistema/pages/SistemaOsPage.tsx` | +452/−? : refatorado para usar a store |
| `src/sistema/pages/SistemaServicosPage.tsx` | +126 : cadastro de serviços |
| `package.json` | +3 deps (ver §5) |
| `bun.lock` | +9 linhas (lock das novas deps) |

### 4.3 Dependências adicionadas

```json
"@types/react-window": "^2.0.0",   // tipos; está em `dependencies` (deveria ser devDependency)
"react-window": "^2.3.3",          // virtualização da DataTable
"zustand": "^5.0.15"               // estado global do módulo
```

Observação: `@types/react-window` foi adicionado em `dependencies` — o correto
seria `devDependencies`. Não afeta o runtime, mas vale corrigir na réplica.

---

## 5. Banco de dados

### 5.1 Linhagem do schema

O schema **não nasceu no módulo**. A base vem de migrations Drizzle que já
existiam no repositório:

| Arquivo | Tabelas criadas |
|---|---|
| `drizzle/migrations/0000_create_sistema_tables.sql` | `clientes`, `ordens_servico`, `servicos` |
| `drizzle/migrations/0001_clientes_modulo_completo.sql` | `cliente_contatos`, `cliente_interacoes`, `cliente_anexos` |
| `drizzle/migrations/0002_sistema_gestao_completa.sql` | `caixa_movimentos`, `servico_tipos` |
| **`supabase/migrations/0003_create_sistema_tables.sql`** (novo) | `estoque`, `orcamentos`, `devolucoes` + alterações |

⚠️ A migration `0003` está em `supabase/migrations/` enquanto `0000–0002` estão em
`drizzle/migrations/`. **São dois diretórios para a mesma numeração** — ao
replicar, aplique as quatro **em ordem** no mesmo banco. O Supabase não vai
aplicá-las automaticamente; é execução manual (SQL Editor ou `psql`).

### 5.2 O que a migration 0003 faz (é idempotente — pode rodar mais de uma vez)

1. **`ordens_servico`** — derruba e recria o `CHECK` de status para aceitar
   `pendente, aprovado, em_andamento, concluida, estoque, devolucao, cancelada`
   (os três últimos eram bloqueados pelo constraint original);
   adiciona `data_conclusao`, `updated_at` + trigger `set_updated_at()` + 2 índices.
2. **`caixa_movimentos`** — adiciona `os_id` (FK opcional para `ordens_servico`,
   `ON DELETE SET NULL`) + índice em `data`.
3. **`estoque`** (nova) — `user_id, aparelho, quantidade, defeito, condicao, observacao`.
4. **`orcamentos`** (nova) — `os_id`, `cliente_id`, `descricao`, `valor`,
   `status IN (pendente|aprovado|reprovado)`, `data_orcamento`.
5. **`devolucoes`** (nova) — sempre ligada a uma OS (`ON DELETE CASCADE`).
6. **`clientes`** — colunas `total_os` e `ultima_os` + função/trigger
   `update_cliente_total_os()` (a aplicação também calcula por agregação, então
   funciona mesmo sem o trigger).

**Decisões registradas no cabeçalho da migration:**
- `ordens_servico.status` permanece **minúsculo** (compatibilidade com dados
  existentes); a UI exibe maiúsculo. Mapeamento em `src/sistema/types.ts`.
- Mantida a tabela `caixa_movimentos` (o spec a chamava de
  `caixa_movimentacoes`; renomear quebraria produção).
- Estoque, Orçamentos e Devoluções ganharam **tabelas próprias**, em vez de
  serem apenas filtros de status.

**RLS:** toda tabela nova tem `ENABLE ROW LEVEL SECURITY` + policy
`FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (...)`.

---

## 6. A regra de preço (Tabela de Telas) — o coração do orçamento

Esta é a parte mais delicada e a que mais foi iterada. O fluxo é:

```
Modelo digitado (ex.: "iPhone 12")
   ↓ normalizarTolerante()            (data/telas.ts)
   ↓ marcasTelaPorEntrada() + marcasCandidatas()   (alias "Moto"→Motorola, prefixo, etc.)
   ↓ candidatosModelo()               (tolerância de digitação)
   ↓ linhas reais da Tabela de Telas
   ↓ construirOpcoesTipoTela()        (services/tipoTelaService.ts — PURO)
   ↓ dropdown de Tipo de Tela com o preço REAL de cada qualidade
   ↓ consultarPreco()                 (services/precosService.ts)
```

**Invariante garantida por teste:** *se o dropdown oferece uma qualidade, a
consulta de preço encontra ela* — `tipoTelaService.test.ts` verifica isso para
Apple/iPhone 12, Motorola/G84, Samsung/Galaxy S21 e Xiaomi/Redmi Note 12,
comparando com o **mínimo real** da tabela.

`MAPA_QUALIDADE_TELA` (em `precosService.ts`) traduz o enum `TipoTela` para a
qualidade **exata** gravada na coluna `qualidade`. Sem esse mapa, escolher
`AMOLED`/`DIAGNOSTICO`/`ORIGINAL`/`PADRÃO`/`TABLET` nunca encontraria preço.

Arquivos que precisam existir juntos: `src/sistema/data/telas.ts` (dados +
normalização), `src/sistema/data/catalogos.ts` (catálogo quando o modelo não
está na tabela), `src/sistema/services/tipoTelaService.ts` (opções puras),
`src/sistema/services/precosService.ts` (consulta).

---

## 7. Configuração e variáveis de ambiente

`.env` (rastreado no Git — ver aviso da §2):

```
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...   # chave anon (pública)
VITE_SUPABASE_URL=https://<projeto>.supabase.co
```

`.env.example` traz ainda `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (Google Analytics
do site institucional, não do `/sistema`).

Projeto Supabase atual: `fiwbbhrrkongcryyqjmv`.

O cliente Supabase (`src/integrations/supabase/client.ts`) é gerado
automaticamente e usa `brokeredPreviewStorage()` — storage de sessão via
`postMessage` para o editor, com origens confiáveis e timeout. **Isso é
específico do ambiente de preview do Lovable/Freebuff**; ao replicar em outro
caminho, verifique se esse storage faz sentido ou troque por `localStorage`.

⚠️ **Ponto crítico de replicação:** para o `/sistema` funcionar você precisa de
um **usuário de auth** com e-mail/senha no projeto Supabase. Sem isso o login
falha com "E-mail ou senha inválidos" e você nunca vê nenhuma tela interna.
Criar em Supabase → Authentication → Users.

A suíte de testes tem 20 casos no total: 8 em `tipoTelaService.test.ts`,
11 em `clientes-utils.test.ts` e 1 em `src/test/example.test.ts`.

---

## 8. Passo a passo para replicar em outro caminho

### Cenário A — outra pasta/máquina, mesmo projeto (mais comum)

1. Copie o repositório **incluindo os arquivos não rastreados**. Como nada está
   commitado, um `git clone` **NÃO** traz o módulo. Use uma cópia de diretório
   (excluindo `node_modules/`, `dist/`, `*.tsbuildinfo`) ou, no repositório de
   origem, faça primeiro um commit do working tree.
2. Confirme que `src/sistema/` chegou completo (68 arquivos) e que
   `src/integrations/supabase/sistema.ts` existe.
3. `bun install` (instala `zustand`, `react-window`, `@types/react-window`).
4. Crie o `.env` (copie do `.env.example`) apontando para o projeto Supabase.
5. **Aplique o banco** — em ordem, no mesmo projeto Supabase:
   `drizzle/migrations/0000_*.sql` → `0001_*.sql` → `0002_*.sql` →
   `supabase/migrations/0003_*.sql`.
6. Regenerar `src/integrations/supabase/types.ts` a partir do schema
   (ou copiar o arquivo, que já está modificado neste working tree).
7. Crie um usuário de auth (§7).
8. `bun run dev` → http://localhost:8080 → `/sistema` redireciona para
   `/sistema/login`.

### Cenário B — outra branch do mesmo repositório

Faça o commit do working tree na branch atual e depois
`git switch -c <nova-branch>` (o commit acompanha). Alternativa isolada:
`git worktree add ../outro-caminho -b <nova-branch>`. **Não** use
`git stash` como transporte — o stash não cruza worktrees de forma confiável
para arquivos não rastreados sem `-u`.

### Cenário C — outro cliente/projeto Supabase

Além dos passos do Cenário A, atualize `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PROJECT_ID` e `VITE_SUPABASE_PUBLISHABLE_KEY`, e crie o usuário
de auth no projeto novo.

---

## 9. Verificação

Comandos usados durante o desenvolvimento (todos com status preservado):

```bash
node_modules/.bin/tsc --noEmit -p tsconfig.app.json   # typecheck
npx --yes bun@latest run test                          # vitest run
npx --yes bun@latest run lint                          # eslint .
npx --yes bun@latest run build                         # vite build
```

Último resultado conhecido: **typecheck 0 erros**, **testes 20/20 passando**,
**lint 0 erros / 17 warnings pré-existentes**, **build OK (~11s)**.

Verificação funcional do dropdown (feita no navegador, lendo o DOM/ARIA do
dropdown aberto — o `preview_screenshot` não compõe frames neste ambiente):

| Entrada | Qualidades oferecidas |
|---|---|
| Apple + iPhone 12 | INCELL 220 · JK 280 · VIVID 340 · OLED 540 · AMOLED 640 · DIAGNOSTICO 740 |
| Motorola + G84 | INCELL 200–240 · ORIGINAL 400 |
| Modelo inexistente | as 12 qualidades do catálogo + aviso "Modelo não localizado na Tabela de Telas" |

Há um harness temporário no repositório (`_wizardPreview.tsx` +
`wizard-preview.html`, servido em `/wizard-preview.html`) usado para testar o
wizard fora do login. **É andaime** — deve ser removido antes de qualquer
deploy, porque o `wizard-preview.html` na raiz do Vite fica publicamente
acessível em produção.

---

## 10. Lacunas e riscos conhecidos

1. **Nada está commitado.** O trabalho existe apenas no working tree. Esse é o
   maior risco: um `git checkout .` apaga o módulo inteiro (as 63 mil linhas
   são, em boa parte, arquivos não rastreados — não há como recuperar).
2. **Dois diretórios de migration** (`drizzle/` e `supabase/`) para a mesma
   numeração sequencial.
3. **`.env` rastreado no Git.**
4. **`tsconfig.*.tsbuildinfo` não ignorados** e presentes como não rastreados.
5. **`brokeredPreviewStorage`** é acoplado ao ambiente de preview; revisar em
   outro caminho.
6. O harness de preview (§9) ainda no repositório.
7. Duplicidade de campos de nome entre `clientes/utils.ts` e
   `clientes/clientes-utils.ts` — os dois vivem lado a lado com
   responsabilidades parcialmente sobrepostas (`findDuplicates` vs
   `descreverDuplicidades`).
