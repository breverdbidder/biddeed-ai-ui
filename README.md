# BidDeed.AI UI

> Agentic AI Ecosystem for Foreclosure Intelligence

## Overview

BidDeed.AI is a split-screen AI interface for foreclosure auction analysis, featuring:

- **Chat Panel**: Natural language interface with LangGraph integration
- **Intelligence Panel**: Real-time pipeline progress, agent activity, property cards
- **12-Stage Pipeline**: The Everest Ascent™ methodology
- **9 AI Agents**: Discovery → Analysis → Execution

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: @assistant-ui/react + shadcn/ui
- **Styling**: Tailwind CSS 4.0
- **State**: Zustand + React Query
- **Database**: Supabase
- **Deployment**: Cloudflare Pages

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://mocerqjnksmhcjzxrewo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_LANGGRAPH_API_URL=your_langgraph_url
NEXT_PUBLIC_CHAT_API_URL=/api/chat
```

## Component Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main page with runtime provider
│   └── globals.css         # Global styles
├── components/
│   ├── layout/
│   │   ├── SplitScreenLayout.tsx
│   │   ├── Header.tsx
│   │   └── IntelligencePanel.tsx
│   ├── chat/
│   │   └── ChatPanel.tsx
│   ├── property/
│   │   ├── PropertyCard.tsx
│   │   └── DecisionBadge.tsx
│   ├── pipeline/
│   │   └── PipelineProgress.tsx
│   ├── agents/
│   │   └── AgentActivityPanel.tsx
│   └── ui/
│       └── tabs.tsx
└── lib/
    ├── langgraph/
    │   └── runtime.ts
    ├── supabase/
    │   └── client.ts
    └── utils.ts
```

## Design System

### Colors

- **Primary**: Trust Blue (#3b82f6)
- **BID**: Green (#22c55e)
- **REVIEW**: Amber (#f59e0b)
- **SKIP**: Red (#ef4444)
- **Background**: Deep Navy (#0f172a)

### Typography

- **Display**: Plus Jakarta Sans
- **Body**: Geist
- **Mono**: JetBrains Mono

## API Sources

This UI integrates with the following from the API Mega Library:

- **AI APIs**: 1,208 endpoints
- **Real Estate APIs**: 851 endpoints
- **MCP Servers**: 131 servers
- **Agent APIs**: 697 endpoints

## Deployment

```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .next
```

## License

Proprietary - Everest Capital USA

---

**Built by Ariel Shapira | Everest Capital USA**
