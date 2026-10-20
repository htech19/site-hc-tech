# ERP de Estoque HC TECH — diagnóstico e plano de evolução

> **Status:** diagnóstico concluído, **nada implementado**.
> Este documento existe para aprovação antes de qualquer migration ou alteração de código.
> Data: 19/10/2026 · Base: `main` · Projeto Supabase `chllhailtkuffciaanlx`.

---

## 0. Resumo executivo

O módulo atual **não é um estoque comercial**. A tabela `public.estoque` guarda
aparelhos de clientes parados/aguardando conserto, com `aparelho`, `quantidade`,
`defeito`, `condição` e `observação`. Ela não tem SKU, categoria, proprietário,
custo, preço, localização, movimentações nem vínculo com OS.

Portanto, o pedido se divide em dois trilhos que **não podem compartilhar a mesma
tabela**:

| Trilho | O que é | Estrutura |
|---|---|---|
| **A. Aparelhos de clientes** | Custódia de aparelhos recebidos para assistência | `estoque` atual, evoluída e vinculada a cliente/OS |
| **B. Estoque comercial e técnico** | Produtos, peças, acessórios, ferramentas, insumos, mercadoria de HC TECH/FASTCELL/ML | Novo núcleo `products` + `inventory_*` |

Não existe hoje nenhuma estrutura equivalente ao trilho B. As tabelas
`servicos` (tabela de preços), `orcamentos`, `devolucoes` e `caixa_movimentos`
não substituem catálogo, saldo, proprietário ou movimentação. **Nada será
duplicado; nada existente será removido.**

A implementação será **aditiva e faseada**. A primeira entrega de código
(Etapa 2) é o núcleo de catálogos + o componente `SearchableSelect`; a
integração real com o Mercado Livre fica para a Etapa 7, depois de o estoque
central estar validado.

---

## 1. Diagnóstico do módulo atual

### 1.1 Arquivos que compõem o Estoque hoje

| Arquivo | Papel | Linhas |
|---|---|---|
| `src/App.tsx` | Rota `/sistema/estoque` → `SistemaEstoquePage` | 103 |
| `src/sistema/pages/SistemaEstoquePage.tsx` | Página: alerta, busca, total, botão Entrada, modal | 98 |
| `src/sistema/components/EstoqueForm.tsx` | Modal de criação/edição (`aparelho`, qtd, defeito, condição, observação) | 129 |
| `src/sistema/components/EstoqueList.tsx` | Tabela com editar/excluir | 151 |
| `src/sistema/components/EstoqueAlert.tsx` | Alerta de quantidade ≤ 1 | 46 |
| `src/integrations/supabase/sistema.ts` | `useEstoque()` — leitura | 12 (bloco) |
| `src/sistema/store.ts` | `criarItemEstoque`, `atualizarItemEstoque`, `excluirItemEstoque` | 45 (bloco) |
| `src/sistema/types.ts` | `EstoqueItem` + `adaptarEstoque()` | 10 + 10 |
| `src/sistema/components/DataTable.tsx` | Tabela reutilizável (ordenação, paginação, erro/vazio) | 244 |
| `src/sistema/components/FormInput.tsx` | `FormInput`, `FormTextarea`, `FormSelect` (Radix, sem busca) | 190 |

**Funcionalidades existentes:** listar, buscar por aparelho/defeito/condição/
observação, criar, editar, excluir, alertar quantidade baixa, total de unidades.
Tudo em um único CRUD, sem histórico.

### 1.2 Banco de dados real (verificado no Supabase, não só nas migrations)

Tabelas em `public`: **13**. Todas com RLS habilitado.
`auth.users`: 1 usuário (`hctechinfocell@gmail.com`) com papel `admin` em
`public.user_roles`.

| Tabela | Linhas hoje | Observação |
|---|---:|---|
| `estoque` | **0** | Aparelhos de clientes (sem dados) |
| `ordens_servico` | **1** | OS em texto livre: `aparelho`, `marca`, `defeito`, `valor`, status |
| `clientes` | 0 | CRM |
| `servicos` | 0 | Tabela de preços sincronizada por código (não é catálogo de produtos) |
| `servico_tipos` | 0 | Tipos de serviço |
| `orcamentos` | 0 | Vincular a OS/cliente |
| `devolucoes` | 0 | Vinculada a OS |
| `caixa_movimentos` | 0 | `os_id` opcional |
| `orcamento_solicitacoes` | 2 | Pedidos do site (RLS por `has_role(admin)`) |

**`estoque` (estrutura real):**

```
id uuid PK default gen_random_uuid()
user_id uuid NOT NULL
aparelho text NOT NULL
quantidade integer NOT NULL default 1 check (quantidade >= 0)
defeito text
condicao text
observacao text
created_at timestamptz NOT NULL default now()
```

- RLS: `Users manage own estoque` `FOR ALL` com `auth.uid() = user_id`.
- Índices: apenas a PK. Não há índice em `user_id`, `aparelho` ou `created_at`.
- **Não há FK** para `clientes` nem para `ordens_servico`.
- A migration antiga faz backfill de OS com `status = 'estoque'` **apenas se a
  tabela estiver vazia**. Hoje está vazia e a OS existente não está nesse status,
  então não há linha de estoque a preservar — mas a tabela e o código continuam.

#### 1.2.1 Relacionamentos e políticas RLS reais

**Chaves estrangeiras existentes:**

| Origem | Destino | Regra |
|---|---|---|
| `ordens_servico.cliente_id` | `clientes.id` | `ON DELETE SET NULL` |
| `orcamentos.os_id` | `ordens_servico.id` | `ON DELETE SET NULL` |
| `orcamentos.cliente_id` | `clientes.id` | `ON DELETE SET NULL` |
| `caixa_movimentos.os_id` | `ordens_servico.id` | `ON DELETE SET NULL` |
| `devolucoes.os_id` | `ordens_servico.id` | `ON DELETE CASCADE` |
| `cliente_contatos.cliente_id` | `clientes.id` | `ON DELETE CASCADE` |
| `cliente_anexos.cliente_id` | `clientes.id` | `ON DELETE CASCADE` |
| `cliente_interacoes.cliente_id` | `clientes.id` | `ON DELETE CASCADE` |
| `user_roles.user_id` | `auth.users.id` | `ON DELETE CASCADE` |
| **`estoque`** | — | **Nenhuma FK** (é o que será corrigido de forma opcional com `cliente_id`/`os_id`) |

