# DECISÕES DE ARQUITETURA — HC Tech

> **Log append-only.** Regra crítica do projeto: toda decisão de arquitetura,
> escolha técnica ou mudança de direção deve ser registrada aqui (e nos demais
> `.md`), nunca apenas no chat. Para registrar uma nova decisão, adicione uma
> entrada ao final do log — **não edite decisões antigas**; se uma decisão
> mudou, marque a antiga como `SUPERADA por #NN`.
>
> Formato: `#NN · YYYY-MM-DD · DECISÃO · JUSTIFICATIVA · ARQUIVOS AFETADOS`

## #016 · 2026-10-20 · Cards de categoria no cadastro de itens do Estoque

O cadastro de novos itens do Estoque passa a ter passo 1 com cards de "tipo de
item" no mesmo padrão visual do Novo Orçamento (border-2 `#00FF88`, ícone +
rótulo + descrição, `grid-cols-2 sm:grid-cols-3`, barra de progresso de 2
passos). Catálogo fonte: spec do ERP §4.1–§4.12 (**226 subcategorias**)
+ "Aparelho de cliente" (§2A, estágios de custódia), centralizado em
`src/sistema/data/categoriasEstoque.ts` (seed inicial; Etapa 2 moverá para o
Supabase). Persistência: `estoque.categoria` (slug) e `estoque.subcategoria`
(migrations `20261020000000` e `20261020001000`). Subcategoria usa o
`SearchableSelect` com criação inline e duplicidade case-insensitive.
Arquivos: `EstoqueForm.tsx`, `EstoqueForm.test.tsx`, `categoriasEstoque.ts(.test)`,
`store.ts`, `types.ts` (ambos), `sistema.ts`, migrations acima.

## #017 · 2026-10-20 · Runtime Supabase real × projeto documentado
A aplicação roda em `fiwbbhrrkongcryyqjmv` (`.env`/VITE_SUPABASE_URL), não em
`chllhailtkuffciaanlx` (config.toml, integração, docs). Enquanto não convergido:
todo SQL deve ser aplicado e verificado no **runtime real**; a integração só
alcança `chll…` (403 no real). Descoberto por gravação de Estoque falhando (400)
por `proprietario` inexistente. Ação: aplicar `20261020001000` no Dashboard do
projeto real e alinhar config/docs/integração ao runtime.

## #018 · 2026-10-20 · Marca/Modelo no Estoque reusa o ComboBusca do orçamento
O passo 2 do cadastro de itens do Estoque ganha campos **Marca** e **Modelo**
com a MESMA lógica da tela de Novo Orçamento: `ComboBusca` (input que abre a
lista no foco, filtra por digitação tolerante a acentos, mostra a marca ao lado
do modelo) foi **extraído** de `WizardNovaOS.tsx` para
`src/sistema/components/ComboBusca.tsx` (reuso — regra “não duplicar
funcionalidades”). Bases reaproveitadas: `MARCAS_CELULAR` ∪
`MARCAS_NOTEBOOK` (36 marcas) e modelos da Tabela de Telas +
`MODELOS_POR_MARCA` (filtrados pela marca).
Regra de composição do campo `Aparelho` (persistido como hoje, sem migration):
seleção na LISTA recompõe sempre (ação explícita); digitação só compõe se o
campo estiver vazio/na última composição (nunca apaga texto manual); ao editar
item salvo, melhor esforço de separar marca/modelo do aparelho gravado.
Arquivos: `ComboBusca.tsx` (novo), `WizardNovaOS.tsx` (importa o extraído),
`EstoqueForm.tsx`, `EstoqueForm.test.tsx`.

---

## #001 · 2026-10-13 · Subsistema `/sistema` dentro do mesmo app Vite
O sistema interno vive como subsistema (`src/sistema/`) do mesmo repositório do
site público, com guarda de rota e auth próprios. Evita repositório/stack nova e
mantém deploy único.
Arquivos: `src/sistema/*`, `src/App.tsx`.

## #002 · 2026-10-13 · Leitura e escrita separadas (Query hooks × Zustand store)
Todas as leituras vão para `src/integrations/supabase/sistema.ts` (TanStack
Query, keys `['sistema', <entidade>]`, staleTime 30s); todas as mutações para
`src/sistema/store.ts` (Zustand + invalidateQueries + toasts). Nunca duplicar
essa lógica em componentes.
Arquivos: `src/integrations/supabase/sistema.ts`, `src/sistema/store.ts`.

## #003 · 2026-10-13 · RLS obrigatório `auth.uid() = user_id`
Toda tabela nova cria `ENABLE ROW LEVEL SECURITY` + policy
`FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (...)`.
`service_role` (edge functions) bypassa RLS.
Arquivos: migrations.

