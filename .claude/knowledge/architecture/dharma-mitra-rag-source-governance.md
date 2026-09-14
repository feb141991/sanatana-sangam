# Dharma Mitra RAG — Explicit Intent and Source Governance

**Date:** 2026-09-14  
**Session context:** Production review of the multi-corpus Dharma Mitra RAG router  
**Category:** architecture

## What we decided
The scripture explicitly named in the current message selects the corpus before the user&apos;s saved tradition. Saved tradition is a fallback only when the message does not name a source family.

RAG prompt wording must derive from the corpus trust state. Public-domain and approved source passages may be described as source-backed; Shoonaya curated lessons must be labelled as retellings; source-audit-pending material must be withheld from prompt context. A recognized but withheld source adds a fail-closed policy note so the model does not invent quotations.

## Why
A profile preference describes the user, but it cannot override the source they are asking about. Doing so returned Sikh or Jain material for explicit Gita or Ramayana questions.

The model previously received a universal “verified Pramana” label even when manifests said `restricted_or_pending`, `needs_source_audit`, or `curated_lesson`. That erased the distinction between canonical text, translation, and interpretation required by `PATHSHALA_SOURCE_POLICY.md`.

## Constraints this creates
- Router matching uses complete tokens or bounded phrases; short concepts such as `om` must never match inside ordinary words such as `computer`.
- Explicit source-family terms take precedence over stored tradition.
- `valmiki_ramayana` remains recognized but returns zero passages until human source audit approval.
- Curated Katha material must be presented as a Shoonaya retelling or study lesson, never as a verbatim scripture quotation.
- The chat route appends fail-closed policy notes even when `rag_grounded` is false.
- RAG telemetry is stored in Supabase `monitoring_events`; it must not be described as Datadog telemetry unless a Datadog exporter is actually installed and verified.

## What we explicitly rejected
We rejected treating a populated embedding index or passing structural validator as proof that its source material is canonical or approved. We also rejected silently routing an explicit scripture question according to profile tradition.

---
