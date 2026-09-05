# Ground-Truth Admin Route, Deep-Link & Information Architecture Audit

**Scope:** `src/app/admin/**`, `src/app/api/admin/**`  
**Date:** September 5, 2026  
**Audited Artifact:** `docs/audits/admin-operations/route-registry.json`

---

## 1. Executive Summary

An exhaustive ground-truth inspection of all 16 administrative UI screens and 32 administrative API endpoints was conducted.

### Key Audit Findings
1. **Deep-Link Disconnects in Alert System**:
   - `/api/admin/alerts` produces parameterized links for 4 core incident categories (Client Crashes, Calendar Integrity Findings, Content Moderation Reports, and Dharm Veer Biographies).
   - Only **1 out of the 4** destinations (`/admin/calendar-governance`) actually parses its deep-link parameters and targets the relevant finding/tab.
   - The other 3 destinations (`/admin/monitoring`, `/admin/moderation`, and `/admin/dharm-veer-review`) completely discard or fail to consume their respective query parameters (`section/fingerprint`, `reportId`, `slug`), stranding administrators on default root states.
2. **Navigation Fragmentation**:
   - Administrative destinations are duplicated in three independent places:
     1. The top header dropdown bar (`AdminNavHeader.tsx`).
     2. The dashboard `/admin` command-card matrix (4 large domain cards duplicating all 11 tool destinations).
     3. Inconsistent page-local "Back" buttons across individual tools.
3. **Absence of Shared URL-State Synchronization**:
   - Tab states in `/admin/monitoring` (`apis`, `telemetry`, `push`, `errors`, `ai_reports`), `/admin/dharm-veer-review`, and `/admin/observance-content` are stored purely in transient React local component state (`useState`), making it impossible to share links, reload a filtered view, or use browser back/forward navigation reliably.

---

## 2. Alert Deep-Link Verification Matrix

| Alert Category | Emitted `href` Pattern | Target Screen | Emitted Parameters | Actually Consumed by Screen? | Classification | Root Cause & Failure Mode |
|---|---|---|---|---|---|---|
| **Client Crash Spike / New Fingerprint** | `/admin/monitoring?section=errors&fingerprint={fp}` | `/admin/monitoring` | `section=errors`, `fingerprint={fp}` | ❌ **No** | **Broken** | `MonitoringClient.tsx` initializes `activeTab` to `"apis"` and does not call `useSearchParams()`. The `section` and `fingerprint` queries are completely ignored. |
| **Calendar Integrity Finding** | `/admin/calendar-governance?tab=integrity&findingId={id}&slug={slug}&year={year}` | `/admin/calendar-governance` | `tab=integrity`, `findingId={id}`, `slug={slug}`, `year={year}` | ✅ **Yes** | **Working** | `calendar-governance/page.tsx` explicitly reads `tab`, `findingId`, `slug`, and `year`, activates the `integrity` tab, and scrolls/focuses the targeted finding row. |
| **Pending Content Report** | `/admin/moderation?reportId={id}` | `/admin/moderation` | `reportId={id}` | ❌ **No** | **Broken** | `moderation/page.tsx` and `ModerationClient.tsx` have no `searchParams` props or `useSearchParams()` hooks. All reports are rendered indiscriminately; no record focus occurs. |
| **Dharm Veer Biography Review** | `/admin/dharm-veer-review?slug={slug}` | `/admin/dharm-veer-review` | `slug={slug}` | ❌ **No** | **Broken** | `dharm-veer-review/page.tsx` does not parse `slug`. It renders the entire pending list with all accordion cards collapsed. |
| **Operational Degraded / Fallback** | `/admin/monitoring` | `/admin/monitoring` | *(None)* | ✅ **Yes** | **Working** | Navigates directly to the root monitoring sentry. |

---

## 3. Administrative Route Inventory & Query Parameter Support

### A. Operational & Governance Workspaces

