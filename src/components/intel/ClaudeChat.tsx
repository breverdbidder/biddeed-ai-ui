'use client';
// src/components/intel/ClaudeChat.tsx
// Per-property chat with Claude. Persists thread to Supabase property_threads.

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { askClaude, type ClaudeMessage } from '@/lib/claude/client';
import { buildPropertyPrompt } from '@/lib/claude/prompts';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface ThreadMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  photoIds?: string[];
  created_at?: string;
}

interface ClaudeChatProps {
  auction: AuctionWithIntel;
  fieldNote?: string | null;
}

const QUICK_ACTIONS = [
  { label: '📸 Analyze photos', text: 'Analyze the field photos I uploaded for this property' },
  { label: '🎯 Should I bid?', text: 'Based on everything you know, should I bid on this property?' },
  { label: '🔒 Lien checklist', text: 'What lien checks are critical before bidding on this property?' },
  { label: '🔨 Repair estimate', text: 'Estimate repair costs given what we know about this property' },
];

export function ClaudeChat({ auction, fieldNote }: ClaudeChatProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load thread from Supabase
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('property_threads')
          .select('id, role, content, photo_ids, created_at')
          .eq('property_uuid', auction.id)
          .eq('thread_type', 'property')
          .order('created_at', { ascending: true });
        if (cancelled) return;
        if (error) throw error;
        setMessages(
          (data || []).map((d: any) => ({
            id: d.id,
            role: d.role,
            content: d.content,
            photoIds: d.photo_ids,
            created_at: d.created_at,
          })),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auction.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, loading]);

  const persistMessage = async (msg: ThreadMessage, model?: string, inTok?: number, outTok?: number) => {
    try {
      await supabase.from('property_threads').insert({
        property_uuid: auction.id,
        role: msg.role,
        content: msg.content,
        photo_ids: msg.photoIds || [],
        thread_type: 'property',
        model: model || null,
        input_tokens: inTok || null,
        output_tokens: outTok || null,
      });
    } catch {
      // Non-fatal
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    const userMsg: ThreadMessage = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    await persistMessage(userMsg);

    try {
      const apiMessages: ClaudeMessage[] = [...messages, userMsg].slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await askClaude(apiMessages, buildPropertyPrompt(auction, fieldNote));
      const assistMsg: ThreadMessage = { role: 'assistant', content: reply.text };
      setMessages((m) => [...m, assistMsg]);
      await persistMessage(assistMsg, reply.model, reply.input_tokens, reply.output_tokens);
    } catch (e) {
      const errMsg: ThreadMessage = {
        role: 'assistant',
        content: '⚠️ ' + (e instanceof Error ? e.message : 'Unknown error'),
      };
      setMessages((m) => [...m, errMsg]);
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-3 border-l-2 border-amber-500">
            <div className="text-[9px] mono text-amber-400 uppercase tracking-wider mb-1">🤖 Claude · Field Analyst</div>
            <div className="text-xs leading-relaxed text-slate-200">
              Ready to help with <strong className="text-amber-400">{auction.property_address}</strong>. I have full context: max bid, ratio, ML score
              {fieldNote ? ", and yesterday's D4D field findings" : ''}.
              <br />
              <br />
              Tap a quick action or ask anything.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={m.id || i}
            className={cn(
              'rounded-lg p-3',
              m.role === 'user' ? 'bg-sky-900/40 ml-6 border-l-2 border-sky-500' : 'bg-slate-800 mr-6 border-l-2 border-amber-500',
            )}
          >
            <div className={cn('text-[9px] mono uppercase tracking-wider mb-1 flex items-center gap-1', m.role === 'user' ? 'text-sky-300' : 'text-amber-400')}>
              {m.role === 'user' ? <UserIcon className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              {m.role === 'user' ? 'You' : 'Claude'}
            </div>
            <div className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="bg-slate-800 mr-6 rounded-lg p-3 border-l-2 border-amber-500">
            <div className="text-[9px] mono text-amber-400 uppercase mb-1 flex items-center gap-1">
              <Bot className="w-3 h-3" /> Claude
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-[11px] text-red-300">⚠️ {error}</div>
        )}
      </div>

      <div className="border-t border-slate-800 p-2.5 bg-slate-900 flex-shrink-0">
        <div className="flex gap-1 mb-2 overflow-x-auto">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => send(qa.text)}
              disabled={loading}
              className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] mono whitespace-nowrap border border-slate-700 disabled:opacity-50 flex-shrink-0"
            >
              {qa.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask Claude about this property..."
            disabled={loading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
