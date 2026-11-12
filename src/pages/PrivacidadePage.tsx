import { Link } from "react-router-dom";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen px-6 py-16 md:py-24">
      <article className="max-w-3xl mx-auto prose prose-invert">
        <Link to="/" className="text-[#00A651] text-sm hover:underline">← Voltar</Link>
        <h1 className="text-4xl font-black mt-4 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-slate-400">Última atualização: 11/05/2026</p>

        <h2 className="mt-8">1. Quem somos</h2>
        <p>HC Tech — assistência técnica de celulares e notebooks em São Bernardo do Campo/SP. Contato: WhatsApp (11) 97793-4634.</p>

        <h2>2. Dados que coletamos</h2>
        <ul>
          <li><strong>Navegação anônima:</strong> via Google Analytics 4, com IP anonimizado, sem sinais de anúncio.</li>
          <li><strong>Atendimento:</strong> mensagens enviadas voluntariamente via WhatsApp (nome, modelo do aparelho, descrição do problema).</li>
          <li><strong>Carrinho:</strong> armazenado apenas no seu navegador (localStorage). Não enviamos para servidor.</li>
        </ul>

        <h2>3. Base legal (LGPD)</h2>
        <p>Consentimento (Art. 7º, I) para cookies analíticos; legítimo interesse (Art. 7º, IX) para registros de atendimento.</p>

        <h2>4. Compartilhamento</h2>
        <p>Não vendemos dados. Compartilhamos apenas com Google (Analytics) mediante seu consentimento.</p>

        <h2>5. Seus direitos</h2>
        <p>Você pode solicitar acesso, correção ou exclusão dos seus dados pelo WhatsApp acima.</p>

        <h2>6. Cookies</h2>
        <p>Usamos apenas cookies essenciais e, se você aceitar, cookies do Google Analytics. Você pode revogar a qualquer momento limpando o armazenamento do navegador.</p>

        <h2>7. Segurança</h2>
        <p>Aplicamos CSP, HTTPS, anonimização de IP e princípios de minimização de dados.</p>
      </article>
    </main>
  );
}