| Route Path | Screen Title | Category | Declared `searchParams` | Consumed Query Params | Live Data Sources | Available Actions |
|---|---|---|---|---|---|---|
| `/admin` | Command Center Home | Overview | *(None)* | *(None)* | `/api/admin/stats`, `/api/admin/alerts`, `calendar_integrity_findings` | Flush Cache, Quick Resolve Finding |
| `/admin/calendar-governance` | Calendar Governance | Canon & Dharma | `tab`, `findingId`, `slug`, `year` | `tab` (`integrity`, `review`, `coverage`, `fixtures`, `activity`), `findingId`, `slug`, `year` | `/api/admin/calendar-governance/*` | Resolve Finding, Resolve All, Approve Fixture, Recalculate Year |
| `/admin/observance-content` | Content Studio | Canon & Dharma | *(None)* | *(None)* | `/api/admin/observance-content` | Save/Publish Story, Upload Deity Art, Manage Sources |
| `/admin/dharm-veer-review` | Dharm Veer Review | Canon & Dharma | *(None)* | *(None)* *(Alert emits `slug`)* | `/api/admin/dharm-veer-review` | Approve Bio, Reject Bio, Regenerate Bio |
| `/admin/hindi-generator` | Sacred Hindi Generator | Canon & Dharma | *(None)* | *(None)* | `/api/admin/generate-hindi-meanings` | Batch Sarvam Translation |
| `/admin/users` | Seeker Directory & Dossiers | Community & Trust | `segment`, `query`, `userId` | `segment` (`all`, `onboarded`, `streak`, `banned`, `pro`), `query`, `userId` | `/api/admin/users`, `/api/admin/users/[userId]` | Ban, Unban, Grant Pro, Issue Warning, Cascade Hard Delete, Scrub PII |
| `/admin/users/[id]` | Seeker Dossier Direct | Community & Trust | `tab` | `tab` (`timeline`, `notifications`, `karma`, `moderation`, `compliance`) | `/api/admin/users/[userId]` | Ban, Unban, Warn, Hard Delete, Scrub PII |
| `/admin/tirtha` | Mandali & Tirtha Hub | Community & Trust | *(None)* | *(None)* | `/api/admin/mandalis` | View Mandalis, Manage Chapters |
| `/admin/tirtha/review` | Mandali Review Queue | Community & Trust | *(None)* | *(None)* | `/api/admin/mandalis/review` | Approve Mandali, Reject Mandali |
| `/admin/moderation` | Trust & Moderation | Community & Trust | *(None)* | *(None)* *(Alert emits `reportId`)* | `/api/admin/reports/[reportId]`, `/api/admin/users/[userId]/warn`, `/api/admin/posts/[postId]` | Review Report, Action Report, Dismiss Report, Warn User, Delete Post |
| `/admin/monitoring` | Operational Sentry & Health | Telemetry & Infra | `aiReportStatus` | `aiReportStatus` (`pending`, `all`, `reviewed`, `actioned`, `dismissed`) *(Alert emits `section`, `fingerprint`)* | `monitoring_events`, `content_reports`, `/api/admin/client-errors`, `/api/admin/push-monitoring` | Resolve/Dismiss AI Report, Revalidate Cache |
| `/admin/crons` | Cron Health & Telemetry | Telemetry & Infra | *(None)* | *(None)* | `/api/admin/crons`, `/api/admin/logs` | Trigger Cron Manually, Simulate Log |
| `/admin/reports` | Executive Analytics & Export | Telemetry & Infra | `tab` | `tab` (`overview`, `growth`, `sadhana`, `commercial`, `governance`, `logs`) | `/api/admin/reports`, `/api/admin/reports/export` | Export CSV (`seekers`, `sadhana`, `subscriptions`, `moderation`) |
| `/admin/notifications` | Notification Studio | Communications | *(None)* | *(None)* | `/api/admin/notification-templates`, `/api/admin/notification-templates/test` | Update Template, Send Test Push |
| `/admin/broadcast` | Global Broadcast | Communications | *(None)* | *(None)* | `/api/admin/broadcast` | Dispatch Platform Broadcast |
| `/admin/settings` | Platform Settings | Settings | *(None)* | *(None)* | *(None)* | Feature Flags, Security Keys |

---

## 4. Navigation Redundancy & Information Architecture Analysis

### Current Inefficiencies
1. **Three Duplicated Menus**:
   - **Header Bar (`AdminNavHeader.tsx`)**: 4 dropdown menus containing 11 tool destinations.
   - **Overview Command Cards (`src/app/admin/page.tsx`)**: 4 large cards reproducing the exact same 11 links with redundant descriptions.
   - **Quick Links**: Ad-hoc cross-links (e.g. "Cron Health Matrix &rarr;" in Monitoring, "Flush Cache" in multiple locations).
2. **Missing Unified Command/Search**:
   - There is currently no quick navigation palette (e.g., `Cmd+K`) to rapidly jump across admin workspaces or search routes.
3. **Inconsistent Navigation Patterns**:
   - Sub-screens use varying styles of back links: some use small text arrows, others use round icon buttons (`ChevronLeft`), and others have no back link at all.

---

## 5. Action Plan for Prompts 1–6

1. **Prompt 1 (URL-State & Deep Links)**:
   - Introduce a typed URL-state helper (`src/lib/admin-url-state.ts`).
   - Fix deep-link consumption in:
     - `/admin/monitoring`: support `tab=errors&fingerprint={fp}`, `tab=telemetry&severity={sev}`, `tab=ai_reports`.
     - `/admin/moderation`: support `reportId={id}` to focus and highlight the targeted report.
     - `/admin/dharm-veer-review`: support `slug={slug}` to auto-expand the targeted biography card.
2. **Prompt 2 (Shell & Route Registry)**:
   - Implement persistent desktop left rail + compact top breadcrumb bar with live alerts badge and global search.
3. **Prompt 3 (Admin Record Inspector)**:
   - Create right-side slide-over drawer for inspecting findings, reports, error fingerprints, and biographies without losing context.
4. **Prompt 4 (Overview Redesign)**:
   - Transform `/admin` from a static link directory into an action-oriented operational overview with a prioritized "Needs Attention" queue.
5. **Prompt 5 (Log Explorer)**:
   - Unify existing telemetry (monitoring events, client error fingerprints, cron logs) with bounded pagination and redaction.
6. **Prompt 6 (Interaction & Accessibility)**:
   - Polish motion (respecting `prefers-reduced-motion`), focus management, and keyboard navigation.
