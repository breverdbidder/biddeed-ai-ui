# SHADCN_V4_INTEGRATION.md — Claude Code Execution Plan

> **Author:** Claude AI (Opus 4.6) — AI Architect, Shapira Agentic Stack
> **Date:** March 7, 2026
> **Scope:** BidDeed.AI UI + ZoneWise.AI Web
> **Priority:** INFRA — Developer Tooling Upgrade
> **Estimated Time:** ~45 minutes per repo
> **Human Actions Required:** ZERO

---

## MISSION

Integrate shadcn/ui CLI v4 into both `biddeed-ai-ui` and `zonewise-web` repos. This gives Claude Code full component intelligence via the Skills system and enforces the house brand via the Preset system. After completion, every future `shadcn add` command auto-inherits brand colors, fonts, and radius — eliminating manual brand enforcement.

---

## CURRENT STATE (Verified March 7, 2026)

### biddeed-ai-ui (`breverdbidder/biddeed-ai-ui`)
- **Framework:** Next.js 15.0.0 (App Router)
- **Tailwind:** v3.4.x (uses `tailwind.config.ts`)
- **Package Manager:** npm
- **Radix Primitives:** 8 packages installed manually (dialog, dropdown-menu, popover, scroll-area, separator, slot, tabs, tooltip)
- **shadcn Components:** Only `src/components/ui/tabs.tsx` exists
- **components.json:** ❌ DOES NOT EXIST — shadcn CLI was never initialized
- **BRAND_COLORS.md:** ❌ DOES NOT EXIST
- **Fonts:** Plus Jakarta Sans (display), Geist (body), JetBrains Mono (mono)
- **Brand Colors in tailwind.config.ts:**
  - Primary: `brand.500: #3b82f6` (Trust Blue — NOT aligned with house brand)
  - Decision colors: bid=#22c55e, review=#f59e0b, skip=#ef4444
  - Has `--radius` CSS variable already

### zonewise-web (`breverdbidder/zonewise-web`)
- **Framework:** Next.js 16.1.6 (App Router)
- **Tailwind:** v3.4.x (uses `tailwind.config.ts`)
- **Package Manager:** npm (has package-lock.json)
- **Radix Primitives:** None installed via package.json
- **shadcn Components:** None — custom components only (NavHeader, ChatWidget, SplitScreenPreview, BetaSignupForm)
- **components.json:** ❌ DOES NOT EXIST
- **BRAND_COLORS.md:** ❌ DOES NOT EXIST
- **Fonts:** Inter (already correct ✅)
- **Brand Colors in app/globals.css:** ✅ FULLY DEFINED
  - Navy: `--navy-600: #1E3A5F` (primary)
  - Orange: `--orange-400: #F59E0B` (accent)
  - Background: `--slate-950: #020617`
  - Has semantic vars: `--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`

### House Brand Mandate (from BRAND_COLORS.md spec + memory)
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1E3A5F` (Navy) | Headers, primary buttons, navigation |
| Accent/CTA | `#F59E0B` (Orange) | Call-to-action, highlights, hover states |
| Background | `#020617` (Slate-950) | App background, dark surfaces |
| Font | Inter | All UI text |
| Mono Font | JetBrains Mono | Code blocks, data displays |

---

## EXECUTION PLAN

### PHASE 1: zonewise-web (Source of Truth for Brand)

ZoneWise already has the correct brand CSS vars. We initialize shadcn here first, capture the preset, then replicate to BidDeed.

#### Step 1.1: Clone and Prepare

```bash
cd /path/to/zonewise-web
git checkout -b feat/shadcn-v4-integration
git pull origin main
```

#### Step 1.2: Initialize shadcn CLI

Since `components.json` doesn't exist, we must run `init`. The project already has Tailwind v3 and Next.js configured, so shadcn will detect the framework automatically.

```bash
npx shadcn@latest init \
  --base radix \
  --yes \
  --force
```

**IMPORTANT FLAGS:**
- `--base radix` — Use Radix UI primitives (matches existing stack)
- `--yes` — Skip confirmation prompts (zero human-in-loop)
- `--force` — Overwrite any existing config if found

**POST-INIT VERIFICATION:**
```bash
# Verify components.json was created
cat components.json

# Verify shadcn info works
npx shadcn@latest info
```

**EXPECTED:** A `components.json` file at repo root with detected framework (Next.js), Tailwind config path, component paths, etc.

#### Step 1.3: Align components.json with Project Structure

After init, verify and fix `components.json` to match existing paths:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**CRITICAL:** The `css` path must be `app/globals.css` (NOT `src/app/globals.css`) — zonewise-web has no `src/` wrapper for app router.

#### Step 1.4: Create lib/utils.ts (if missing)

shadcn requires a `cn()` utility function:

