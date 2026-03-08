'use client';
// src/components/chat/ChatPanel.tsx
// BidDeed.AI Chat — wired to /api/chat with Claude Sonnet SSE streaming

import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 **BidDeed.AI Intelligence** — Powered by Claude Sonnet

I have live access to Brevard County foreclosure data across 126 active properties.

Ask me anything:
• *"Show BID signals"* — active high-probability opportunities
• *"Next auction dates"* — upcoming Brevard auctions
• *"Analyze case 250697"* — full deal analysis
• *"Is 32937 a good market?"* — ZIP-level macro context
• *"Max bid formula explained"* — investment methodology`,
};

const SUGGESTED = [
  'Show BID signals',
  'Next auction dates',
  'REVIEW properties',
  'Pipeline status',
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    // Build history (exclude welcome + current empty assistant)
    const history = [...messages.slice(1), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const { text, error: chunkError } = JSON.parse(data);
            if (chunkError) throw new Error(chunkError);
            if (text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + text } : m
                )
              );
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `❌ Error: ${msg}\n\nCheck that ANTHROPIC_API_KEY is configured in Cloudflare Pages.` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-sm font-semibold text-white">BidDeed Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />}
          <button
            onClick={resetChat}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Reset chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-[#1E3A5F] text-white rounded-br-sm'
                  : 'bg-[#0f172a] text-slate-200 rounded-bl-sm border border-slate-800'
              )}
            >
              {m.content === '' && loading ? (
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : (
                <MessageContent content={m.content} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (only when no user messages yet) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-[#1E3A5F]/60 text-[#F59E0B] border border-[#F59E0B]/20 hover:border-[#F59E0B]/60 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-slate-800">
        <div className="flex items-end gap-2 bg-[#0f172a] rounded-xl border border-slate-700 focus-within:border-[#F59E0B]/50 px-3 py-2 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about properties, bids, market data…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none max-h-24 scrollbar-thin"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg transition-all',
              input.trim() && !loading
                ? 'bg-[#F59E0B] text-[#020617] hover:bg-[#F59E0B]/80'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5 text-center">
          Live Brevard data · Claude Sonnet · Enter to send
        </p>
      </div>
    </div>
  );
}

// Simple markdown-ish renderer
function MessageContent({ content }: { content: string }) {
  const parts = content.split('\n');
  return (
    <div className="space-y-1">
      {parts.map((line, i) => {
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <div key={i} className="flex gap-1"><span className="text-[#F59E0B] mt-0.5">•</span><span>{line.slice(2)}</span></div>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <div key={i} className="font-semibold text-white">{line.slice(2, -2)}</div>;
        }
        if (line.startsWith('# ')) {
          return <div key={i} className="font-bold text-[#F59E0B]">{line.slice(2)}</div>;
        }
        // inline bold
        const bolded = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        const italics = bolded.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return line ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: italics }} />
        ) : (
          <br key={i} />
        );
      })}
    </div>
  );
}
