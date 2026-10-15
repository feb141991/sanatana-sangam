# Search discovery and submission

This file is the operating runbook for Search Console (GSC), indexing and
search-discovery work. It records how to interpret reports and choose work; it
does not promise indexing, ranking or traffic outcomes.

## What acceptance means

IndexNow HTTP 200 acknowledges a submission, not indexing, ranking, or a
recrawl within minutes. HTTP 202 means key validation is pending; the script
fails without advancing its snapshot so the next run retries. Do not claim
delivery to named downstream crawlers without provider evidence.

The same evidence rule applies in Google Search Console: a sitemap submission,
URL Inspection request, or validation start is an action acknowledged by
Google, not proof that a URL was crawled, indexed, selected as canonical, or
ranked. Record the report's own last-update date with every count. Page
indexing and enhancement reports can lag behind a source deployment or a
validation request; compare only refreshed reports and inspected URLs.

The workflow runs on successful Production deployment events, daily at
03:17 UTC, and manual dispatch. It submits sitemap additions/removals and
last-modified changes; deployment runs also inspect source changes. Daily
runs must not label the current main SHA as deployed. Unchanged URLs are
not deliberately resubmitted daily. Static source changes need a production
deployment event. Database content edits need truthful last-modified data
or a deliberate manual full submission; creation timestamps cannot detect edits.

`INDEXNOW_DRY_RUN=true node scripts/submit-indexnow.mjs` previews live sitemap
selection without submitting or changing the checkpoint. `node
scripts/submit-indexnow.mjs` submits changes. `INDEXNOW_FORCE_SUBMIT=true`
explicitly resubmits the full current sitemap. Local receipts under `.indexnow/`
are ignored by Git. A failed sitemap query must not produce a successful partial
sitemap, since missing URLs could otherwise be interpreted as removals.

## Google: use Search Console, not the restricted Indexing API

Google's Indexing API is restricted to JobPosting and livestream pages with
BroadcastEvent embedded in VideoObject. Shoonaya's scripture, course, festival,
and Panchang pages do not qualify. Do not grant a service account Search Console
Owner access or reuse GOOGLE_SERVICE_ACCOUNT_KEY for bulk URL notifications.

