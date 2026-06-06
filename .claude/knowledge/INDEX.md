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

### Product
- [Dinacharya System](product/dinacharya-system.md) — Full-day rhythm architecture and progressive disclosure
- [Waitlist Funnel](product/waitlist-funnel.md) — 3-step form, duplicate-email handling, unified hero + CTA forms
- [Onboarding Name Auto-fill](product/onboarding-name-autofill.md) — Pre-fill name from waitlist table to avoid double-ask

### Rituals
- [Nitya Karma Sequence](rituals/nitya-karma-sequence.md) — Correct Hindu morning order and tradition-aware sequence constraints

### Decisions
- [Shoonaya Agent Operating Model](decisions/shoonaya-agent-operating-model.md) — How role agents, graphify, and knowledge curation support the team
- [Feature Card Routing](decisions/feature-card-routing.md) — Landing cards link to /signup, never to protected app routes
- [Nav and Footer Branding](decisions/nav-footer-branding.md) — river-light-horizontal.png is canonical; no text fallbacks

## How to add entries

Run the knowledge curator agent after any session with significant decisions:
```
use agent: shoonaya-knowledge-curator
"Capture decisions from this session"
```

If a PostToolUse hook is added later, it should remind the operator to run the curator
after significant sessions. At the moment, curation is manual.
