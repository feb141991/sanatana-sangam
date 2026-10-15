# Search Console Evidence and Indexing Triage

**Date:** 2026-10-16  
**Session context:** Establishing a repeatable Search Console review process after reviewing Shoonaya's indexing and performance reports  
**Category:** decision

## What we decided
Use Google Search Console as evidence about Google's crawl, indexing and search performance, while treating submissions and validation requests only as requests for Google to act. Triage URLs by intended search visibility and the specific reported state; the goal is not to make every excluded URL indexed.

The operating checklist and review record live in `docs/SEARCH_INDEXING_OPERATIONS.md` and should be updated there as GSC workflows evolve.

## Why
GSC reports can lag behind deployments, while redirects and `noindex` exclusions may be correct by design. Repeatedly requesting indexing or reacting to a stale aggregate count can waste effort or introduce low-value URLs into search. Matched performance windows and representative URL inspections provide more useful evidence than a single manual query or a submission receipt.

## Constraints this creates
- Record report freshness, property, filters and comparison window with every material conclusion.
- Keep sitemap entries canonical, successful, crawlable pages intentionally meant for search; link internally to their final URLs.
- Inspect Google's selected canonical when canonicalization is in question.
- Request recrawling selectively after a live fix; do not promise indexing, timing or ranking.
- Keep Search Performance evidence separate from AI feature observations and from IndexNow receipts.

## What we explicitly rejected
- Treating all "not indexed" URLs as defects or forcing every URL into the index.
- Treating a successful sitemap submission, URL Inspection request or validation start as proof of indexing or ranking improvement.
- Repeatedly resubmitting unchanged pages instead of fixing content, canonical, discovery or technical issues.

---
