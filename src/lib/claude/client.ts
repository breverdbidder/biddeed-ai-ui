// src/lib/claude/client.ts
// Calls Supabase Edge Function "claude-router" which routes ALL AI to Gemini 2.5 Flash.
//
// Architecture: Server-side routing via Supabase. 5-layer cost guards enforce:
//   Layer 1: Anthropic only allowed for vision (currently disabled at policy + budget)
//   Layer 2: Daily budget ceiling in biddeed_llm_budget table
//   Layer 3: Per-key monthly cap at provider console
//   Layer 4: Every call logged to llm_requests + llm_responses
//   Layer 5: v_biddeed_router_audit view for inspection
//
// Why not /api/claude? biddeed-ai-ui is static export to Cloudflare Pages,
// Next.js API routes don't run. Edge function works regardless of frontend deploy.

import { supabase } from '@/lib/supabase/client';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: any;
}

export interface ClaudeResponse {
  text: string;
  model?: string;
  provider?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  latency_ms?: number;
  routing_tier?: string;
  has_images?: boolean;
  request_id?: number;
}

export async function askClaude(
  messages: ClaudeMessage[],
  system?: string,
  options?: { maxTokens?: number },
): Promise<ClaudeResponse> {
  const { data, error } = await supabase.functions.invoke('claude-router', {
    body: {
      messages,
      system,
      max_tokens: options?.maxTokens ?? 1500,
    },
  });
  if (error) throw new Error(error.message || 'claude-router invoke failed');
  if (data && (data as any).error) {
    throw new Error((data as any).message || (data as any).error);
  }
  return data as ClaudeResponse;
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
