# Admin Operations Redesign Prompts

## Operating Rules

- Work in `/Users/Business(C)/Sanatan Sangam/Shoonaya` only.
- Treat unrelated working-tree changes as concurrent work. Do not revert, stage, or edit them.
- Preserve existing authorization, RLS, service-role boundaries, and destructive-action safeguards.
- Do not invent telemetry, metrics, assignments, log correlations, or database fields. Show an honest unavailable or empty state when data does not exist.
- Use existing Shoonaya tokens and Lucide icons. This is an operational console: prioritize density, scanning, predictable navigation, and clear failure states over decorative cards.
- All new client motion must respect `prefers-reduced-motion`.
- Do not combine prompts. After each prompt, run the required checks, report touched files and remaining limitations, and stop for review.
- Do not commit unless explicitly requested.

---

## Prompt 0: Ground-Truth Admin Route and Deep-Link Audit

```text
Audit the existing Shoonaya admin console without changing runtime behavior.

Scope:
- src/app/admin/**
- src/app/api/admin/**
- directly used admin helpers only

Inventory every admin route, its owning screen, its current URL parameters, its data sources, and its available actions. Build a machine-readable route registry and a concise Markdown report under docs/audits/admin-operations/.

For every link produced by /api/admin/alerts, verify whether the destination actually consumes every query parameter and opens the intended tab, filter, row, or record. Specifically trace:
- client-error alerts to Monitoring errors/fingerprint
- telemetry or API alerts to Monitoring filters
- calendar findings to Calendar Governance finding and tab
- moderation reports to the exact report
- Dharm Veer alerts to the exact review item
- cron failures to the exact cron/run where possible

Classify each route/link as working, partial, broken, unsupported, or not-applicable. Do not infer that a query parameter works merely because it appears in an href.

Also inventory duplicate navigation surfaces: header menus, dashboard command cards, quick tools, page-local back links, and any existing command/search affordance. Do not redesign yet.

Deliver:
1. docs/audits/admin-operations/route-registry.json
2. docs/audits/admin-operations/DEEP_LINK_AND_INFORMATION_ARCHITECTURE_AUDIT.md
3. Focused tests only if an existing reusable URL parsing helper can be unit-tested without changing production behavior.

Verification:
- npx tsc --noEmit -p tsconfig.json
- applicable focused tests
- git diff --check
- git status --short

Stop. Do not change routes, APIs, layouts, or UI in this prompt.
```

---

## Prompt 1: Canonical Admin URL-State and Deep-Link Repair

```text
Implement the smallest shared admin URL-state contract required to make existing alert links operational.

Use the Prompt 0 audit as ground truth. Do not add query parameters that lack a real destination behavior.

Requirements:
1. Create a small, typed, client-safe admin URL-state helper. It must parse only declared values, reject invalid values safely, and preserve unrelated query parameters when updating a tab/filter.
2. Monitoring must consume and synchronize stable URL parameters such as:
   - tab=apis|telemetry|push|errors|ai_reports
   - fingerprint=<known client-error fingerprint>
   - requestId=<known request id>, only if the current telemetry data can actually filter it
3. Moderation must consume `report=<id>` or the audited canonical equivalent, focus that report, and show an explicit unavailable state if it is not present in the loaded result set.
4. Calendar Governance must retain its existing working tab/finding behavior. Consolidate parameter naming only if backward-compatible aliases are retained for existing alert links.
5. Cron links must target a cron/job/run only where the data model supports it. Do not fabricate a run inspector.
6. Replace the invalid moderation UI filter label/value `resolved` with canonical statuses or a display-only grouping that maps accurately to `reviewed` and `actioned`.
7. Deep linking must work on a hard refresh, browser back/forward, and direct pasted URL.

Tests:
- one focused test per repaired alert destination
- invalid tab/id query values fail safely
- browser-state changes preserve unrelated query parameters

Verification:
- npx tsc --noEmit -p tsconfig.json
- focused tests
- git diff --check
- git status --short

Stop. Do not redesign the shell or dashboard yet.
```

---

## Prompt 2: Admin Shell, Route Registry, and Navigation Consolidation

```text
Build the shared administrative shell using the audited route registry and the repaired URL-state contract.

Goal: replace the current header dropdown plus repeated dashboard command-card/quick-tool navigation with one predictable operational navigation model.

Requirements:
1. Create a persistent desktop left rail with these groups:
   - Overview
   - Work Queues: Moderation, Calendar Governance, Dharm Veer Review
   - Operations: Monitoring, Crons, Notifications
   - Content & Community: Observance Content, Users, Tirtha/Mandali, Broadcast
   - Reports & Settings
2. Keep the top bar compact: current section breadcrumb, global command/search entry point, real alert count, settings, sign out. Do not repeat full navigation there.
3. On narrow viewports, collapse the rail into an accessible menu. Keyboard navigation and visible focus states are required.
4. Build one route registry as the source for rail items, labels, icons, descriptions, and active-state matching. Remove duplicated hardcoded navigation lists only after all destinations are verified.
5. Preserve all existing admin route URLs. No breaking renames.
6. Add a command palette that searches route names and descriptions only. It must not claim to search logs, users, or records until those indices exist.
7. Remove redundant navigation cards and quick tools from the overview only after Prompt 3 replaces them with action-oriented content.

Visual requirements:
- Use existing token colors and Lucide icons.
- Keep sections unframed where possible; cards are for actionable queue items, not every page band.
- Rail width and collapsed dimensions must be stable.
- Do not use permanent decorative animation.

Verification:
- npx tsc --noEmit -p tsconfig.json
- focused navigation/URL-state tests
- npm run build if available; otherwise state why it cannot run
- git diff --check
- git status --short

Stop. Do not build a new log explorer or rewrite individual operational pages.
```