In the verified Search Console property for shoonaya.com (or the exact
https://www.shoonaya.com/ URL-prefix property), open Sitemaps and submit
https://www.shoonaya.com/sitemap.xml. Use URL Inspection on a small number of
important published pages. Monitor Page indexing, sitemap fetch errors,
Google-selected canonicals and Core Web Vitals. Submission is not an indexing guarantee.

IndexNow is a discovery signal for participating engines; it is not Google's
indexing or ranking telemetry. Use Search Console for Google-specific evidence.

## GSC triage and URL disposition

Start each review by recording the property, report, report last-update date,
date range, search type, filters and exported URL sample. Keep source fixes,
deployment time, validation start and report refresh time in the same audit
record. Do not compare an old report count to a newer deployment as if Google
had already recrawled it.

Classify affected URLs before changing anything. The goal is not to drive every
"not indexed" count to zero; only pages intended to appear in Search should be
indexable.

| GSC state | Expected handling |
| --- | --- |
| Page with redirect | Usually expected for alternate hosts, retired slugs or normalized URLs. Keep the redirect when intentional, but remove the redirecting URL from sitemaps and update internal links to point directly to the final canonical URL. Investigate redirect chains, loops, unrelated targets and redirects that replace a useful page without an equivalent destination. |
| Excluded by `noindex` | Expected only for intentionally private, utility, duplicate or otherwise excluded pages. Keep the page crawlable so Google can see `noindex`; remove it from the sitemap. If the page should rank, remove the directive and verify the rendered response and canonical. |
| Not found (404) | Check whether the URL is a typo, stale link, deleted content or a real missing page. Fix internal links and sitemap entries. Use a permanent redirect only when a relevant replacement exists; otherwise a truthful 404/410 is appropriate. Do not redirect every missing URL to the homepage. |
| Discovered — currently not indexed | Google knows the URL but has not crawled it yet. Confirm it is valuable, canonical, in the sitemap if indexable, and reachable through ordinary crawlable links from relevant pages. Check crawl stats and server availability before inferring a crawl-capacity issue. Do not repeatedly request indexing for the same unchanged URL. |
| Crawled — currently not indexed | Google fetched the URL but did not include it. Inspect the rendered page, canonical, duplication, substantive uniqueness, usefulness and whether the page is a soft 404. Improve or consolidate the content based on evidence; resubmitting alone does not resolve a quality or duplication decision. |
| Duplicate / Google chose another canonical | Inspect both the declared and Google-selected canonical. Align redirects, `rel=canonical`, sitemap entries, internal links, host and protocol. If the pages are meant to be distinct, ensure they provide materially distinct user value; do not create near-duplicate pages just to target keyword variants. |
| Server error / blocked / other technical exclusion | Reproduce the live response, inspect robots and rendered HTML, correlate server logs by request ID when available, and fix the actual failure before requesting re-crawl. Do not treat a transient outage as a content-quality conclusion. |

For every URL class, first decide whether those URLs are meant to be indexed.
If not, document the intended disposition and stop trying to force them into
Search. If yes, verify all of the following on the live deployed URL:

- It returns a stable `200` response and Googlebot is not blocked.
- It has indexable, useful content available to Google, including after
  rendering where client-side code is involved.
- Its canonical is absolute, points to the preferred URL, and agrees with
  redirects, sitemap entries and internal links.
- It is included in the sitemap only if it is the canonical URL and is meant
  for Search; `lastmod` reflects a real meaningful content change.
- It has at least one relevant, crawlable internal link, not only a sitemap
  entry or a client-side interaction that Google may not follow.

Use URL Inspection for representative, high-value URLs and after a real fix.
Request indexing selectively after the live fix is deployed. Reserve manual
requests for important changed pages; use a sitemap for groups of URLs. Do not
use Google's Indexing API for Shoonaya's ordinary content pages, and do not
loop through URL Inspection requests as a substitute for resolving site-wide
signals.

## Sitemap and canonical release gate

Before every sitemap or indexing change, run the repository's sitemap and
metadata checks where available and inspect the production sitemap response.
Confirm that entries are absolute HTTPS URLs on the canonical `www` host, return
success, are indexable, use the expected self-canonical, and contain no
redirects, noindex pages, error pages, private pages, tracking variants or
unreviewed calendar claims. Verify important navigation links point to the
same canonical URLs. Re-check the sitemap in GSC after deployment; a successful
fetch means Google processed the sitemap file, not that every URL was indexed.

Keep redirects for consolidation and user experience where appropriate; the
rule is to keep redirected URLs out of the sitemap and link to their final
destination. A Search Console "Page with redirect" count is not itself a bug.
It becomes actionable when the redirected URL is advertised as canonical, is
still internally linked, creates a chain/loop, or sends users to the wrong
destination.

## Structured data, security and experience reports

- Treat Search Console enhancement reports as eligibility and markup
  diagnostics, not as a ranking score. Markup must match visible page content
  and the feature's current Google documentation. Fix errors and warnings when
  appropriate; do not add invented fields or content merely to clear a warning.
- A non-critical enhancement suggestion (for example, an optional `license`
  property) does not by itself mean the page is excluded from Search. Decide
  whether the field is accurate and applicable before adding it.
- Review Manual Actions and Security Issues independently from indexing
  counts. Any alert there is a separate incident requiring investigation.
- Monitor Core Web Vitals using field data when available. Do not infer user
  experience from a lab-only score, and do not change image loading or page
  rendering based solely on a Search Console count without measuring the actual
  user impact.

## Measurement and review cadence

For a production SEO change, retain a pre-change baseline and a post-change
comparison with matching settings. Use a full 28-day window after Google has
had time to recrawl; compare it with the preceding 28 days, and note any
seasonality, campaign, release or content changes that could affect results.
For Search Performance, record clicks, impressions, CTR and average position
for Web Search, then segment by brand/discovery query group, page, country and
device where sample volume allows. Keep AI feature reporting separate from
ordinary Web Search performance. Low-volume query data is incomplete and should
not be treated as a complete list of searches.

For indexing, record indexed and non-indexed counts by reason, report freshness,
the number of URLs actually intended to be indexed, and a representative URL
sample with its live response, declared canonical and Google-selected
canonical. A smaller exclusion count is not automatically an improvement if it
comes from accidentally indexing low-value pages. A higher indexed count is
not automatically an improvement if duplicates or private pages entered the
index.

Review reports after a deployment and then on a weekly cadence while an issue
is under active investigation. Once counts and validations stabilize, monthly
review is sufficient for routine operations. Avoid daily reactive changes to
metadata based on small or delayed fluctuations. Mark a fix complete only when
the live implementation is verified and refreshed GSC evidence supports the
expected disposition; ranking and indexing remain Google's decision.

### GSC review record

Use this compact record in a task note or release record for each significant
review:

```text
Property and report:
Report last updated:
Review date:
Filters/date range/search type:
Baseline counts and performance:
URLs intended to be indexed:
URL groups and intended disposition:
Live checks (status, robots, canonical, sitemap, internal links):
Change and production deployment:
Validation/request status:
Next review date:
Outcome and remaining uncertainty:
```

Do not store personal Search Console exports, account credentials, or secrets
in the repository. Keep URL samples limited to public URLs and redact any
query parameters that could contain personal or session data.

## Shoonaya brand identity across owned profiles

Keep the public identity consistent wherever Shoonaya is described:

- Display name: **Shoonaya** (do not list “Shoonya” as an alternate product name).
- Descriptor: **A modern dharmic companion for daily practice, sacred time,
  scripture, family, and community across Hindu, Sikh, Jain, and Buddhist
  traditions.**
- Canonical website: `https://www.shoonaya.com/`.
- Use the same spelling and canonical website link on LinkedIn, Instagram,
  Facebook, the Apple App Store listing, and the Android beta/store listing.
- Keep availability claims accurate for each channel. The Android beta page is
  not a public Google Play listing; do not describe it as publicly available
  until that status changes.

The homepage's `Organization` entity points to the official social profiles and
the `SoftwareApplication` entity points to the Apple App Store listing. This
helps connect the owned properties; it does not update their profile copy or
guarantee a ranking. Verify the text and links on those external accounts
directly after an authorized account owner updates them.

## Brand-query measurement

Before a metadata/content deployment, export the prior 28 days from Search
Console Performance for Web Search and keep it as the baseline. After Google has
recrawled the homepage, compare a new 28-day window with the preceding 28 days.
Do not compare an incomplete post-deployment window with a full month.

Review these query groups and pages:

- Brand queries: `shoonaya`, `shoonaya app`, and `shoonaya dharmic`.
- Relevant discovery queries: `dharmic companion app`, `sacred calendar app`,
  and `daily dharmic practice`.
- Pages: `/`, `/what-is-shoonaya`, `/features`, and the matching feature detail
  pages.

Record impressions, clicks, click-through rate, average position, country, and
device. In URL Inspection, confirm the canonical homepage and the two brand
pages are eligible for indexing and that Google's selected canonical matches
the declared canonical. Search Console query data and URL Inspection establish
whether pages are indexed and how they perform; a single manual search or a
`site:` query is not a complete measurement. Keep AI Overview observations
separate from ordinary web-result positions.

Google may need days or weeks to recrawl changes, and neither a recrawl request
nor a sitemap submission guarantees a ranking change. Do not report an SEO
improvement until the matched post-deployment window has enough Search Console
data to compare.

## Publication and deployment gates

- Sitemap includes public course overviews and editorially publishable festival
  narratives only; it does not authorize publication of any calendar date.
- Course lessons, progress and subscription checks remain authenticated.
- AudioObject markup is limited to the existing approved playable recordings;
  generated TTS is not presented as a permanent public audio file.
- Generic festival articles are not ticketed Event listings.
- Public city and temple landing pages are a separate content project; never
  expose Mandali membership or generate unreviewed location dates for SEO.
- Measured production redirects on 2026-09-07 after explicitly assigning the
  apex domain to the Shoonaya Vercel project: HTTP apex -> HTTPS apex (308), then
  HTTPS apex -> HTTPS www (308), preserving the path. The canonical www host
  serves the page. This is Vercel project-domain configuration, not application
  middleware; re-check both hosts if domain ownership or DNS is changed.
- Deploy these source changes before expecting the new sitemap/page behavior
  in the live IndexNow submission. Do not claim a local fix is already indexed.
- Measure mobile LCP/INP/CLS and the actual LCP element before changing image
  loading. This repo uses Next.js 15, where priority remains supported; no
  blanket image preloading or forced static rendering is justified by grep counts.

## References

- https://support.google.com/webmasters/answer/7440203
- https://developers.google.com/search/docs/essentials/technical
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/apis/indexing-api/v3/using-api
- https://www.indexnow.org/documentation
