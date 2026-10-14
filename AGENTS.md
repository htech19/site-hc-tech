
## Orçamentos (site)
- Public quote requests go only through the `solicitar-orcamento` edge function (service role insert); the table has no anon access, admins read via `has_role` — keeps customer data private.
- The commercial WhatsApp number for new code lives in `src/config/contact.ts`; reuse it instead of hardcoding.