---

## Prompt 3: Shared Admin Record Inspector

```text
Create a reusable right-side AdminRecordInspector for inspecting a linked operational record without losing the surrounding queue context.

Start with only records backed by real data already supplied by existing pages/APIs:
- calendar integrity finding
- content report
- client-error fingerprint
- Dharm Veer review item

Requirements:
1. Inspector selection must be URL-addressable via the canonical Prompt 1 query parameters and close cleanly with browser back/forward support.
2. Display only actual supplied fields: identifier, severity/status, timestamps, source, description, metadata, and existing supported actions.
3. Provide real links to the owning dedicated screen and related user/profile only when a valid route and authorization already exist.
4. Do not add a generic “resolve” button. Render an action only when the record type has an existing safe, authorized, and tested action endpoint.
5. Render explicit loading, not-found, forbidden, degraded-source, and empty states.
6. Sensitive metadata must be minimized by default. Do not expose secrets, tokens, raw authorization headers, or unrestricted profile data.
7. Use one shared component contract; do not duplicate a new modal implementation on each page.

Tests:
- URL opens and closes the correct inspector
- invalid/missing record produces a clear state
- each record type renders only its supported actions

Verification:
- npx tsc --noEmit -p tsconfig.json
- focused tests
- git diff --check
- git status --short

Stop. Do not create a unified log explorer in this prompt.
```

---

## Prompt 4: Operations Overview Redesign

```text
Redesign /admin as an operational overview, not an application directory.

Use the new shell, route registry, and record inspector. Preserve existing endpoints and real metrics.

Required layout:
1. A compact status strip: latest deployment identity if available, active alerts, critical cron failures, and monitoring degradation. Never show “all healthy” when any source is degraded.
2. A primary “Needs attention” queue ordered by severity, freshness, and operational impact. Each row must deep-link into the relevant inspector and dedicated page.
3. A small operational snapshot with only real, decision-useful metrics. Remove vanity or duplicated counters.
4. “Recent operator activity” only if a reliable audit/event source exists. Otherwise omit it rather than invent it.
5. A short “Open workspaces” section for frequently used tools, sourced from the route registry. Do not recreate the old four-domain card wall.
6. Remove dashboard-local alert modals once the shared inspector is in use.

Requirements:
- Reuse /api/admin/alerts but surface its degraded status prominently.
- Do not resolve or dismiss records directly from the overview unless the inspector provides a type-specific, authorized action with confirmation.
- Preserve keyboard and screen-reader navigation.
- Maintain fast first render; do not make the overview wait on optional secondary metrics.

Verification:
- npx tsc --noEmit -p tsconfig.json
- focused overview/deep-link tests
- npm run build if available; otherwise state why it cannot run
- git diff --check
- git status --short

Stop. Do not change cron, monitoring, or calendar business logic.
```

---

## Prompt 5: Log Explorer and Correlation Contract

```text
Implement a unified Admin Log Explorer only for evidence already captured by the system.

Scope existing sources first:
- monitoring events
- client error fingerprints/events
- cron telemetry/runs
- API monitoring events
- notification dispatch events, only if their schema is already available

Requirements:
1. Define a normalized display DTO, not a new event database unless the current data cannot be safely queried.
2. Support URL-persisted filters for date range, severity, source/domain, route, request ID, fingerprint, cron/job, and deployment SHA only where those fields actually exist.
3. Use keyset pagination or bounded date windows. Do not load an unbounded event table.
4. A row opens AdminRecordInspector or a dedicated event detail route with the same canonical URL contract.
5. Show correlation links only when values are present and exact: request ID, fingerprint, cron run, deployment SHA, notification dispatch identifier.
6. Redact PII and secrets in display DTOs. User references should be opaque IDs with a controlled link to a dossier, never full raw payload dumps.
7. Keep a clear distinction between “no events”, “source unavailable”, and “query failed”.

Do not claim full distributed tracing. This is an evidence browser over existing telemetry.

Tests:
- filter parsing and URL persistence
- bounded pagination
- redaction of known sensitive fields
- correlation links appear only with real identifiers

Verification:
- npx tsc --noEmit -p tsconfig.json
- focused tests
- git diff --check
- git status --short

Stop. Do not add external observability vendors in this prompt.
```

---

## Prompt 6: Operational Motion, Loading, and Accessibility Pass

```text
Apply a restrained interaction-quality pass across the shared admin shell, overview, queues, inspector, and log explorer.

Motion requirements:
- Route/content transition: opacity plus 4-8px movement, 160-200ms.
- Inspector: right-side slide, 180-220ms.
- First-load queue rows: one-time stagger, maximum 30ms between rows.
- Mutation feedback: local status transition plus toast/banner; no indefinite pulse.
- Skeletons only for regions that are loading; preserve layout dimensions.
- Respect prefers-reduced-motion by removing transforms/staggers and retaining only instant state changes.

Accessibility requirements:
- Dialog/drawer focus trap, Escape close, return focus to invoking control.
- Keyboard-accessible rail, command palette, tabs, rows, and inspector actions.
- Visible focus indicators and sufficient contrast for warning/degraded/error states.
- Screen-reader announcements for completed and failed mutations.

Visual constraints:
- Keep the admin console dense and utilitarian.
- Remove gratuitous gradients, permanent pulses, oversized rounded cards, and hover scaling that shifts layout.
- Do not change business logic, database access, URL contracts, or actions in this prompt.

Verification:
- npx tsc --noEmit -p tsconfig.json
- focused interaction/accessibility tests where the existing test stack supports them
- manual keyboard walkthrough of Overview, Monitoring, Moderation, Calendar Governance, and Crons
- git diff --check
- git status --short

Stop and provide screenshots or a concise visual verification receipt before any commit.
```
