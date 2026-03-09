# BidDeed.AI UI/UX Implementation Plan

> **For Claude Code:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Use superpowers:test-driven-development for component logic. Use superpowers:verification-before-completion before marking any task done.

**Goal:** Build the chat-as-OS interface for BidDeed.AI's public launch — split-screen with NLP chat (left) and dynamic artifact canvas (right), rendering auction calendars, property deep dives, card grids, and pipeline progress.

**Architecture:** React (Next.js) on Cloudflare Pages, Tailwind CSS with custom brand tokens, Supabase backend. Chat-driven navigation — no traditional routing. Canvas renders artifact components based on AI response type.

**Tech Stack:** Next.js 14+, React 18+, Tailwind CSS, Supabase JS client, SSE/WebSocket for pipeline progress.

**Design Spec:** `docs/plans/2026-03-09-biddeed-ui-design.md` — READ THIS FULLY before starting any task.

---

### Task 1: Design Token Foundation & App Shell

**Files:**
- Modify: `tailwind.config.js`
- Create: `src/styles/tokens.css`
- Create: `src/components/AppShell.jsx`
- Create: `src/components/AppShell.test.jsx`

**Step 1: Write failing test**
```javascript
// Test that AppShell renders split-screen layout with chat and canvas panels
test('renders split-screen with chat panel and canvas panel', () => {
  render(<AppShell />);
  expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  expect(screen.getByTestId('canvas-panel')).toBeInTheDocument();
});

test('chat panel has correct width constraints', () => {
  render(<AppShell />);
  const chatPanel = screen.getByTestId('chat-panel');
  // Should have flex-basis/width styles for ~35% width
  expect(chatPanel).toHaveClass('w-[380px]');
});
```

**Step 2: Run test to verify it fails**
Run: `npx jest src/components/AppShell.test.jsx --verbose`
Expected: FAIL — component not found

**Step 3: Extend Tailwind config with brand tokens**
```javascript
// Add to tailwind.config.js theme.extend.colors
brand: { navy: '#1E3A5F', orange: '#F59E0B', slate: '#020617' },
verdict: { bid: '#F59E0B', review: '#3B82F6', skip: '#EF4444' },
lien: { wiped: '#22C55E', survives: '#EF4444', review: '#EAB308' },
```

**Step 4: Build AppShell component**
- Full viewport height, slate-950 background
- Flex row: ChatPanel (left, 380px fixed with resize handle) + Canvas (right, flex-1)
- Top bar: BidDeed.AI logo (left), user avatar + settings (right)
- Responsive: Below 768px, single panel mode with state to toggle chat/canvas

**Step 5: Run test to verify it passes**
Run: `npx jest src/components/AppShell.test.jsx --verbose`
Expected: PASS

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: app shell with split-screen layout and brand tokens"
```

---

### Task 2: Chat Panel — Messages, Input & Welcome State

**Files:**
- Create: `src/components/ChatPanel.jsx`
- Create: `src/components/ChatPanel.test.jsx`
- Create: `src/hooks/useConversationContext.js`

**Step 1: Write failing test**
```javascript
test('renders welcome state with suggested prompts when no messages', () => {
  render(<ChatPanel messages={[]} />);
  expect(screen.getByText(/Welcome to BidDeed.AI/)).toBeInTheDocument();
  expect(screen.getByText('Upcoming Auctions')).toBeInTheDocument();
  expect(screen.getByText('Analyze Property')).toBeInTheDocument();
  expect(screen.getByText('How This Works')).toBeInTheDocument();
});

test('renders user messages right-aligned with navy background', () => {
  const messages = [{ role: 'user', content: 'Show upcoming auctions' }];
  render(<ChatPanel messages={messages} />);
  const msg = screen.getByText('Show upcoming auctions');
  expect(msg.closest('[data-role="user"]')).toBeInTheDocument();
});

test('renders AI messages left-aligned', () => {
  const messages = [{ role: 'assistant', content: 'Here are upcoming auctions', artifactType: 'auction-calendar' }];
  render(<ChatPanel messages={messages} />);
  expect(screen.getByText(/upcoming auctions/)).toBeInTheDocument();
});

