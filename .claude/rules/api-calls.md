---
pattern: "src/lib/**"
---
# API/Lib Rules (loaded only when editing lib utilities)

- All Supabase calls through typed client — never raw fetch to Supabase URL
- Error handling: try/catch every async call, surface to user via toast
- Token refresh: handled by Supabase client, never manual
- Rate limiting: client-side debounce on search/filter inputs (300ms)
- No secrets in client code. Environment variables via .env.local only
- LLM calls route through CLIProxyAPI (127.0.0.1:8317), never direct to providers
