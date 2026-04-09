# Audio Architecture Plan

Last updated: 2026-04-09

## Purpose

This plan defines how Sanatana Sangam should handle recitation, chants, bhajans, and future contemplation audio without mixing trustworthy scripture audio with unclear devotional media.

## Principles

- keep scripture recitation source-aware and rights-safe
- treat `Gita` as the first full audio implementation
- separate `authoritative recitation` from `open devotional audio`
- keep audio optional, calm, and non-intrusive
- design playback so elder users can operate it easily

## Audio Classes

### 1. Authoritative Recitation

Use for:

- Bhagavad Gita chapter recitation
- future Upanishad / Ramayana recitation where source rights are clear

Required metadata:

- `id`
- `title`
- `tradition`
- `text_family`
- `chapter`
- `verse_range`
- `source_name`
- `source_url`
- `license`
- `attribution`
- `audio_url`
- `duration_seconds`
- `language`
- `is_authoritative`
- `is_hosted_in_app`

### 2. Open Devotional Chant

Use for:

- mantra loops
- japa support
- gentle chant beds for `Mala mode`

Sources should be:

- public domain
- CC0
- CC BY / CC BY-SA with clear attribution handling

### 3. Bhajan / Kirtan

Use later for:

- devotional listening
- family / Kul bhakti sessions

Rule:

- do not launch a broad bhajan library until every item has clear reuse terms

## Playback Architecture

## Engine

- use `Howler` for playback
- keep one shared player state instead of many scattered `<audio>` tags

## State Model

- `currentTrack`
- `queue`
- `isPlaying`
- `progressSeconds`
- `durationSeconds`
- `playbackRate`
- `repeatMode`
- `sourceType`
- `returnHref`

## UI Layers

### Mini Player

- persistent bottom sheet / dock
- play / pause
- scrub bar
- expand button

### Full Player

- title
- source and attribution
- chapter / verse context
- speed
- repeat
- return to study

### Elder-Friendly Requirements

- large targets
- high contrast
- clear labels
- no hidden gestures
- generous spacing

## Product Sequence

### Phase 1

- keep current companion-source recitation where needed
- define the metadata registry
- build the shared audio player shell

### Phase 2

- bring `authoritative Gita audio` into the app after rights confirmation
- chapter-by-chapter playback
- save listening progress
- return-to-study flow

### Phase 3

- `Zen mode`
- `Mala mode`
- rights-safe chant starter pack

### Phase 4

- optional bhajan / kirtan library
- Kul devotional sessions
- offline caching if needed

## Source Strategy

### Safe Starter Sources

- Wikimedia Commons items with clear public-domain / CC licensing
- Openverse discovery for reusable audio
- explicitly licensed archival devotional recordings

### Not Allowed

- unclear YouTube audio reuse
- unlabeled third-party uploads
- “free to use” claims without real license terms

## Launch Recommendation

- launch study first
- keep authoritative recitation honest
- bring Gita audio in-app as the first complete audio milestone
- add Mala / Zen once the shared audio foundation is stable
