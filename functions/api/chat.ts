// functions/api/chat.ts
// BidDeed.AI Chat API - Cloudflare Pages Function
// Claude Sonnet SSE + Supabase intent routing + ZIP macro context

interface Env {
  ANTHROPIC_API_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUPABASE_URL = 'https://mocerqjnksmhcjzxrewo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2VycWpua3NtaGNqenhyZXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzI1MjYsImV4cCI6MjA4MDEwODUyNn0.ySFJIOngWWB0aqYra4PoGFuqcbdHOx1ZV6T9-klKQDw';

const SYSTEM_PROMPT = `You are BidDeed.AI — the most advanced foreclosure auction intelligence system in Florida. You combine macro market analysis (Reventure-style Zillow/Census data) with micro auction intelligence (live foreclosure data from 46 FL counties).

CORE FORMULA:
MAX BID = (ARV × 70%) − Repairs − $10,000 − MIN($25,000, ARV × 15%)
BID: bid/judgment ratio ≥ 75% | REVIEW: 60-74% | SKIP: <60%
ARV = assessed_value × 1.18 (enriched) or × 1.22 (unenriched)
Repairs = MIN(sqft × $22, $55,000)

LIEN PRIORITY RULES (FL law):
- HOA forecloses → senior mortgage SURVIVES — ALWAYS SKIP these
- Tax deed auction → ALL junior liens wiped (clean title)
- Foreclosure auction → only junior liens wiped, senior mortgages survive
- BECA court confirms final judgment amounts
- 10-day redemption period after Certificate of Sale

COMPETITIVE INTEL:
- PropertyOnion: $575/mo (includes $50/property lien searches) — 96 KPIs
- Reventure.app: $49/mo — macro ZIP trends only, no auction data
- BidDeed.AI: 298 KPIs, FREE AcclaimWeb lien search, XGBoost ML, NLP chat

TARGET MTR ZIPS (Mid-Term Rental):
- 32937 Satellite Beach: income $78K, vacancy 5.3%, strong MTR demand
- 32940 Melbourne/Viera: income $82K, vacancy 4.9%, premium market
- 32953 Merritt Island: income $78K, vacancy 5.5%, coastal premium
- 32903 Indialantic: income $81K, vacancy 5.1%, high barrier to entry

Respond with precision. For specific properties, use the live data provided. Never hallucinate values.`;

async function supabaseQuery(table: string, params: Record<string, string>, serviceKey: string) {
  const url = new URL(\`\${SUPABASE_URL}/rest/v1/\${table}\`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: {
      'apikey': serviceKey || ANON_KEY,
      'Authorization': \`Bearer \${serviceKey || ANON_KEY}\`,
    }
  });
  return r.ok ? r.json() : null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { messages, propertyContext, zipContext } = await context.request.json() as {
    messages: Message[];
    propertyContext?: Record<string, unknown>;
    zipContext?: Record<string, unknown>;
  };

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const svcKey = context.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY;
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  let dbContext = '';

  // Intent routing
  try {
    if (lastMsg.includes('bid signal') || (lastMsg.includes('show') && lastMsg.includes('bid'))) {
      const data = await supabaseQuery('multi_county_auctions', {
        'select': 'case_number,property_address,city,sale_date,judgment_amount,max_bid_calculated,ml_probability,recommendation',
        'county': 'eq.brevard',
        'recommendation': 'eq.BID',
        'order': 'sale_date.asc',
        'limit': '5'
      }, svcKey);
      if (data?.length) dbContext += \`\n\nLIVE BID SIGNALS (\${data.length}):\n\${JSON.stringify(data, null, 2)}\`;
    }

    else if (lastMsg.includes('next auction') || lastMsg.includes('upcoming') || lastMsg.includes('calendar')) {
      const today = new Date().toISOString().split('T')[0];
      const data = await supabaseQuery('multi_county_auctions', {
        'select': 'sale_date,case_number,property_address,city,sale_type,recommendation,max_bid_calculated,judgment_amount',
        'county': 'eq.brevard',
        'sale_date': \`gte.\${today}\`,
        'order': 'sale_date.asc',
        'limit': '10'
      }, svcKey);
      if (data?.length) dbContext += \`\n\nUPCOMING BREVARD AUCTIONS:\n\${JSON.stringify(data, null, 2)}\`;
    }

    else if (lastMsg.includes('review') && !lastMsg.includes('report')) {
      const data = await supabaseQuery('multi_county_auctions', {
        'select': 'case_number,property_address,city,sale_date,max_bid_calculated,ml_probability,judgment_amount,recommendation',
        'county': 'eq.brevard',
        'recommendation': 'eq.REVIEW',
        'order': 'sale_date.asc',
        'limit': '5'
      }, svcKey);
      if (data?.length) dbContext += \`\n\nREVIEW PROPERTIES:\n\${JSON.stringify(data, null, 2)}\`;
    }

    else if (lastMsg.includes('pipeline') || lastMsg.includes('status') || lastMsg.includes('how many')) {
      const data = await supabaseQuery('multi_county_auctions', {
        'select': 'recommendation,count',
        'county': 'eq.brevard',
      }, svcKey);
      const total = await supabaseQuery('multi_county_auctions', {
        'select': 'count',
        'county': 'eq.brevard',
      }, svcKey);
      if (total) dbContext += \`\n\nBREVARD PIPELINE STATUS: \${JSON.stringify(total)} total properties\`;
    }

    // Case number or address lookup
    const caseMatch = lastMsg.match(/\b(\d{6})\b/);
    const addrMatch = lastMsg.match(/(\d+\s+[\w\s]+(st|ave|dr|blvd|rd|ln|ct|pl|way|hwy|highway))/i);
    if (caseMatch || addrMatch) {
      const param = caseMatch
        ? { 'case_number': \`ilike.*\${caseMatch[1]}*\` }
        : { 'property_address': \`ilike.*\${addrMatch![0].substring(0, 15)}*\` };
      const data = await supabaseQuery('multi_county_auctions', {
        'select': '*',
        'county': 'eq.brevard',
        ...param,
        'limit': '1'
      }, svcKey);
      if (data?.[0]) dbContext += \`\n\nPROPERTY DATA:\n\${JSON.stringify(data[0], null, 2)}\`;
    }
  } catch (e) {
    // Supabase errors are non-fatal
  }

  if (propertyContext) dbContext += \`\n\nSELECTED PROPERTY (from map):\n\${JSON.stringify(propertyContext)}\`;
  if (zipContext) dbContext += \`\n\nZIP MACRO DATA:\n\${JSON.stringify(zipContext)}\`;

  // Stream from Anthropic
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      stream: true,
      system: SYSTEM_PROMPT + dbContext,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(\`data: \${JSON.stringify({ error: err })}\n\n\`, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }

  // Transform Anthropic SSE → simple text chunks
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  (async () => {
    const reader = anthropicRes.body!.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                await writer.write(encoder.encode(\`data: \${JSON.stringify({ text: json.delta.text })}\n\n\`));
              }
            } catch {}
          }
        }
      }
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