## #004 · 2026-10-13 · Migrations em duas pastas (aceito, com ressalva)
`drizzle/migrations/0000–0002` (legado, **não** lido pelo `supabase db push`) e
`supabase/migrations/0003+` (lido pelo CLI/CI). Em banco novo aplicar 0000–0002
manualmente antes. Decisão registrada no `docs/HANDOFF-SISTEMA.md` §5.1.

## #005 · 2026-10-13 · Status de OS em minúsculo no banco
`ordens_servico.status` permanece minúsculo (`pendente`, `aprovado`,
`em_andamento`, `concluida`, `estoque`, `devolucao`, `cancelada`) por
compatibilidade com dados existentes; a UI exibe maiúsculo. Mapeamento em
`src/sistema/types.ts`.

## #006 · 2026-10-13 · Tabela `caixa_movimentos` mantida (não renomear)
O spec a chamava de `caixa_movimentacoes`; renomear quebraria produção.
Mantido `caixa_movimentos`.

## #007 · 2026-10-13 · Nunca inventar preço
A Tabela de Telas 08/2026 é a fonte da verdade; combinação não encontrada ⇒
"sujeito à avaliação técnica". `src/sistema/data/telas.ts`,
`src/sistema/services/precosService.ts`.

## #008 · 2026-10-19 · Orçamentos públicos só via edge function
Pedidos de orçamento entram somente pela edge function `solicitar-orcamento`
(insert com service role); `orcamento_solicitacoes` não tem acesso anon;
admins leem via `has_role`. Número comercial do WhatsApp centralizado em
`src/config/contact.ts`. (ver `AGENTS.md`)

## #009 · 2026-10-19 · Produção publicada a partir de `main`
`.github/workflows/deploy.yml` dispara apenas em `push` para `main`
(GitHub Pages + `CNAME hctechinfocell.com.br`). Migrations em workflow
separado (`migrations.yml`) com confirmação manual — push em `main` nunca
altera o banco sozinho.

## #010 · 2026-10-19 · Dois estoques separados (regra de ouro do ERP)
`public.estoque` permanece como **Aparelhos de Clientes** (custódia de
consertos) e será apenas *evoluída* (colunas anuláveis `cliente_id`, `os_id`,
`status_custodia`, ...). O **Estoque Comercial/Técnico** nasce em tabelas novas
com nomenclatura em inglês (alinhada à API do Mercado Livre):
`inventory_owners`, `sales_channels`, `product_categories`, `brands`,
`device_models`, `suppliers`, `products`, `product_compatibilities`,
`inventory_locations`, `inventory_balances`, `inventory_movements`,
`inventory_reservations`, `ordem_servico_pecas` (exceção em PT-BR),
`marketplace_*`. Nada é duplicado nem removido.
Ver `docs/ERP-ESTOQUE-PLANO.md` §3.

## #011 · 2026-10-19 · Proprietário × Canal de venda são campos distintos
Todo produto comercial tem saldo separado por **proprietário**
(`HC TECH` / `FASTCELL` / `MERCADO LIVRE`), enquanto ML/Loja Física/etc. é
**canal de venda**. Nunca usar um pelo outro. Colunas já existentes em
`estoque`: `proprietario`, `canal_de_venda` (migration 0003).

## #012 · 2026-10-19 · SearchableSelect é o componente único de listas de opção
Todo campo de opção (Categoria, Marca, Modelo, Fornecedor, Proprietário,
Canal) usa o combobox reutilizável com busca, teclado, criação inline e
prevenção de duplicidade case-insensitive. Implementado em
`src/components/ui/searchable-select.tsx` (`SearchableSelect` +
`useCatalogoQuery`, commit `2870643`) sobre Radix `Popover` + `cmdk`.
`FormSelect` legado permanece nas telas antigas; migração incremental.

## #013 · 2026-10-20 · Nenhum dado fictício no estoque ERP
Estrutura e catálogos base apenas; zero produtos/quantidades fake, zero
limite artificial de produtos. Seed restrito a catálogos de domínio
(categorias/marcas/canais) aprovados.

## #014 · 2026-10-20 · Documentação `.md` local é obrigatória
Todo contexto, decisão e progresso é gravado em arquivos `.md` no repositório
(`docs/CONTEXTO-PROJETO.md`, este arquivo, `docs/PROXIMOS-PASSOS.md`,
`WORKSUMMARY.md`) para garantir continuidade mesmo com perda do histórico de
chat. Critério de aceite de toda sessão: docs atualizados.

## #015 · 2026-10-20 · Mercado Livre apenas estrutural (Fase 1)
Criar tabelas `marketplace_listings` / `marketplace_sync_logs` (e futuras
`marketplace_*`) e preparar OAuth/sync, **sem** chamar a API real e sem tokens
antes da validação do estoque central (Etapa 7 do plano).
