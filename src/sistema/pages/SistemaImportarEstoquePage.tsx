import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PRODUTOS = [
  { sku:"001", aparelho:"Cartão de Memória Altomex 8GB Class 10 (AL-MO-8)", cat:"armazenamento", qtd:3, preco:50, marca:"Altomex", modelo:"AL-MO-8", forn:"Altomex" },
  { sku:"002", aparelho:"Cabo de Áudio KAIDI P2 para P2 1m (KD-29)", cat:"cabos_conectores", qtd:7, preco:20, marca:"KAIDI", modelo:"KD-29", forn:"KAIDI" },
  { sku:"003", aparelho:"Película de Câmera Olyps (iPhone 13 / 13 mini)", cat:"peliculas_protecao", qtd:9, preco:10, marca:"Olyps", modelo:"iPhone 13/13 mini", forn:"Olyps" },
  { sku:"004", aparelho:"Cabo Tipo-C para Tipo-C KAIDI Turbo PD 60W (KD-27)", cat:"cabos_conectores", qtd:8, preco:35, marca:"KAIDI", modelo:"KD-27", forn:"KAIDI" },
  { sku:"005", aparelho:"Cabo Micro USB KAIDI Carregamento Rápido 1m (KD-39M)", cat:"cabos_conectores", qtd:10, preco:25, marca:"KAIDI", modelo:"KD-39M", forn:"KAIDI" },
  { sku:"006", aparelho:"Cabo USB Tipo-C KAIDI Carregamento Rápido 1m (KD-39C)", cat:"cabos_conectores", qtd:8, preco:25, marca:"KAIDI", modelo:"KD-39C", forn:"KAIDI" },
  { sku:"007", aparelho:"Cabo USB para Lightning KAIDI com Tela Digital (KD-104A)", cat:"cabos_conectores", qtd:2, preco:30, marca:"KAIDI", modelo:"KD-104A", forn:"KAIDI" },
  { sku:"008", aparelho:"Carregador Portátil Universal LEHMOX 5V-3.1A (LEY-235)", cat:"carregadores", qtd:4, preco:25, marca:"LEHMOX", modelo:"LEY-235", forn:"LEHMOX" },
  { sku:"009", aparelho:"Adaptador Lightning para P2 3.5mm LEHMOX (LEY-234)", cat:"acessorios", qtd:6, preco:15, marca:"LEHMOX", modelo:"LEY-234", forn:"LEHMOX" },
  { sku:"010", aparelho:"Cabo USB para Lightning LOGIC Timão Corinthians", cat:"cabos_conectores", qtd:1, preco:25, marca:"LOGIC", modelo:"Timão", forn:"LOGIC" },
  { sku:"011", aparelho:"Capa Space Collection (iPhone 15 Pro Max)", cat:"capas", qtd:9, preco:null, marca:"Space Collection", modelo:"iPhone 15 Pro Max", forn:null },
  { sku:"012", aparelho:"Bateria de Lítio 3V LE-BT2025 Lehmox (cartela)", cat:"baterias", qtd:17, preco:5, marca:"Lehmox", modelo:"LE-BT2025", forn:"Lehmox" },
  { sku:"013", aparelho:"Cabo de Rede / Conexão Altomex Azul", cat:"cabos_conectores", qtd:4, preco:25, marca:"Altomex", modelo:null, forn:"Altomex" },
  { sku:"014", aparelho:"Adaptador Dual Lightning Audio & Charge (J-008)", cat:"acessorios", qtd:2, preco:20, marca:null, modelo:"J-008", forn:null },
  { sku:"015", aparelho:"Fone TWS Auricular KAIDI (KD-7026)", cat:"audio", qtd:3, preco:60, marca:"KAIDI", modelo:"KD-7026", forn:"KAIDI" },
  { sku:"016", aparelho:"Suporte de Celular para Moto LEHMOX (LEY-1602)", cat:"acessorios", qtd:3, preco:25, marca:"LEHMOX", modelo:"LEY-1602", forn:"LEHMOX" },
];

export default function SistemaImportarEstoquePage() {
  const navigate = useNavigate();
  const [executando, setExecutando] = useState(false);

  async function handleImportar() {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      toast.error("Faça login primeiro");
      return;
    }

    setExecutando(true);

    const { data: existentes } = await supabase
      .from("estoque")
      .select("id, sku")
      .not("sku", "is", null);

    const skusExistentes = new Map(existentes?.map(e => [e.sku, e.id]) || []);
    let inseridos = 0;
    let atualizados = 0;

    for (const p of PRODUTOS) {
      const idExistente = skusExistentes.get(p.sku);
      const dados = {
        user_id: user.user.id,
        sku: p.sku,
        aparelho: p.aparelho,
        categoria: p.cat,
        quantidade: p.qtd,
        custo: null,
        preco_venda: p.preco,
        proprietario: "HC TECH",
        canal_de_venda: "Loja física",
        fornecedor: p.forn,
        marca: p.marca,
        modelo: p.modelo,
        condicao: "Novo",
      };

      if (idExistente) {
        const { error } = await supabase.from("estoque").update(dados).eq("id", idExistente);
        if (!error) atualizados++;
      } else {
        const { error } = await supabase.from("estoque").insert(dados);
        if (!error) inseridos++;
      }
    }

    setExecutando(false);
    toast.success(`Concluído! ${inseridos} novos + ${atualizados} atualizados`);
    setTimeout(() => navigate("/sistema/estoque"), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/sistema/estoque")} className="text-green-400 hover:text-green-300 mb-4 block text-sm">
          ← Voltar ao Estoque
        </button>
        <h1 className="text-2xl font-bold text-[#00FF88] mb-2">Importação de Produtos HC TECH</h1>
        <p className="text-zinc-400 mb-6">Lista real do proprietário — 16 produtos cadastrados da planilha Excel</p>
        <button onClick={handleImportar} disabled={executando} className="w-full py-4 bg-[#00FF88] text-zinc-900 font-bold rounded-lg hover:bg-green-400 transition disabled:opacity-50 text-lg mb-8">
          {executando ? "Importando..." : `IMPORTAR TODOS OS PRODUTOS (${PRODUTOS.length})`}
        </button>
        <div className="space-y-2">
          {PRODUTOS.map((p) => (
            <div key={p.sku} className="bg-zinc-900 border border-zinc-800 rounded p-3 flex justify-between items-center text-sm">
              <span className="text-zinc-300"><span className="text-green-400 font-mono">{p.sku}</span> - {p.aparelho}</span>
              <span className="text-zinc-400 font-mono">Qtd: {p.qtd} | R$ {p.preco ?? "Sob consulta"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
