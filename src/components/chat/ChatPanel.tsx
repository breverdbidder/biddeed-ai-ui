'use client';
// src/components/chat/ChatPanel.tsx
// CP-13: BidDeed.AI Chat — wired to client-side intelligence engine
// Queries LIVE Supabase data loaded by useAuctions hook
// PropertyOnion has ZERO NLP chat — this is BidDeed.AI EXCLUSIVE

import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuctions } from '@/hooks/useAuctions';
import { processQuery } from '@/lib/chat-intelligence';
import type { AuctionWithIntel } from '@/lib/chat-intelligence';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 **BidDeed.AI Intelligence** — Live Data Chat

I have **real-time access** to Brevard County foreclosure data. Every answer comes from live Supabase queries — not canned responses.

Ask me anything:
• *"Show BID signals"* — active high-probability opportunities
• *"Next auction dates"* — upcoming Brevard auctions
• *"Analyze case 250697"* — full deal analysis
• *"32937 market"* — ZIP-level macro context
• *"Summary"* — portfolio overview
• *"Max bid formula"* — investment methodology`,
};

const SUGGESTED = [
  'Show BID signals',
  'Next auction dates',
  'Summary',
  'Max bid formula',
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Live auction data from Supabase
  const { enriched } = useAuctions();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update welcome message with live count
  useEffect(() => {
    if (enriched.length > 0) {
      setMessages(prev => prev.map(m =>
        m.id === 'welcome'
          ? { ...m, content: m.content.replace(/foreclosure data\./, `foreclosure data across **${enriched.length} active properties**.`) }
          : m
      ));
    }
  }, [enriched.length]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate brief "thinking" delay for natural feel
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

    // Query the intelligence engine with live data
    const result = processQuery(text, enriched as AuctionWithIntel[]);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.text,
    };

    setMessages(prev => [...prev, assistantMsg]);
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME]);
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-sm font-semibold text-white">BidDeed Intelligence</span>
          {enriched.length > 0 && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-mono">
              LIVE · {enriched.length}
            </span>
          )}
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
              <MessageContent content={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0f172a] rounded-xl px-3 py-2 border border-slate-800">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
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
          Live Brevard data · {enriched.length} properties · Enter to send
        </p>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split('\n');
  return (
    <div className="space-y-1">
      {parts.map((line, i) => {
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <div key={i} className="flex gap-1"><span className="text-[#F59E0B] mt-0.5">•</span><span>{formatInline(line.slice(2))}</span></div>;
        }
        if (line.startsWith('# ')) {
          return <div key={i} className="font-bold text-[#F59E0B] text-base mt-1">{line.slice(2)}</div>;
        }
        const formatted = formatInline(line);
        return line ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
        ) : (
          <br key={i} />
        );
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-slate-400">$1</em>');
}