test('calls onSend when user submits message', async () => {
  const onSend = jest.fn();
  render(<ChatPanel messages={[]} onSend={onSend} />);
  const input = screen.getByPlaceholderText(/Ask about auctions/);
  await userEvent.type(input, 'Show auctions{enter}');
  expect(onSend).toHaveBeenCalledWith('Show auctions');
});
```

**Step 2: Run test to verify fails**

**Step 3: Implement ChatPanel**
- Welcome state: Logo, brief description, 3 large suggested-prompt cards (orange left border, hover glow)
- Message list: Scrollable, auto-scroll to bottom on new message
- User messages: Right-aligned, bg-brand-navy, rounded-lg, white text
- AI messages: Left-aligned, bg-slate-800, rounded-lg, white text
- AI messages with artifactType show "→ View [Artifact]" link tag
- Input bar: Bottom-fixed, dark bg, navy border, orange focus ring
- Placeholder: "Ask about auctions, properties, or type / for commands..."
- Send button: Orange icon button
- useConversationContext hook: Maintains current context (active property, active auction, etc.)

**Step 4: Run test to verify passes**

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: chat panel with welcome state, messages, and input"
```

---

### Task 3: Quick-Action Chips & Slash Command Palette

**Files:**
- Create: `src/components/ui/QuickActionChips.jsx`
- Create: `src/components/ui/SlashCommandPalette.jsx`
- Create: `src/components/ui/QuickActionChips.test.jsx`
- Create: `src/components/ui/SlashCommandPalette.test.jsx`

**Step 1: Write failing tests**
```javascript
// QuickActionChips
test('renders default chips when no canvas context', () => {
  render(<QuickActionChips canvasContext={null} />);
  expect(screen.getByText('Upcoming Auctions')).toBeInTheDocument();
  expect(screen.getByText('Analyze Property')).toBeInTheDocument();
});

test('renders context-specific chips when viewing calendar', () => {
  render(<QuickActionChips canvasContext={{ type: 'auction-calendar' }} />);
  expect(screen.getByText('This Week')).toBeInTheDocument();
  expect(screen.getByText('BID Properties Only')).toBeInTheDocument();
});

test('clicking chip calls onSend with chip text', async () => {
  const onSend = jest.fn();
  render(<QuickActionChips canvasContext={null} onSend={onSend} />);
  await userEvent.click(screen.getByText('Upcoming Auctions'));
  expect(onSend).toHaveBeenCalledWith('Show upcoming auctions');
});

// SlashCommandPalette
test('shows command palette when input starts with /', () => {
  render(<SlashCommandPalette inputValue="/" visible={true} />);
  expect(screen.getByText('/auction')).toBeInTheDocument();
  expect(screen.getByText('/analyze')).toBeInTheDocument();
});

test('filters commands as user types', () => {
  render(<SlashCommandPalette inputValue="/ana" visible={true} />);
  expect(screen.getByText('/analyze')).toBeInTheDocument();
  expect(screen.queryByText('/auction')).not.toBeInTheDocument();
});
```

**Step 2: Run tests to verify fail**

**Step 3: Implement QuickActionChips**
- Horizontal row of pill-shaped chips, persistent above input
- Pill design: navy border, transparent bg, orange on hover, orange bg when active
- Context-sensitive chip sets based on canvasContext prop
- Click handler auto-fills and sends chat message

**Step 4: Implement SlashCommandPalette**
- Dropdown above input, triggered when input value starts with "/"
- Commands: /auction, /analyze, /portfolio, /watchlist, /compare, /report, /counties, /help
- Each command shows description text
- Arrow key navigation, Enter to select
- Mobile: Bottom sheet instead of dropdown

