# BidDeed.AI MCP Server — Architecture

**Status:** SPEC · v1.0 · 2026-05-27
**Owner:** Ariel Shapira
**Implementation tracking:** `summit_chat_dispatch` SUMMIT-D (queued, depends on SUMMIT-B V14 inference endpoint)
**Audit:** `ci_v65_event_log` row `13be7baa-c50c-4fd1-8223-091788cb9bda` (Diamonds/Triangle/V4 ground truth)

> Designed against the three engineering patterns Apigene monetizes (apigene.ai, $200/mo for 100K tool calls). We replicate them in our own runtime for free using the Anthropic MCP SDK and Cloudflare Pages Functions, so we keep the BidDeed surface bespoke and own the gateway.

---

## 0. Where the MCP server lives

**Decision:** colocate as a Cloudflare Pages Function inside this repo.

| | Path | Runtime |
|---|---|---|
| Existing | `functions/api/chat.ts` | CF Pages Function (edge) |
| New (this ADR) | `functions/api/mcp/[transport].ts` | CF Pages Function (edge) |

Why colocated, not a separate `biddeed-mcp` repo:
- Single deploy path (existing `wrangler.toml` + `.github/workflows/deploy.yml` cover it)
- Same domain as the chat UI → simpler auth, no CORS gymnastics
- Edge runtime is ideal for MCP: low latency, zero cold start, free tier covers V1 load
- The `functions/api/chat.ts` pattern is already proven in this codebase

When traffic crosses ~5M tool calls/month we re-evaluate splitting into a dedicated Worker. Not before.

---

## 1. Tool catalog (V1 — 6 tools, not 8)

Each tool is a thin shell over a Supabase RPC. The RPC does the work; the MCP layer enforces the three optimizations.

| Tool | Underlying Supabase entity | Subscription tier |
|---|---|---|
| `search_distressed_inventory(filters)` | `multi_county_auctions` + `triangle.signal_catalog` (owner-vertex SQL) | Solo+ |
| `get_property_intelligence(parcel_id)` | RPC `get_shapira_v14_score(parcel_id)` (built by SUMMIT-B's inference endpoint) | Solo+ |
| `score_parcel_batch(parcel_ids[])` | parallel fan-out over `get_property_intelligence` | Team+ |
| `find_diamonds(county, max_opening_bid?)` | SQL filter on unknown-address properties | Solo+ |
| `get_owner_distress_profile(owner_name)` | `triangle.*` owner-vertex 8-signal score | Team+ |
| `summarize_upcoming_auctions(county, date_range)` | aggregated `multi_county_auctions` + V14 scores | Solo+ |

Tools NOT in V1 (deliberately deferred):
- Bidding strategy (`compute_max_bid`) → V2 once we have outcome telemetry to defend it
- Owner skip-trace / contact info → never (regulatory + data-license headaches)
- Property photo gallery → wrong shape for MCP; deep-link the UI

---

## 2. Pattern A — Dynamic tool loading

**Problem we're solving:** if we expose all 6 tools to every client, every Claude/ChatGPT session burns ~3-5K tokens loading tools it'll never use. At 100K sessions/month that's real money and slower responses.

**Mechanism:** MCP's `tools/list` is called once per session, and we return a tier-filtered + intent-filtered subset.

```typescript
// functions/api/mcp/[transport].ts (excerpt)
async function listTools(req: McpRequest): Promise<Tool[]> {
  const tier = await resolveSubscriptionTier(req.apiKey);  // 'solo' | 'team' | 'enterprise'
  const hint = req.headers.get('x-biddeed-intent');  // optional client hint

  // Tier gate
  let pool = TOOLS.filter(t => t.minTier <= tierRank(tier));

  // Intent gate (when client provides hint, otherwise expose all eligible)
  if (hint === 'browse')   pool = pool.filter(t => ['search_distressed_inventory','find_diamonds','summarize_upcoming_auctions'].includes(t.name));
  if (hint === 'analyze')  pool = pool.filter(t => ['get_property_intelligence','score_parcel_batch','get_owner_distress_profile'].includes(t.name));

  // Hard cap (never expose more than 5 tools per session — keeps client prompts terse)
  return pool.slice(0, 5);
}
```

**Three things this gets right:**
- Tier filtering is server-side and irrevocable (a Solo customer cannot probe Team tools by guessing names)
- Intent hint is optional — if the client doesn't send one, we still expose the full tier-eligible set
- The hard cap is the safety net (an `enterprise` tier with all 6 visible is still ≤5)

**Telemetry hook:** every `tools/list` writes a row to `mcp_tool_list_log (session_id, tier, hint, tools_returned[])` so we can A/B intent classifiers later.

---

## 3. Pattern B — Output compression

**Problem we're solving:** `multi_county_auctions` rows have 100+ columns. A naïve `get_property_intelligence(parcel_id)` returns the full row + scoring details = ~30 KB. The LLM doesn't need or want most of it. It crowds context, slows responses, and costs money downstream.

**Mechanism:** every tool has a strict output contract enforced at the edge function. Max bytes per tool, hard-coded.

| Tool | Max output bytes | What we strip |
|---|---|---|
| `search_distressed_inventory` | 8 KB | Photo URLs, BCPAO raw, legal description, full plaintiff name (truncate to 40 chars) |
| `get_property_intelligence` | **500 bytes** | Everything except: score, confidence, top-3 signal contributions, deep-link URL |
| `score_parcel_batch` | 8 KB | Same as get_property_intelligence × N, plus a single batch summary |
| `find_diamonds` | 6 KB | Same as search_distressed_inventory, plus diamond rationale |
| `get_owner_distress_profile` | 2 KB | Only the 6 enabled signals + score, no raw owner_name regex matches |
| `summarize_upcoming_auctions` | 4 KB | Aggregate stats only, never per-row data |

```typescript
// Contract enforcement (excerpt)
function shapePropertyIntel(raw: Mca, score: V14Score): PropertyIntelOutput {
  return {
    parcel_id: raw.parcel_id,
    score: score.probability,                          // 0..1, 6 decimals
    confidence: score.cv_band,                         // "high" | "medium" | "low"
    grade: gradeFromScore(score.probability),          // "A+" | "A" | "B" | "C" | "D"
    top_signals: score.top_3_features,                 // [{ feature, contribution }]
    open_bid: raw.opening_bid,
    market_value: raw.market_value,
    auction_date: raw.auction_date,
    deep_link: `https://biddeed.ai/property/${raw.parcel_id}`,
  };  // ~420 bytes, never crosses 500
}

