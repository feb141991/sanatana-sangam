# Bhajan Discovery MVP

Last updated: 2026-04-09

## Goal

Create a lightweight devotional music discovery surface that shows:

- famous bhajans / devotional songs
- what people are listening to across major platforms
- links out to the platform, not pirated playback
- save / share / place-on-profile actions

This MVP should focus on ranking and discovery, not full streaming.

## Recommendation

Build this as a `catalog + ranking + open-out` product first.

Do not start with:

- hosting copyrighted songs
- scraping random playlists
- building a heavy in-app streaming product

The MVP should feel like:

- `What devotees are listening to`
- `Open where you already listen`
- `Share what resonates with you`

## Product Shape

### Core entity

`devotional_track`

Suggested fields:

- `id`
- `title`
- `artist`
- `tradition`
- `language`
- `type`
  - `bhajan`
  - `kirtan`
  - `shabad`
  - `chant`
  - `stotra`
- `canonical_slug`
- `cover_image_url`
- `spotify_url`
- `youtube_url`
- `apple_music_url`
- `source_rank`
- `source_platform`
- `ranking_period`
- `editorial_tags`
- `is_verified`

### User actions

- save to profile
- share externally
- open in streaming app/site

Optional later:

- add to Kul devotional picks
- add to Mala / Zen audio tray

## Best MVP logic

Use a curated and refreshed devotional catalog, then enrich it with ranking signals.

### Step 1: editorial seed catalog

Start with a vetted list of well-known devotional songs by tradition and type.

Examples:

- bhajans
- shabads
- kirtans
- chants

This is low-maintenance and gives good quality immediately.

### Step 2: ranking enrichment

Add external popularity signals, not raw uncontrolled ingestion.

Best practical approach:

- Spotify chart metadata where available
- YouTube popularity / most-popular discovery where relevant
- Apple Music charts where available
- Last.fm top-track / geo-top-track signals as a lighter aggregate layer

### Step 3: platform links

Store direct external links and open users out.

This avoids:

- streaming rights complexity
- audio hosting burden
- playback compliance risk

## Maintenance Cost

### Low if we do it right

Maintenance stays reasonable if:

- the catalog is curated
- rankings are refreshed on a schedule
- the app opens out instead of streaming everything

### High if we do it wrong

Maintenance becomes painful if:

- we scrape platforms aggressively
- we try to host mainstream devotional audio ourselves
- we mix copyrighted songs with unclear rights
- we depend on brittle unofficial chart pages

## Suggested Architecture

### MVP

- `devotional_tracks` table
- optional `devotional_track_rankings` table
- nightly or twice-daily refresh job
- profile save/share relation later

### Refresh strategy

- editorial data is durable
- ranking metadata is refreshable
- if a ranking source fails, keep the last known score and badge it as stale rather than breaking the page

## Platform Reality

### Spotify

Useful for metadata and linking, but respect policy and attribution.

Notes:

- Spotify has a Web API for search and metadata
- chart visibility exists publicly, but product use should stay metadata/link oriented
- do not download or restream Spotify content

### YouTube

Useful for discoverability and open-out links.

Notes:

- YouTube Data API supports `videos.list` with `chart=mostPopular`
- ranking can vary by region/category and should be treated as one signal, not truth

### Apple Music

Useful for chart metadata if we want stronger “popular now” support later.

### Last.fm

Very useful as a lightweight ranking signal.

Notes:

- top track charts are available
- geo top tracks are available by country
- commercial usage needs care and may require contact depending on use

## Suggested Launch Version

### MVP v1

- devotional discovery page
- curated catalog of famous devotional songs
- popularity badges like:
  - `popular now`
  - `widely shared`
  - `editor's pick`
- open in Spotify / YouTube / Apple Music where available
- save to profile
- share card

### MVP v2

- filter by tradition
- filter by language
- weekly ranking refresh
- profile section: `What I am listening to`

### Later

- Kul devotional picks
- family sharing
- rights-safe chant starter pack inside app
- in-app playback only for clearly licensed / open devotional audio

## Difficulty

### Engineering difficulty

Moderate.

The MVP is not hard if we keep it to:

- catalog
- ranking metadata
- open-out links
- profile save/share

### Operational difficulty

Moderate to high only if we overreach.

Keep it simple at first and it stays manageable.

## Recommended Rule

For launch:

- `discover here`
- `listen there`

Not:

- `host everything here`

## Sources

- Spotify Web API overview: https://developer.spotify.com/documentation/web-api
- Spotify Search API: https://developer.spotify.com/documentation/web-api/reference/search
- Spotify track metadata policy notes: https://developer.spotify.com/documentation/web-api/reference/get-track
- Spotify chart overview: https://support.spotify.com/ci-en/artists/article/charts/
- YouTube Data API videos implementation guide: https://developers.google.com/youtube/v3/guides/implementation/videos
- Apple Music charts API docs: https://developer.apple.com/documentation/applemusicapi/charts-api
- Last.fm API overview: https://www.last.fm/api
- Last.fm chart.getTopTracks: https://www.last.fm/api/show/chart.getTopTracks