**Step 5: Run tests to verify pass**

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: context-sensitive quick chips and slash command palette"
```

---

### Task 4: Dynamic Canvas & Artifact Routing

**Files:**
- Create: `src/components/Canvas.jsx`
- Create: `src/components/Canvas.test.jsx`

**Step 1: Write failing test**
```javascript
test('renders empty state when no artifact is active', () => {
  render(<Canvas artifact={null} />);
  expect(screen.getByText(/Select a property or ask a question/)).toBeInTheDocument();
});

test('renders AuctionCalendar when artifact type is auction-calendar', () => {
  const artifact = { type: 'auction-calendar', data: mockCalendarData };
  render(<Canvas artifact={artifact} />);
  expect(screen.getByTestId('auction-calendar')).toBeInTheDocument();
});

test('renders PropertyDeepDive when artifact type is property-deep-dive', () => {
  const artifact = { type: 'property-deep-dive', data: mockPropertyData };
  render(<Canvas artifact={artifact} />);
  expect(screen.getByTestId('property-deep-dive')).toBeInTheDocument();
});

test('transitions smoothly between artifact types', async () => {
  const { rerender } = render(<Canvas artifact={{ type: 'auction-calendar', data: {} }} />);
  rerender(<Canvas artifact={{ type: 'property-card-grid', data: {} }} />);
  // Should show new artifact
  expect(screen.getByTestId('property-card-grid')).toBeInTheDocument();
});
```

**Step 2: Run test to verify fails**

**Step 3: Implement Canvas**
- Artifact router: Switch component rendering based on artifact.type
- Supported types: 'auction-calendar', 'property-deep-dive', 'property-card-grid', 'pipeline-progress', 'portfolio-dashboard', 'report-viewer'
- Crossfade transition (200ms) between artifact types
- Empty state: Subtle prompt encouraging user to interact with chat
- Skeleton loading states for each artifact type
- Mobile: Full-screen mode with "← Chat" back button

**Step 4: Run test to verify passes**

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: dynamic canvas with artifact routing and transitions"
```

---

### Task 5: Auction Calendar Artifact

**Files:**
- Create: `src/components/artifacts/AuctionCalendar.jsx`
- Create: `src/components/artifacts/AuctionCalendar.test.jsx`

**Step 1: Write failing tests**
```javascript
test('renders timeline with auction dates', () => {
  render(<AuctionCalendar data={mockAuctions} />);
  expect(screen.getByText('Brevard County')).toBeInTheDocument();
  expect(screen.getByText('23 properties')).toBeInTheDocument();
});

test('highlights today with orange ring', () => {
  render(<AuctionCalendar data={mockAuctions} today="2026-03-09" />);
  const todayColumn = screen.getByTestId('day-2026-03-09');
  expect(todayColumn).toHaveClass('ring-brand-orange');
});

test('clicking county card calls onSelectAuction', async () => {
  const onSelect = jest.fn();
  render(<AuctionCalendar data={mockAuctions} onSelectAuction={onSelect} />);
  await userEvent.click(screen.getByText('Brevard County'));
  expect(onSelect).toHaveBeenCalledWith({ county: 'brevard', date: expect.any(String) });
});
```

**Step 2: Run test to verify fails**

**Step 3: Implement AuctionCalendar**
Per design spec Section 4:
- Horizontal timeline, current week centered, scroll left/right
- Day columns with date headers
- County auction cards: dark slate-800, navy header, property count, judgment total, analysis progress bar
- Today: orange ring + glow, Tomorrow: slightly brighter
- Past: dimmed, show results if available
- Click → triggers onSelectAuction callback (parent routes to Property Card Grid)
- Data source: Supabase `multi_county_auctions` table, grouped by date + county

**Step 4: Run test to verify passes**

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: auction calendar artifact with multi-county timeline"
```

---

### Task 6: Verdict Badge & Lien Card UI Components

**Files:**
- Create: `src/components/ui/VerdictBadge.jsx`
- Create: `src/components/ui/LienCard.jsx`
- Create: `src/components/ui/VerdictBadge.test.jsx`
- Create: `src/components/ui/LienCard.test.jsx`

**Step 1: Write failing tests**
```javascript
// VerdictBadge
test('renders BID badge with orange styling', () => {
  render(<VerdictBadge verdict="BID" maxBid={142250} />);
  const badge = screen.getByText('BID');
  expect(badge).toHaveClass('bg-verdict-bid');
  expect(screen.getByText('Max: $142,250')).toBeInTheDocument();
});

