# Media Registry Plan

Last updated: 2026-04-10

## Purpose

This file defines how audio and other media should be organized so launch assets stay manageable and later scale does not create licensing or storage chaos.

## Principles

- metadata first
- license-aware by default
- separate source URL from hosted URL
- one canonical record per asset
- no “mystery files” in the app bundle

## Registry Fields

Every media asset should eventually have:

- `id`
- `title`
- `media_type`
  - `chant`
  - `stotram`
  - `kirtan`
  - `gita_audio`
  - `environment_audio`
  - `environment_visual`
- `tradition`
- `creator`
- `source_name`
- `source_page_url`
- `source_file_url`
- `hosted_url`
- `license`
- `attribution_text`
- `duration_label`
- `commercial_use_allowed`
- `redistribution_allowed`
- `modifications_allowed`
- `approval_status`
  - `pending`
  - `approved`
  - `provisional`
  - `rejected`
- `review_notes`
- `reviewed_at`
- `reviewed_by`

## Storage Layout

When we move beyond source-streaming, use a clear folder structure:

- `media/chants/`
- `media/stotrams/`
- `media/kirtan/`
- `media/gita/`
- `media/focus-environments/`

Do not keep launch media as random repo assets if they are expected to grow. Use object storage + CDN.

## Delivery Model

### Launch

- stream a small vetted pack from source URLs where license and uptime are acceptable
- keep metadata in code
- keep attribution in the registry

### Post-launch hardening

- mirror `approved` files to owned object storage
- serve through CDN
- keep original source page links for audit and attribution

## Product Use

The same registry should feed:

- `Bhakti` chant shelf
- `Zen` focus chant
- `Mala` accompaniment
- later `Gita` audio
- later ambient focus environments

## Review Workflow

1. collect source URL
2. verify exact file-page license
3. classify into `approved`, `provisional`, or `reject`
4. write attribution text
5. add metadata to registry
6. only then enable in-app playback or hosting

## Avoid

- `BY-NC` as a default hosted library base
- files without a per-item source page
- “royalty free” marketing claims without explicit license terms
- mixing hosted and source-streamed assets without metadata saying which is which
