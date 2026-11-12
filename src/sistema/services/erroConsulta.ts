/**
 * =============================================================================
 * TRADUÇÃO DE ERROS DE CONSULTA (Supabase/PostgREST)
 * =============================================================================
 * As páginas do /sistema exibem listas. Quando a consulta falha, elas antes
 * mostravam o estado vazio ("Nenhum registro") — o que é MENTIRA: os dados não
 * foram lidos, não é que não existam.
 *
 * Este módulo concentra a transformação do erro cru numa mensagem PT-BR para o
 * usuário. É uma função PURA (sem React, sem Supabase) justamente para ser
 * testável e para manter a UI previsível.
 *
 * Casos tratados com mensagem acionável:
 *  - PGRST205: a tabela não existe no banco (migração não aplicada).
 *  - Falha de rede/DNS: não deu para falar com o banco.
 * Qualquer outro erro cai no detalhe técnico, nunca em texto genérico.
 */

/** Erro no formato que o PostgREST devolve. */
interface ErroPostgrest {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

/** Extrai o texto técnico de qualquer coisa que tenha sido lançada. */
function detalheTecnico(erro: unknown): string {
  if (erro == null) return "";

  if (typeof erro === "string") return erro.trim();

  if (typeof erro === "object") {
    const e = erro as ErroPostgrest & { error_description?: string };

    // Erros do PostgREST: code + message (+ hint, que costuma apontar a saída)
    const partes = [e.code, e.message ?? e.error_description, e.details, e.hint]
      .filter((p): p is string => typeof p === "string" && p.trim() !== "")
      .map((p) => p.trim());

    if (partes.length > 0) return partes.join(" — ");

    // Objeto sem nenhum dos campos conhecidos: nunca devolver "[object Object]".
    // Se houver conteúdo, serializamos; se estiver vazio, não há o que mostrar.
    try {
      const json = JSON.stringify(erro);
      if (json && json !== "{}") return json;
    } catch {
      // Objeto circular ou com toJSON que lança: sem detalhe utilizável.
    }
    return "";
  }

  return String(erro);
}

/**
 * Mensagem exibida ao usuário para uma consulta que falhou.
 * Nunca retorna string vazia.
 */
export function mensagemDeErro(erro: unknown): string {
  const detalhe = detalheTecnico(erro);

  // Tabela ausente: o erro mais provável em ambiente novo (migração não aplicada).
  if (/PGRST205/i.test(detalhe) || /could not find the table/i.test(detalhe)) {
    return (
      "A tabela não existe no banco de dados. " +
      "Aplique a migração pendente (veja supabase/APLICAR-0003-no-SQL-Editor.sql)."
    );
  }

  // Falha de transporte: o navegador não conseguiu chegar ao banco.
  if (/failed to fetch|networkerror|load failed|ERR_/i.test(detalhe)) {
    return "Não foi possível falar com o banco de dados. Verifique sua conexão e tente novamente.";
  }

  return detalhe || "Não foi possível carregar os dados.";
}

/**
 * Detalhe técnico cru, para o `<details>` da UI.
 * Devolve `null` quando não há nada útil a mostrar.
 */
export function detalheDoErro(erro: unknown): string | null {
  const detalhe = detalheTecnico(erro);
  return detalhe === "" ? null : detalhe;
}

/**
 * =============================================================================
 * ESTADO DE UMA LISTA A PARTIR DA CONSULTA
 * =============================================================================
 * Uma lista só pode dizer "não há registros" DEPOIS que a consulta assentou com
 * sucesso. Existem três formas de a consulta não ter assentado:
 *
 *  - ainda buscando         → `isPending` true, `isPaused` false
 *  - PAUSADA por falta de rede → `isPending` true, `isPaused` true
 *  - falhou                  → `isError` true
 *
 * Usar `isLoading` aqui era o bug: `isLoading` é `isPending && isFetching`, e
 * `isFetching` é `false` enquanto a consulta está PAUSADA. Resultado: em rede
 * instável o React Query pausava a busca e a página mostrava "Nenhum registro"
 * como se a lista estivesse vazia — afirmando algo que nunca foi lido.
 *
 * Por isso a regra é expressa a partir de `isPending`, que continua true até a
 * consulta assentar (com dado ou com erro), independentemente de estar pausada.
 */
export interface EstadoConsulta {
  /** A consulta ainda não assentou: mostrar carregamento, nunca "vazio". */
  carregando: boolean;
  /** A busca está parada por falta de conexão (não é lentidão do servidor). */
  pausada: boolean;
  /** Erro a exibir; `undefined` enquanto não houve falha. */
  erro?: unknown;
}

/**
 * Traduz o resultado de um `useQuery` para o estado que a UI deve renderizar.
 * Função pura, sem React nem Supabase, para poder ser testada isoladamente.
 */
export function estadoDaConsulta(consulta: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** Nem toda consulta pausa; ausente = nunca pausada. */
  isPaused?: boolean;
}): EstadoConsulta {
  return {
    carregando: consulta.isPending,
    pausada: consulta.isPending && consulta.isPaused === true,
    erro: consulta.isError ? consulta.error : undefined,
  };
}
