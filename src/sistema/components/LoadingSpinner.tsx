import { memo, useState } from "react";
import { AlertTriangle, RotateCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { detalheDoErro, mensagemDeErro } from "@/sistema/services/erroConsulta";

interface Props {
  /** Tamanho do spinner em pixels. */
  tamanho?: number;
  /** Classe extra para posicionamento. */
  className?: string;
  /** Texto acessível exibido ao lado (opcional). */
  rotulo?: string;
}

/** Spinner de carregamento — memoizado para não re-renderizar junto da árvore. */
export const LoadingSpinner = memo(function LoadingSpinner({
  tamanho = 20,
  className,
  rotulo,
}: Props) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2 text-zinc-400", className)}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block animate-spin rounded-full border-2 border-zinc-700 border-t-[#00FF88]"
        style={{ width: tamanho, height: tamanho }}
        aria-hidden
      />
      {rotulo && <span className="text-sm">{rotulo}</span>}
      <span className="sr-only">Carregando</span>
    </div>
  );
});

/** Bloco de carregamento padrão ocupando a altura do container. */
export const CarregandoArea = memo(function CarregandoArea({
  altura = "h-64",
  rotulo = "Carregando dados...",
}: {
  altura?: string;
  rotulo?: string;
}) {
  return (
    <div className={cn("flex w-full items-center justify-center", altura)}>
      <LoadingSpinner rotulo={rotulo} />
    </div>
  );
});

/** Estado vazio (nenhum registro encontrado). */
export const EstadoVazio = memo(function EstadoVazio({
  icone = "📭",
  titulo,
  descricao,
  acao,
}: {
  icone?: string;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {icone}
      </div>
      <h4 className="text-base font-semibold text-zinc-100">{titulo}</h4>
      {descricao && <p className="mt-1 max-w-sm text-sm text-zinc-400">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
});

/**
 * Estado de ERRO de uma consulta que falhou.
 *
 * Existe para separar duas coisas que a UI confundia: "não há registros"
 * (consulta OK, lista vazia) e "não conseguimos ler os registros" (falha).
 * Sem este estado, um erro de banco aparecia como lista vazia.
 */
export const EstadoErro = memo(function EstadoErro({
  erro,
  titulo = "Não foi possível carregar os dados",
  aoTentarNovamente,
}: {
  /** Erro cru lançado pela consulta (Supabase/PostgREST ou rede). */
  erro: unknown;
  titulo?: string;
  /** Recarrega a consulta; quando ausente, o botão não é exibido. */
  aoTentarNovamente?: () => void;
}) {
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const detalhe = detalheDoErro(erro);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-14 text-center"
    >
      <div className="mb-3 text-rose-400" aria-hidden>
        <AlertTriangle size={36} />
      </div>

      <h4 className="text-base font-semibold text-zinc-100">{titulo}</h4>
      <p className="mt-1 max-w-md text-sm text-zinc-400">{mensagemDeErro(erro)}</p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {aoTentarNovamente && (
          <button
            type="button"
            onClick={aoTentarNovamente}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#00FF88] hover:text-[#00FF88]"
          >
            <RotateCw size={14} />
            Tentar novamente
          </button>
        )}

        {detalhe && (
          <button
            type="button"
            onClick={() => setDetalhesAbertos((v) => !v)}
            aria-expanded={detalhesAbertos}
            className="rounded-md border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-zinc-200"
          >
            {detalhesAbertos ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}
          </button>
        )}
      </div>

      {detalhesAbertos && detalhe && (
        <pre className="mt-3 max-w-xl overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-left text-[11px] leading-relaxed text-zinc-400">
          {detalhe}
        </pre>
      )}
    </div>
  );
});

/**
 * Aviso de consulta PAUSADA por falta de conexão.
 *
 * O React Query pausa a busca quando o navegador reporta estar offline. Sem este
 * aviso, o esqueleto fica mudo e o usuário não sabe se é a rede ou o servidor.
 * Trocamos o silêncio por uma explicação curta, mantendo o carregamento visível.
 */
export const AvisoSemConexao = memo(function AvisoSemConexao({
  className,
}: {
  className?: string;
}) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200",
        className
      )}
    >
      <WifiOff size={14} className="shrink-0" aria-hidden />
      Sem conexão com o servidor — os registros serão carregados quando a conexão voltar.
    </p>
  );
});

/**
 * Versão COMPACTA do estado de erro, para widgets de painel (cards, gráficos).
 *
 * O `EstadoErro` completo ocupa uma área alta e é pensado para substituir uma
 * lista inteira. Aqui a ideia é avisar sem empurrar o layout: uma faixa fina,
 * com a mensagem curta e o botão de recarregar.
 */
export const EstadoErroCompacto = memo(function EstadoErroCompacto({
  erro,
  contexto,
  aoTentarNovamente,
}: {
  erro: unknown;
  /** Nome do bloco que falhou, ex.: "OS por Status". */
  contexto?: string;
  aoTentarNovamente?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-left"
    >
      <AlertTriangle size={15} className="shrink-0 text-rose-400" aria-hidden />
      <span className="min-w-0 flex-1 text-xs text-rose-200">
        {contexto && <strong className="font-semibold">{contexto}: </strong>}
        {mensagemDeErro(erro)}
      </span>
      {aoTentarNovamente && (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="shrink-0 rounded-md border border-rose-500/40 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
});

export default LoadingSpinner;
