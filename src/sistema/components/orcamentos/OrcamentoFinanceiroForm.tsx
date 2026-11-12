import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Save, Send, Mail, FileText, Eye, ExternalLink } from "lucide-react";
import { formatarMoeda, calcularValoresFinanceiros, gerarMensagemCliente } from "@/sistema/os-shared";
import { consultarPrecoTela } from "@/sistema/data/telas";
import { servicoRequerTipoTela } from "@/sistema/data/catalogos";
import type { Orcamento, ItemOrcamento } from "@/sistema/types";

/** Converte telefone para formato internacional (55 + DDD + número) */
const paraFormatoInternacional = (telefone: string): string => {
  const digitos = telefone.replace(/\D/g, "");
  return `55${digitos}`;
};

interface OrcamentoFinanceiroFormProps {
  modelo: string;
  marca: string;
  qualidadeTela?: string;
  servico: string;
  // Estado compartilhado com o wizard
  custoPeca: number;
  setCustoPeca: (v: number) => void;
  valorPeca: number;
  setValorPeca: (v: number) => void;
  valorMaoObra: number;
  setValorMaoObra: (v: number) => void;
  desconto: number;
  setDesconto: (v: number) => void;
  frete: number;
  setFrete: (v: number) => void;
  custosAdicionais: number;
  setCustosAdicionais: (v: number) => void;
  garantiaDias: number;
  setGarantiaDias: (v: number) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
  onSalvar: (orcamento: Orcamento) => void;
  onEnviarCliente: (orcamento: Orcamento, canal: "whatsapp" | "email" | "pdf") => void;
  // Dados do cliente para preview/envio
  clienteNome?: string;
  clienteTelefone?: string;
}