test('renders SKIP badge with red styling', () => {
  render(<VerdictBadge verdict="SKIP" />);
  expect(screen.getByText('SKIP')).toHaveClass('bg-verdict-skip');
});

// LienCard
test('renders lien with WIPED status in green', () => {
  render(<LienCard holder="Chase" amount={165000} type="1st Mortgage" status="wiped" />);
  expect(screen.getByText('Chase')).toBeInTheDocument();
  expect(screen.getByText('WIPED IN SALE')).toBeInTheDocument();
  expect(screen.getByTestId('lien-status')).toHaveClass('text-lien-wiped');
});

test('renders lien with SURVIVES status in red', () => {
  render(<LienCard holder="Coral Bay HOA" amount={12400} type="HOA Lien" status="survives" />);
  expect(screen.getByText('SURVIVES')).toBeInTheDocument();
});
```

**Step 2-5: Standard TDD cycle**

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: verdict badge and lien card reusable UI components"
```

---

### Task 7: Property Deep Dive Artifact

**Files:**
- Create: `src/components/artifacts/PropertyDeepDive.jsx`
- Create: `src/components/artifacts/PropertyDeepDive.test.jsx`

**Step 1: Write failing tests**
```javascript
test('renders hero section with BCPAO photo and verdict', () => {
  render(<PropertyDeepDive data={mockProperty} />);
  expect(screen.getByText('2840 Coral Way')).toBeInTheDocument();
  expect(screen.getByText('BID')).toBeInTheDocument();
  expect(screen.getByText('Max: $142,250')).toBeInTheDocument();
});

test('renders sticky tab nav with all sections', () => {
  render(<PropertyDeepDive data={mockProperty} />);
  expect(screen.getByText('The Math')).toBeInTheDocument();
  expect(screen.getByText('Liens')).toBeInTheDocument();
  expect(screen.getByText('Tax')).toBeInTheDocument();
  expect(screen.getByText('Area')).toBeInTheDocument();
  expect(screen.getByText('ML')).toBeInTheDocument();
  expect(screen.getByText('Decision')).toBeInTheDocument();
});

test('renders max bid calculation breakdown', () => {
  render(<PropertyDeepDive data={mockProperty} />);
  expect(screen.getByText('ARV:')).toBeInTheDocument();
  expect(screen.getByText('$245,000')).toBeInTheDocument();
});

test('renders lien stack with priority ordering', () => {
  render(<PropertyDeepDive data={mockProperty} />);
  const liens = screen.getAllByTestId('lien-card');
  expect(liens).toHaveLength(3);
});

test('renders decision log with reasoning', () => {
  render(<PropertyDeepDive data={mockProperty} />);
  expect(screen.getByText(/BID recommended/)).toBeInTheDocument();
});
```

**Step 2: Run test to verify fails**

**Step 3: Implement PropertyDeepDive**
Per design spec Section 5:
- Hero: BCPAO photo (left), address + case info (right), large VerdictBadge + max bid
- Sticky tab nav: Horizontal tabs below hero, sticks on scroll, highlights active section via IntersectionObserver
- Tab click → smooth scroll to section
- Sections rendered as scrollable page:
  1. The Math: Formula breakdown with ARV, repairs, safety, profit margin, max bid (large orange), bid/judgment ratio
  2. Liens: LienCard stack showing priority, amounts, status colors
  3. Tax: Certificate table, delinquent amounts
  4. Area: Neighborhood stats, mini sparkline for comps
  5. ML: Horizontal gauge bar for third-party probability, range indicator for predicted price
  6. Decision: Plain-English reasoning paragraph
- Mobile: Full-width, horizontally scrollable tab bar

