// src/app/api/claude/route.ts
// Server-side Anthropic API proxy. Keeps ANTHROPIC_API_KEY off the client.
// Provenance: Summit ZW-MAPS-MCP-D4D Phase 1.5 — Claude integration

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      >;
}

interface ClaudeRequest {
  system?: string;
  messages: ClaudeMessage[];
  model?: string;
  max_tokens?: number;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured on server' },
      { status: 500 },
    );
  }

  let body: ClaudeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  try {
    const resp = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model ?? DEFAULT_MODEL,
        max_tokens: body.max_tokens ?? 1024,
        system: body.system,
        messages: body.messages,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: 'Anthropic API error', status: resp.status, detail: errText },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    const text =
      data.content?.filter((c: { type: string }) => c.type === 'text')
        .map((c: { text: string }) => c.text)
        .join('\n') ?? '';

    return NextResponse.json({
      text,
      usage: data.usage,
      model: data.model,
      stop_reason: data.stop_reason,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Network error calling Anthropic', detail: String(err) },
      { status: 502 },
    );
  }
}