**Políticas RLS existentes (não serão alteradas):**

| Tabela | Política | Comando | Regra |
|---|---|---|---|
| `ordens_servico` | `Users manage own OS` | ALL | `auth.uid() = user_id` |
| `clientes` | `Users manage own clientes` | ALL | `auth.uid() = user_id` |
| `estoque` | `Users manage own estoque` | ALL | `auth.uid() = user_id` |
| `orcamentos` | `Users manage own orcamentos` | ALL | `auth.uid() = user_id` |
| `devolucoes` | `Users manage own devolucoes` | ALL | `auth.uid() = user_id` |
| `caixa_movimentos` | `Users manage own caixa` | ALL | `auth.uid() = user_id` |
| `servico_tipos` | `Users manage own servico_tipos` | ALL | `auth.uid() = user_id` |
| `servicos` | `Authenticated can read servicos` | SELECT | `true` (somente leitura) |
| `cliente_contatos` | `Users manage own contatos` | ALL | `auth.uid() = user_id` |
| `cliente_anexos` | `Users manage own anexos` | ALL | `auth.uid() = user_id` |
| `cliente_interacoes` | `Users read/insert/delete own interacoes` | SELECT/INSERT/DELETE | `auth.uid() = user_id` |
| `orcamento_solicitacoes` | `Admins read/update solicitacoes` | SELECT/UPDATE | `has_role(auth.uid(), 'admin')` |
| `user_roles` | `Users read own roles` | SELECT | `user_id = auth.uid()` |

**`ordens_servico` (colunas relevantes):**

```
id, numero (sequence), user_id, cliente_id, cliente_nome, telefone,
aparelho, marca, quantidade, defeito, status, observacao, valor,
data_entrada, data_conclusao, created_at, updated_at
```

Status aceitos: `pendente, aprovado, em_andamento, concluida, estoque,
devolucao, cancelada`. A UI mapeia `aprovado` para `EM_ANDAMENTO`.
**Não existe tabela de peças da OS.** O valor da OS é um campo único; não há
custo de peça, quantidade de peça, proprietário nem baixa de estoque.

### 1.3 Como o Estoque se relaciona com as OS hoje

- **Não se relaciona por chave.** `estoque` e `ordens_servico` são independentes.
- O dashboard usa `ordens_servico.status = 'estoque'` para a métrica
  **“Em Estoque”** (`useMetricasDashboard`, `emEstoque`) e `count(*)` de
  `public.estoque` para `itensEstoque` (hoje não exibido nos cards).
- A tela de Estoque é uma lista manual paralela ao fluxo da OS. Não há baixa
  automática, reserva, consumo nem histórico de peças.

### 1.4 Componentes reutilizáveis (o que já dá para aproveitar)

| Recurso | Situação | Uso no novo módulo |
|---|---|---|
| `DataTable` | Ordenação, paginação, estados de erro/vazio, mobile | Listas de produtos, movimentos, fornecedores |
| `Modal` | Dialog escuro, rodapé, loading, `naoFecharFora` | Formulários |
| `FormInput` / `FormTextarea` | Label, erro, dica, tema escuro | Campos de texto |
| `FormSelect` | Radix Select **sem busca** | Não atende à regra de listas pesquisáveis; será complementado, não removido |
| `ui/command.tsx` + `cmdk` | Já instalados no projeto, **sem uso atual** | Base do `SearchableSelect` |
| `ui/popover.tsx` | Radix Popover instalado | Combobox |
| `ClienteImportDialog` | CSV com prévia, erros e duplicidade | Modelo para o importador de produtos |
| `LoadingSpinner` / `EstadoErro` | Estados de consulta confiáveis | Todas as telas novas |
| `formatBRL`, `formatData` | `os-shared.tsx` | Valores e datas |
| `queryClient` + `invalidateQueries(['sistema', ...])` | Cache hierárquico | Invalidação de catálogos e saldos |
| `catalogos.ts` / `telas.ts` | Marcas, modelos, qualidades, tabela de preços 08/2026 | **Fonte de seed** dos catálogos; a tabela de preços continua intocada |

### 1.5 Lacunas em relação ao pedido

| Área pedida | Hoje | Falta |
|---|---|---|
| Separação aparelhos × mercadoria | Tudo em `estoque` | Vínculo com cliente/OS e núcleo comercial separado |
| Proprietário | Não existe | `inventory_owners` + saldo por proprietário |
| Canal de venda | Não existe | `sales_channels` + vínculo produto/canal |
| Categorias/subcategorias | Não existe | Árvore gerenciável + seed completo |
| Listas pesquisáveis | `FormSelect` sem busca | `SearchableSelect` com criação inline |
| Catálogo de produtos | Não existe | `products` com SKU, custo, preço, atributos |
| Compatibilidade peça × modelo | Não existe | `product_compatibilities` + `device_models` |
| Saldo por proprietário/local/lote | Só `quantidade` | `inventory_balances` |
| Movimentações | Só edição direta da quantidade | Ledger imutável + RPC transacional |
| Reservas/estoque de segurança | Não existe | `inventory_reservations` + `safety_stock` |
| Peças na OS | Não existe | `ordem_servico_pecas` + reserva/consumo |
| Dashboard de estoque | Só contagem de linhas | KPIs e filtros por período/categoria/proprietário/canal |
| Importação | Só clientes (CSV) | CSV + Excel com prévia e histórico |
| Mercado Livre | Nada | OAuth, anúncios, pedidos, fila, logs, webhooks |
| Auditoria | Nada | Movimentos imutáveis + `inventory_audit_log` |

