# Shoonaya Knowledge Base

Auto-curated decisions, architecture choices, and reasoning from working sessions.
Updated by the `shoonaya-knowledge-curator` agent.

## Structure

| Folder | What lives here |
|--------|----------------|
| `decisions/` | Why we chose X over Y — product, technical, UX calls |
| `architecture/` | System design: data models, API patterns, component contracts |
| `product/` | Feature design rationale, user psychology, progressive disclosure logic |
| `rituals/` | Dharmic/spiritual correctness decisions — tradition-specific choices |

## Key Documents

### Architecture
- [Share Cards](architecture/share-cards.md) — Canvas rendering, card types, viral loop design
- [Location Persistence](architecture/location-persistence.md) — Save GPS on most-visited screen (HomeDashboard), not profile page
- [Ashrama Duty Persistence](architecture/ashrama-duty-persistence.md) — localStorage for grihastha, sessionStorage for other stages
- [AI Report — content_reports Reuse](architecture/ai-report-content-reports-reuse.md) — AI chat reports reuse content_reports table; empty-string sentinel for AI author; metadata jsonb column; separate AI reason constants
- [Dharma Mitra — Language-Aware](architecture/dharma-mitra-language-aware.md) — Language prop chain from layout to FAB; API fallback order; MUST directive in system prompt; supported codes en/hi/pa
- [Home Performance Patterns](architecture/home-performance-patterns.md) — Single range query for sadhana history; unstable_cache for 4 public tables; concurrent Promise.all grouping; dynamic imports for interaction-gated components
- [Admin Auth Patterns](architecture/admin-auth-patterns.md) — Server actions re-verify HMAC independently; content_reports status union; postgrest-js v2 .update() never bug workaround; Next.js 15 searchParams must be awaited

### Product
- [Dinacharya System](product/dinacharya-system.md) — Full-day rhythm architecture and progressive disclosure
- [Waitlist Funnel](product/waitlist-funnel.md) — 3-step form, duplicate-email handling, unified hero + CTA forms
- [Onboarding Name Auto-fill](product/onboarding-name-autofill.md) — Pre-fill name from waitlist table to avoid double-ask
- [AI Report UX Pattern](product/ai-report-ux-pattern.md) — Inline dropdown (not modal), permanent local hide after success, prevUserText threading via array walk
- [FirstWeekGuide — Tradition-Aware](product/first-week-guide-tradition-aware.md) — 5-act onboarding guide with tradition-aware vocabulary, localStorage progress, visibility conditions
- [Greeting System Conventions](product/greeting-system-conventions.md) — Empty-string userName fallback, comma-guard, 3-tier greeting pool fallback chain

### Rituals
- [Nitya Karma Sequence](rituals/nitya-karma-sequence.md) — Correct Hindu morning order and tradition-aware sequence constraints

### Decisions
- [Shoonaya Agent Operating Model](decisions/shoonaya-agent-operating-model.md) — How role agents, graphify, and knowledge curation support the team
- [Feature Card Routing](decisions/feature-card-routing.md) — Landing cards link to /signup, never to protected app routes
- [Nav and Footer Branding](decisions/nav-footer-branding.md) — river-light-horizontal.png is canonical; no text fallbacks
- [Nitya Karma Error Boundaries](decisions/nitya-karma-error-boundaries.md) — Route-level error.tsx on /insights and /plans; reset() + Go Back recovery; never a single parent boundary

## How to add entries

Run the knowledge curator agent after any session with significant decisions:
```
use agent: shoonaya-knowledge-curator
"Capture decisions from this session"
```

If a PostToolUse hook is added later, it should remind the operator to run the curator
after significant sessions. At the moment, curation is manual.
