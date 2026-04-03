# Color Strategy

Last updated: 2026-04-03

## Decision

The current green / teal direction is not the final brand direction.

For this product, the better fit is a warmer dharmic palette:

- `Ivory` for the base
- `Saffron` for spiritual emphasis
- `Deep maroon / sindoor` for authority and sacred identity
- `Soft earth` for grounding details

Any cool green or teal should be reduced to a supporting role at most, not the dominant brand color.

## Why We Are Changing It

The previous palette leaned too hard on warm browns and maroons across large surfaces. That made some screens feel heavier and more emotionally "hot" than we want for a daily-use spiritual app.

The product needs to support:

- long reading sessions
- reflective mood, not constant urgency
- trust on knowledge and family surfaces
- clear emphasis without visual fatigue

## Research Summary

### 1. Color effects are real, but not magical

The scientific literature does support color affecting emotion, attention, and evaluation, but the effects are contextual rather than universal. We should use color as a directional design tool, not as superstition.

Sources:

- [Color and psychological functioning: a review of theoretical and empirical work](https://pmc.ncbi.nlm.nih.gov/articles/PMC4383146/)
- [Color and emotion: a systematic literature review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12325498/)

### 2. Lighter, less aggressive surfaces support positive affect

Across the review literature, lighter and less visually heavy color environments are more consistently associated with positive affect than dark or muddy palettes on extended-use surfaces.

Implication:

- keep main backgrounds light and breathable
- use saturation in smaller doses

Source:

- [Color and emotion: a systematic literature review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12325498/)

### 3. Warm colors attract attention, but too much warmth raises arousal

Warm hues can increase energy and salience, which is useful for calls to action and celebratory festival moments. But if warm colors dominate the entire shell, they can make the app feel busy or emotionally loud.

Implication:

- use saffron as accent and emphasis
- do not use saffron or maroon as the primary background system

This is an inference based on the review literature plus the app's use case.

Sources:

- [Color and psychological functioning: a review of theoretical and empirical work](https://pmc.ncbi.nlm.nih.gov/articles/PMC4383146/)
- [Warm-Cool Color Polarities in Artworks and Real-World Scenes](https://pmc.ncbi.nlm.nih.gov/articles/PMC11235144/)

### 4. Positive associations matter

Ecological Valence Theory argues that people prefer colors partly because of the positive or negative associations attached to them.

Implication:

- for a dharmic product, saffron and maroon carry stronger cultural resonance than a green-first shell
- the app should feel rooted in sacred familiarity, not generic wellness or finance-app coolness
- we still need calm light reading surfaces, but the identity color story should come from warm dharmic tones rather than teal dominance

This is partly a research-backed inference applied to the app's cultural and product context.

Source:

- [Effects of university affiliation and “school spirit” on color preferences: Berkeley versus Stanford](https://pmc.ncbi.nlm.nih.gov/articles/PMC3098359/)

### 5. Website color affects appeal and whether users stay

Color is not just branding. In HCI research, website color affects first impressions, appeal, and downstream interaction quality.

Implication:

- palette cleanup is product work, not cosmetic work

Source:

- [The impact of colour on Website appeal and users’ cognitive processes](https://www.researchgate.net/publication/256970347_The_impact_of_colour_on_Website_appeal_and_users%27_cognitive_processes)

### 6. Contrast still wins over taste

Whatever palette we choose, text contrast must remain readable on small screens.

Source:

- [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG20/Understanding/contrast-minimum.html)

## Updated Palette Direction

### Core tokens

- `--brand-primary`: move toward a deep maroon / sindoor family
- `--brand-primary-strong`: darker maroon for emphasis and headers
- `--brand-primary-soft`: warm blush / saffron-tinted light surface
- `--brand-accent`: saffron / sacred gold
- `--brand-accent-soft`: pale saffron wash
- `--sacred-cream`: `#f7f3eb`
- `--brand-earth`: `#5f5248`

### Contrast checks

Measured ratios used in this pass:

- `#1f6b72` on white: `6.17:1`
- `#164d54` on white: `9.44:1`
- `#1f6b72` on `#f7f3eb`: `5.57:1`

Meaning:

- accessibility remains non-negotiable even as the palette warms up
- maroon and saffron should be used with disciplined contrast checks
- the final palette should feel recognizably dharmic without becoming visually heavy

## Usage Rules

### Use maroon for

- navigation
- primary buttons
- sacred authority
- high-importance actions
- strong section headers

### Use saffron for

- active emphasis
- celebrations
- guided-path highlights
- memory accents
- notification or festival emphasis

### Use neutral warm light surfaces for

- reading
- study
- forms
- longer sessions

### Use ivory for

- app backgrounds
- reading surfaces
- large clay cards
- modals that need calmness

### Avoid

- green / teal as the dominant identity color
- full-screen dark maroon dominance
- saffron as a primary text color on white
- multiple strong warm gradients on one screen
- mixing too many tradition colors in the same dense surface

## Rollout Plan

### Current pass

- Pathshala and structure work are ahead of the final palette correction
- `Kul / Vansh` clay portraits replaced by keepsake medallions
- shared glass and clay surfaces still need the warm dharmic palette pass

### Next pass

- replace the current green / teal brand tokens with a warmer dharmic system
- unify high-traffic screens around ivory + saffron + maroon
- align public/auth pages and the main app shell to the new palette
- tune tradition-aware accents so they still feel distinct without fragmenting the brand

### Final pass

- add screenshot-based visual QA across Home, Mandali, Library, Kul, and Vichaar
- lock palette guidance into component-level tokens
