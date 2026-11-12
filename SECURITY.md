# Security & Hardening — HC Tech

Este documento lista o que está aplicado no código e o que precisa ser ativado **uma vez** na UI do GitHub / Cloudflare. Tudo é gratuito.

## ✅ Aplicado no código

- `.gitignore` profissional (`.env*`, chaves, builds, caches).
- `vite.config.ts` com `sourcemap: false` e `drop: console/debugger` em produção.
- Meta CSP, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` no `index.html`.
- Frame-buster JS no `main.tsx` (anti-clickjacking sem header HTTP).
- Banner de consentimento LGPD/GDPR + Google Consent Mode v2.
- Google Analytics carrega **só após consentimento**, com `anonymize_ip` e ad-signals desligados.
- CodeQL workflow + Dependabot semanal.
- Página `/privacidade` com política básica.

## 🔧 Ativar 1× no GitHub (Settings → Code security)

- [ ] **Secret scanning** + **Push protection** (gratuito em repo público)
- [ ] **Dependabot alerts** + **security updates**
- [ ] **Branch protection** em `main`: require PR review, require status checks (CodeQL).
- [ ] **Actions → Workflow permissions**: "Read repository contents" + "Allow GitHub Actions to create PRs" (para Dependabot).

## 🛡️ Headers HTTP reais (opcional, free)

GitHub Pages **não** envia HSTS/X-Frame-Options/COOP. Para ter headers reais sem custo:

1. Cadastre o domínio no **Cloudflare** (plano Free).
2. Aponte os DNS pro Cloudflare e mantenha `CNAME` apontando pro GitHub Pages.
3. **Rules → Transform Rules → Modify Response Header** — adicione:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

4. **SSL/TLS → Full (strict)** + **Always Use HTTPS** ON.

## 🚫 O que NÃO foi feito (e por quê)

| Pedido | Motivo |
|---|---|
| Bloqueio F12 / botão direito | Falsa segurança, quebra acessibilidade. Atacante real bypassa em segundos. |
| Pre-commit hook (gitleaks/husky) | Requer dependências novas. **Push Protection do GitHub** cobre isso de graça. |
| CSRF tokens | App é SPA estática + JWT em header (Supabase). Sem cookies de sessão = sem CSRF. |
| Brute-force / rate-limit custom | Supabase Auth já tem rate-limit nativo. |
| Nginx / Docker hardening | Não há servidor próprio; hosting é GitHub Pages. |

## 📊 Checklist de auditoria mensal

- [ ] Rodar `bun audit` e revisar PRs do Dependabot.
- [ ] Revisar logs de `Secret scanning alerts`.
- [ ] Testar site em https://securityheaders.com (alvo: A após Cloudflare).
- [ ] Lighthouse > 90 em Performance / Best Practices / SEO.