### 1.6 Restrições operacionais descobertas

1. **CI de migrations não aplica nada hoje.** O job avisa que
   `SUPABASE_DB_PASSWORD` e `SUPABASE_ACCESS_TOKEN` não estão configurados.
   Toda migration nova precisará ser aplicada explicitamente (SQL Editor ou CLI
   autenticado) e verificada. Não confiar no deploy para criar tabelas.
2. **Banco praticamente sem dados de estoque.** Isso reduz o risco de migração,
   mas não autoriza apagar nada. A única OS existente deve continuar intacta.
3. **RLS é por usuário (`user_id`), não por tenant.** Hoje há um único admin.
   O `owner_id` do novo módulo é **proprietário da mercadoria** (HC TECH,
   FASTCELL, ML), não usuário autenticado. Os dois conceitos ficam separados.
4. **Não há bucket de Storage.** Para fotografia de produto será necessário
   criar `product-images` com política de acesso (Etapa 3).
5. **Não há `pg_trgm`/`unaccent` instalados.** Serão criados na migration do
   núcleo para busca tolerante; se o projeto não permitir, o fallback é
   `ilike` com índices funcionais.
6. **`pg_cron` não está instalado.** A expiração de reservas e o worker de
   sincronização não devem depender dele sem confirmação; usar Edge Function
   agendada ou GitHub Actions enquanto isso.

---

## 2. Decisões de arquitetura

### 2.1 Preservar `estoque` como custódia de aparelhos de clientes

- A tabela **não será renomeada nem recriada**. Recebe apenas colunas novas,
  todas anuláveis: `cliente_id`, `os_id`, `status_custodia`, `data_saida`,
  `updated_at` e índices.
- `status_custodia` cobre os sete estágios pedidos:
  `aguardando_orcamento`, `aguardando_aprovacao`, `em_manutencao`,
  `aguardando_pecas`, `em_teste`, `pronto_retirada`, `aguardando_devolucao`,
  além de `entregue` e `devolvido`.
- O formulário atual continua funcionando; ganha os campos novos de forma
  opcional. Nenhum campo existente é removido.
- A tela “Aparelhos de clientes” mostra **duas visões**:
  1. **Custódia** — CRUD atual, agora com cliente/OS/estágio.
  2. **Pipeline da assistência** — leitura derivada das OS + orçamentos, sem
     duplicar registros. Ações levam para a OS.
- Esses aparelhos **nunca** entram em `inventory_balances`; não têm
  proprietário comercial nem valor de venda.

### 2.2 Núcleo comercial novo, sem duplicar identidade

- `products` é a identidade comercial do item. **Um produto, vários saldos.**
- O mesmo produto pode ter estoque de HC TECH, FASTCELL e ML sem duplicar
  cadastro: o vínculo é `inventory_balances(product_id, owner_id, location_id,
  lot_code)`.
- Canal de venda é uma dimensão separada (`sales_channels` +
  `product_sales_channels`). **Mercado Livre é canal**, e também existe como
  opção de proprietário para mercadoria em Full/consignação, conforme pedido.
  A distinção fica explícita no banco (`inventory_owners.kind` e
  `sales_channels.kind`).
- Preço/custo ficam no produto; o saldo não guarda preço. Relatórios de valor
  usam custo/preço atuais ou o custo congelado no movimento.
- O produto pode ser cadastrado sem saldo (catálogo). **Toda linha de saldo,
  movimento, reserva ou peça de OS exige `owner_id`**; não existe estoque
  “sem dono”.

### 2.3 Saldo é derivado do ledger, não editável à mão

- `inventory_movements` é **append-only** (sem UPDATE/DELETE para o cliente).
- `inventory_balances` é a tabela de saldo corrente, atualizada **somente** por
  funções SQL transacionais.
- Correções: estorno (`reverses_movement_id`) ou ajuste de inventário, nunca
  `UPDATE quantidade`.
- Toda operação recebe `idempotency_key`; retry não duplica movimento.
- `available = on_hand - reserved - damaged`; `safety_stock` é um buffer
  separado que reduz o disponível para venda sem alterar o físico.
- Saldo negativo é bloqueado no banco; ajuste negativo exige `has_role(admin)`
  e motivo registrado.

### 2.4 RLS e privilégios

- Tabelas de catálogo/produto: `user_id = auth.uid()` para SELECT/INSERT/UPDATE;
  exclusão é lógica (`active`/`status`), não física.
- `inventory_balances` e `inventory_movements`: **SELECT** para o dono;
  INSERT/UPDATE/DELETE **revogados** de `authenticated`. Escrita só pelas RPCs
  `SECURITY DEFINER`.
- `inventory_movements`: sem policy de UPDATE/DELETE (imutável).
- `marketplace_credentials`: RLS habilitado, **sem policy**; apenas
  `service_role` acessa. Tokens ficam no Supabase Vault (`supabase_vault`
  já instalado), nunca no frontend, nunca em `localStorage`.
- As policies existentes de OS, clientes, caixa, orçamentos e devoluções
  **não serão alteradas**.
- Ajustes administrativos usam `public.has_role(auth.uid(), 'admin')`.

### 2.5 Listas pesquisáveis centralizadas

- Um único componente `SearchableSelect` (Popover + `cmdk`) com:
  busca por digitação, autocomplete, filtro instantâneo, navegação por teclado,
  touch no mobile, seleção de existente, criação inline quando autorizado,
  invalidação do cache após criar e bloqueio de duplicidade normalizada.
- As opções vêm do Supabase via hooks (`['sistema','catalogo',tipo]`), com
  `staleTime` de 5 min. **Nenhum array estático novo** para opções de formulário.
- `catalogos.ts`/`telas.ts` continuam existindo como **seed** e como fonte da
  Tabela de Preços; não serão usados como lista de opções em runtime.
- Duplicidade: índice único em `lower(btrim(name))` (por pai/usuário), e a
  criação inline captura `23505`, selecionando o registro existente em vez de
  criar outro.