```bash
# Check if it exists
ls lib/utils.ts 2>/dev/null || echo "MISSING — create it"
```

If missing, create `lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Both `clsx` and `tailwind-merge` are already in package.json. ✅

#### Step 1.5: Map Brand Colors to shadcn CSS Variables

shadcn v4 uses OKLCH colors by default with Tailwind v4, but since we're on Tailwind v3, it uses HSL CSS variables. The existing `app/globals.css` already has semantic vars (`--background`, `--foreground`, etc.) — we need to make sure shadcn's expected vars are present.

**DO NOT OVERWRITE the existing globals.css brand vars.** Instead, ADD the missing shadcn semantic variables that map to our brand:

```css
:root {
  /* === EXISTING BRAND VARS (DO NOT TOUCH) === */
  /* --navy-*, --orange-*, --slate-* already defined */

  /* === SHADCN SEMANTIC MAPPINGS === */
  --background: 222.2 84% 4.9%;        /* #020617 slate-950 */
  --foreground: 210 40% 96%;            /* slate-100 */
  --card: 222.2 47.4% 11.2%;            /* slate-900 */
  --card-foreground: 210 40% 96%;       /* slate-100 */
  --popover: 222.2 47.4% 11.2%;         /* slate-900 */
  --popover-foreground: 210 40% 96%;    /* slate-100 */
  --primary: 213 54% 24%;               /* #1E3A5F navy-600 */
  --primary-foreground: 0 0% 100%;      /* white */
  --secondary: 217.2 32.6% 17.5%;       /* slate-800 */
  --secondary-foreground: 210 40% 96%;  /* slate-100 */
  --muted: 217.2 32.6% 17.5%;           /* slate-800 */
  --muted-foreground: 215 20.2% 65.1%;  /* slate-400 */
  --accent: 38 92% 50%;                 /* #F59E0B orange-400 */
  --accent-foreground: 0 0% 100%;       /* white */
  --destructive: 0 62.8% 30.6%;         /* red-900 */
  --destructive-foreground: 210 40% 96%;
  --border: 217.2 32.6% 17.5%;          /* slate-800 */
  --input: 217.2 32.6% 17.5%;           /* slate-800 */
  --ring: 213 54% 24%;                  /* #1E3A5F navy-600 */
  --radius: 0.5rem;

  /* Chart colors for recharts/shadcn charts */
  --chart-1: 213 54% 24%;               /* navy */
  --chart-2: 38 92% 50%;                /* orange */
  --chart-3: 142 76% 36%;               /* green */
  --chart-4: 221 83% 53%;               /* blue */
  --chart-5: 262 83% 58%;               /* purple */
}
```

**CONVERSION NOTES:**
- `#1E3A5F` → HSL `213 54% 24%` (navy primary)
- `#F59E0B` → HSL `38 92% 50%` (orange accent)
- `#020617` → HSL `222.2 84% 4.9%` (slate-950 background)
- shadcn expects HSL values WITHOUT the `hsl()` wrapper — just the raw numbers

**APPROACH:** Read the existing `app/globals.css`, preserve ALL existing custom properties, and ADD the shadcn semantic variables alongside them. The existing `--background: var(--slate-950)` format should be replaced with the HSL format shadcn expects, but keep the original `--slate-*` vars intact for backward compatibility with existing components.

#### Step 1.6: Install shadcn Skills for Claude Code

```bash
# Install the shadcn skill for Claude Code agent
npx skills add shadcn/ui -a claude-code -y
```

**VERIFICATION:**
```bash
# Skills get installed to .claude/skills/ or .github/skills/
ls -la .claude/skills/ 2>/dev/null
ls -la .github/skills/ 2>/dev/null

# The skill should contain SKILL.md with shadcn context
find . -path "*/skills/*/SKILL.md" -name "SKILL.md" | head -5
```

#### Step 1.7: Install a Test Component

Validate the full pipeline works by adding the Button component:

```bash
# Dry-run first (mandatory per our protocol)
npx shadcn@latest add button --dry-run

# If clean, install
npx shadcn@latest add button --yes
```

**VERIFY:**
```bash
# Component should be at components/ui/button.tsx
cat components/ui/button.tsx

# Check it uses our brand semantic colors (bg-primary, etc.)
grep -c "primary\|destructive\|secondary" components/ui/button.tsx
```

#### Step 1.8: Create BRAND_COLORS.md

Create `BRAND_COLORS.md` at repo root:

```markdown
# House Brand — BidDeed.AI + ZoneWise.AI

## Colors
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Primary (Navy) | `#1E3A5F` | `213 54% 24%` | Headers, primary buttons, navigation |
| Accent (Orange) | `#F59E0B` | `38 92% 50%` | CTAs, highlights, interactive elements |
| Background | `#020617` | `222.2 84% 4.9%` | App background, dark surfaces |
| Foreground | `#F1F5F9` | `210 40% 96%` | Body text on dark backgrounds |
| Muted | `#1E293B` | `217.2 32.6% 17.5%` | Secondary surfaces, borders |

