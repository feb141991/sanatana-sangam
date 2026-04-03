# Color Strategy

Last updated: 2026-04-03

## Decision

Move the app away from a terracotta-heavy shell and toward a calmer, more repeat-use-friendly palette:

- `Ivory` for the base
- `Peacock teal` for primary actions and trust surfaces
- `Saffron` as a selective accent, not the dominant screen color
- `Soft earth` only for grounding details, not the whole interface

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

- for a dharmic product, saffron still matters culturally
- but it should function as a meaningful accent, not the full reading environment
- a calm teal base can carry trust while saffron carries spiritual and festive emphasis

This is partly a research-backed inference applied to the app's cultural context.

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

## Chosen Palette

### Core tokens

- `--brand-primary`: `#1f6b72`
- `--brand-primary-strong`: `#164d54`
- `--brand-primary-soft`: `#e2efef`
- `--brand-accent`: `#c3872f`
- `--brand-accent-soft`: `#f2e4c7`
- `--sacred-cream`: `#f7f3eb`
- `--brand-earth`: `#5f5248`

### Contrast checks

Measured ratios used in this pass:

- `#1f6b72` on white: `6.17:1`
- `#164d54` on white: `9.44:1`
- `#1f6b72` on `#f7f3eb`: `5.57:1`

Meaning:

- primary teal is safe for standard text on light surfaces
- strong teal is safe for high-emphasis UI and icons
- saffron should mainly stay in accents, chips, highlights, and gradients rather than small white-text buttons

## Usage Rules

### Use teal for

- navigation
- primary buttons
- trust surfaces
- links
- focus states
- quiet authority

### Use saffron for

- active emphasis
- celebrations
- guided-path highlights
- memory accents
- notification or festival emphasis

### Use ivory for

- app backgrounds
- reading surfaces
- large clay cards
- modals that need calmness

### Avoid

- full-screen maroon or terracotta dominance
- saffron as a primary text color on white
- multiple strong warm gradients on one screen
- mixing too many tradition colors in the same dense surface

## Rollout Plan

### Current pass

- global brand tokens shifted to ivory + teal + saffron
- `Kul / Vansh` clay portraits replaced by keepsake medallions
- shared glass and clay surfaces re-tuned around the calmer palette

### Next pass

- replace remaining hardcoded maroon values in high-traffic screens
- align public/auth pages to the new palette
- tune tradition-aware accents so they still feel distinct without fragmenting the brand

### Final pass

- add screenshot-based visual QA across Home, Mandali, Library, Kul, and Vichaar
- lock palette guidance into component-level tokens