**Step 4: Run test to verify passes**

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: property deep dive with scrollable sections and sticky nav"
```

---

### Task 8: Property Card Grid Artifact

**Files:**
- Create: `src/components/ui/PropertyCard.jsx`
- Create: `src/components/artifacts/PropertyCardGrid.jsx`
- Create: `src/components/artifacts/PropertyCardGrid.test.jsx`

**Step 1: Write failing tests**
```javascript
test('renders grid of property cards', () => {
  render(<PropertyCardGrid data={mockAuctionProperties} />);
  const cards = screen.getAllByTestId('property-card');
  expect(cards).toHaveLength(23);
});

test('filters cards by verdict', async () => {
  render(<PropertyCardGrid data={mockAuctionProperties} />);
  await userEvent.click(screen.getByText('BID (4)'));
  const cards = screen.getAllByTestId('property-card');
  expect(cards).toHaveLength(4);
});

test('sorts cards by ML score', async () => {
  render(<PropertyCardGrid data={mockAuctionProperties} />);
  await userEvent.click(screen.getByText('ML Score'));
  const scores = screen.getAllByTestId('ml-score').map(el => Number(el.textContent.replace('%', '')));
  expect(scores).toEqual([...scores].sort((a, b) => b - a));
});

test('clicking card calls onSelectProperty', async () => {
  const onSelect = jest.fn();
  render(<PropertyCardGrid data={mockAuctionProperties} onSelectProperty={onSelect} />);
  await userEvent.click(screen.getAllByTestId('property-card')[0]);
  expect(onSelect).toHaveBeenCalled();
});
```

**Step 2-5: Standard TDD cycle**

**Step 3: Implement**
Per design spec Section 6:
- Header: County name, date, property count, total judgment
- Filter tabs: All | BID (count) | REVIEW (count) | SKIP (count) — active tab orange underline
- Sort: ML Score (default), Judgment, Address, Bid/Judgment Ratio
- Property cards: Dark slate-800, BCPAO thumbnail, address, judgment, ML score %, VerdictBadge
- Grid: 3 cols desktop, 2 tablet, 1 mobile
- Click → onSelectProperty callback
- Infinite scroll pagination (20 per page)

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: property card grid with filters, sorting, and pagination"
```

---

### Task 9: Pipeline Progress Artifact

**Files:**
- Create: `src/components/artifacts/PipelineProgress.jsx`
- Create: `src/components/artifacts/PipelineProgress.test.jsx`
- Create: `src/hooks/usePipelineProgress.js`

**Step 1: Write failing tests**
```javascript
test('renders all 12 pipeline stages', () => {
  render(<PipelineProgress stages={mockStages} />);
  expect(screen.getByText('Discovery')).toBeInTheDocument();
  expect(screen.getByText('ML Score')).toBeInTheDocument();
});

test('shows completed stages with green check', () => {
  render(<PipelineProgress stages={mockStages} />);
  const completed = screen.getAllByTestId('stage-completed');
  expect(completed).toHaveLength(3); // First 3 stages done
});

test('shows active stage with orange indicator', () => {
  render(<PipelineProgress stages={mockStages} />);
  const active = screen.getByTestId('stage-active');
  expect(active).toHaveClass('text-brand-orange');
});

test('displays progress percentage', () => {
  render(<PipelineProgress stages={mockStages} currentStage={4} totalStages={12} />);
  expect(screen.getByText('33%')).toBeInTheDocument();
});
```

**Step 2-5: Standard TDD cycle**

**Step 3: Implement**
Per design spec Section 7:
- Vertical stage list: ✅ done (green), ● active (orange, pulse), ○ pending (gray)
- Completed stages show brief result summary inline
- Overall progress bar: orange fill on dark track
- Estimated time remaining
- usePipelineProgress hook: SSE/WebSocket connection for real-time updates
- On completion: smooth transition to PropertyDeepDive

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: pipeline progress artifact with real-time stage updates"
```

---

### Task 10: Mobile Responsive Behavior

**Files:**
- Modify: `src/components/AppShell.jsx`
- Modify: `src/components/ChatPanel.jsx`
- Modify: `src/components/Canvas.jsx`
- Create: `src/hooks/useMobileLayout.js`

**Step 1: Write failing tests**
```javascript
test('renders single panel on mobile viewport', () => {
  // Set viewport to mobile width
  window.innerWidth = 375;
  render(<AppShell />);
  expect(screen.getByTestId('chat-panel')).toBeVisible();
  expect(screen.queryByTestId('canvas-panel')).not.toBeVisible();
});