- O `FormSelect` atual permanece para telas legadas; a migração para o novo
  componente é incremental e não quebra formulários existentes.

### 2.6 Formulários dinâmicos por categoria

- `product_categories.attribute_schema` (JSONB) descreve os campos extras da
  categoria (ex.: tela → tecnologia, aro, qualidade; bateria → mAh, código;
  cabo → conector, comprimento, potência; fone → versão Bluetooth, autonomia).
- `products.attributes` (JSONB) guarda os valores; campos técnicos importantes
  também têm colunas indexadas (`technical_code`, `quality_id`, `brand_id`).
- Compatibilidade **não** fica só em texto: `product_compatibilities` liga a
  `device_models` (marca + modelo), permitindo busca por modelo e evitando
  presumir compatibilidade por nome parecido.

### 2.7 SKU e código de barras

- SKU automático e imutável: `HC-<PREFIXO_CATEGORIA>-<SEQUÊNCIA>` (ex.:
  `HC-TEL-000123`), gerado por função atômica com contador por usuário/prefixo.
- Importação pode informar SKU; se já existir, atualiza o produto (sem saldo).
- Código de barras é texto livre, único quando preenchido (índice parcial).
- Produto sem SKU manual nunca recebe SKU duplicado; a constraint é do banco.

### 2.8 Integração com OS: reservar, não baixar no orçamento

1. Adicionar peça na OS → produto pesquisável, proprietário, quantidade,
   custo e valor cobrado.
2. `inventory_reserve` cria reserva ativa; **`on_hand` não muda**, mas
   `available` cai.
3. A baixa (`service_order_out`) acontece em ação explícita “Consumir peças” ou
   na transição para `EM_ANDAMENTO`/`CONCLUIDA`, conforme configuração.
4. Cancelamento/devolução libera a reserva ou estorna o consumo com
   `return_in`.
5. Criar orçamento **nunca** desconta peça.
6. Histórico de peças por OS fica em `ordem_servico_pecas` + movimentos.

### 2.9 Mercado Livre: preparado, não publicado

- Etapa 7 só começa depois de o núcleo de estoque estar validado.
- OAuth oficial com `state` assinado e validação estrita do `redirect_uri`;
  tokens no Vault; Edge Functions com `service_role`; nenhum token no bundle.
- Webhooks idempotentes (`marketplace_webhook_events.external_event_id`),
  fila com retry/backoff, logs e reconciliação.
- `logistic_type` é lido por anúncio (próprio, Full, flex, etc.); **não** se
  assume que todos usam o mesmo modelo.
- Modo teste por flag: importar anúncios/pedidos e simular baixas, **sem**
  alterar anúncios reais até autorização expressa.
- Sincronização **manual** (botão “Sincronizar agora”) e **automática** (job
  agendado + webhook); ambas passam pela mesma fila idempotente.
- O Supabase continua sendo a fonte central dos saldos; o ML é espelho.

---

## 3. Modelo de dados proposto

> **Regra de nomenclatura:** as tabelas existentes permanecem exatamente como
> estão (`aparelho`, `defeito`, `valor`, `created_at`). As tabelas **novas** do
> núcleo comercial usam nomes e colunas em inglês (`products`, `owner_id`,
> `quantity`, `unit_cost`), alinhadas aos nomes pedidos e à API do Mercado Livre.
> A UI continua 100% em PT-BR; os adaptadores em `types.ts` fazem o mapeamento
> snake_case ↔ camelCase, como já acontece no módulo atual. A única exceção é
> `ordem_servico_pecas`, que fica em PT-BR por ser extensão direta da tabela
> existente `ordens_servico`.

### 3.1 Catálogos (Etapa 2)

| Tabela | Campos-chave | Regras |
|---|---|---|
| `inventory_owners` | `id, user_id, name, kind, active` | Seed: HC TECH, FASTCELL, MERCADO LIVRE. Único `lower(btrim(name))` |
| `sales_channels` | `id, user_id, name, kind, active` | Seed: Loja física, Mercado Livre, WhatsApp, Site, Venda direta, Outros |
| `product_categories` | `id, user_id, parent_id, name, slug, path, level, sort_order, attribute_schema, active` | Árvore; único por pai + nome normalizado; sem exclusão física se houver produto |
| `brands` | `id, user_id, name, kind, active` | `kind`: produto/aparelho/ambos |
| `device_models` | `id, user_id, brand_id, name, aliases, active` | Único por marca + nome normalizado; seed a partir das marcas/modelos já existentes |
| `product_types` | `id, user_id, name, active` | Revenda, peça, acessório, ferramenta, equipamento, insumo, consumo |
| `product_colors` | `id, user_id, name, hex, active` | — |
| `units_of_measure` | `id, user_id, name, symbol, active` | UN, PC, CX, KG, L, M |
| `quality_grades` | `id, user_id, name, description, active` | Seed das qualidades de tela + Original/OEM/Premium/Compatível/Recondicionada |
| `movement_reasons` | `id, user_id, name, kinds, requires_note, active` | `kinds` = array de tipos de movimento aplicáveis |
| `suppliers` | `id, user_id, name, document, phone, email, notes, active` | Único por documento quando houver; nome normalizado |

**Seed de categorias:** as 12 categorias do pedido + todas as subcategorias
listadas (acessórios, telas, baterias, câmeras, carcaças, flex, áudio, sensores,
componentes, ferramentas, insumos, testes). Nenhum produto e **nenhuma
quantidade** serão criados. A árvore é criada com `active = true` e pode ser
editada/desativada pelo sistema.

### 3.2 Produto (Etapa 3)

| Tabela | Campos-chave | Regras |
|---|---|---|
| `products` | `id, user_id, sku, barcode, name, description, category_id, product_type_id, brand_id, model_id, supplier_id, technical_code, quality_id, color_id, unit_id, attributes jsonb, cost_price, sale_price, min_stock, max_stock, image_path, status, created_at, updated_at` | SKU único por usuário; código de barras único parcial; `status`: `active`/`inactive`/`discontinued`; `model_id` referencia `device_models` quando o produto é específico de um aparelho; `supplier_id` é o fornecedor principal |
| `product_compatibilities` | `product_id, device_model_id, notes` | PK composta; N:N |
| `product_sales_channels` | `product_id, sales_channel_id` | PK composta; um produto em vários canais |
| `product_images` | `id, product_id, storage_path, sort_order` | Opcional na primeira versão; `products.image_path` atende ao pedido |

