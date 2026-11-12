## Plano de Hardening — HC Tech (React + Vite + Lovable Cloud + GitHub Pages)

Vou aplicar **apenas o que faz sentido** para a sua stack real (SPA estática no GitHub Pages + edge functions no Lovable Cloud). Ítens que não se aplicam (ex.: middleware Node, Nginx, Docker, Next.js SSR) ficam de fora — incluí-los só geraria código morto.

---

### 1. Auditoria rápida do que já existe
- `.env` já é gerado pelo Lovable (não vai pro git, contém só chaves **publishable** — seguras por design).
- `VITE_SUPABASE_PUBLISHABLE_KEY` é **pública** (anon key protegida por RLS) — não é vazamento.
- Edge function `maia-chat` usa `LOVABLE_API_KEY` server-side ✅.
- Já existe `GoogleAnalytics.tsx`, mas carrega **sem consentimento** ❌.

### 2. Mudanças no repositório

**`.gitignore` profissional**
- Adicionar: `.env*`, `*.local`, `dist/`, `coverage/`, `.DS_Store`, `*.log`, `.vscode/`, `.idea/`, `node_modules/`, `bun.lockb` (manter), `*.pem`, `*.key`.

**`.github/workflows/deploy.yml`**
- Adicionar permissões mínimas (já OK), pinar actions por SHA opcional, rodar `bun audit` (best-effort).
- Criar `.github/workflows/codeql.yml` (CodeQL para JS/TS — gratuito).
- Criar `.github/dependabot.yml` (npm semanal + github-actions).

**Push protection / Secret scanning / Branch protection**
- Não dá pra ativar via código — vou deixar instruções no `SECURITY.md` (1 clique na UI do GitHub, gratuito em repo público).

### 3. Hardening do frontend (Vite)

**`vite.config.ts`**
- `build.sourcemap: false` (evita expor source em produção).
- Drop `console.*` e `debugger` em produção via esbuild (`drop: ['console','debugger']`).
- `build.minify: 'esbuild'` (default, confirmar).

**`index.html` — meta security headers (o que funciona via meta tag em hosting estático)**
- `Content-Security-Policy` (meta) restrita a: self, fonts.googleapis/gstatic, googletagmanager, supabase URL, wa.me, imagens https/data.
- `X-Content-Type-Options: nosniff` (via meta http-equiv onde suportado).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` minimalista.
- Observação honesta: **HSTS, X-Frame-Options, COOP/COEP só funcionam via header HTTP real**. GitHub Pages não permite custom headers. Vou documentar como ativar via Cloudflare (free tier) — opcional.

**Anti-clickjacking sem header HTTP**
- Frame-buster JS leve no `main.tsx` (`if (top !== self) top.location = self.location`).

**Bloqueio de DevTools / F12 / botão direito**
- Vou implementar como **opt-in desativado por padrão** com comentário explicando que isso **não é segurança real** (qualquer atacante contorna em 5s) e prejudica UX/acessibilidade. Se você insistir, ativa uma flag.

### 4. Google Analytics + LGPD

**Novo: `src/components/CookieConsent.tsx`**
- Banner discreto (estilo dark/emerald do projeto).
- Botões: "Aceitar", "Recusar", "Personalizar".
- Persiste escolha em `localStorage` (`hctech-consent`).
- Dispara evento global que o `GoogleAnalytics` escuta.

**Refator `GoogleAnalytics.tsx`**
- Carrega script **só após consentimento**.
- `anonymize_ip: true`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`.
- Implementa **Google Consent Mode v2** (`default denied` → `update granted`).

**Eventos custom**: `whatsapp_click`, `add_to_cart`, `chat_open`, `loja_view` (hooks pequenos onde já existem handlers).

**Nova página `/privacidade`** com política LGPD enxuta (texto pronto, editável).

### 5. SEO/Performance (incrementos baratos)
- `loading="lazy"` e `decoding="async"` nas imagens da loja (verificar se já tem).
- `<link rel="preconnect">` já existe pra fonts ✅. Adicionar pra Supabase URL.
- Atualizar `sitemap.xml` com `/loja`, `/peliculas`, `/privacidade`.
- Corrigir bug no JSON-LD do `index.html` (faltam aspas em `streetAddress`).

### 6. Documentação entregue
- `SECURITY.md` — checklist do que ativar manualmente no GitHub (Secret scanning, Push protection, Branch protection, Dependabot alerts) + como plugar Cloudflare free pra headers HTTP reais.
- Comentários técnicos mínimos nos arquivos novos.

---

### Itens do seu pedido que **vou recusar/adaptar** (com motivo)

| Pedido | Decisão | Motivo |
|---|---|---|
| Bloquear F12/Ctrl+U/click direito | Opcional, off por padrão | Falsa sensação de segurança, quebra acessibilidade e devtools legítimos. |
| Headers HTTP reais (HSTS, XFO, etc) | Documentado, não aplicado | GitHub Pages não suporta. Solução real: Cloudflare na frente (free). |
| Pre-commit hook anti-secrets | Documentado | Requer instalar dep (`husky`/`gitleaks`); contraria sua regra "STRICTLY NO new libraries". GitHub Push Protection cobre isso de graça. |
| CSRF no frontend | N/A | Não há cookies de sessão server-rendered; auth do Supabase usa JWT em header. |
| Brute-force protection | N/A | Sem login customizado; Supabase Auth já tem rate-limit nativo. |
| Nginx/Docker config | Pulado | Não há servidor próprio. |
| Compressão gzip/brotli | Já ativo | GitHub Pages serve gzip por padrão. |

---

**Confirma que posso aplicar?** Se quiser, marco também o opt-in de bloqueio DevTools (não recomendo) ou pulo o banner de consent (não recomendo se o site tem visitantes UE/BR).