test('shows canvas full-screen when artifact triggers on mobile', () => {
  window.innerWidth = 375;
  const { rerender } = render(<AppShell />);
  // Simulate artifact trigger
  act(() => { /* trigger artifact */ });
  expect(screen.getByTestId('canvas-panel')).toBeVisible();
  expect(screen.getByText('← Chat')).toBeInTheDocument();
});
```

**Step 2-5: Standard TDD cycle**

**Step 3: Implement mobile behaviors**
- useMobileLayout hook: Detects viewport < 768px
- Mobile mode: Chat full-screen by default
- Artifact trigger: Canvas slides in from right, full-screen
- Back button: "← Chat" in top-left returns to chat
- Swipe right gesture to return to chat
- Quick-action chips: Horizontally scrollable
- Slash commands: Bottom sheet instead of dropdown

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: mobile responsive layout with chat/canvas toggle"
```

---

### Task 11: Integration — Wire Chat to Canvas

**Files:**
- Modify: `src/components/AppShell.jsx`
- Create: `src/lib/chatToArtifact.js` — Maps chat intents to artifact types
- Create: `src/lib/chatToArtifact.test.js`

**Step 1: Write failing tests**
```javascript
test('maps "show upcoming auctions" to auction-calendar artifact', () => {
  const result = mapChatToArtifact({ intent: 'show_auctions' });
  expect(result.type).toBe('auction-calendar');
});

test('maps "analyze [case]" to property-deep-dive artifact', () => {
  const result = mapChatToArtifact({ intent: 'analyze_property', caseNumber: '05-2024-1234' });
  expect(result.type).toBe('property-deep-dive');
});

// Integration test
test('typing message triggers corresponding artifact on canvas', async () => {
  render(<AppShell />);
  const input = screen.getByPlaceholderText(/Ask about/);
  await userEvent.type(input, 'Show upcoming auctions{enter}');
  await waitFor(() => {
    expect(screen.getByTestId('auction-calendar')).toBeInTheDocument();
  });
});
```

**Step 2-5: Standard TDD cycle**

**Step 3: Implement**
- chatToArtifact mapper: Takes AI response with intent field, returns artifact config
- AppShell state management: currentArtifact state controls Canvas rendering
- Chat → AI endpoint → response includes intent + data → Canvas renders artifact
- Quick-action chip clicks flow through same pipeline
- Context tracking: When viewing a property, subsequent questions reference it

**Step 6: Commit**
```bash
git add -A && git commit -m "feat: wire chat messages to dynamic canvas artifact rendering"
```

---

## Execution Notes

### For Claude Code:
- Read the full design spec FIRST: `docs/plans/2026-03-09-biddeed-ui-design.md`
- House brand is MANDATORY: Navy #1E3A5F, Orange #F59E0B, Inter font, bg #020617
- Use `superpowers:test-driven-development` for all component logic
- Use `superpowers:verification-before-completion` before marking any task done
- Use `superpowers:requesting-code-review` after Tasks 4, 7, and 11
- Dispatch `superpowers:dispatching-parallel-agents` for Tasks 6+7 (can be done in parallel — independent components)

### Quality Gates:
- All tests must pass before moving to next task
- Verify responsive behavior at 375px, 768px, and 1440px widths
- Verify brand colors match BRAND_COLORS.md exactly
- No generic AI aesthetics (no purple gradients, no default Tailwind)

### Data Sources:
- Auction data: Supabase `multi_county_auctions` table (245,017 rows, 46 counties)
- BCPAO photos: `https://www.bcpao.us/photos/{prefix}/{account}011.jpg`
- Use mock data for development, wire to Supabase in integration task
