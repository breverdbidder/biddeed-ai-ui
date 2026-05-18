// src/app/api/claude/route.ts
// Server-side proxy to Anthropic API.
// Keeps ANTHROPIC_API_KEY server-side; client never sees it.
// Provenance: Summit ZW-MAPS-MCP-D4D Phase 1.5 (Claude integration, May 18 2026)

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ClaudeRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: any }>;
  system?: string;
  model?: string;
  max_tokens?: number;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured on server' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as ClaudeRequest;
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const apiBody: Record<string, unknown> = {
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 1500,
      messages: body.messages,
    };
    if (body.system) apiBody.system = body.system;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(apiBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `Anthropic API ${resp.status}`, detail: errText.slice(0, 500) },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    const text = (data.content || [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n');

    return NextResponse.json({
      text,
      model: data.model,
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
      stop_reason: data.stop_reason,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
