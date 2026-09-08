# Task: Source/rule research for unresolved multi-day observance candidates

## Context

Shoonaya already supports multi-day observance cards through:

- `packages/dharma-rules/src/festivals/rules.json`
- `packages/dharma-rules/src/festivals/series.json`
- `packages/dharma-rules/src/festivals/series-content.json`
- `src/lib/calendar/observance-series.ts`

Do not write final app content yet. This task is to determine whether each
candidate has a source-backed, implementable structure. The output should let
engineering know exactly which candidates can be promoted next and which must
stay deferred.

## Candidates to research

### Hindu

1. `holi` two-day split
   - Current issue: existing rule likely represents Holika Dahan / Phalguna
     Purnima, not the following Rangwali Holi color day.
   - Research need: confirm whether Shoonaya should model this as a 2-day
     cluster: Holika Dahan + Rangwali Holi.
   - Output needed: proposed child slugs, offsets/rules, source citations, and
     whether current `holi` slug should remain day 1 or become day 2.

2. `pitru-paksha`
   - Current issue: helper code exists in `src/lib/pitru-paksha.ts`, but there is
     no canonical multi-day `rules.json` series entry.
   - Research need: confirm authoritative start/end convention for the 16-day
     ancestor remembrance period and Mahalaya/Sarva Pitru Amavasya endpoint.
   - Output needed: whether it should be a `daily_journey`, `season`, or
     lightweight banner-only model; proposed slugs; date rule source.

3. `onam`
   - Current issue: single `onam` rule exists and is source-aligned for Thiruvonam,
     but the 10-day Atham to Thiruvonam journey is not modeled.
   - Research need: confirm the 10-day structure, child names, and whether app
     should show all 10 days or only a shorter lead-up.
   - Output needed: proposed child slugs, anchor rule, relative offsets, official
     Kerala/calendar sources.

4. `pongal` / Makar Sankranti cycle
   - Current issue: no multi-day series model.
   - Research need: confirm Bhogi, Thai Pongal/Surya Pongal, Mattu Pongal, and
     Kaanum Pongal structure and date relationship to Makar Sankranti / Tamil
     Thai month.
   - Output needed: child slugs, rule type, source citations, regional scope.

5. `tulsi-vivah` / `bhishma-panchaka`
   - Current issue: not represented as a series.
   - Research need: confirm whether this should be a 5-day Kartika Shukla
     Ekadashi-through-Purnima vrata span, and whether Tulsi Vivah is a day inside
     it or a separate adjacent observance.
   - Output needed: structure recommendation and source-backed rule proposal.

6. `gupt-navratri-ashadha` and `gupt-navratri-magha`
   - Current issue: 9-day span scaffold exists, but day-to-deity mapping is
     deliberately unset because Mahavidya mapping is disputed.
   - Research need: determine if a reliable, source-backed day mapping exists.
   - Output needed: either a cited mapping with sampradaya/context, or a clear
     recommendation to keep these as generic 9-day sadhana periods without
     per-day deity claims.

### Jain

7. `das-lakshana-dharma`
   - Current issue: begin rule exists as deferred single anchor only.
   - Research need: confirm 10-day Digambara structure, end-date convention,
     Kshamavani relationship, and the ten dharmas/day order.
   - Output needed: child slugs, sequence, start/end rules, primary Jain sources.

8. `ayambil-oli`
   - Current issue: not represented as a series.
   - Research need: confirm 9-day twice-yearly Jain observance, months, start
     tithi, and whether Shvetambara subgroup scope should be explicit.
   - Output needed: source-backed rule model and launch recommendation.

### Sikh

9. `hola-mohalla`
   - Current issue: single included rule exists as `holla-mohalla`, but no 3-day
     series model.
   - Research need: confirm canonical spellings, date relationship to Holi, and
     whether the series should be 3 days or broader Anandpur Sahib mela dates.
   - Output needed: child slugs, naming correction recommendation if needed,
     source-backed date rule.

10. Shaheedi Jor Mela / Saka Chamkaur / Saka Sirhind
    - Current issue: not represented as a series.
    - Research need: identify whether this belongs in launch calendar and what
      the official date span should be.
    - Output needed: source-backed structure or defer recommendation.

### Buddhist

11. `losar-tibetan-new-year`
    - Current issue: single deferred rule, no multi-day model.
    - Research need: determine whether to model as one day, 3-day cluster, or
      longer tradition-specific Tibetan New Year period.
    - Output needed: source-backed structure and whether a Tibetan calendar
      profile is required.

12. `vassa` / `pavarana` / `kathina`
    - Current issue: parked by governance. Pavarana needs a Theravada profile;
      Kathina needs externally curated monastery/community dates.
    - Research need: confirm if any launch-safe generic model exists, or whether
      these must stay institution/location-specific.
    - Output needed: explicit keep-deferred or implementable profile-specific
      recommendation.

## Output format

Produce `unresolved-multiday-source-rule-research-output.json`, one object per
candidate:

```json
{
  "candidate": "onam",
  "verdict": "ready_for_engineering" | "content_only_after_engineering" | "needs_scholar_decision" | "keep_deferred",
  "recommendedShape": "daily_journey" | "festival_cluster" | "season" | "single_day" | "banner_only",
  "proposedChildren": [
    { "slug": "...", "sequence": 1, "title": "...", "rule": "anchor|relative_offset|independent_rule", "offsetDays": 0 }
  ],
  "ruleSources": [
    { "sourceName": "...", "pageOrSection": "...", "url": "...", "tier": 1, "confidence": "high" }
  ],
  "contentSources": [
    { "sourceName": "...", "pageOrSection": "...", "url": "...", "tier": 1, "confidence": "high" }
  ],
  "risks": ["..."],
  "engineeringNotes": "Exact fields/rules that would need to change.",
  "recommendation": "One concise recommendation."
}
```

## Guardrails

- Do not invent rule sources.
- Do not promote deferred rules.
- Do not create content prose.
- Do not change production files.
- If sources disagree, preserve the disagreement and say what profile or
  tradition each source represents.
- If the candidate needs a local institution/community calendar, say so instead
  of pretending a universal global date exists.