**Margem de lucro** é calculada em view/fórmula (`(sale_price - cost_price) /
cost_price`), não armazenada, para não ficar inconsistente quando o custo muda.

**Proprietário, localização e quantidade não são colunas de `products`.** Eles
pertencem ao saldo (`inventory_balances`). O formulário de produto tem uma
seção “Estoque inicial” com proprietário, localização, quantidade e custo; isso
permite o mesmo produto com saldos de HC TECH e FASTCELL sem duplicar cadastro.
O campo “Proprietário” também aparece como filtro e como coluna de saldo nas
listas.

**Atributos dinâmicos:** `product_categories.attribute_schema` por categoria e
`products.attributes` no produto. Exemplos de schema inicial:
- Telas: tecnologia (LCD/OLED/AMOLED...), com/sem aro, qualidade,
  compatibilidade (via relação), código técnico.
- Baterias: capacidade mAh, código, original/compatível.
- Cabos: conector, comprimento, potência, qualidade.
- Fones: modelo, versão Bluetooth, autonomia, cor.

### 3.3 Estoque e movimentações (Etapa 4)

| Tabela | Campos-chave | Regras |
|---|---|---|
| `inventory_locations` | `id, user_id, name, kind, active` | Loja, balcão, bancada, depósito, trânsito, Full, avaria, fornecedor |
| `inventory_balances` | `id, user_id, product_id, owner_id, location_id, lot_code, on_hand, reserved, damaged, safety_stock, updated_at` | Único `(product_id, owner_id, location_id, lot_code)`; checks `>= 0` e `reserved + damaged <= on_hand` |
| `inventory_movements` | `id, user_id, kind, product_id, owner_id, from_owner_id, to_owner_id, from_location_id, to_location_id, quantity, unit_cost, reason_id, supplier_id, os_id, sales_channel_id, marketplace_order_id, responsible_user_id, idempotency_key, reverses_movement_id, notes, created_at` | Append-only; idempotência única por usuário; checks por tipo |
| `inventory_reservations` | `id, user_id, product_id, owner_id, location_id, quantity, status, source, os_id, listing_id, expires_at, created_by, consumed_movement_id` | Status `active`/`consumed`/`released`/`expired`; uma ativa por OS+produto+proprietário |
| `inventory_transfers` | `id, user_id, from_owner_id, to_owner_id, from_location_id, to_location_id, status, created_by, sent_at, received_at, notes` | `pending`/`sent`/`received`/`cancelled` |
| `inventory_transfer_items` | `transfer_id, product_id, quantity, unit_cost` | Itens da transferência |
| `inventory_audit_log` | `id, user_id, table_name, record_id, action, before jsonb, after jsonb, created_at` | Alterações de cadastro e ajustes |

**Tipos de movimento:** `purchase_in`, `return_in`, `adjustment_in`,
`sale_out`, `service_order_out`, `loss_out`, `damage_out`, `transfer_out`,
`transfer_in`, `inventory_adjustment`, `reversal`. A UI traduz cada tipo para
PT-BR. Reservas ficam na tabela própria e são refletidas em
`inventory_movements` apenas quando consumidas/liberadas, para não sujar o
saldo físico.

**Quantidades exibidas:** física (`on_hand`), reservada (`reserved`),
disponível física (`on_hand - reserved - damaged`), disponível para venda
(`on_hand - reserved - damaged - safety_stock`), avariada (`damaged`), em
transferência (soma dos itens cujo `inventory_transfers.status = 'sent'`),
anunciada (soma de `marketplace_listings.available_quantity`).

**Dependência entre etapas:** `inventory_reservations.listing_id` e
`inventory_movements.marketplace_order_id` são `uuid` sem FK na Etapa 4; as
FKs para as tabelas de marketplace são criadas na Etapa 7, quando elas
existem. Isso mantém cada migration aplicável isoladamente.

### 3.4 Peças na OS (Etapa 5)

| Tabela | Campos-chave | Regras |
|---|---|---|
| `ordem_servico_pecas` | `id, user_id, os_id, product_id, owner_id, location_id, quantity, unit_cost, charged_price, status, reservation_id, movement_id, created_by, created_at, updated_at` | Status `reserved`/`consumed`/`returned`/`cancelled`; único por OS+produto+proprietário |

- Adicionar peça → reserva (sem baixa).
- Consumir → movimento `service_order_out`, baixa de `on_hand` e `reserved`.
- Devolver/cancelar → libera reserva ou movimento `return_in`.
- A OS existente ganha apenas uma seção “Peças” na tela; colunas atuais
  permanecem. `valor` da OS não é recalculado automaticamente sem confirmação.

### 3.5 Importação e inventário (Etapa 6)

| Tabela | Papel |
|---|---|
| `inventory_import_batches` | Histórico: arquivo, modo, totais, status, resumo |
| `inventory_import_rows` | Linha crua, erros, produto criado/atualizado, ação |
| `inventory_counts` | Sessão de contagem (local, proprietário, status) |
| `inventory_count_items` | Sistema × contado, divergência, movimento de ajuste |
| `sales` / `sale_items` | Vendas de loja física/WhatsApp/site (opcional nesta etapa, para “vendas por canal” e vínculo com Caixa) |

### 3.6 Mercado Livre (Etapa 7)

