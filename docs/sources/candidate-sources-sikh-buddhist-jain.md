# Candidate sources — Sikh, Buddhist, Jain (unverified, for council review)

**PARKED 2026-08-18 (founder decision): Buddhist and Jain sourcing/verification
is a deprioritized body of work, to be picked up together later.** This affects
`paryushana-parva-begins` (Jain, disputed for 2027/2028), `vassa-begins-rains-retreat`
and `kathina` (Buddhist, both deferred) in `rules.json` — no further engineering
action on any of these pending a real Tier 1-4 source. Sikh sourcing (SGPC) is
NOT parked by this decision — see the Sikh section below, which already has a
real Tier-1 candidate; only the fork question (P2) blocks it.

**Status: research only — none of this has been verified against a primary
document, and none of it has been entered into any `golden_fixtures` row.**
Per `docs/source-governance.md` §2, only a human with the actual publication
in hand can turn a candidate into a citation. This file exists so the
candidates aren't lost, not to assert they're correct.

**Context**: `golden_fixtures` currently has zero rows for Sikh, Buddhist, or
Jain observances — the 216 seeded placeholders (see tracker item 4.2) are
Hindu-only. The three rules flagged in the 2026-08-11 tracker entry as
needing a separate source — `kathina`, `vassa-begins-rains-retreat`,
`paryushana-parva-begins` (`packages/dharma-rules/src/festivals/rules.json`)
— have no fixture row to attach a citation to yet; someone needs to decide
whether/how to seed one before any of this can reach the admin approval UI
(`/admin/calendar-governance`).

## Sikh

| Field | Value |
|---|---|
| Candidate Tier-1 authority | **SGPC** (Shiromani Gurdwara Parbandhak Committee) |
| What they publish | Official Nanakshahi calendar, released annually at Akal Takht, Amritsar. Nanakshahi 558 (current cycle) = 2026-03-14 to 2027-03-13. |
| Known caveat | `calendar-profiles.md` §3.1 already flags an **unresolved fork**: 2003-Nanakshahi (SGPC's own redesign, by Pal Singh Purewal) vs. Bikrami, used by different Sikh institutions. Sourcing from SGPC does not settle this — it's council item **P2**, a policy choice, not a missing-citation problem. |
| Links | [SGPC official Nanakshahi calendar](https://sgpc.net/nanakshahi-calendar/) · [2026 calendar PDF](https://sgpc.net/wp-content/uploads/2025/03/Calender-Nanakshahi-557.pdf) · [Release announcement](https://apnapunjabmedia.com/nanakshahi-calendar-release-2026/) |

## Buddhist

| Field | Value |
|---|---|
| Candidate Tier-1 authority | **Sri Lanka Department of Buddhist Affairs**, jointly with the government-appointed **Poya Committee** |
| What they publish | Official annual Poya (full-moon) calendar and rulings on contested dates — e.g. the 2026 Vesak Poya ruling (30 May, resolving a public dispute over two full moons in May). |
| Known gap | No confirmed Tier-1 source found yet for Vassa/Kathina specifically (`vassa-begins-rains-retreat`, `kathina` in `rules.json`) — these are Theravāda monastic-calendar dates, not civil Poya holidays, and may need a different authority (e.g. a specific national Sangha body) rather than the Dept. of Buddhist Affairs. Thailand's official Buddhist-Era civil calendar is a plausible second candidate but no specific publishing body/URL was confirmed — flagged as unverified, not asserted. |
| Links | [Vesak Full Moon Poya Day confirmed for May 30 — Ada Derana](https://adaderana.lk/news/122012) · [Clarification on the public holiday — Fact Crescendo Sri Lanka](https://srilanka.factcrescendo.com/english/an-explanation-about-the-public-holiday-the-day-after-vesak-poya-day/) |

## Jain

| Field | Value |
|---|---|
| Candidate Tier-1 authority | **None identified.** Unlike Hindu/Sikh/Buddhist, Jain observance calendars do not appear to be issued by a state or single central body in the same way. |
| Candidate Tier-4 authority | Not confidently named — a specific Śvetāmbara or Digambara trust would be the right category, but no single body was confirmed strongly enough to name here rather than guess. |
| Known fork (real, confirmed) | Śvetāmbara and Digambara calendars **genuinely diverge**: Śvetāmbara's 8-day Paryushan ends at Samvatsari (2026: 8–15 September per secondary sources); Digambara's parallel 10-day Daśa Lakṣaṇa Parva begins where that ends. Any source must declare which sect it represents — this is not a rounding difference, both traditions publish different dates and both are legitimate. |
| Links | [Samvatsari — Wikipedia](https://en.wikipedia.org/wiki/Samvatsari) · [Paryushan Parva 2026 — bhaktiras.net](https://www.bhaktiras.net/festivals/paryushan-parva/) *(secondary source, not Tier 1–4 — for orientation only)* |

## Next step, if this is picked up

1. Council/human decision on the Sikh 2003-Nanakshahi-vs-Bikrami fork (P2) —
   sourcing can't proceed without it.
2. Identify a real Tier-1–4 authority for Theravāda Vassa/Kathina specifically
   (not just civil Poya holidays) and for a named Jain sect.
3. Once a real source is in hand, someone with `golden_fixtures` write access
   would need to seed rows for these festival_ids before the existing
   `/admin/calendar-governance` approval flow (edit → Approve, disabled until
   `expected` is set and `source.ref` isn't a `TODO` stub) can be used at all.
