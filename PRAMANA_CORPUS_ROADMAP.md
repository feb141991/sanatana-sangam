# Pramana Corpus Roadmap v1

Launch-trust + core tradition activation roadmap for Shoonaya's Pramana/RAG scripture layer.

Last updated: 2026-06-20

## Purpose

This document is the single source of truth for what is done, what is pending, and what Shoonaya can honestly claim about Pramana corpus/RAG coverage.

It consolidates the current state from:

- `PATHSHALA_SOURCE_POLICY.md`
- `pramana_corpus_status.md`
- `pramana_corpus_expansion_plan.md`
- `PRAMANA_MODULE_MAP.md`
- `python/ai_pipeline/corpus/*`
- `src/lib/ai/retrieval.ts`

This roadmap does not claim full dharmic canon parity. It defines a practical, source-aware path from the current mixed corpus state to a credible tradition-aware RAG foundation.

## Executive Status

| Layer | Current State | Target State |
|---|---|---|
| Corpus data | Mixed: Gita strong, Buddhist/Jain indexed, Sikh/Upanishads sample-scale, many scaffolds | Clear corpus maturity by tradition and source state |
| RAG routing | Gita strongest; other lanes mostly explicit-only | Tradition-aware retrieval routing |
| Source trust | Policy exists | Metadata enforced per corpus |
| Eval | 7 suites pass, many mock/sample | Real eval coverage per activated corpus |
| Product claim | Must stay conservative | Source-aware scripture study, not full canon parity |

## Corpus Maturity Definitions

| Stage | Meaning | Product Claim Allowed |
|---|---|---|
| Scaffolded | Placeholder manifest or 1-2 sample items exist | Catalog/later only |
| Sample-scale indexed | Index exists but coverage is limited | Starter study lane |
| Production-scale indexed | Meaningful passage count exists and retrieval works | Indexed corpus available, with caveats |
| Runtime activated | Tradition-aware routing, prompt mode, and eval coverage are wired | Tradition-aware study support |
| Rights-complete | Source and usage rights are explicit and machine-readable | Stronger local corpus claim |

## Priority Roadmap

| Priority | Theme | Outcome |
|---|---|---|
| P1 | Trust + activation foundation | Clean source metadata, fix docs, activate Buddhist/Jain properly |
| P2 | Core tradition depth | Expand Sikh/Gurbani and Upanishads |
| P3 | High-value Hindu expansion | Add Yoga Sutras and clear the Valmiki Ramayana starter source audit |
| P4 | Expansion backlog | Mahabharata, Tamil, Shaiva, Jain Agamas, Mahayana, Bhakti poetry, commentaries, audio |

## P1 - Trust Foundation + Core Runtime Activation

| Workstream | What To Do | Why It Matters | Done When |
|---|---|---|---|
| Corpus status source of truth | Retire contradictions between older status docs and this roadmap | Current docs disagree on Buddhist/Jain maturity | This file is maintained as canonical |
| Rights metadata | Add machine-readable source/rights fields to every manifest | Required by `PATHSHALA_SOURCE_POLICY.md` | Every manifest has source, rights, language, script, original/translation/audio status |
| Buddhist activation | Move `buddhist_dhamma` from explicit-only/mock-ish to product-ready tradition flow | It already has 109 indexed passages | Buddhist user queries retrieve Buddhist corpus by default when appropriate |
| Jain activation | Move `jain_dharma` from explicit-only/mock-ish to product-ready tradition flow | It already has 107 indexed passages | Jain user queries retrieve Jain corpus by default when appropriate |
| Eval hardening | Add real grounding cases for Buddhist/Jain runtime | Prevents hallucinated scripture explanation | Eval covers representative user questions and regression checks |

## P2 - Core Tradition Depth

| Tradition | Corpus | Current | Target | Pending |
|---|---|---|---|---|
| Sikh | Gurbani / Nitnem | 34 indexed docs, sample-scale | Fuller Nitnem/Gurbani lane | Rights confirmation, more bani, stronger metadata, eval |
| Hindu / Vedanta | Upanishads | 45 indexed curated passages across the 11 Principal Upanishad names; sample-scale | Principal Upanishads as strong explicit corpus | Fuller passage coverage, source metadata hardening, original-text clarity |

## P3 - High-Value Hindu Expansion

| Corpus | Current | Target | Why |
|---|---|---|---|
| Yoga Sutras | Missing | New indexed corpus with eval suite | High demand, compact source shape, good RAG fit |
| Ramayana | Source-audit pending metadata starter only; no live-approved canonical text | Rebuild a verified Griffith/Gutenberg English starter, keep Sanskrit companion-only until digital-source rights clear, then expand Kanda/Sarga coverage | High devotional and family-learning value |
| Mahabharata starter | Shanti Parva scaffold only | Optional curated study passages | Useful after Ramayana/Yoga Sutras |

## P4 - Expansion Backlog

| Corpus Family | Priority | Notes |
|---|---:|---|
| Full Guru Granth Sahib | High but rights-gated | Do not claim full coverage until terms are confirmed |
| Dasam Granth | Sensitive | Needs authority/source review |
| Full Jain Agamas | High but permission-first | Keep conservative |
| Kalpa Sutra | Medium | Scaffold exists |
| Full Buddhist canon | Medium | Expand beyond Dhammapada gradually |
| Bodhicharyavatara | Medium | Mahayana lane |
| Tirukkural | Medium | Strong ethical text, scaffold exists |
| Divya Prabandham | Medium | Sri Vaishnava Tamil lane |
| Tiruvachakam | Medium | Shaiva Tamil lane |
| Kashmir Shaiva texts | Medium | Scaffold exists |
| Kabir / Sant poetry | Medium | Strong devotional wisdom lane; source audit needed |
| Commentaries / Bhashya | Later | Must be visually distinct from canonical text |
| Audio / recitation corpus | Separate track | Rights standard is stricter than text |

