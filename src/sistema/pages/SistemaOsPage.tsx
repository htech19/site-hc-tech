import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientesLeves, useOS } from "@/integrations/supabase/sistema";
import { estadoDaConsulta } from "@/sistema/services/erroConsulta";
import { filtrarOS, useSistemaStore } from "@/sistema/store";
import { formatBRL, formatData, osNum } from "@/sistema/os-shared";
import { OSFilters } from "@/sistema/components/OSFilters";
import { OSList } from "@/sistema/components/OSList";
import { OSForm } from "@/sistema/components/OSForm";
import { montarUrlWhatsapp } from "@/sistema/components/OSActions";
import { OSStatusBadge } from "@/sistema/components/OSStatusBadge";
import { Modal } from "@/sistema/components/Modal";
import WizardNovaOS from "@/sistema/components/orcamentos/WizardNovaOS";
import { LISTA_STATUS } from "@/sistema/components/OSStatusBadge";
import { FormSelect } from "@/sistema/components/FormInput";
import type { FiltroOS, OrdemServico, StatusOS } from "@/sistema/types";

/**
 * Página Ordens de Serviço — CRUD completo com filtros.
 *
 * - Busca global (topbar) é combinada com o filtro local da página.
 * - Modal de criação é controlado pela store (botão "Nova OS" do header).
 * - Edição/visualização são estados locais desta página.
 */
const SistemaOsPage = memo(function SistemaOsPage() {
  const navigate = useNavigate();
  const filtro = useSistemaStore((s) => s.filtroOS);
  const buscaGlobal = useSistemaStore((s) => s.buscaGlobal);
  const modalCriacaoAberto = useSistemaStore((s) => s.modalOS.aberto);
  const fecharCriacao = useSistemaStore((s) => s.fecharModalOS);
  const abrirCriacao = useSistemaStore((s) => s.abrirModalOS);
  const definirStatusOS = useSistemaStore((s) => s.definirStatusOS);
  const definirFiltroOS = useSistemaStore((s) => s.definirFiltroOS);

  const [editando, setEditando] = useState<OrdemServico | null>(null);
  const [visualizando, setVisualizando] = useState<OrdemServico | null>(null);

  // Cards do dashboard abrem a listagem já filtrada via query string
  // (`/sistema/os?status=PENDENTE`). Aplicamos apenas quando a URL muda, para
  // não sobrescrever o filtro que o usuário escolher na tela.
  const [searchParams] = useSearchParams();
  const parametrosAplicados = useRef<string | null>(null);
  useEffect(() => {
    const assinatura = searchParams.toString();
    if (parametrosAplicados.current === assinatura) return;
    parametrosAplicados.current = assinatura;

    const parcial: Partial<FiltroOS> = {};
    const statusUrl = searchParams.get("status");
    const clienteUrl = searchParams.get("cliente");
    if (statusUrl && LISTA_STATUS.some((s) => s.valor === statusUrl)) {
      parcial.status = statusUrl as StatusOS;
    }
    if (clienteUrl) parcial.clienteId = clienteUrl;
    if (Object.keys(parcial).length > 0) definirFiltroOS(parcial);
  }, [searchParams, definirFiltroOS]);

  const { data: clientes } = useClientesLeves();
  const consultaOS = useOS();
  const { data: todas, refetch: recarregarOS } = consultaOS;
  // `isPending` (e não `isLoading`) é o que impede a lista de mentir: uma
  // consulta PAUSADA por falta de conexão não é uma lista vazia.
  const { carregando, pausada, erro } = estadoDaConsulta(consultaOS);

  /** Combina filtro da página + busca global da topbar. */
  const filtroEfetivo = useMemo(
    () => ({
      ...filtro,
      busca: filtro.busca || buscaGlobal,
    }),
    [filtro, buscaGlobal]
  );

  const linhas = useMemo(
    () => filtrarOS(todas ?? [], filtroEfetivo),
    [todas, filtroEfetivo]
  );

  const aoEditar = useCallback((os: OrdemServico) => setEditando(os), []);
  const aoVisualizar = useCallback((os: OrdemServico) => setVisualizando(os), []);

  const aoFecharModais = useCallback(() => {
    setEditando(null);
    setVisualizando(null);
    fecharCriacao();
  }, [fecharCriacao]);


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <OSFilters clientes={clientes ?? []} comPeriodo />
        <Button
          onClick={abrirCriacao}
          className="shrink-0 bg-primary font-bold text-background hover:bg-primary/90"
        >
          <Plus size={16} className="mr-1" /> Nova OS
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Exibindo <strong className="text-foreground">{linhas.length}</strong> de{" "}
          {todas?.length ?? 0} OS
        </span>
      </div>

      <OSList
        linhas={linhas}
        carregando={carregando}
        pausada={pausada}
        erro={erro}
        aoTentarNovamente={() => void recarregarOS()}
        aoVisualizar={aoVisualizar}
        aoEditar={aoEditar}
        vazioTitulo={
          filtroEfetivo.busca || filtro.status !== "TODOS" || filtro.clienteId !== "TODOS"
            ? "Nenhuma OS encontrada com esses filtros"
            : "Nenhuma OS cadastrada"
        }
      />

      {/* Criação: mesmo padrão do wizard de orçamento (busca de cliente/modelo) */}
      {modalCriacaoAberto && <WizardNovaOS onClose={fecharCriacao} onCriada={() => {}} />}

      {/* Edição continua no formulário compacto */}
      <OSForm
        clientes={clientes ?? []}
        aberto={!!editando}
        editando={editando}
        aoFechar={aoFecharModais}
      />

      {/* Modal de visualização */}
      <Modal
        aberto={!!visualizando}
        aoFechar={() => setVisualizando(null)}
        titulo={visualizando ? `Detalhes da OS ${osNum(visualizando.numero)}` : ""}
        descricao="Informações completas da ordem de serviço."
        largura="max-w-lg"
        rodape={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisualizando(null)}
              className="border-border bg-muted text-foreground hover:bg-zinc-700 hover:text-foreground"
            >
              Fechar
            </Button>
            <a href={visualizando ? montarUrlWhatsapp(visualizando) : "#"} target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary font-bold text-background hover:bg-primary/90">
                Avisar no WhatsApp
              </Button>
            </a>
          </>
        }
      >
        {visualizando && (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-y-2.5 text-sm">
              {([
                ["Data", formatData(visualizando.dataEntrada)],
                ["Aparelho", `${visualizando.aparelho}${visualizando.marca ? ` · ${visualizando.marca}` : ""}`],
                ["Quantidade", `${visualizando.quantidade} un.`],
                ["Cliente", visualizando.clienteNome ?? "—"],
                ["Telefone", visualizando.telefone ?? "—"],
                ["Defeito", visualizando.defeito],
                ["Valor", formatBRL(visualizando.valorOrcado)],
                ["Observação", visualizando.observacao || "—"],
              ] as const).map(([rotulo, valor]) => (
                <div key={rotulo} className="contents">
                  <dt className="text-muted-foreground">{rotulo}</dt>
                  <dd className="col-span-2 break-words text-foreground">{valor}</dd>
                </div>
              ))}
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">
                <OSStatusBadge status={visualizando.status} />
              </dd>
            </dl>

            <div className="rounded-xl border border-border bg-background/50 p-3">
              <FormSelect
                label="Alterar status"
                valor={visualizando.status}
                aoMudar={(v) => {
                  const status = v as StatusOS;
                  void definirStatusOS(visualizando.id, status);
                  setVisualizando({ ...visualizando, status });
                }}
                opcoes={LISTA_STATUS}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});

export default SistemaOsPage;
