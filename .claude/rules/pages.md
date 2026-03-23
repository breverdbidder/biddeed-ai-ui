---
pattern: "src/pages/**"
---
# Page Rules (loaded only when editing page files)

- NLP chatbot interface is PRIMARY interaction model
- Every page must handle: loading, error, empty states
- Auth: Supabase magic link + RLS. Never client-side auth checks alone
- Route protection: redirect unauthenticated to /login, never flash protected content
- SEO: title + meta description on every page
- Performance: lazy-load below-fold components. No blocking renders
