// src/lib/claude/client.ts
// Client-side helper that calls our server-side /api/claude route.
// All requests stay same-origin; ANTHROPIC_API_KEY never leaves the server.

export interface ClaudeTextBlock {
  type: 'text';
  text: string;
}

export interface ClaudeImageBlock {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}

export type ClaudeContent = string | Array<ClaudeTextBlock | ClaudeImageBlock>;

export interface ClaudeMsg {
  role: 'user' | 'assistant';
  content: ClaudeContent;
}

export interface CompleteOptions {
  system?: string;
  messages: ClaudeMsg[];
  model?: string;
  maxTokens?: number;
}

export interface CompleteResult {
  text: string;
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
}

/**
 * Convert a data URL (data:image/jpeg;base64,...) into a Claude image block.
 */
export function dataUrlToImageBlock(dataUrl: string): ClaudeImageBlock {
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
  if (!match) throw new Error('Invalid data URL');
  return {
    type: 'image',
    source: { type: 'base64', media_type: match[1], data: match[2] },
  };
}

export async function complete(opts: CompleteOptions): Promise<CompleteResult> {
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: opts.system,
      messages: opts.messages,
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return await resp.json();
}
