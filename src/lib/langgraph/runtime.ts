'use client';

import { useMemo, useCallback } from 'react';
import { useExternalStoreRuntime } from '@assistant-ui/react';

// Types for LangGraph integration
interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  metadata?: {
    type?: 'text' | 'pipeline_progress' | 'property_card';
    stage?: string;
    progress?: number;
  };
}

interface ThreadState {
  messages: Message[];
  isRunning: boolean;
}

// Environment variables
const LANGGRAPH_API_URL = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || '';
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || '/api/chat';

/**
 * Custom hook for BidDeed.AI LangGraph runtime
 * Provides streaming support and tool call visualization
 */
export function useBidDeedRuntime() {
  const threadState: ThreadState = useMemo(
    () => ({
      messages: [],
      isRunning: false,
    }),
    []
  );

  const sendMessage = useCallback(async (message: string) => {
    try {
      // Check if LangGraph API is configured
      if (LANGGRAPH_API_URL) {
        // Use LangGraph streaming
        const response = await fetch(`${LANGGRAPH_API_URL}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            config: {
              configurable: {
                thread_id: crypto.randomUUID(),
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response;
      } else {
        // Fallback to regular chat API
        const response = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });

        return response;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

  // Create runtime with external store
  const runtime = useExternalStoreRuntime({
    messages: threadState.messages,
    isRunning: threadState.isRunning,
    onNew: async (message) => {
      if (message.content[0]?.type === 'text') {
        await sendMessage(message.content[0].text);
      }
    },
  });

  return runtime;
}

/**
 * Parse streaming response from LangGraph
 */
export async function* parseStreamResponse(
  response: Response
): AsyncGenerator<Message> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data as Message;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * Intent detection for chat messages
 * Determines if message should trigger pipeline
 */
export function detectIntent(message: string): {
  type: 'pipeline_single' | 'pipeline_batch' | 'chat';
  address?: string;
  auctionDate?: string;
} {
  const lowerMessage = message.toLowerCase();

  // Single property analysis
  const analyzeMatch = message.match(
    /analyze\s+(.+?)(?:\s+(?:in|at|for))?\s*$/i
  );
  if (analyzeMatch || lowerMessage.includes('analyze')) {
    return {
      type: 'pipeline_single',
      address: analyzeMatch?.[1]?.trim(),
    };
  }

  // Batch analysis
  if (
    lowerMessage.includes('batch') ||
    lowerMessage.includes('dec 17') ||
    lowerMessage.includes('dec 3') ||
    lowerMessage.includes('auction')
  ) {
    const dateMatch = message.match(/dec(?:ember)?\s*(\d{1,2})/i);
    return {
      type: 'pipeline_batch',
      auctionDate: dateMatch
        ? `Dec ${dateMatch[1]}, 2025`
        : undefined,
    };
  }

  return { type: 'chat' };
}