| Tabela | Papel |
|---|---|
| `marketplace_accounts` | Conta, seller id, site, status, última sync (sem tokens) |
| `marketplace_credentials` | IDs de segredos no Vault (service_role only) |
| `marketplace_oauth_states` | State assinado, conta, expiração e consumo único |
| `marketplace_listings` | Anúncio, SKU, produto, preço, quantidade, status, `logistic_type`, permalink, raw |
| `marketplace_listing_variations` | Variações, SKU, preço, quantidade |
| `marketplace_orders` | Pedido externo, status, total, data, raw |
| `marketplace_order_items` | Itens do pedido, SKU, produto, proprietário, quantidade, preço |
| `marketplace_sync_queue` | Fila com direção, entidade, payload, tentativas, próximo retry, erro |
| `marketplace_sync_logs` | Log de cada chamada/resposta |
| `marketplace_webhook_events` | Evento externo idempotente, tópico, payload, processamento |

---

## 4. Funções SQL (RPC) previstas

Todas `SECURITY DEFINER`, `SET search_path = public, pg_temp`, validando
`auth.uid()` e privilégios, com locks determinísticos e idempotência.

| Função | Efeito |
|---|---|
| `gerar_sku(prefixo)` | Sequência atômica por usuário/prefixo |
| `inventory_apply_movement(...)` | Valida, trava saldos, grava movimento e atualiza `on_hand`/`damaged` |
| `inventory_transfer_owner(...)` | Transfere entre proprietários/localizações em transação |
| `inventory_reserve(...)` | Cria reserva ativa, valida disponível e estoque de segurança |
| `inventory_release_reservation(...)` | Libera reserva e registra auditoria |
| `inventory_consume_os_part(...)` | Consome peça da OS, baixa saldo, grava `service_order_out` |
| `inventory_return_os_part(...)` | Devolve peça consumida, grava `return_in` |
| `inventory_reverse_movement(...)` | Estorno com vínculo ao movimento original |
| `inventory_admin_adjust(...)` | Ajuste excepcional com `has_role(admin)` e motivo obrigatório |
| `inventory_product_search(...)` | Busca paginada por nome/SKU/código/modelo, com saldo por proprietário |
| `inventory_dashboard(...)` | Agregados por período/categoria/proprietário/canal |

**Concorrência:** locks `FOR UPDATE` nas linhas de saldo em ordem
`(product_id, owner_id, location_id)`. Duas vendas simultâneas do mesmo saldo
não podem deixar `on_hand` negativo; a segunda falha com mensagem clara ou fica
na fila, conforme a operação.

---

## 5. Interface e navegação

### 5.1 Rotas

Manter `/sistema/estoque` (bookmarks) e adicionar subrotas com navegação
interna. Nenhuma rota existente é removida.

```
/sistema/estoque                     Visão geral
/sistema/estoque/aparelhos           Aparelhos de clientes (custódia + pipeline)
/sistema/estoque/produtos            Produtos e peças (todas as categorias)
/sistema/estoque/produtos/novo       Cadastro inteligente
/sistema/estoque/produtos/:id        Detalhe/edição
/sistema/estoque/acessorios          Produtos filtrados por categoria (atalho)
/sistema/estoque/tecnico             Estoque técnico (peças/componentes/insumos)
/sistema/estoque/movimentacoes       Ledger + nova entrada/saída/transferência
/sistema/estoque/mercado-livre       Preparação/estado da integração (Etapa 7)
/sistema/estoque/fornecedores        CRUD de fornecedores
/sistema/estoque/inventario          Contagem e ajustes
/sistema/estoque/relatorios          Relatórios e exportação
/sistema/estoque/catalogos           Categorias, marcas, modelos, proprietários...
```

### 5.2 Padrão visual

- Manter o tema escuro zinc + verde neon `#00FF88`, cards `rounded-2xl`,
  bordas `zinc-800`, tipografia e espaçamentos do `/sistema`.
- Tabelas usam `DataTable`; no mobile, colunas secundárias ficam ocultas e
  ações viram menu.
- Filtros em barra superior, com `SearchableSelect` também nos filtros.
- Ações globais: **Novo produto**, **Nova entrada**, **Nova saída**,
  **Transferência**, **Importar**, **Exportar**, **Novo fornecedor**,
  **Histórico**.
- Seleção múltipla, edição em massa, paginação server-side (sem limite
  artificial de produtos).
- Estados de carregamento/erro/vazio sempre distintos (padrão já existente).

### 5.3 `SearchableSelect`

Novo componente em `src/sistema/estoque/componentes/SearchableSelect.tsx`
(ou `src/sistema/components/` se for reutilizado fora do módulo):

- `Popover` + `Command` (`cmdk`) + `Input`.
- Busca com debounce de 250 ms; limite 20; “carregar mais”.
- Teclado: ↑/↓, Enter, Esc, Tab; foco visível; `aria-*`.
- Mobile: popover com largura total, alvos de toque ≥ 40 px.
- Criação inline: linha “Criar ‘termo’” quando `permitirCriar`; formulário
  curto (nome) e invalidação do cache.
- Duplicidade: normaliza espaços/caixa; em `23505`, seleciona o existente.
- Suporte a `multiple` para filtros e compatibilidade.
- Não substitui `FormSelect` de telas legadas de uma vez; migração incremental.

---

## 6. Arquivos e tabelas que serão criados/modificados

### 6.0 Tabelas existentes modificadas

Apenas **uma** tabela existente recebe alteração de estrutura:

| Tabela | Alteração | Preservação |
|---|---|---|
| `public.estoque` | Adiciona colunas **anuláveis** `cliente_id`, `os_id`, `status_custodia`, `data_saida`, `updated_at`; índices em `user_id`, `os_id`, `cliente_id`, `created_at`; FK opcional para `clientes`/`ordens_servico`; trigger `set_updated_at()` | Nenhuma coluna removida; RLS atual intacta; linhas existentes intactas; `status_custodia` default `'aguardando_pecas'` (mesmo significado do formulário atual) |

**Não serão alteradas** as tabelas `ordens_servico`, `clientes`, `servicos`,
`servico_tipos`, `orcamentos`, `caixa_movimentos`, `devolucoes`,
`orcamento_solicitacoes`, `user_roles`, `cliente_contatos`,
`cliente_interacoes` e `cliente_anexos`. A OS ganha apenas uma **seção de
interface** para peças, suportada pela nova tabela `ordem_servico_pecas`.

