# BidDeed.AI UI/UX Redesign — Design Specification

> **Superpowers Context:** This design was brainstormed between Ariel Shapira (Product Owner) and Claude AI (AI Architect) on March 9, 2026. It is ready for implementation via `superpowers:writing-plans` → `superpowers:subagent-driven-development`.

**Goal:** Build a production-ready UI for BidDeed.AI's public launch — a chat-first foreclosure auction intelligence platform serving individual investors, teams/firms, and agents/brokers across 46 Florida counties.

**Architecture:** Chat-as-Operating-System. No traditional navigation. Left panel is always the NLP chat. Right panel is a dynamic canvas rendering contextual artifacts. Every user action flows through the chat — either typed, clicked (quick-action chips), or triggered via slash commands.

**Tech Stack:** React (Next.js on Cloudflare Pages), Tailwind CSS, Supabase (backend), LiteLLM + LangGraph (AI pipeline). House brand: Navy #1E3A5F, Orange #F59E0B, Inter font, bg #020617 (slate-950).

---

## 1. Design Philosophy

### Core Principle: Chat IS the Interface
- The left panel (chat) is ALWAYS visible
- The right panel (canvas) renders whatever the conversation demands
- Users never "navigate" — they talk, click chips, or use slash commands
- Every click on the canvas auto-populates the chat, teaching users the command vocabulary passively
- The system remembers context: "what liens does this have?" knows what "this" refers to

### Design Benchmarks
- **Claude.ai:** Clean split-screen, conversational flow produces artifacts on the right
- **Manus AI:** Agent workspace feel — users see the AI working through pipeline stages

### When to Use Which Mode
- **Claude.ai mode:** User asks a question → artifact renders (static result)
- **Manus AI mode:** System is running analysis → pipeline stages animate (active process)
- Transition between modes must be seamless — no page reload, no jarring switch

### Brand Application
- **Background:** #020617 (slate-950) — dark, professional
- **Primary:** #1E3A5F (navy) — headers, borders, structural elements
- **Accent/CTA:** #F59E0B (orange) — buttons, BID badges, active states, highlights
- **Typography:** Inter — all weights available
- **Verdict Colors:**
  - BID: #F59E0B (orange) with dark text
  - REVIEW: #3B82F6 (blue-500)
  - SKIP: #EF4444 (red-500) muted opacity

---

