// src/lib/claude/client.ts
// Client-side helper that calls /api/claude proxy.

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: any;
}

export interface ClaudeResponse {
  text: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  stop_reason?: string;
}

export async function askClaude(
  messages: ClaudeMessage[],
  system?: string,
  options?: { model?: string; maxTokens?: number },
): Promise<ClaudeResponse> {
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      system,
      model: options?.model,
      max_tokens: options?.maxTokens,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Claude API failed');
  }
  return (await resp.json()) as ClaudeResponse;
}

export function buildImageContent(base64DataUrl: string) {
  const match = base64DataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid base64 image data URL');
  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: match[1],
      data: match[2],
    },
  };
}
