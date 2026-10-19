import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import {
  useResumoSolicitacoesSite,
  useSolicitacoesSiteRecentes,
} from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import {
  classeStatusSolicitacao,
  formatarDataHora,
  rotuloStatusSolicitacao,
} from "@/sistema/solicitacoes-shared";
import { CarregandoArea, EstadoErroCompacto, EstadoVazio } from "./LoadingSpinner";

/**
 * Painel de solicitações do site no dashboard.
 *
 * Mostra os pedidos que chegam pelo botão “Solicitar orçamento” do site —
 * a mesma tabela da tela Solicitações (site). Atualiza por polling de 60s e
 * também quando a tela de Solicitações invalida a chave `['sistema','solicitacoes']`
 * ao mudar um status.
 */
export const SolicitacoesSitePanel = memo(function SolicitacoesSitePanel() {
  const consultaRecentes = useSolicitacoesSiteRecentes(6);
  const consultaResumo = useResumoSolicitacoesSite();

  const { data: recentes, refetch: recarregarRecentes } = consultaRecentes;
  const { data: resumo, refetch: recarregarResumo } = consultaResumo;
  const { carregando, pausada, erro } = estadoDaConsulta(consultaRecentes);
  const { erro: erroResumo, carregando: carregandoResumo } = estadoDaConsulta(consultaResumo);

  const recarregar = () => {
    void recarregarRecentes();
    void recarregarResumo();
  };

  const numero = (v: number | null | undefined) =>
    v == null ? "—" : v.toLocaleString("pt-BR");

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
            🌐 Solicitações do site
          </h3>
          <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">
            Pedidos enviados pelo botão de orçamento da página inicial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={recarregar}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-2 text-zinc-400 transition hover:border-[#00FF88]/40 hover:text-[#00FF88]"
            aria-label="Atualizar solicitações"
            title="Atualizar"
          >
            <RefreshCw size={14} />
          </button>
          <Link
            to="/sistema/solicitacoes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00FF88] transition hover:underline"
          >
            Abrir módulo <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Contadores do funil */}
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 p-4">
        {[
          { rotulo: "Novos", valor: resumo?.recebido, tom: "text-sky-300" },
          { rotulo: "Em análise", valor: resumo?.emAnalise, tom: "text-amber-300" },
          { rotulo: "Total", valor: resumo?.total, tom: "text-zinc-100" },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {c.rotulo}
            </p>
            <p
              className={`mt-1 text-lg font-bold tabular-nums ${c.tom} ${
                carregandoResumo ? "animate-pulse text-zinc-700" : ""
              }`}
            >
              {carregandoResumo ? "—" : numero(c.valor)}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4">
        {erro || erroResumo ? (
          <EstadoErroCompacto
            erro={erro ?? erroResumo}
            contexto="Solicitações do site"
            aoTentarNovamente={recarregar}
          />
        ) : carregando ? (
          <CarregandoArea altura="h-40" rotulo="Carregando solicitações..." />
        ) : !recentes || recentes.length === 0 ? (
          <EstadoVazio
            icone="🌐"
            titulo="Nenhuma solicitação recebida ainda"
            descricao="Quando um cliente enviar o orçamento pelo site, o pedido aparece aqui e na tela Solicitações."
          />
        ) : (
          <div className="space-y-2">
            {pausada && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Sem conexão — exibindo os últimos dados carregados.
              </p>
            )}
            {recentes.map((s) => (
              <Link
                key={s.id}
                to="/sistema/solicitacoes"
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 transition hover:border-[#00FF88]/40 hover:bg-zinc-800/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#00FF88]">
                      {s.protocolo}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classeStatusSolicitacao(
                        s.status
                      )}`}
                    >
                      {rotuloStatusSolicitacao(s.status)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-100">{s.nome}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {s.categoria} {s.marca} {s.modelo} • {s.servico}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-zinc-500">{formatarDataHora(s.created_at)}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#00FF88]">
                    Abrir <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default SolicitacoesSitePanel;