## Typography
| Token | Font | Fallbacks |
|-------|------|-----------|
| Sans | Inter | -apple-system, BlinkMacSystemFont, sans-serif |
| Mono | JetBrains Mono | SF Mono, Consolas, monospace |

## Radius
Default: `0.5rem`

## shadcn/ui Preset
> Preset code will be added here once generated via shadcn/create.
> Both repos MUST use the same preset for brand consistency.

## Semantic Mapping (shadcn → brand)
- `bg-primary` → Navy #1E3A5F
- `bg-accent` → Orange #F59E0B
- `bg-background` → Slate-950 #020617
- `bg-muted` → Slate-800 #1E293B
- `text-primary-foreground` → White
- `text-muted-foreground` → Slate-400
```

#### Step 1.9: Update CLAUDE.md

Append this section to the existing `CLAUDE.md`:

```markdown
## shadcn/ui v4 (Added March 2026)

### Skills
The shadcn skill is installed at `.claude/skills/` — it gives you full context for component APIs, CLI commands, and composition patterns. The skill auto-activates when `components.json` is detected.

### CLI Workflow (MANDATORY)
1. **Before adding any component:** `npx shadcn@latest add <component> --dry-run`
2. **Before updating any component:** `npx shadcn@latest add <component> --diff`
3. **To check project state:** `npx shadcn@latest info`
4. **To get component docs:** `npx shadcn@latest docs <component>`
5. **NEVER fetch raw component files from GitHub** — always use the CLI

### Brand Enforcement
- All components use semantic colors: `bg-primary`, `text-accent`, `bg-background`
- NEVER use raw Tailwind colors like `bg-blue-500` or `text-amber-500`
- See `BRAND_COLORS.md` for the complete color mapping
- Use `gap-*` not `space-y-*` for spacing
- Use `size-*` when width equals height

### Component Location
- UI primitives: `components/ui/`
- Custom components: `components/`
```

#### Step 1.10: Commit and Push

```bash
git add -A
git commit -m "feat: integrate shadcn/ui CLI v4 with Skills + house brand