### 6.1 Arquivos modificados (com justificativa)

| Arquivo | Mudança | Risco |
|---|---|---|
| `src/App.tsx` | Rotas aninhadas `/sistema/estoque/*`; mantém `/sistema/estoque` | Baixo |
| `src/sistema/pages/SistemaEstoquePage.tsx` | Passa a ser o shell do módulo (abas); o CRUD atual vira a aba “Aparelhos” | Baixo, preservando componentes |
| `src/sistema/components/EstoqueForm.tsx` | Campos opcionais `cliente`, `OS`, `status_custodia` | Baixo; validação atual mantida |
| `src/sistema/components/EstoqueList.tsx` | Colunas de cliente/OS/estágio; ações atuais preservadas | Baixo |
| `src/sistema/components/EstoqueAlert.tsx` | Continua para custódia; alerta comercial separado | Nenhum |
| `src/sistema/components/SistemaSidebar.tsx` | Item “Estoque” continua; subnavegação fica dentro do módulo | Nenhum |
| `src/sistema/types.ts` | Novos tipos/adaptadores; `EstoqueItem` preservado | Baixo |
| `src/sistema/store.ts` | Ações atuais preservadas; novas mutações em módulo próprio | Baixo |
| `src/integrations/supabase/sistema.ts` | Hooks atuais preservados; novos em arquivo separado | Baixo |
| `src/integrations/supabase/types.ts` | Regenerado após migrations | Médio (revisar diff) |
| `package.json` / `bun.lock` | Biblioteca de planilha para Excel (SheetJS `xlsx`, `exceljs` ou `read-excel-file`, escolhida na Etapa 6 após revisão de bundle/segurança) | Baixo |
| `src/index.css` | Nenhuma mudança prevista; reutilizar classes | Nenhum |

### 6.2 Criados — frontend

```
src/sistema/estoque/
├── EstoqueLayout.tsx
├── paginas/
│   ├── EstoqueVisaoGeralPage.tsx
│   ├── AparelhosClientesPage.tsx
│   ├── ProdutosPage.tsx
│   ├── ProdutoFormPage.tsx
│   ├── MovimentacoesPage.tsx
│   ├── MercadoLivrePage.tsx
│   ├── FornecedoresPage.tsx
│   ├── InventarioPage.tsx
│   ├── RelatoriosEstoquePage.tsx
│   └── CatalogosPage.tsx
├── componentes/
│   ├── SearchableSelect.tsx
│   ├── CategoryTreeSelect.tsx
│   ├── ProductPicker.tsx
│   ├── StockBadge.tsx
│   ├── OwnerStockTable.tsx
│   ├── ProductForm.tsx
│   ├── DynamicFields.tsx
│   ├── MovementForm.tsx
│   ├── TransferForm.tsx
│   ├── ImportProdutosDialog.tsx
│   ├── InventoryCountTable.tsx
│   └── MarketplaceStatusCard.tsx
├── hooks/
│   ├── useCatalogos.ts
│   ├── useProdutos.ts
│   ├── useMovimentacoes.ts
│   ├── useSaldos.ts
│   └── useMarketplace.ts
├── services/
│   ├── catalogoService.ts
│   ├── produtoService.ts
│   ├── movimentoService.ts
│   └── importacaoService.ts
└── utils/
    ├── sku.ts
    ├── saldo.ts
    ├── categorias.ts
    ├── importacao.ts
    └── *.test.ts
```

### 6.3 Criados — banco/funções

```
supabase/migrations/20261019120000_inventory_core.sql
supabase/migrations/20261019121000_inventory_catalog_seed.sql
supabase/migrations/20261019122000_inventory_functions.sql
supabase/migrations/20261019123000_inventory_os_parts.sql
supabase/migrations/20261019124000_inventory_import_counts.sql
supabase/migrations/20261019125000_marketplace_core.sql        (Etapa 7)
supabase/functions/mercado-livre-oauth/index.ts                 (Etapa 7)
supabase/functions/mercado-livre-sync/index.ts                  (Etapa 7)
supabase/functions/mercado-livre-webhook/index.ts               (Etapa 7)
```

Além das migrations, a Etapa 3 cria o bucket privado **`product-images`** no
Storage, com política de leitura/escrita para o usuário autenticado e limite de
tamanho/tipo de arquivo. Nenhum bucket existe hoje.

> Os nomes/timestamps podem mudar na execução; o importante é a ordem e a
> aplicação explícita, pois o CI hoje não tem credenciais de migration.

### 6.4 Documentação

- `docs/ERP-ESTOQUE-PLANO.md` (este documento).
- Atualizar `docs/HANDOFF-SISTEMA.md` ao final de cada etapa com o novo schema
  e os fluxos.

---

## 7. Etapas de implementação e critérios de aceite

### Etapa 1 — Diagnóstico (concluída)

- Inventário de arquivos, schema real, RLS, relações e lacunas.
- Nenhum arquivo de código alterado.

### Etapa 2 — Catálogos + listas pesquisáveis

**Entrega:** migrations de catálogos + seed completo; `SearchableSelect`;
tela de catálogos; hooks de leitura e criação inline.

**Aceite:**
- 12 categorias e todas as subcategorias do pedido cadastradas, sem produtos.
- HC TECH, FASTCELL, MERCADO LIVRE e os 6 canais presentes.
- Busca “Fone” retorna fones com fio, Bluetooth e headsets.
- Criar categoria/marca/modelo sem sair do formulário; lista atualiza sozinha.
- “TESTE”, “teste” e “ teste ” não geram duplicata.
- Navegação por teclado e uso em viewport de 360 px.
- Nenhuma tela existente alterada; testes atuais continuam verdes.

### Etapa 3 — Produtos, SKU e compatibilidade

**Entrega:** `products`, compatibilidades, formulário dinâmico, upload de foto,
busca por modelo/código, lista paginada.

