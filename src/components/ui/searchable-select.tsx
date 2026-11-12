/**============================================================================
 * SEARCHABLESELECT — Combobox pesquisável reutilizável (HC Tech)
 * ============================================================================
 * Dropdown pesquisável usado em TODOS os campos de opção do módulo Estoque/ERP
 * (Categoria, Marca, Modelo, Fornecedor, Proprietário, Canal, ...), conforme
 * Regra de Ouro #3 do plano do ERP (docs/ERP-ESTOQUE-PLANO.md).
 *
 * Recursos:
 * - Busca por digitação com filtragem instantânea (tolerante a caixa/espaços)
 * - Navegação por teclado (↑/↓/Enter/Esc via cmdk) e foco visível
 * - Criação inline de nova opção quando `allowCreate` (sem sair da tela),
 *   com prevenção de duplicidade case-insensitive
 * - Controle de valor via `selectedValue` (exibe o rótulo selecionado)
 * - Mobile: popover com largura do gatilho, alvos de toque confortáveis
 *
 * TODAS AS STRINGS EM PT-BR (regra obrigatória do projeto).
 *==========================================================================*/

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface SearchableSelectOptions {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  /** Rótulo exibido acima do campo */
  label: string;
  /** Nome/id do campo no formulário */
  name: string;
  /** Opções disponíveis (estáticas ou via `useCatalogoQuery`) */
  options: SearchableSelectOptions[];
  /** Valor já selecionado (controlado) */
  selectedValue?: string;
  /** Callback quando o valor muda */
  onSelect: (value: string | undefined) => void;
  /** Texto placeholder do campo de busca */
  placeholder?: string;
  /** Se true, permite criar nova opção inline */
  allowCreate?: boolean;
  /** Se true, persiste a nova opção (quando ausente, apenas repassa em `onSelect`) */
  onCreate?: (termo: string) => void;
  /** Se true, desabilita o componente */
  disabled?: boolean;
  /** Classe CSS adicional no wrapper */
  className?: string;
  /** Textos customizados */
  texts?: {
    placeholder?: string;
    createLabel?: string;
    noResults?: string;
    loading?: string;
  };
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const DEFAULT_TEXTS = {
  placeholder: "Digite para pesquisar...",
  createLabel: "Criar nova opção",
  noResults: "Nenhum resultado encontrado",
  loading: "Carregando...",
};

/** Normaliza para comparação/duplicidade: minúsculas + sem espaços nas pontas. */
const normalizar = (texto: string) => texto.toLowerCase().trim();

// -----------------------------------------------------------------------------
// SEARCHABLESELECT
// -----------------------------------------------------------------------------

export const SearchableSelect = ({
  label,
  name,
  options,
  selectedValue,
  onSelect,
  placeholder: customPlaceholder,
  allowCreate = false,
  onCreate,
  disabled = false,
  className: extraClassName,
  texts: customTexts,
}: SearchableSelectProps) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const texts = { ...DEFAULT_TEXTS, ...customTexts };

  const selecionada = options.find((opt) => opt.value === selectedValue);

  // Filtragem própria (o Command roda com shouldFilter={false} para que a
  // linha "Criar nova opção" apareça mesmo sem correspondência exata).
  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return options;
    return options.filter((opt) => normalizar(opt.label).includes(termo));
  }, [options, busca]);

  // Prevenção de duplicidade case-insensitive: "TESTE", "teste" e " teste "
  // não podem gerar duas entradas.
  const termo = busca.trim();
  const jaExiste = termo.length > 0 && options.some((opt) => normalizar(opt.label) === normalizar(termo));
  const podeCriar = allowCreate && termo.length > 0 && !jaExiste;

  const fechar = () => {
    setAberto(false);
    setBusca("");
  };

  const selecionar = (valor: string) => {
    onSelect(valor);
    fechar();
  };

  const criar = () => {
    if (!podeCriar) return;
    if (onCreate) onCreate(termo);
    else onSelect(termo);
    fechar();
  };

  return (
    <div className="space-y-2">
      {label !== undefined && label !== null && (
        <label htmlFor={name} className="block text-sm font-medium text-zinc-300 mb-1">
          {label}
        </label>
      )}

      <Popover
        open={aberto}
        onOpenChange={(novo) => {
          setAberto(novo);
          if (!novo) setBusca("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            id={name}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={aberto}
            className={cn(
              "w-full flex items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 disabled:cursor-not-allowed disabled:opacity-50",
              disabled && "bg-zinc-800",
            )}
          >
            <span className={cn("flex-1 truncate text-left", !selecionada && "text-zinc-500")}>
              {selecionada?.label ?? customPlaceholder ?? texts.placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-zinc-700"
        >
          <Command shouldFilter={false} className="bg-transparent text-zinc-100">
            <CommandInput
              value={busca}
              onValueChange={setBusca}
              placeholder={customPlaceholder ?? texts.placeholder}
              className="text-zinc-100 placeholder:text-zinc-500"
            />
            <CommandList className="max-h-72">
              <CommandEmpty className="py-4 text-center text-sm text-zinc-500">
                {texts.noResults}
              </CommandEmpty>
              <CommandGroup>
                {filtradas.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    disabled={opt.disabled}
                    onSelect={() => selecionar(opt.value)}
                    className="py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors aria-disabled:opacity-40"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedValue === opt.value ? "opacity-100 text-[#00FF88]" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 truncate font-medium">{opt.label}</span>
                  </CommandItem>
                ))}

                {podeCriar && (
                  <CommandItem
                    key="__criar"
                    value={`__criar_${normalizar(termo)}`}
                    onSelect={criar}
                    className="py-1.5 px-2 rounded bg-zinc-800/40 text-[#00FF88] transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate font-medium">
                      {texts.createLabel}: {termo}
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// -----------------------------------------------------------------------------
// useCatalogoQuery — leitura de catálogos centralizados no Supabase
// -----------------------------------------------------------------------------

export type CatalogoTipo = "owners" | "channels" | "categories" | "brands" | "models";

/**
 * Tabelas de catálogo do ERP (Etapa 2 do plano — docs/ERP-ESTOQUE-PLANO.md §3.1).
 * Enquanto a migration da Etapa 2 não for aplicada, a query responde "tabela
 * inexistente" e o hook devolve lista vazia (nada de dados fictícios).
 */
const CATALOGO_TABELAS: Record<CatalogoTipo, string> = {
  owners: "inventory_owners",
  channels: "sales_channels",
  categories: "product_categories",
  brands: "brands",
  models: "device_models",
};

interface CatalogoLinha {
  id: string;
  name: string;
  active?: boolean | null;
}

interface RespostaCatalogo {
  data: CatalogoLinha[] | null;
  error: { code?: string; message?: string } | null;
}

/**
 * Contrato mínimo da cadeia `from().select()` — as tabelas de catálogo ainda
 * não constam no Database gerado (`src/integrations/supabase/types.ts`), então
 * evitamos `any` mantendo o typecheck verde até a regeneração dos tipos.
 */
interface ClienteCatalogo {
  from(tabela: string): {
    select(colunas: string): PromiseLike<RespostaCatalogo>;
  };
}

/**
 * Busca opções de um catálogo no Supabase com cache (staleTime 5 min).
 * RLS (`auth.uid() = user_id`) garante o isolamento por usuário.
 */
export function useCatalogoQuery(tipo: CatalogoTipo, userId?: string) {
  return useQuery<SearchableSelectOptions[], Error>({
    queryKey: ["sistema", "catalogo", tipo, userId],
    queryFn: async () => {
      const cliente = supabase as unknown as ClienteCatalogo;
      const { data, error } = await cliente.from(CATALOGO_TABELAS[tipo]).select("id, name, active");

      if (error) {
        // 42P01 / PGRST205 = tabela ainda não criada (migration da Etapa 2).
        if (error.code === "42P01" || error.code === "PGRST205") return [];
        throw new Error(error.message ?? "Erro ao carregar o catálogo");
      }

      return (data ?? [])
        .filter((linha) => linha.active !== false)
        .map((linha) => ({ label: linha.name, value: linha.id }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 60 * 1000, // 30 minutos
  });
}
