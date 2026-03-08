'use client';
// src/components/chat/ChatPanel.tsx
// BidDeed.AI Chat — native React UI (LangGraph in v2)

import { useState, useRef, useEffect } from 'react';
import { Mic, Paperclip, Send, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '👋 Welcome to BidDeed.AI! I\'m your foreclosure intelligence assistant powered by The Everest Ascent™ pipeline.\n\nI can help you:\n• Analyze properties from upcoming auctions\n• Run the 12-stage intelligence pipeline\n• Generate investment reports\n• Explain ML predictions and decisions\n\nWhat would you like to explore today?',
};

const SUGGESTED = ['Analyze next auction', 'Show BID signals', 'Mar 19 tax deeds', 'Pipeline status'];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Received: "' + text + '". LangGraph pipeline integration coming in v2. Explore the live property grid on the right \u2192',
    }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800 flex-shrink-0">
        <Zap className="w-5 h-5 text-amber-400" />
        <span className="font-semibold text-white font-display">BidDeed.AI Chat</span>
        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">LangGraph v2</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm',
              msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
            )}>
              {msg.role === 'assistant' ? <Zap className="w-4 h-4 text-white" /> : 'A'}
            </div>
            <div className={cn(
              'rounded-2xl px-4 py-3 max-w-[85%] text-sm whitespace-pre-wrap',
              msg.role === 'assistant' ? 'bg-slate-800 text-slate-100 rounded-tl-md' : 'bg-amber-500 text-black rounded-tr-md font-medium'
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-md px-4 py-4 flex gap-1">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-2 border-t border-slate-700/50 flex-shrink-0 flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => send(s)}
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-full border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 transition-colors">
            {s}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-amber-500/50 transition-colors">
          <button className="p-3"><Paperclip className="w-5 h-5 text-slate-500" /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask BidDeed.AI..."
            className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 py-3 text-sm"
          />
          <button onClick={() => setIsListening(!isListening)}
            className={cn('p-3 transition-colors', isListening ? 'text-red-400 animate-pulse' : 'text-slate-500 hover:text-slate-300')}>
            <Mic className="w-5 h-5" />
          </button>
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="p-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 rounded-r-xl transition-colors">
            <Send className="w-5 h-5 text-black" />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">Enter to send</p>
      </div>
    </div>
  );
}