// Hard limit at serialize time
function enforce(out: unknown, maxBytes: number, toolName: string): string {
  const json = JSON.stringify(out);
  if (json.length > maxBytes) {
    throw new Error(`MCP contract violation: ${toolName} output ${json.length}B exceeds ${maxBytes}B cap`);
  }
  return json;
}
```

**Failure mode:** if the underlying RPC ever returns something the shaper can't compress, we throw an error and surface it as `mcp_tool_error_log`. We do NOT silently truncate — that produces lies. We fail loudly and the engineer fixes the shaper.

---

## 4. Pattern C — Parallel execution

**Problem we're solving:** `score_parcel_batch(parcel_ids[])` on 20 parcels, done sequentially, is 20 × (network + RPC) ≈ 4-6 seconds. Done in parallel, it's ~300 ms. Same compute cost, 15-20× wall-clock improvement.

**Mechanism:** fan-out at the edge with `Promise.all`, with a concurrency cap to protect Supabase.

```typescript
async function scoreParcelBatch(parcel_ids: string[]): Promise<PropertyIntelOutput[]> {
  if (parcel_ids.length > 50) {
    throw new Error("batch_size_exceeded: max 50 parcels per call");
  }

  // Concurrency cap — protect Supabase connection pool
  const CONCURRENCY = 10;
  const results: PropertyIntelOutput[] = [];

  for (let i = 0; i < parcel_ids.length; i += CONCURRENCY) {
    const chunk = parcel_ids.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(id =>
        getPropertyIntel(id).catch(err => ({
          parcel_id: id,
          error: err.message.slice(0, 80),
        }))
      )
    );
    results.push(...chunkResults);
  }

  return results;
}
```

**Three things this gets right:**
- Batch size capped at 50 — protects against runaway loops in pathological client prompts
- Concurrency capped at 10 — protects Supabase's PgBouncer pool from being exhausted
- Per-parcel errors don't fail the batch — a single bad parcel_id returns `{ parcel_id, error }` and the rest succeed. The LLM can reason about partial results.

---

## 5. Auth, rate limiting, telemetry

**Auth:** API key in `Authorization: Bearer biddeed_<sk|pk>_<random>` header. Keys live in `public.biddeed_api_keys` table (to be created) with `tier`, `monthly_quota`, `created_for_user_id`. Edge function does a single Supabase lookup per request, cached in Cloudflare KV for 60 seconds.

**Rate limits per tier:**

| Tier | Tool calls / month | Concurrent sessions |
|---|---|---|
| Solo ($499/mo) | 10,000 | 3 |
| Team ($4,999/mo) | 100,000 | 20 |
| Enterprise (custom) | unlimited | unlimited |

Tracked in `public.mcp_call_log (session_id, tier, tool_name, latency_ms, bytes_returned, error)`. Aggregated nightly to `biddeed_api_keys.calls_this_month`. Soft warning at 80%, hard block at 100% until next billing cycle.

**Telemetry:** PostHog (already wired in `lib/posthog/config.ts`) gets a server-side capture for every tool call with: tool name, tier, latency, bytes, success/error. This is what tells us which tools matter and where to invest engineering next.

---

## 6. What ships in V1 vs deferred

**V1 (this ADR, ships after SUMMIT-B's inference endpoint):**
- `functions/api/mcp/[transport].ts` with HTTP+SSE transports
- 6 tools (catalog in §1) with tier gating + intent filtering
- Output contracts enforced per §3
- Parallel fan-out per §4
- API key auth + per-tier rate limits
- PostHog telemetry on every call
- Listed in apigene.ai/mcp/tools directory for free distribution

**V2 (after we have 30 days of V1 telemetry):**
- `compute_max_bid(parcel_id, strategy)` tool — needs outcome calibration data
- Smart caching: tools that return the same data within 5 min get cached at edge
- Per-tool A/B test framework (e.g., test 500-byte vs 800-byte property intel — does it actually hurt?)
- MCP elicitation for clarifying questions on ambiguous filter inputs

**V3 (post-Q3, after V4 stacked ensemble per SUMMIT-C):**
- `get_convergence_alert(zip_code, threshold)` — Patent Claim 13
- `get_cycle_position(market)` — Patent Claim 14
- Streaming tool outputs for batch ops > 100 parcels

---

## 7. Implementation sequence — DO NOT skip

This is the order, not a menu:

1. **SUMMIT-B inference endpoint** — `get_shapira_v14_score(parcel_id)` Edge Function (Supabase, not Cloudflare). Reads from `shapira_models` registry, downloads `model.json` from `shapira-models` Storage bucket once at cold start, runs XGBoost inference in JS via [xgboost-js port] or precomputes scores into a materialized view. **Decision pending: live inference vs. pre-scored materialized view. Lean materialized view for V1 — refresh nightly, sub-ms read.**
2. **`functions/api/mcp/[transport].ts` scaffold** — see `functions/api/mcp.ts` stub in this commit
3. **6 tool implementations** in priority order:
   a. `get_property_intelligence` (needs SUMMIT-B done first)
   b. `find_diamonds` (pure SQL, can ship today)
   c. `search_distressed_inventory` (needs tier-gating logic)
   d. `score_parcel_batch` (depends on `get_property_intelligence`)
   e. `get_owner_distress_profile` (needs triangle.distress_scores populated — currently 0 rows; needs separate SUMMIT)
   f. `summarize_upcoming_auctions`
4. **End-to-end test in Claude Desktop + ChatGPT custom GPT** — both must work without code change
5. **apigene.ai/mcp/tools listing submission** — 30-min distribution win

---

## 8. What's intentionally NOT here

- **No LangGraph integration.** The MCP server is stateless per-request. Multi-step reasoning is the client's job (Claude, ChatGPT, etc). We expose tools, not workflows.
- **No real-time push.** MCP supports server-initiated notifications but we don't have a use case; HTTP request/response is enough for V1.
- **No client SDK.** Anthropic's `@modelcontextprotocol/sdk` is the reference; any client that speaks MCP works with us. We don't build a JS SDK for our MCP server because the protocol already is the SDK.

---

## Appendix · Spec compliance checklist

The three Apigene patterns, item by item:

- [x] **Dynamic tool loading** — `tools/list` returns tier + intent-filtered subset, max 5 per session (§2)
- [x] **Output compression** — per-tool max-byte contracts, hard-enforced at serialize time, no silent truncation (§3)
- [x] **Parallel execution** — `Promise.all` with concurrency cap 10, batch cap 50, per-item error tolerance (§4)

When we list in apigene.ai/mcp/tools, the directory blurb writes itself: "BidDeed.AI — FL distressed asset intelligence. 6 tools. 500-byte property intel. 50-parcel batch scoring in <500 ms."