## Tradition-Wise Readiness

| Tradition | Current RAG Strength | Main Gap | Recommended Next Move |
|---|---|---|---|
| Hindu / Sanatan | Strongest because of Gita | Upanishads still curated/sample-scale; Yoga missing; Ramayana starter still source-audit pending | Finish Upanishads, clear Ramayana source audit, add Yoga Sutras |
| Sikh | Early sample | Broader Gurbani/Nitnem rights and ingestion | Expand Gurbani after rights confirmation |
| Buddhist | Data strong, product activation weaker | Runtime routing and prompt/eval maturity | Activate Buddhist Dhamma as proper tradition lane |
| Jain | Data strong, rights/product maturity weaker | Permission clarity and routing | Activate Jain Dharma cautiously with visible provenance |
| Tamil / Regional | Mostly scaffold | No real indexed corpus yet | Keep in P4 until core traditions stabilize |

## Current Indexed Corpus Counts

| Index | Corpus | Count | Notes |
|---|---|---:|---|
| `gita_index.json` | Bhagavad Gita | 701 | Strongest current production lane |
| `upanishads_index.json` | Upanishads | 45 | Sample-scale curated passages across the 11 Principal Upanishad names |
| `gurbani_index.json` | Sikh Gurbani | 34 | Sample-scale |
| `buddhist_dhamma_index.json` | Buddhist Dhamma | 109 | Production-scale index, still needs stronger activation |
| `jain_dharma_index.json` | Jain Dharma | 107 | Production-scale index, still needs stronger activation |
| `valmiki_ramayana_index.json` | Valmiki Ramayana | 15 | Source-audit pending metadata starter; not live-approved canonical text |

## Claiming Rules

| Can Claim Now | Do Not Claim Yet |
|---|---|
| Source-aware scripture study | Full cross-tradition canon parity |
| Gita-first deep local corpus | Full Guru Granth Sahib coverage |
| Tradition-first Pathshala structure | Full Jain Agama coverage |
| Buddhist/Jain indexed starter corpora | Universal rights-cleared corpus |
| Companion-linked authoritative sources | In-app authoritative recitation audio |

## Source / Rights Enforcement Checklist

Before any corpus moves beyond scaffold/sample status, confirm:

| Requirement | Required Field / Evidence |
|---|---|
| Named source | `source_name`, `source_url`, `source_owner` |
| Rights state | `rights_status` |
| Source class | canonical, translation, commentary, curated lesson, AI reflection |
| Language/script | `language`, `script` |
| Original text status | live, companion, unavailable |
| Translation status | live, companion, unavailable |
| Audio status | live, companion, unavailable |
| Revision note | OCR caveat, edition note, generated transliteration note, or similar |
| Eval status | grounding, source metadata, language compliance |

## Retrieval / Routing Readiness

| Corpus | Current Routing | Target |
|---|---|---|
| `pathshala_gita` | Active/default fallback | Keep active; strengthen metadata |
| `pathshala_upanishads` | Explicit-target only | Keep explicit until coverage expands |
| `sikh_gurbani` | Explicit-target only | Tradition-aware Sikh routing after rights/data expansion |
| `buddhist_dhamma` | Explicit-target only | Tradition-aware Buddhist routing |
| `jain_dharma` | Explicit-target only | Tradition-aware Jain routing |
| `valmiki_ramayana` | Source-gated / blocked | Do not route until a verified Griffith/Gutenberg starter exists |

## Eval Coverage Matrix

| Suite | Current Status | Next Need |
|---|---|---|
| `pathshala_gita` | Passing | Add more real user-style questions |
| `pathshala_upanishads` | Passing | Expand coverage with full corpus |
| `sikh_gurbani` | Passing sample | Add more Nitnem/Gurbani cases |
| `buddhist_dhamma` | Passing sample | Add runtime/tradition-routing tests |
| `jain_dharma` | Passing sample | Add runtime/tradition-routing tests |
| `bhakti_katha` | Passing sample | Add source metadata and optional index |
| `bhakti_panchatantra` | Passing sample | Add source metadata and optional index |

## Product Guardrails

1. Do not imply all traditions have equal corpus depth.
2. Do not present companion-only sources as local corpus coverage.
3. Do not merge canonical text, translation, commentary, and AI reflection visually.
4. Do not claim authoritative in-app recitation audio until audio rights are explicit.
5. Do not widen corpus claims faster than source/rights metadata.

## Next 30 / 60 / 90 Days

| Window | Focus | Output |
|---|---|---|
| 30 days | P1 trust cleanup | Canonical status, rights metadata schema, Buddhist/Jain activation plan |
| 60 days | P1 activation + P2 depth | Buddhist/Jain tradition routing; expanded Gurbani/Upanishad manifests |
| 90 days | P3 buildout | Yoga Sutras corpus and source-cleared Valmiki Ramayana starter slice |

## Open Decisions

| Decision | Owner Needed | Notes |
|---|---|---|
| Sikh source terms | Product / legal / pramana reviewer | Confirm what can be stored locally |
| Jain source permissions | Product / legal / pramana reviewer | Keep conservative until clarified |
| Buddhist expansion source | Pramana reviewer | Decide Dhammapada-only vs broader SuttaCentral-compatible scope |
| Audio rights model | Product / legal | Treat as separate from text corpus |
| Commentary layer | Product / pramana reviewer | Needs UI distinction from canonical text |
