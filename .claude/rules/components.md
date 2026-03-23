---
pattern: "src/components/**"
---
# Component Rules (loaded only when editing React components)

- HOUSE BRAND MANDATORY: Navy #1E3A5F primary, Orange #F59E0B accent/CTA
- Font: Inter. Background: #020617 slate-950
- Split-screen layout: chat left, artifacts/reports right (like Claude AI)
- Tailwind ONLY for styling. No inline styles, no CSS modules
- Every component: default export, no required props (or provide defaults)
- Accessibility: aria-labels on interactive elements, keyboard navigable
- No localStorage/sessionStorage — use React state (useState/useReducer)
- Import from shadcn/ui when component exists there. No reinventing