## 2. Layout Architecture

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────────┐
│  BidDeed.AI logo          [user avatar] [settings]  │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   CHAT       │         CANVAS                       │
│   PANEL      │         (Dynamic Artifact)           │
│              │                                      │
│  [messages]  │  Renders: Calendar, Cards, Deep      │
│              │  Dive, Pipeline, Portfolio, Reports   │
│              │                                      │
│              │                                      │
├──────────────┤                                      │
│ [chips]      │                                      │
│ [/ input  ]  │                                      │
└──────────────┴──────────────────────────────────────┘
```
- Chat panel: ~35% width (min 360px, max 480px), resizable handle
- Canvas panel: remaining width
- Chat panel has subtle navy border-right separator

### Tablet (768-1023px)
- Same split but chat panel narrower (~30%)
- Canvas takes priority for data density

### Mobile (<768px)
- Single panel view
- Default: Chat full screen
- When artifact renders: Canvas takes over full screen with "← Back to chat" swipe/button
- Bottom sheet option for quick property info without leaving chat

---

## 3. Chat Panel Design

### Welcome State (Empty Chat)
```
┌──────────────┐
│              │
│  🏛️          │
│  Welcome to  │
│  BidDeed.AI  │
│              │
│  I track     │
│  foreclosure │
│  auctions    │
│  across 46   │
│  FL counties │
│              │
│  ┌──────────┐│
│  │ Upcoming ││
│  │ Auctions ││
│  └──────────┘│
│  ┌──────────┐│
│  │ Analyze  ││
│  │ Property ││
│  └──────────┘│
│  ┌──────────┐│
│  │ How This ││
│  │  Works   ││
│  └──────────┘│
│              │
│ [/ type...  ]│
└──────────────┘
```
- Suggested prompts are large, tappable cards (not tiny text links)
- Cards have subtle orange left border and hover glow
- Welcome message is brief — no feature walls or onboarding tours

### Chat Messages
- User messages: Right-aligned, navy background (#1E3A5F), white text
- AI messages: Left-aligned, transparent/dark background, white text
- AI messages that trigger artifacts show a small "→ [Artifact Name]" link tag
- Typing indicator: Three-dot animation with orange dots

### Quick-Action Chips
- Persistent above input field (don't scroll away)
- Context-sensitive: Change based on what's on the canvas
  - Default: `Upcoming Auctions` · `Analyze Property` · `My Watchlist`
  - Viewing calendar: `This Week` · `Brevard County` · `All BID Properties`
  - Viewing deep dive: `Add to Watchlist` · `Generate Report` · `Compare Similar`
  - Viewing card grid: `Sort by ML Score` · `Filter BID Only` · `Batch Analyze`
- Design: Pill-shaped, navy border, transparent bg, orange on hover/active
- Clicking a chip auto-fills and sends the chat message

### Slash Command Palette
- Triggered when user types `/` in the input
- Dropdown appears above input showing available commands:
  ```
  /auction [county] [date]     — View auction calendar
  /analyze [case# or address]  — Deep dive on a property
  /portfolio                   — View your portfolio
  /watchlist                   — Manage watchlist
  /compare [case#] [case#]     — Compare properties side by side
  /report [case#]              — Generate downloadable report
  /counties                    — List available counties
  /help                        — Show all commands
  ```
- Commands autocomplete as user types
- Same queries work in natural language — commands are shortcuts, never required

### Chat Input
- Dark input bar, subtle navy border, orange focus ring
- Placeholder: "Ask about auctions, properties, or type / for commands..."
- Send button: Orange arrow icon
- Attach button: For uploading property photos or documents (future)

---

## 4. Artifact Type 1: Auction Calendar

**Priority:** #1 (first thing users see)
**Triggered by:** "upcoming auctions", "what's coming up", "auction calendar", `/auction`

### Layout
```
┌──────────────────────────────────────────┐
│  UPCOMING AUCTIONS           [Mar 2026]  │
│  ◀ ══════════╤═══════════════════ ▶      │
│     Mon 9    │    Tue 10    │   Wed 11   │
│              │              │            │
│  ┌────────┐  │ ┌────────┐  │            │
│  │Brevard │  │ │Duval   │  │  No        │
│  │23 props│  │ │41 props│  │  auctions  │
│  │$4.2M   │  │ │$8.1M   │  │            │
│  │■■■□□   │  │ │■■□□□   │  │            │
│  └────────┘  │ └────────┘  │            │
│  ┌────────┐  │ ┌────────┐  │            │
│  │Orange  │  │ │Volusia │  │            │
│  │12 props│  │ │18 props│  │            │
│  └────────┘  │ └────────┘  │            │
└──────────────────────────────────────────┘
```

### Design Details
- **Timeline:** Horizontal scroll, current day highlighted with orange ring
- **Auction cards:** Dark card (slate-800) with navy header showing county name
- **Stats per card:** Property count, total judgment value, pre-analysis progress bar (■ = analyzed, □ = pending)
- **Today's auctions:** Orange left border + subtle glow
- **Tomorrow:** Slightly brighter than future dates
- **Past auctions:** Dimmed, show results if available (sold count, total revenue)
- **Click interaction:** Clicking a county card transitions canvas to Property Card Grid for that auction

### Multi-County Value Proposition
- All 46 counties visible in one view
- Ability to filter by region (Central FL, South FL, etc.)
- "NEW" badge on counties where BidDeed just expanded coverage

---

## 5. Artifact Type 2: Property Deep Dive

**Priority:** #2 (the core product experience)
**Triggered by:** "analyze [case#]", clicking a property card, `/analyze`

### Layout: Scrollable Page with Sticky Tab Nav
```
┌──────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐ │
│ │ 📸 BCPAO Photo    2840 Coral Way     │ │
│ │                   Melbourne, FL      │ │
│ │                   Case: 05-2024-1234 │ │
│ │                   Auction: Mar 12    │ │
│ │    ┌─────────────────────┐           │ │
│ │    │  BID   Max: $142K   │           │ │
│ │    └─────────────────────┘           │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [The Math] [Liens] [Tax] [Area] [ML] [?] │ ← sticky tab nav
│ ─────────────────────────────────────── │
│                                          │
│  § THE MATH                              │
│  ARV: $245,000                           │
│  Repairs: -$35,000                       │
│  Safety: -$10,000                        │
│  Profit: -MIN($25K, 15% ARV)            │
│  ═══════════════                         │
│  Max Bid: $142,250                       │
│  Judgment: $185,000                      │
│  Bid/Judgment: 76.9% → BID ✓            │
│                                          │
│  § LIEN STACK                            │
│  ┌─ 1st Mortgage (Chase) ────── 🟢 ──┐ │
│  │  $165,000  — WIPED IN SALE         │ │
│  └────────────────────────────────────┘ │
│  ┌─ HOA Lien (Coral Bay) ────── 🔴 ──┐ │
│  │  $12,400   — SURVIVES (senior)     │ │
│  └────────────────────────────────────┘ │
│  ┌─ Tax Cert 2023 ──────────── 🟡 ──┐ │
│  │  $3,200    — REVIEW REQUIRED       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  § NEIGHBORHOOD                          │
│  Median Income: $78,200                  │
│  Vacancy Rate: 5.2%                      │
│  Comparable Sales: [mini chart]          │
│                                          │
│  § ML PREDICTION                         │
│  Third-Party Purchase: 72%               │
│  [═══════════════════░░░░░░░]            │
│  Predicted Sale Range: $155K-$180K       │
│  Confidence: High                        │
│                                          │
│  § DECISION LOG                          │
│  "BID recommended: Bid/judgment ratio    │
│   76.9% exceeds 75% threshold. No       │
│   surviving senior liens. Strong         │
│   neighborhood metrics."                 │
│                                          │
└──────────────────────────────────────────┘
```

### Design Details

**Hero Section (top, always visible):**
- BCPAO photo (left) with address + case info (right)
- Verdict badge: Large, colored (orange BID, blue REVIEW, red SKIP)
- Max bid amount next to verdict — the answer is FIRST
- Auction date with countdown ("in 3 days")

**Sticky Tab Nav:**
- Tabs: The Math | Liens | Tax | Area | ML | Decision
- Sticky below hero on scroll
- Active tab highlighted with orange underline
- Clicking tab smooth-scrolls to section
- Tab highlights automatically as user scrolls through sections
- On mobile: horizontally scrollable tab bar

**Section: The Math**
- Visual formula breakdown, not just numbers
- Each line item has a subtle explanation tooltip
- Final max bid in large orange text
- Bid/judgment ratio with color indicator and threshold labels

**Section: Lien Stack**
- THIS IS THE DIFFERENTIATOR — make it visually unmistakable
- Each lien is a card with priority position (1st, 2nd, 3rd...)
- Color-coded status: 🟢 Green = wiped in sale, 🔴 Red = survives, 🟡 Yellow = review needed
- Lien holder name, amount, and plain-English explanation
- Visual hierarchy showing priority order (stacked, with the surviving liens visually "floating above")

**Section: Tax & Title**
- Tax certificate status table
- Delinquent tax amounts with years
- Title issues flagged in red

**Section: Neighborhood (Area)**
- Median income, vacancy rate, population
- Mini comp sales chart (last 6 months, sparkline style)
- Zip code with quality indicators

**Section: ML Prediction**
- Third-party purchase probability as horizontal gauge bar
- Predicted sale price range as a range indicator
- Confidence level badge
- Brief model explanation for transparency

**Section: Decision Log**
- Plain-English explanation of WHY the system recommended BID/REVIEW/SKIP
- Bullet points of key factors
- This builds trust — users see reasoning, not just a verdict

---

## 6. Artifact Type 3: Property Card Grid

**Priority:** #3 (browsing an auction's properties)
**Triggered by:** Clicking an auction date, "show [county] auction [date]", `/auction brevard march 12`

### Layout
```
┌──────────────────────────────────────────┐
│  BREVARD COUNTY — Mar 12, 2026           │
│  23 properties | $4.2M total judgment    │
│                                          │
│  [All] [BID (4)] [REVIEW (3)] [SKIP (16)]│
│  Sort: [ML Score ▼] [Judgment] [Address] │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 📸      │ │ 📸      │ │ 📸      │   │
│  │ 2840    │ │ 1521    │ │ 4102    │   │
│  │ Coral   │ │ Oak St  │ │ Palm    │   │
│  │         │ │         │ │         │   │
│  │ $185K   │ │ $92K    │ │ $245K   │   │
│  │ ML: 72% │ │ ML: 41% │ │ ML: 88% │   │
│  │ ■ BID   │ │ ■ SKIP  │ │ ■ BID   │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ...     │ │ ...     │ │ ...     │   │
└──────────────────────────────────────────┘
```

### Design Details
- **Cards:** Dark card (slate-800), BCPAO photo thumbnail at top
- **Verdict badge:** Bottom of card, color-coded, prominent
- **Key stats:** Judgment amount, ML score, verdict
- **Filter tabs:** BID/REVIEW/SKIP with count badges
- **Sort options:** ML Score (default), Judgment Amount, Address, Bid/Judgment Ratio
- **Click:** Opens Property Deep Dive for that property
- **Batch actions:** "Analyze All" button for properties not yet processed
- **Grid:** 3 columns on desktop, 2 on tablet, 1 on mobile (stacked cards)

---

## 7. Artifact Type 4: Pipeline Progress

**Priority:** #4 (trust-building, Manus AI feel)
**Triggered by:** When system is actively analyzing a property or batch

### Layout
```
┌──────────────────────────────────────────┐
│  ANALYZING: 2840 Coral Way               │
│                                          │
│  ✅ Discovery          Found case        │
│  ✅ Scraping           BCPAO data pulled │
│  ✅ Title Search       3 liens found     │
│  ●  Lien Priority      Analyzing...      │
│  ○  Tax Certificates                     │
│  ○  Demographics                         │
│  ○  ML Score                             │
│  ○  Max Bid                              │
│  ○  Decision Log                         │
│  ○  Report                               │
│                                          │
│  ═══════════════════░░░░░░░░░░  30%      │
│  Estimated: ~45 seconds remaining        │
│                                          │
│  [Live log output scrolling...]          │
└──────────────────────────────────────────┘
```

### Design Details
- **Stages:** Vertical list with status icons (✅ done, ● active/spinning, ○ pending)
- **Active stage:** Orange highlight, subtle pulse animation
- **Completed stages:** Green check, brief result summary inline
- **Progress bar:** Orange fill on dark track
- **Live log:** Optional expandable section showing raw pipeline output (for power users)
- **Transition:** When pipeline completes, canvas smoothly transitions to Property Deep Dive with completed data
- **Batch mode:** When analyzing multiple properties, show a queue with individual progress per property

---

## 8. Mobile-Specific Design

### Navigation Model
- No split screen on mobile
- Chat is default view
- When artifact triggers, canvas slides in from right (full screen)
- "← Chat" button in top-left of canvas view
- Swipe right to return to chat
- Chat messages that triggered artifacts show a "View →" tap target

### Property Card Grid on Mobile
- Single column, full-width cards
- Larger touch targets for verdict badges
- Pull-to-refresh for auction data updates

### Property Deep Dive on Mobile
- Hero section with photo takes ~40% of viewport
- Sticky tab bar scrolls horizontally
- Sections stack vertically with generous spacing
- Lien stack cards are full-width

### Quick Actions on Mobile
- Chips scroll horizontally above input
- Slash command palette is bottom sheet (not dropdown)

---

## 9. Interaction Patterns

### Context Awareness
The chat maintains conversational context:
- "Analyze 2840 Coral Way" → Deep Dive loads
- "What liens does it have?" → Scrolls to Lien section (knows "it" = current property)
- "Compare it to 1521 Oak St" → Side-by-side comparison view
- "Add it to my watchlist" → Adds current property, confirms in chat

### Canvas Transitions
- Artifact changes use a subtle crossfade (200ms)
- Pipeline progress uses real-time updates (no page reload)
- Going "back" (e.g., from Deep Dive to Card Grid) preserves scroll position in the grid

### Loading States
- Canvas shows skeleton screens (dark placeholders) while data loads
- Chat shows typing indicator for AI responses
- Pipeline Progress artifact IS the loading state for analysis (no generic spinner)

### Error States
- "County not available yet" → Show which counties are live, offer to notify when added
- "Case not found" → Suggest similar case numbers, offer to search by address
- "Pipeline failed at [stage]" → Show which stage failed, offer retry, explain what data IS available

---

## 10. Implementation Notes

### State Management
- Chat history: Supabase `conversations` table
- Canvas state: React context, not URL-based routing
- Property data: Supabase `multi_county_auctions` table (245,017 rows)
- User preferences: Supabase `user_preferences` table
- Watchlist: Supabase `user_watchlist` table

### API Design
- Chat messages → LangGraph agent endpoint → returns structured response + artifact type
- Artifact rendering: Frontend switches component based on `artifact_type` field in response
- Pipeline progress: WebSocket or SSE for real-time stage updates

### Performance
- Auction Calendar: Pre-computed, cached daily via GitHub Actions scrape
- Property Card Grid: Paginated (20 cards per page), infinite scroll
- Property Deep Dive: Lazy-load sections below fold
- BCPAO photos: CDN-cached, lazy-loaded with blur placeholder

### Accessibility
- All interactive elements keyboard-navigable
- Screen reader labels on verdict badges
- Color-coded information always has text/icon alternative
- Minimum contrast ratio 4.5:1 on dark background

---

## 11. Files to Create/Modify

### New Files
- `src/components/ChatPanel.jsx` — Chat messages, input, chips, slash commands
- `src/components/Canvas.jsx` — Dynamic artifact renderer (switches based on type)
- `src/components/artifacts/AuctionCalendar.jsx`
- `src/components/artifacts/PropertyCardGrid.jsx`
- `src/components/artifacts/PropertyDeepDive.jsx`
- `src/components/artifacts/PipelineProgress.jsx`
- `src/components/artifacts/PortfolioDashboard.jsx` (Phase 2)
- `src/components/artifacts/ReportViewer.jsx` (Phase 2)
- `src/components/ui/VerdictBadge.jsx`
- `src/components/ui/LienCard.jsx`
- `src/components/ui/PropertyCard.jsx`
- `src/components/ui/QuickActionChips.jsx`
- `src/components/ui/SlashCommandPalette.jsx`
- `src/hooks/useConversationContext.js`
- `src/hooks/usePipelineProgress.js`

### Design Tokens (tailwind.config.js extension)
```javascript
colors: {
  brand: {
    navy: '#1E3A5F',
    orange: '#F59E0B',
    slate: '#020617',
  },
  verdict: {
    bid: '#F59E0B',
    review: '#3B82F6',
    skip: '#EF4444',
  },
  lien: {
    wiped: '#22C55E',
    survives: '#EF4444',
    review: '#EAB308',
  }
}
```
