# Unresolved Multi-Day Candidates Status

Date: 2026-09-08

## Content-ready

### Chaitra Navratri

- Current code status: `chaitra-navratri-begins` is scaffolded as a 9-day
  `lunar_tithi_span` in `packages/dharma-rules/src/festivals/rules.json`.
- Series status: not yet present in `series.json`.
- Content status: missing day-level `series-content.json` entries.
- Next work: Antigravity content authoring only, using
  `scripts/chaitra-navratri-content-prompt-for-antigravity.md`.
- Engineering after content returns: verify citations, add `series.json` entry,
  merge sourced content, promote only after review.

## Source/rule research first

### Gupt Navratri, Ashadha and Magha

- Current code status: 9-day scaffolds exist, all child days remain deferred.
- Blocker: day-to-Mahavidya mapping is not source-ratified and may be
  sampradaya-dependent.
- Next work: research whether a reliable day mapping exists; otherwise keep as a
  generic 9-day sadhana period without per-day deity claims.

### Das Lakshana Dharma

- Current code status: deferred single anchor rule exists.
- Blocker: needs Digambara source confirmation for 10-day sequence, end rule,
  Kshamavani relationship, and ten-dharma order.
- Next work: source/rule research, then engineering.

### Holi / Holika Dahan

- Current code status: single `holi` rule is included, but its source note says
  it tracks Holika Dahan/Purnima rather than resolving the color-day split.
- Blocker: product/source decision whether to split into Holika Dahan plus
  Rangwali Holi.
- Next work: source/rule research and naming/slug decision.

### Pitru Paksha

- Current code status: helper exists in `src/lib/pitru-paksha.ts`, but there is
  no canonical `rules.json` multi-day series.
- Blocker: model choice: daily journey, season, or banner-only.
- Next work: source/rule research for start/end convention and app shape.

### Onam

- Current code status: single deferred `onam` rule exists and has corrected
  Thiruvonam source notes.
- Blocker: 10-day Atham-through-Thiruvonam sequence is not modeled.
- Next work: source/rule research for official Kerala calendar structure.

### Pongal / Makar Sankranti Cycle

- Current code status: no multi-day series.
- Blocker: regional Tamil calendar/source model.
- Next work: source/rule research for Bhogi, Thai Pongal, Mattu Pongal, Kaanum
  Pongal.

### Tulsi Vivah / Bhishma Panchaka

- Current code status: not represented as a series.
- Blocker: relationship between Devutthana Ekadashi, Tulsi Vivah,
  Bhishma Panchaka, and Kartik Purnima needs source-backed modeling.
- Next work: source/rule research.

### Hola Mohalla

- Current code status: single Sikh rule exists as `holla-mohalla`.
- Blocker: spelling normalization and 3-day Anandpur Sahib/mela structure need
  source confirmation.
- Next work: source/rule research.

### Shaheedi Jor Mela / Saka Chamkaur / Saka Sirhind

- Current code status: not represented as a series.
- Blocker: official date span and launch scope need Sikh source confirmation.
- Next work: source/rule research.

### Losar

- Current code status: single deferred `losar-tibetan-new-year` rule exists.
- Blocker: one-day versus 3-day or longer Tibetan calendar period, plus calendar
  profile requirements.
- Next work: source/rule research.

### Vassa / Pavarana / Kathina

- Current code status: deferred and explicitly parked by governance.
- Blocker: Theravada profile and institution/community-specific dates.
- Next work: keep deferred unless reliable profile-specific Buddhist authority
  is identified.

### Ayambil Oli

- Current code status: not represented.
- Blocker: twice-yearly 9-day Jain source/rule structure.
- Next work: source/rule research.