- Initialize shadcn CLI with Radix base and components.json
- Map house brand (Navy #1E3A5F, Orange #F59E0B) to shadcn semantic CSS vars
- Install shadcn Skills for Claude Code agent context
- Add Button component as integration test
- Create BRAND_COLORS.md with complete brand spec
- Update CLAUDE.md with shadcn v4 workflow rules"

git push origin feat/shadcn-v4-integration
```

Then merge to main (or create PR if branch protection is on):
```bash
# If no branch protection:
git checkout main
git merge feat/shadcn-v4-integration
git push origin main

# If branch protection exists, create PR via GitHub API:
curl -s -X POST -H "Authorization: token $GITHUB_PAT" \
  "https://api.github.com/repos/breverdbidder/zonewise-web/pulls" \
  -d '{"title":"feat: shadcn/ui v4 integration","head":"feat/shadcn-v4-integration","base":"main","body":"Adds shadcn CLI v4 with Skills + house brand preset. See SHADCN_V4_INTEGRATION.md for details."}'
```

---

### PHASE 2: biddeed-ai-ui (Replicate from ZoneWise)

#### Step 2.1: Clone and Prepare

```bash
cd /path/to/biddeed-ai-ui
git checkout -b feat/shadcn-v4-integration
git pull origin main
```

#### Step 2.2: Initialize shadcn CLI

```bash
npx shadcn@latest init \
  --base radix \
  --yes \
  --force
```

#### Step 2.3: Fix components.json Paths

BidDeed uses `src/` directory structure:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**CRITICAL:** BidDeed's CSS file is at `src/app/globals.css` — verify this path exists before proceeding. If it doesn't, check where global styles are imported in `src/app/layout.tsx`.

#### Step 2.4: Align Brand Colors

BidDeed's current `tailwind.config.ts` uses `brand.500: #3b82f6` (generic blue) — this is NOT the house brand.

**TASK:** Update `tailwind.config.ts` to replace the `brand` color scale with the house brand:

```typescript
colors: {
  brand: {
    // House Brand Navy Scale (replacing old Trust Blue)
    50: '#E8F4FD',
    100: '#C5DFEF',
    200: '#9DC6E0',
    300: '#7099C0',
    400: '#4A6F9A',
    500: '#2A4F7A',
    600: '#1E3A5F',  // ← PRIMARY (house brand navy)
    700: '#162D4A',
    800: '#0F2035',
    900: '#07111C',
    950: '#040B12',
  },
  accent: {
    // House Brand Orange Scale
    50: '#FEF3C7',
    100: '#FDE68A',
    200: '#FCD34D',
    300: '#FBBF24',
    400: '#F59E0B',  // ← ACCENT (house brand orange)
    500: '#D97706',
    600: '#B45309',
  },
  // Keep existing decision, risk, agent, stage colors
}
```

**ALSO** add the same shadcn HSL semantic variables to the CSS file (same as Step 1.5 above).

#### Step 2.5: Update Font to Inter

BidDeed currently uses `Plus Jakarta Sans` as display font and `Geist` as body. Per house brand mandate, switch to Inter:

In `tailwind.config.ts`:
```typescript
fontFamily: {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
},
```

In the CSS file, add the Inter import if missing:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

#### Step 2.6: Verify Existing tabs.tsx Component

The existing `src/components/ui/tabs.tsx` was likely copied from shadcn. After init, check compatibility:

```bash
npx shadcn@latest add tabs --diff
```

If there are upstream updates, review the diff and apply if safe.

#### Step 2.7: Install Skills, BRAND_COLORS.md, Update CLAUDE.md

Same as Phase 1, Steps 1.6, 1.8, 1.9 — copy the same files and adjust paths.

#### Step 2.8: Commit and Push

```bash
git add -A
git commit -m "feat: integrate shadcn/ui CLI v4 with Skills + house brand

- Initialize shadcn CLI with Radix base and components.json
- Align brand colors from Trust Blue to house brand Navy #1E3A5F
- Switch fonts from Plus Jakarta Sans/Geist to Inter (house brand)
- Map house brand to shadcn semantic CSS vars
- Install shadcn Skills for Claude Code agent context
- Create BRAND_COLORS.md with complete brand spec
- Update CLAUDE.md with shadcn v4 workflow rules"

git push origin feat/shadcn-v4-integration
```

---

### PHASE 3: Post-Integration Verification

Run these checks on BOTH repos after merging:

```bash
# 1. shadcn project detection
npx shadcn@latest info
# Expected: Shows framework, base, installed components, CSS file

# 2. shadcn info JSON (what the skill reads)
npx shadcn@latest info --json
# Expected: Valid JSON with all config

# 3. Skills installed
find . -name "SKILL.md" -path "*skills*" | head -5
# Expected: At least one SKILL.md in .claude/skills/ or .github/skills/

# 4. Brand colors in CSS
grep -c "1E3A5F\|F59E0B\|020617" app/globals.css
# Expected: Multiple matches

# 5. Build passes
npm run build
# Expected: Clean build, no errors

# 6. Lint passes
npm run lint
# Expected: No new warnings from shadcn integration
```

---

## ROLLBACK PLAN

If anything breaks:

```bash
# Revert to main
git checkout main
git branch -D feat/shadcn-v4-integration

# Or revert specific commit
git revert HEAD
```

The integration is additive — it adds `components.json`, CSS variables, and skills. It doesn't remove or modify existing component logic. The only destructive change is the font swap in `biddeed-ai-ui` (Step 2.5), which is intentional per house brand mandate.

---

## DECISION LOG

| Decision | Rationale |
|----------|-----------|
| Radix over Base UI | Both repos already use @radix-ui packages |
| new-york style | Cleaner, more professional — matches BidDeed/ZoneWise aesthetic |
| Tailwind v3 HSL vars | Both repos on Tailwind v3.4 — OKLCH is v4 only |
| Inter font for both | House brand mandate — consistency across platforms |
| zonewise-web first | Already has correct brand CSS vars — use as source of truth |
| Keep existing custom vars | Backward compat — existing components reference `--navy-*`, `--orange-*` |
| No preset code yet | Presets require manual creation at shadcn/create — log as follow-up |

---

## FOLLOW-UP TASKS (After This Integration)

1. **Create shadcn Preset at shadcn/create** — Manual task requiring browser. Configure Navy/Orange/Inter/0.5rem radius, generate preset code, document in BRAND_COLORS.md. *Surfaces to Ariel as it requires manual browser interaction.*

2. **Add More Base Components** — After integration confirmed, add commonly needed components:
   ```bash
   npx shadcn@latest add card dialog dropdown-menu input label separator tooltip --yes
   ```

3. **Update GitHub Issues** — Close `biddeed-ai-ui#1` and `zonewise-web#33` with completion notes.

4. **Cross-Reference CLAUDE.md in Both Repos** — Ensure the shadcn section is identical.

---

## GITHUB ISSUES

- BidDeed.AI: https://github.com/breverdbidder/biddeed-ai-ui/issues/1
- ZoneWise Web: https://github.com/breverdbidder/zonewise-web/issues/33

---

*Generated by Claude AI (Opus 4.6) — AI Architect, Shapira Agentic Stack*
*This document is the single source of truth for this integration. Claude Code should execute phases sequentially without deviation.*
