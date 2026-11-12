# Teste de Seleção em Massa - ClienteList

## Diagnóstico do Problema

Com base na análise do código `SistemaClientesPage.tsx` e `ClienteList.tsx`, identifiquei **dois problemas principais**:

### 1. Limpeza indevida de seleção ao mudar filtros/paginação
A função `limparFiltros` (linha 481) e as mudanças em filtros (`busca`, `status`, `tag`, `pageSize`) executam:
```typescript
setSelecionados(new Set())
```

Isso limpa a seleção **global** indeferidas, mesmo que o usuário já tenha selecionado clientes em outras páginas.

**Problema:** Quando o usuário está na página 2 com clientes selecionados e altera o status, todos os selecionados são removidos indevidamente.

### 2. Divergência possível de tipos
- ID armazenado em `Set<string>` por `useState<Set<string>>`
- IDs vindos do banco podem ser strings ou números
- Comparação `selecionados.has(cliente.id)` pode falhar se tiver tipos diferentes

## Checklist Correção

- [ ] Imóveis modificação selecionada?
  - [ ] Desmarcar checkbox limpa apenas uma linha (correto)
  - [ ] Marcar checkbox limpa others (correto)
  - [ ] Marcar "Todos da página" seleciona apenas páginas atuais (correto)
  - [ ] Desmarcar "Todos da página" remove apenas página atual (correto)
  - [ ] "Selecionar todos filtrados" popula `Set<string>` de todos IDs filtrados (provável problema)
  - [ ] "Limpar seleção" limpa `Set<string>` completamente (correto)
  - [ ] Mudar paginação NÃO limpa seleção global (INCORRETO - precisa corrigir)
  - [ ] Mudar status/tag/busca NÃO limpa seleção global (INCORRETO - precisa corrigir)
  - [ ] Mudar tamanho da página NÃO limpa seleção global (INCORRETO - precisa corrigir)

## Padrão de Estado Correto

```typescript
// O estado DEVE ser preservado quando:
// - Mudar paginação (navegar entre páginas)
// - Mudar tamanho da página (reindexar)
// - Mudar filtros (preserva seleção, apenas filtra exibição)

// O estado PODE ser limpo quando:
// - Limpar seleção manualmente (botão "Limpar seleção")
// - Mudar busca/paginação/tamanho de página (inicializa novo cenário)
```

## Ações Necessárias

1. Remover `setSelecionados(new Set())` das mudanças de filtro e paginação
2. Manter `setPagina(0)` para voltar à primeira página
3. Verificar integridade de tipo: garantir que IDs sejam sempre strings
4. Testar seleção com múltiplas páginas e filtros