export function OrcamentoFinanceiroForm({
  modelo,
  marca,
  qualidadeTela,
  servico,
  custoPeca,
  setCustoPeca,
  valorPeca,
  setValorPeca,
  valorMaoObra,
  setValorMaoObra,
  desconto,
  setDesconto,
  frete,
  setFrete,
  custosAdicionais,
  setCustosAdicionais,
  garantiaDias,
  setGarantiaDias,
  observacoes,
  setObservacoes,
  onSalvar,
  onEnviarCliente,
  clienteNome,
  clienteTelefone,
}: OrcamentoFinanceiroFormProps) {
  // Valores calculados
  const [valoresCalculados, setValoresCalculados] = useState({
    custo_pecas: 0,
    frete_aquisicao: 0,
    custos_adicionais: 0,
    custo_total_operacao: 0,
    valor_venda_pecas: 0,
    valor_mao_obra: 0,
    desconto: 0,
    acrescimo: 0,
    valor_final: 0,
    lucro_bruto: 0,
    margem_lucro: 0,
  });

  // Preço de referência: apenas Troca de Tela + qualidade (fonte síncrona da Tabela de Telas)
  useEffect(() => {
    const ehTela = servicoRequerTipoTela(servico);
    if (!ehTela || !modelo || !marca || !qualidadeTela) return;
    const preco = consultarPrecoTela(marca, modelo, qualidadeTela);
    if (typeof preco === "number" && valorPeca === 0) {
      setValorPeca(preco);
      setCustoPeca(Math.round(preco * 0.6 * 100) / 100);
    }
  }, [modelo, marca, qualidadeTela, servico, valorPeca, setValorPeca, setCustoPeca]);

  // Recalcular valores
  useEffect(() => {
    const itens: ItemOrcamento[] = [
      {
        id: crypto.randomUUID(),
        descricao: `Tela ${marca} ${modelo} ${qualidadeTela || ""}`,
        quantidade: 1,
        precoUnitario: valorPeca,
        total: valorPeca,
      },
    ];

    const calculados = calcularValoresFinanceiros({
      itens,
      frete,
      custosAdicionais,
      valorMaoObra,
      desconto,
      acrescimo: 0,
      valorFinalCustom: undefined,
    });

    setValoresCalculados(calculados);
  }, [valorPeca, custoPeca, valorMaoObra, desconto, frete, custosAdicionais, marca, modelo, qualidadeTela]);

  // Salvar orçamento
  const handleSalvar = () => {
    const orcamento: Orcamento = {
      id: crypto.randomUUID(),
      osId: null,
      numeroOS: null,
      clienteId: null,
      clienteNome: "",
      aparelho: `${marca} ${modelo}`,
      descricao: servico,
      valor: valoresCalculados.valor_final,
      status: "PENDENTE",
      dataOrcamento: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSalvar(orcamento);
  };

  // Enviar ao cliente
  const handleEnviar = (canal: "whatsapp" | "email" | "pdf") => {
    // Usar a função gerarMensagemCliente que só mostra valor final e garantia
    const mensagem = gerarMensagemCliente({
      nomeCliente: clienteNome || "", 
      aparelho: `${marca} ${modelo}`,
      descricaoServico: servico,
      valorFinal: valoresCalculados.valor_final,
      prazoEstimado: "A combinar",
      garantia: `${garantiaDias} dias`,
    });

    if (canal === "whatsapp") {
      // Abrir WhatsApp com a mensagem
      const telefoneLimpo = clienteTelefone ? paraFormatoInternacional(clienteTelefone) : "5511999999999";
      const url = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
    } else if (canal === "email") {
      // Abrir cliente de email
      const url = `mailto:?subject=Orçamento HC Tech - ${marca} ${modelo}&body=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
    } else if (canal === "pdf") {
      // Gerar PDF (placeholder)
      alert("Geração de PDF em desenvolvimento. Use WhatsApp ou E-mail por enquanto.");
    }
  };

  // Pré-visualizar mensagem do cliente
  const handlePreview = () => {
    const mensagem = gerarMensagemCliente({
      nomeCliente: clienteNome || "",
      aparelho: `${marca} ${modelo}`,
      descricaoServico: servico,
      valorFinal: valoresCalculados.valor_final,
      prazoEstimado: "A combinar",
      garantia: `${garantiaDias} dias`,
    });
    alert("Pré-visualização da mensagem ao cliente:\n\n" + mensagem);
  };

  return (
    <div className="space-y-6">
      {/* SEÇÃO INTERNA: CUSTOS */}
      <div className="rounded-xl border-2 border-destructive/30 bg-muted/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground">
            💰 GESTÃO FINANCEIRA INTERNA — ACESSO RESTRITO
          </h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Estes valores NÃO serão enviados ao cliente. Apenas o valor final e garantia.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="custo-peca">Custo da Peça (Aquisição)</Label>
            <Input
              id="custo-peca"
              type="number"
              step="0.01"
              value={custoPeca}
              onChange={(e) => setCustoPeca(parseFloat(e.target.value) || 0)}
              className="input-modern"
            />
          </div>
          <div>
            <Label htmlFor="frete">Frete de Aquisição</Label>
            <Input
              id="frete"
              type="number"
              step="0.01"
              value={frete}
              onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
              className="input-modern"
            />
          </div>
          <div>
            <Label htmlFor="custos-adicionais">Outros Custos Internos</Label>
            <Input
              id="custos-adicionais"
              type="number"
              step="0.01"
              value={custosAdicionais}
              onChange={(e) => setCustosAdicionais(parseFloat(e.target.value) || 0)}
              className="input-modern"
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg border-2 border-border bg-card p-4">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 font-semibold text-foreground">Custo das Peças</td>
                <td className="py-2 text-right text-foreground">{formatarMoeda(valoresCalculados.custo_pecas)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-foreground">Frete de Aquisição</td>
                <td className="py-2 text-right text-foreground">{formatarMoeda(valoresCalculados.frete_aquisicao)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-foreground">Outros Custos</td>
                <td className="py-2 text-right text-foreground">{formatarMoeda(valoresCalculados.custos_adicionais)}</td>
              </tr>
              <tr className="bg-muted/50 font-bold">
                <td className="py-3 text-foreground">CUSTO TOTAL DA OPERAÇÃO</td>
                <td className="py-3 text-right text-foreground">{formatarMoeda(valoresCalculados.custo_total_operacao)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO PÚBLICA: VALORES AO CLIENTE */}
      <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">📋 Valores do Orçamento (Cliente)</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="valor-peca">Valor da Peça</Label>
            <Input
              id="valor-peca"
              type="number"
              step="0.01"
              value={valorPeca}
              onChange={(e) => setValorPeca(parseFloat(e.target.value) || 0)}
              className="input-modern"
            />
          </div>
          <div>
            <Label htmlFor="mao-obra">Mão de Obra</Label>
            <Input
              id="mao-obra"
              type="number"
              step="0.01"
              value={valorMaoObra}
              onChange={(e) => setValorMaoObra(parseFloat(e.target.value) || 0)}
              className="input-modern"
            />
          </div>
          <div>
            <Label htmlFor="desconto">Desconto</Label>
            <Input
              id="desconto"
              type="number"
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
              className="input-modern"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="garantia">Garantia</Label>
          <Select value={garantiaDias.toString()} onValueChange={(v) => setGarantiaDias(parseInt(v))}>
            <SelectTrigger className="input-modern">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 rounded-lg border-2 border-border bg-card p-4">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 font-semibold text-foreground">Peça</td>
                <td className="py-2 text-right text-foreground">{formatarMoeda(valoresCalculados.valor_venda_pecas)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-foreground">Mão de Obra</td>
                <td className="py-2 text-right text-foreground">{formatarMoeda(valoresCalculados.valor_mao_obra)}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-foreground">Desconto</td>
                <td className="py-2 text-right text-destructive">- {formatarMoeda(valoresCalculados.desconto)}</td>
              </tr>
              <tr className="bg-primary/10 font-bold">
                <td className="py-3 text-lg text-primary">TOTAL DO ORÇAMENTO</td>
                <td className="py-3 text-right text-lg text-primary">{formatarMoeda(valoresCalculados.valor_final)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Lucro Bruto Estimado:</span>
            <span className="text-lg font-bold text-success">{formatarMoeda(valoresCalculados.lucro_bruto)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold text-foreground">Margem Bruta:</span>
            <span className="text-lg font-bold text-success">{valoresCalculados.margem_lucro.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações Internas</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Notas internas..."
          className="input-modern min-h-[100px]"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSalvar} className="btn-modern bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Salvar Orçamento
        </Button>
        <Button onClick={handlePreview} variant="outline" className="btn-modern border-primary text-primary hover:bg-primary/10">
          <Eye className="mr-2 h-4 w-4" />
          Pré-visualizar
        </Button>
        <Button onClick={() => handleEnviar("whatsapp")} className="btn-modern bg-emerald-600 text-white hover:bg-emerald-700">
          <Send className="mr-2 h-4 w-4" />
          Enviar WhatsApp
        </Button>
        <Button onClick={() => handleEnviar("email")} className="btn-modern bg-sky-600 text-white hover:bg-sky-700">
          <Mail className="mr-2 h-4 w-4" />
          Enviar E-mail
        </Button>
        <Button onClick={() => handleEnviar("pdf")} className="btn-modern bg-muted text-muted-foreground hover:bg-muted/80">
          <FileText className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </div>
    </div>
  );
}
