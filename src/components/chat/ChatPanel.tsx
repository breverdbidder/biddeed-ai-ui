'use client';

import { useState } from 'react';
import {
  Thread,
  ThreadMessages,
  ThreadScrollAnchor,
  Composer,
  ComposerInput,
  ComposerSend,
} from '@assistant-ui/react';
import { Mic, Paperclip, Send, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTED_ACTIONS = [
  'Analyze Dec 17 batch',
  'Show BID recommendations',
  'Calendar',
  'Latest reports',
];

export function ChatPanel() {
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-white font-display">
            BidDeed.AI Chat
          </span>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
            LangGraph Connected
          </span>
        </div>
      </div>

      {/* Messages */}
      <Thread className="flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
              <p className="text-sm">
                👋 Welcome to BidDeed.AI! I'm your foreclosure intelligence assistant 
                powered by The Everest Ascent™ pipeline.
              </p>
              <p className="text-sm mt-2">
                I can help you:
              </p>
              <ul className="text-sm mt-1 space-y-1 text-slate-300">
                <li>• Analyze properties from upcoming auctions</li>
                <li>• Run the 12-stage intelligence pipeline</li>
                <li>• Generate investment reports</li>
                <li>• Explain ML predictions and decisions</li>
              </ul>
              <p className="text-sm mt-2 text-slate-400">
                What would you like to explore today?
              </p>
            </div>
          </div>

          <ThreadMessages />
          <ThreadScrollAnchor />
        </div>
      </Thread>

      {/* Suggested Actions */}
      <div className="px-4 py-2 border-t border-slate-700/50">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_ACTIONS.map((action) => (
            <button
              key={action}
              className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded-full border border-slate-700 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <Composer className="flex items-center gap-2 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-blue-500 transition-colors">
          <button className="p-3 hover:bg-slate-700 rounded-l-xl transition-colors">
            <Paperclip className="w-5 h-5 text-slate-400" />
          </button>
          
          <ComposerInput
            placeholder="Ask BidDeed.AI..."
            className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-slate-500 py-3"
          />
          
          <button
            onClick={() => setIsListening(!isListening)}
            className={cn(
              'p-3 transition-colors',
              isListening
                ? 'text-red-400 animate-pulse'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <ComposerSend className="p-3 bg-blue-600 hover:bg-blue-500 rounded-r-xl transition-colors">
            <Send className="w-5 h-5 text-white" />
          </ComposerSend>
        </Composer>
        
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
