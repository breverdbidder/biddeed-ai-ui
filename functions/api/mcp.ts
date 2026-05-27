/**
 * BidDeed.AI MCP Server — Cloudflare Pages Function
 *
 * Spec: docs/MCP_ARCHITECTURE.md
 * Tracking: summit_chat_dispatch SUMMIT-D (queued)
 * Depends on: SUMMIT-B inference endpoint (get_shapira_v14_score RPC)
 *
 * This is V1 SCAFFOLD — types and contracts are real, tool bodies throw NOT_IMPLEMENTED
 * until SUMMIT-D fills them in once V14 inference is live.
 *
 * Implements three Apigene patterns natively:
 *   §2 Dynamic tool loading — tier + intent filtering at tools/list
 *   §3 Output compression   — per-tool max-byte contracts
 *   §4 Parallel execution   — Promise.all with concurrency cap
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  POSTHOG_API_KEY: string;
  BIDDEED_API_KEY_CACHE: KVNamespace;  // 60s lookup cache
}

// ── Subscription tiers (§5) ──────────────────────────────────────────────────
type Tier = "solo" | "team" | "enterprise";
const TIER_RANK: Record<Tier, number> = { solo: 1, team: 2, enterprise: 3 };

// ── Tool catalog (§1) ────────────────────────────────────────────────────────
interface ToolDef {
  name: string;
  description: string;
  minTier: Tier;
  maxOutputBytes: number;  // §3 contract
  inputSchema: object;
}

const TOOLS: ToolDef[] = [
  {
    name: "search_distressed_inventory",
    description: "Search FL foreclosure + tax deed auctions with multi-signal owner-distress filtering. Returns ranked candidates with grades.",
    minTier: "solo",
    maxOutputBytes: 8 * 1024,
    inputSchema: {
      type: "object",
      properties: {
        county: { type: "string", description: "FL county name, lowercase (e.g. 'brevard')" },
        sale_type: { type: "string", enum: ["foreclosure", "tax_deed"] },
        min_owner_distress: { type: "number", description: "0-130 score threshold" },
        date_from: { type: "string", format: "date" },
        date_to: { type: "string", format: "date" },
        limit: { type: "number", maximum: 50, default: 20 },
      },
    },
  },
  {
    name: "get_property_intelligence",
    description: "Get the V14 third-party-purchase probability score plus top distress signals for a single parcel.",
    minTier: "solo",
    maxOutputBytes: 500,  // §3 — hard cap, contract violation if exceeded
    inputSchema: {
      type: "object",
      required: ["parcel_id"],
      properties: { parcel_id: { type: "string" } },
    },
  },
  {
    name: "score_parcel_batch",
    description: "Score up to 50 parcels in parallel. Returns array of property intel objects.",
    minTier: "team",
    maxOutputBytes: 8 * 1024,
    inputSchema: {
      type: "object",
      required: ["parcel_ids"],
      properties: {
        parcel_ids: { type: "array", items: { type: "string" }, maxItems: 50 },
      },
    },
  },
  {
    name: "find_diamonds",
    description: "Find properties with unknown/missing street addresses (PIN-only parcels) — proxy bidders skip these, manual bidders get an edge.",
    minTier: "solo",
    maxOutputBytes: 6 * 1024,
    inputSchema: {
      type: "object",
      required: ["county"],
      properties: {
        county: { type: "string" },
        max_opening_bid: { type: "number" },
      },
    },
  },
  {
    name: "get_owner_distress_profile",
    description: "Compute the Triangle owner-vertex distress score (0-130) from 6 enabled SQL signals for a given owner name.",
    minTier: "team",
    maxOutputBytes: 2 * 1024,
    inputSchema: {
      type: "object",
      required: ["owner_name"],
      properties: { owner_name: { type: "string" } },
    },
  },
  {
    name: "summarize_upcoming_auctions",
    description: "Aggregate stats for upcoming auctions: count by sale_type, score distribution, top counties.",
    minTier: "solo",
    maxOutputBytes: 4 * 1024,
    inputSchema: {
      type: "object",
      required: ["county"],
      properties: {
        county: { type: "string" },
        date_from: { type: "string", format: "date" },
        date_to: { type: "string", format: "date" },
      },
    },
  },
];

// ── §2 Dynamic tool loading ──────────────────────────────────────────────────
function listTools(tier: Tier, intent: string | null): ToolDef[] {
  let pool = TOOLS.filter((t) => TIER_RANK[t.minTier] <= TIER_RANK[tier]);

  if (intent === "browse") {
    pool = pool.filter((t) =>
      ["search_distressed_inventory", "find_diamonds", "summarize_upcoming_auctions"].includes(t.name)
    );
  } else if (intent === "analyze") {
    pool = pool.filter((t) =>
      ["get_property_intelligence", "score_parcel_batch", "get_owner_distress_profile"].includes(t.name)
    );
  }

  return pool.slice(0, 5);  // hard cap — keeps client prompts terse
}

// ── §3 Output compression — enforce contract at serialize time ───────────────
function enforceContract(toolName: string, output: unknown, maxBytes: number): string {
  const json = JSON.stringify(output);
  if (json.length > maxBytes) {
    throw new Error(
      `mcp_contract_violation: tool=${toolName} returned ${json.length}B, cap=${maxBytes}B`
    );
  }
  return json;
}

// ── §4 Parallel execution with concurrency cap ───────────────────────────────
async function parallelMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 10
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

// ── Auth (§5) ────────────────────────────────────────────────────────────────
async function resolveApiKey(env: Env, apiKey: string): Promise<{ tier: Tier; user_id: string } | null> {
  // KV cache first (60s TTL)
  const cached = await env.BIDDEED_API_KEY_CACHE.get(`key:${apiKey}`);
  if (cached) return JSON.parse(cached);

  // Supabase lookup
  const r = await fetch(
    `${env.SUPABASE_URL}/rest/v1/biddeed_api_keys?api_key=eq.${apiKey}&select=tier,user_id,active&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const rows = await r.json() as Array<{ tier: Tier; user_id: string; active: boolean }>;
  if (!rows[0]?.active) return null;

  const result = { tier: rows[0].tier, user_id: rows[0].user_id };
  await env.BIDDEED_API_KEY_CACHE.put(`key:${apiKey}`, JSON.stringify(result), { expirationTtl: 60 });
  return result;
}

// ── Telemetry (§5) ───────────────────────────────────────────────────────────
async function logCall(env: Env, payload: {
  user_id: string;
  tier: Tier;
  tool: string;
  latency_ms: number;
  bytes: number;
  error: string | null;
}) {
  // Fire-and-forget — don't block tool response on telemetry
  fetch(`${env.SUPABASE_URL}/rest/v1/mcp_call_log`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// ── Tool implementations — V1 SCAFFOLD ───────────────────────────────────────
// Each throws NOT_IMPLEMENTED until SUMMIT-D wires it. The contracts (input
// shape, output max bytes, parallel patterns) are FINAL — only the bodies change.

async function execute(
  toolName: string,
  args: Record<string, unknown>,
  env: Env
): Promise<unknown> {
  switch (toolName) {
    case "get_property_intelligence": {
      // TODO(SUMMIT-D): call RPC `get_shapira_v14_score(parcel_id)` once SUMMIT-B inference endpoint lands.
      // Shape the output to the 500-byte contract — see docs/MCP_ARCHITECTURE.md §3 shapePropertyIntel.
      throw new Error("NOT_IMPLEMENTED: blocked on SUMMIT-B inference endpoint");
    }

    case "score_parcel_batch": {
      // TODO(SUMMIT-D): use parallelMap with concurrency=10
      // const ids = args.parcel_ids as string[];
      // return parallelMap(ids, id => execute("get_property_intelligence", { parcel_id: id }, env), 10);
      throw new Error("NOT_IMPLEMENTED: blocked on get_property_intelligence");
    }

    case "find_diamonds": {
      // CAN ship today — pure SQL, no V14 dependency. TODO(SUMMIT-D) implement first.
      throw new Error("NOT_IMPLEMENTED: pure-SQL tool, no upstream blocker — implement first in SUMMIT-D");
    }

    case "search_distressed_inventory":
    case "get_owner_distress_profile":
    case "summarize_upcoming_auctions": {
      throw new Error(`NOT_IMPLEMENTED: ${toolName} pending SUMMIT-D`);
    }

    default:
      throw new Error(`unknown_tool: ${toolName}`);
  }
}

// ── HTTP handler — Cloudflare Pages Function entrypoint ─────────────────────
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const start = Date.now();

  // Auth
  const apiKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!apiKey.startsWith("biddeed_")) {
    return new Response(JSON.stringify({ error: "missing_or_malformed_api_key" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const auth = await resolveApiKey(env, apiKey);
  if (!auth) {
    return new Response(JSON.stringify({ error: "invalid_api_key" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Parse MCP request
  const body = await request.json() as { method: string; params?: Record<string, unknown> };
  const intent = request.headers.get("x-biddeed-intent");

  try {
    let result: unknown;

    if (body.method === "tools/list") {
      const tools = listTools(auth.tier, intent);
      result = { tools };
    } else if (body.method === "tools/call") {
      const { name, arguments: args } = body.params as { name: string; arguments: Record<string, unknown> };
      const toolDef = TOOLS.find((t) => t.name === name);
      if (!toolDef) throw new Error(`unknown_tool: ${name}`);
      if (TIER_RANK[toolDef.minTier] > TIER_RANK[auth.tier]) {
        throw new Error(`tier_too_low: ${name} requires ${toolDef.minTier}, you have ${auth.tier}`);
      }
      const raw = await execute(name, args ?? {}, env);
      // §3 — enforce contract before returning
      const compressed = enforceContract(name, raw, toolDef.maxOutputBytes);
      result = { content: [{ type: "text", text: compressed }] };
    } else {
      throw new Error(`unknown_method: ${body.method}`);
    }

    const latency = Date.now() - start;
    const bytes = JSON.stringify(result).length;
    ctx.waitUntil(logCall(env, {
      user_id: auth.user_id, tier: auth.tier, tool: body.params?.name as string ?? body.method,
      latency_ms: latency, bytes, error: null,
    }));

    return new Response(JSON.stringify({ jsonrpc: "2.0", result }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const latency = Date.now() - start;
    ctx.waitUntil(logCall(env, {
      user_id: auth.user_id, tier: auth.tier, tool: body.params?.name as string ?? body.method,
      latency_ms: latency, bytes: 0, error: message.slice(0, 200),
    }));
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message } }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
};
