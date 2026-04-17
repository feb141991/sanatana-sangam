# Panchang Precision Plan

Last updated: 2026-04-17

## Purpose

This file defines the serious Panchang upgrade path for Sanatana Sangam:

- move from an in-app estimate to a high-precision calculation engine
- keep the current lightweight Panchang as a fallback and browsing layer
- add a validated server-side precision source for observance-sensitive timings

## Chosen direction

The best serious option is:

- a Swiss Ephemeris-backed service
- built as a dedicated engine package, not mixed directly into the current UI shell
- exposed to the app through a stable precision-service seam

## Non-negotiable license decision

Swiss Ephemeris is not a casual dependency.

Before production use, we must explicitly choose one of:

1. `AGPL`
2. `Swiss Ephemeris Professional License`

Current product direction implies:

- if Sanatana Sangam remains closed-source or commercially distributed, we should plan for the professional license
- do not quietly ship Swiss Ephemeris-backed functionality on the assumption that npm package installation alone solves licensing

## Product rule

Until the precision engine is validated and licensed correctly:

- keep current UI copy as guidance-level
- do not upgrade claims to priest-grade precision
- do not treat the current JS engine as authoritative for observance-sensitive windows

## Architecture

### 1. Precision engine package

Create a dedicated engine lane:

- `packages/panchang-engine`

Responsibilities:

- exact solar/lunar positions via Swiss Ephemeris
- exact transition times for:
  - tithi
  - nakshatra
  - yoga
  - karana
- exact sunrise / sunset and local sacred-time windows
- observance-sensitive calculations and timing metadata
- trust / method / validation metadata for every result

### 2. Server-only execution

Swiss Ephemeris-backed calculations should run:

- server-side only
- never in the browser bundle

Reasons:

- native / heavy engine handling
- ephemeris data-file management
- licensing clarity
- easier validation and caching

### 3. App integration model

The app should consume precision results through a service seam:

- current in-app `panchang.ts` remains the fallback calculator
- precise engine becomes the trusted source when available

Recommended product behavior:

- `precision available`: show precise windows and exact transition timing
- `precision unavailable`: fall back to current estimate and keep trust copy explicit

### 4. Data / file strategy

Swiss Ephemeris supports multiple ephemeris modes.

Recommended progression:

1. start with Moshier-backed development mode
2. move to full Swiss Ephemeris data files for production precision
3. evaluate JPL only if truly necessary later

Production needs:

- a durable ephemeris file location
- controlled deploy/runtime path setup
- versioned engine metadata

## Observance logic layer

Astronomy alone is not enough.

We also need a rule layer for:

- sunrise-based observance decisions
- tithi overlap logic
- parana windows
- Ekadashi / Pradosh / Shivaratri style cases
- Amanta vs Purnimanta month interpretation
- later regional or sampradaya rule packs

This layer must remain configurable and auditable.

## Validation standard

Do not trust the engine because it is “Swiss Ephemeris-backed.”
Trust it because it is validated.

Validation should include:

1. reference cities
- India north / south / east / west
- diaspora cities

2. reference dates
- ordinary days
- edge cases near sunrise transitions
- major observances

3. comparison sources
- trusted published Panchangs
- temple or regional references where available

4. tolerance policy
- define acceptable differences
- record mismatches
- mark unresolved rule differences explicitly

## Rollout phases

### Phase 1 — Package and service seam

- scaffold `packages/panchang-engine`
- define precision result types
- define engine config and trust metadata
- keep runtime disabled until license decision is explicit

### Phase 2 — Swiss Ephemeris wiring

- choose the Node binding
- wire server-only calculations
- set ephemeris path handling
- return exact transition windows

### Phase 3 — Observance rule layer

- add Hindu observance-sensitive calculations first
- keep rule config modular for later expansion

### Phase 4 — Validation harness

- build comparison scripts
- store reference snapshots
- define pass/fail and review workflow

### Phase 5 — UI upgrade

- add precise-mode trust labels
- show exact timing windows where validated
- keep fallback path visible when precision is unavailable

## Recommended implementation choice for Node

At the repo-planning level, prefer a modern maintained binding path over the older unmaintained wrapper.

Current best serious direction:

- evaluate a modern Swiss Ephemeris Node binding such as `sweph`
- use it only after the project license path is chosen

## Current status

- planning and engine seam may proceed now
- package installation and production activation should wait for explicit license choice