**Aceite:**
- Produto criado com SKU automático e único; código de barras livre.
- Campos dinâmicos aparecem conforme a categoria.
- Uma peça relacionada a vários modelos; busca por marca/modelo/código acha.
- Mesmo produto com saldos de proprietários diferentes, sem duplicar cadastro.
- Nenhum produto/quantidade fictícios no seed.

### Etapa 4 — Saldos, proprietários e movimentações

**Entrega:** locations, balances, movements, reservas, transferências, RPCs,
tela de movimentações e saldo por proprietário.

**Aceite:**
- Entrada, saída, perda, avaria, ajuste e transferência registram movimento.
- Saldo por proprietário e total físico conferem com o ledger.
- Venda da HC TECH não consome FASTCELL sem transferência.
- `on_hand` nunca negativo; duas saídas concorrentes não furam o saldo.
- Reserva reduz disponível, não físico; expiração libera.
- Movimento não pode ser editado/apagado; correção só por estorno/ajuste.
- Toda movimentação tem usuário, data/hora, motivo, origem/destino.

### Etapa 5 — Integração com OS

**Entrega:** `ordem_servico_pecas`, seção “Peças” na OS, reservar/consumir/
devolver, histórico.

**Aceite:**
- Adicionar peça à OS reserva e mostra disponibilidade por proprietário.
- Criar orçamento não baixa estoque.
- Consumir baixa uma única vez (idempotente) e grava `service_order_out`.
- Cancelar/devolver libera ou estorna corretamente.
- Histórico da OS lista peças, custo, valor cobrado e status.
- OS existente continua abrindo e salvando sem os campos novos.

### Etapa 6 — Dashboard, relatórios, importação e inventário

**Entrega:** KPIs, filtros, relatórios, CSV/XLSX, contagem de inventário,
exportação, ações em massa.

**Aceite:**
- KPIs: produtos, quantidade física, custo total, valor potencial, baixo/sem
  estoque, mais vendidos, peças mais usadas, por proprietário, por canal,
  anúncios sincronizados/falhas, sem movimentação.
- Filtros por período/categoria/proprietário/canal.
- Importação mostra prévia, erros e duplicidades; não sobrescreve quantidade
  existente em silêncio; registra lote.
- Contagem gera ajuste com divergência e movimento auditável.
- Exportação CSV/XLSX funciona em desktop e mobile.
- Lista suporta paginação server-side sem limite artificial de produtos; os
  limites de linhas por arquivo de importação são operacionais e configuráveis,
  não um teto de cadastro.

### Etapa 7 — Mercado Livre (modo teste)

**Entrega:** OAuth, contas, anúncios, variações, pedidos, fila, logs, webhook,
reconciliação; feature flag de teste.

**Aceite:**
- Conectar conta via OAuth; token só no Vault; nada no frontend.
- Importar anúncios existentes, SKU, variações e `logistic_type`.
- Relacionar anúncio a produto interno; listar pausados/sem estoque/erros.
- Importar pedido e baixar estoque **uma única vez** (idempotência).
- Webhook duplicado não duplica venda; falha entra na fila com retry/backoff.
- Nenhum anúncio real é alterado até autorização expressa.
- Full é tratado como estoque separado; reconciliação explica divergências.

### Etapa 8 — Testes, validação e produção

**Entrega:** suíte unitária/integração, revisão de RLS, ensaio de migração,
checklist de deploy.

**Aceite:**
- `tsc`, ESLint, testes e build verdes.
- Migrations aplicadas em ambiente de teste e verificadas por consultas.
- RLS testada com duas contas (isolamento por usuário e por proprietário).
- Nenhuma regressão em Dashboard, OS, Clientes, Serviços, Tabela de Preços,
  Orçamentos, Caixa, Devoluções, Relatórios, Auth e integrações.
- Produção só após validação explícita.

---

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| CI não aplica migrations | Aplicar manualmente/CLI autenticado; checklist por etapa; verificar schema real |
| `estoque` ser confundido com estoque comercial | Rótulo “Aparelhos de clientes”; tabelas separadas; nenhum owner_id nele |
| Duplicar produto por proprietário | Identidade única em `products`; saldo em `inventory_balances` |
| Saldo inconsistente | Ledger + RPC transacional + idempotência + testes de concorrência |
| Vazamento de token ML | Vault + `service_role` + nunca no bundle/logs |
| Venda duplicada | Unique de pedido/evento + idempotency_key + processamento idempotente |
| Full/estoque próprio misturados | `logistic_type` por anúncio + localização Full + reconciliação |
| Importação sobrescrever saldo | Modo explícito; quantidade só com movimento de entrada confirmado |
| Migração quebrar OS/clientes | Apenas colunas/tabelas novas; nenhum DROP; testar em branch |
| Listas estáticas voltarem | Seed único + hooks de catálogo; revisão de código |
| Performance em catálogo grande | Paginação server-side, índices GIN/trigram, `EXPLAIN` nas consultas |

---

## 9. O que NÃO será feito nesta evolução

- Não reconstruir o sistema nem trocar o tema visual.
- Não apagar/renomear tabelas existentes.
- Não alterar as policies atuais de OS, clientes, caixa, orçamentos e devoluções.
- Não criar produtos ou quantidades fictícias.
- Não publicar em produção sem validação.
- Não ativar escrita real no Mercado Livre antes da Etapa 8.
- Não substituir a Tabela de Preços 08/2026 nem o motor de preços.

---

## 10. Próximo passo proposto

Aprovar este plano e iniciar a **Etapa 2** (catálogos + `SearchableSelect`),
que é a fundação de todo o resto e não toca em nenhum dado existente.

Antes de codar, a Etapa 2 entrega:
1. A migration de catálogos (aditiva, com seed).
2. O componente `SearchableSelect` + testes.
3. A tela de catálogos.
4. A verificação de que `/sistema/estoque` atual continua funcionando.

Se preferir, a ordem pode começar pela Etapa 3 (produtos) usando opções
estáticas temporárias — **não recomendado**, pois violaria a regra de
centralização no Supabase e exigiria retrabalho.
