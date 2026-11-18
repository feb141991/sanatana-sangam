#!/usr/bin/env npx tsx
// ============================================================================
// Shoonaya RAG Marketing Automation CLI
// Generates grounded social media posts, programmatic festival SEO pages,
// and weekly newsletters.
//
// Usage:
//   npx tsx scripts/rag-marketing-cli.ts --type=dharm-veer --hero=chhatrapati-shivaji
//   npx tsx scripts/rag-marketing-cli.ts --type=festival --slug=maha-shivaratri --city=London
//   npx tsx scripts/rag-marketing-cli.ts --type=newsletter --date=2026-11-20
// ============================================================================

import {
  generateDharmVeerSocialPost,
  generateFestivalSeoCampaign,
  generateSanctuaryNewsletter,
} from '../src/lib/ai/marketing-rag';

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const map: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      map[key] = val || 'true';
    }
  }
  return map;
}

async function main() {
  const args = parseArgs();
  const type = args.type || 'dharm-veer';

  console.log(`\n======================================================`);
  console.log(`  SHOONAYA RAG MARKETING GENERATOR`);
  console.log(`  Campaign Type: ${type}`);
  console.log(`======================================================\n`);

  if (type === 'dharm-veer') {
    const heroId = args.hero || args.heroId;
    const date = args.date;
    const platform = (args.platform as 'instagram' | 'twitter' | 'linkedin') || 'instagram';

    console.log(`Fetching grounded hero data (heroId: ${heroId || 'date-based'}, platform: ${platform})...`);
    const res = await generateDharmVeerSocialPost({ heroId, date, platform });

    console.log(`\n--- HERO CAMPAIGN: ${res.heroName} (${res.tradition}) ---`);
    console.log(`Hook: ${res.hook}`);
    console.log(`\n--- SLIDES (${res.slides.length}) ---`);
    res.slides.forEach((s) => {
      console.log(`[Slide ${s.slideNumber}: ${s.header}]`);
      console.log(`  Body: ${s.body}`);
      if (s.visualDirection) console.log(`  Visual: ${s.visualDirection}`);
    });
    console.log(`\n--- CAPTION ---`);
    console.log(res.caption);
    console.log(`\nHashtags: ${res.hashtags.join(' ')}`);
    console.log(`CTA: ${res.ctaUrl}`);
    console.log(`Source Attribution: ${res.sourceAttribution}`);
    return;
  }

  if (type === 'festival' || type === 'festival-seo') {
    const slug = args.slug || 'maha-shivaratri';
    const city = args.city || 'London';
    const year = args.year ? parseInt(args.year, 10) : new Date().getFullYear();

    console.log(`Generating programmatic SEO landing page for ${slug} in ${city} (${year})...`);
    const res = await generateFestivalSeoCampaign({ festivalSlug: slug, city, year });

    console.log(`\n--- SEO METADATA ---`);
    console.log(`Title: ${res.metaTitle}`);
    console.log(`Description: ${res.metaDescription}`);
    console.log(`H1: ${res.h1}`);
    console.log(`\n--- TIMING & DRIGGANITA ---`);
    console.log(res.astronomicalTimingExplanation);
    console.log(`\n--- FAQs (${res.faqItems.length}) ---`);
    res.faqItems.forEach((f, i) => {
      console.log(`Q${i + 1}: ${f.question}`);
      console.log(`A: ${f.answer}\n`);
    });
    console.log(`CTA: ${res.ctaText} (${res.ctaUrl})`);
    return;
  }

  if (type === 'newsletter') {
    const date = args.date || new Date().toISOString().slice(0, 10);
    console.log(`Generating The Sanctuary Dispatch newsletter for week of ${date}...`);
    const res = await generateSanctuaryNewsletter({ weekStartDate: date });

    console.log(`\n--- EMAIL PREVIEW ---`);
    console.log(`Subject: ${res.subjectLine}`);
    console.log(`Preview: ${res.previewText}`);
    console.log(`\n--- BODY ---`);
    console.log(res.plainText);
    return;
  }

  console.error(`Unknown type: ${type}. Please specify --type=dharm-veer, --type=festival, or --type=newsletter.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
