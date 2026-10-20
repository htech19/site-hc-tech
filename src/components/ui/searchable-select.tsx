/**============================================================================
 * SEARCHABLESELECT — Módulo Estoque e Catálogo (HC TECH)
 * ============================================================================
 * Componente dropdown pesquisável usando Radix Command + Popover.
 * Substitui o FormSelect sem busca para listas centrralizadas.
 * TODAS AS STRINGS EM PT-BR conforme regra obrigatória do projeto.
 *==========================================================================*/

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandValue } from "@/components/ui/command";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TipoEquipamento } from "@/sistema/types";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface SearchableSelectOptions {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  /** Rótulo exibido ao lado do input */
  label: string;
  /** Nome do campo no formulário */
  name: string;
  /** Opções disponíveis (vêm do Supabase via query) */
  options: SearchableSelectOptions[];
  /** Opções já selecionadas (controlado) */
  selectedValue?: string;
  /** Callback quando o valor muda */
  onSelect: (value: string | undefined) => void;
  /** Texto placeholder do input */
  placeholder?: string;
  /** Se true, permite criar nova opção (inline) */
  allowCreate?: boolean;
  /** Se true, desabilita o componente */
  disabled?: boolean;
  /** Classe CSS adicional */
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
// SEARCHABLESELECT COMPONENT
// -----------------------------------------------------------------------------

const DEFAULT_TEXTS = {
  placeholder: "Digite para pesquisar...",
  createLabel: "Criar nova opção",
  noResults: "Nenhum resultado encontrado",
  loading: "Carregando...",
};

/**
 * Componente Select pesquisável usando Radix Command + Popover.
 * 
 * Características:
 * - Busca por digitação com autocomplete
 * - Filtro instantâneo
 * - Navegação por teclado
 - Suporte a touch no mobile
 * - Seleção de existente
 - Criação inline quando autorizada
 - Invalidação de cache após criar
 - Bloqueio de duplicidade normalizada
 */
export const SearchableSelect = ({
  label,
  name,
  options,
  selectedValue,
  onSelect,
  placeholder: customPlaceholder,
  allowCreate = false,
  disabled = false,
  className: extraClassName,
  texts: customTexts,
}: SearchableSelectProps) => {

  const [inputValue, setInputValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const texts = { ...DEFAULT_TEXTS, ...customTexts };

  // Query para buscar opções do Supabase (com staleTime 5min)
  // Em produção, isso seria substituído por uma query real do Supabase
  const { data: cachedOptions, isLoading, isError } = useQuery<
    SearchableSelectOptions[],
    Error
  >(
    ["sistema", "catalogo", name],
    async () => {
      // TODO: Substituir por query real do Supabase
      // Por enquanto, filtra as opções locais
      return options.filter(opt => 
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      enabled: !!inputValue.length > 0 || cachedOptions?.length > 0,
    }
  );

  // Filter options based on input or use cached
  const filteredOptions = cachedOptions || options.filter(opt =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Handle selection
  const handleSelect = (value: string) => {
    onSelect(value);
    setInputValue("");
    setJustCreated(false);
  };

  // Handle create new option (simulado - em produção faria query INSERT)
  const handleCreate = useCallback(async (nome: string) => {
    // TODO: Fazer INSERT no Supabase e refetch options
    // Por enquanto, simula criação e seleciona a nova opção
    setJustCreated(true);
    onSelect(nome);
    setInputValue("");
    // Em produção: queryClient.invalidateQueries(["sistema", "catalogo", name])
  }, [onSelect, inputValue]);

  // Normalize string for duplicate checking
  const normalize = (text: string) =>
    text.toLowerCase().trim();

  // Check if option already exists
  const optionExists = filteredOptions.some(
    opt => normalize(opt.label) === normalize(inputValue) && opt.value !== inputValue
  );

  return (
    <div className="space-y-2">
      {/* Label */}
      {label !== undefined && label !== null && (
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {label}
        </label>
      )}

      {/* SearchableSelect */}
      <div 
        className={cn(
          "relative w-full",
          disabled && "opacity-50 cursor-not-allowed",
          extraClassName
        )}
      >
        {/* Trigger button */}
        <button
          onClick={() => setInputValue(inputValue => !inputValue)}
          className={cn(
            "w-full flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 disabled:cursor-not-allowed disabled:opacity-50",
            disabled && "bg-zinc-800"
          )}
          disabled={disabled}
        >
          <span className="flex-1 truncate">{inputValue || placeholder}</span>
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          {allowCreate && (
            <span className="text-xs text-zinc-500">
              {inputValue && !optionExists ? texts.createLabel : ""}
            </span>
          )}
        </div>

        {/* Popover with Command */}
        <Popover>
          <PopoverTrigger asChild>
            <Command
              multiple={false}
              inlineCreate
              onSelect={handleSelect}
              onCreate={allowCreate ? handleCreate : undefined}
              value={inputValue}
              onValueChange={setInputValue}
              disabled={disabled}
              className={cn(
                "w-full rounded-md bg-zinc-900 p-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition-colors focus:ring-2 focus:ring-[#00FF88]/30 disabled:cursor-not-allowed disabled:opacity-50",
                disabled && "bg-zinc-800"
              )}
            >
              <Command.Input
                className="w-full placeholder:text-zinc-500"
                placeholder={texts.placeholder}
              />
              <CommandEmpty>
                {filteredOptions.length > 0 ? (
                  <>
                    {filteredOptions.map((option) => (
                      <Command.Item
                        key={option.value}
                        value={option.value}
                        className="py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
                      >
                        <span className="font-medium">{option.label}</span>
                      </Command.Item>
                    ))}
                    {allowCreate && !optionExists && (
                      <Command.Item
                        key="create-new"
                        value={inputValue}
                        className="py-1.5 px-2 rounded bg-zinc-800/30 text-zinc-400"
                        onSelect={() => handleCreate(inputValue)}
                      >
                        <span className="font-medium">
                          {texts.createLabel}: {inputValue}
                        </span>
                      </Command.Item>
                    )}
                  </>
                ) : (
                  <div className="py-4 text-center text-zinc-500">
                    {isLoading ? texts.loading : texts.noResults}
                  </div>
                )}
              </CommandEmpty>
              <Command.Group>
                {options.map((option) => (
                  <Command.Group>
                    <Command.Group.Header key={option.label} className="px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider">
                      {option.label.split(" ")[0]}
                    </Command.Group.Header>
                    <Command.Item
                      key={option.value}
                      value={option.value}
                      className="py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <span className="font-medium">{option.label}</span>
                    </Command.Item>
                  </Command.Group>
                ))}
              </Command.Group>
            </Command>
          </PopoverTrigger>
          
          <PopoverContent className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="h-24 flex items-center justify-center text-zinc-500">
                {texts.loading}
              </div>
            ) : (
              <>
                {filteredOptions.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {filteredOptions.map((option) => (
                      <Command.Item
                        key={option.value}
                        value={option.value}
                        className="py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
                      >
                        <span className="font-medium">{option.label}</span>
                      </Command.Item>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-zinc-500">
                    {isLoading ? texts.loading : texts.noResults}
                  </div>
                )}
                {allowCreate && !optionExists && inputValue.trim().length > 0 && (
                  <Command.Item
                    key="create-new"
                    value={inputValue}
                    className="py-1.5 px-2 rounded bg-zinc-800/30 text-zinc-400"
                  >
                    <span className="font-medium">
                      {texts.createLabel}: {inputValue}
                    </span>
                  </Command.Item>
                )}
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

/**
 * Hook para buscar opções do Supabase com cache e staleTime
 */
export function useCatalogoQuery(
  tipo: "owners" | "channels" | "categories" | "brands" | "models",
  userId?: string
) {
  return useQuery<SearchableSelectOptions[], Error>(
    ["sistema", "catalogo", tipo, userId],
    async () => {
      // TODO: Substituir por queries reais do Supabase
      // Estas são queries mockadas baseadas no tipo
      const mockData: SearchableSelectOptions[] = [];
      
      switch (tipo) {
        case "owners":
          // Retorna donos de estoque (HC TECH, FASTCELL, ML)
          return [
            { label: "HC TECH", value: "HC_TECH" },
            { label: "FASTCELL", value: "FASTCELL" },
            { label: "MERCADO LIVRE", value: "ML" },
          ];
        case "channels":
          // Canais de venda
          return [
            { label: "Loja Física", value: "loja_fisica" },
            { label: "Mercado Livre", value: "ml" },
            { label: "WhatsApp", value: "whatsapp" },
            { label: "Site", value: "site" },
          ];
        case "categories":
          // Categorias de produto
          return [
            { label: "Tela", value: "tela" },
            { label: "Bateria", value: "bateria" },
            { label: "Acessório", value: "acessorio" },
            { label: "Ferramenta", value: "ferramenta" },
          ];
        case "brands":
          // Marcas
          return [
            { label: "Apple", value: "apple" },
            { label: "Samsung", value: "samsung" },
            { label: "Lenovo", value: "lenovo" },
            { label: "Positivo", value: "positivo" },
          ];
        case "models":
          // Modelos (depende da marca)
          return [];
        default:
          return mockData;
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchInterval: 30 * 60 * 1000, // 30 minutos
    }
  );
}

export { SearchableSelect, useCatalogoQuery };