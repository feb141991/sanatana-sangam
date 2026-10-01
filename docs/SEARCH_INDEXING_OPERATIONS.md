# Search discovery and submission

## What acceptance means

IndexNow HTTP 200 acknowledges a submission, not indexing, ranking, or a
recrawl within minutes. HTTP 202 means key validation is pending; the script
fails without advancing its snapshot so the next run retries. Do not claim
delivery to named downstream crawlers without provider evidence.

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

- https://developers.google.com/search/apis/indexing-api/v3/using-api
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://www.indexnow.org/documentation
