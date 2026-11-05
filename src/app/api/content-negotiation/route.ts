import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCanonicalVratData } from "@/lib/vrat-data";
import { getPublishableFestivalContent, resolveFestivalList, resolveFestivalText } from "@/lib/festival-data";

export const runtime = "nodejs";

const BASE_URL = "https://www.shoonaya.com";

const ABOUT_MD = `# About Shoonaya: Find your infinite.

> A daily spiritual sanctuary for sacred time, practice, and connection across Hindu, Sikh, Buddhist, and Jain traditions.

Canonical URL: https://www.shoonaya.com/about

## Our Purpose
Life gets busy, and meaningful days can pass without notice. Shoonaya helps you stay connected to the sacred rhythm of the day: see what is unfolding in your local Panchang, understand the observances that matter to you, and find simple ways to bring reflection and practice into everyday life.

## Living Tools
- **Local Panchang and Sacred Calendar**: Follow daily tithi, nakshatra, and selected timings with astronomy-backed precision.
- **Daily Practice and Japa**: 108-bead digital mala counter for mantra and sadhana with ambient soundscapes.
- **Scripture and Pathshala**: Guided learning across Bhagavad Gita, Upanishads, Gurbani, Dhammapada, and Jain Agamas.
- **Rashiphal and Kundali**: Birth-chart reflections and planetary contexts.
- **Live Darshan & Sacred Places**: Authentic streaming connections to historical temples and gurdwaras.
- **Kul Family Spaces**: Preserve lineage, gotra, meaningful ancestral remembrance, and family milestones.
- **Mandali Community**: Interfaith dialogue and local seeker circles.

## Official Contact
- Email: info@shoonaya.com
- Website: https://www.shoonaya.com
`;

const PRICING_MD = `# Shoonaya Pricing & Access Policy

> 100% Free Dharmic Open Access. Core daily practice, sacred time, scripture, and learning carry zero subscription fees.

Canonical URL: https://www.shoonaya.com/pricing

## Seeker Sanctuary Plan: ₹0 / Free Forever
We believe foundational dharmic time, sacred scripture, and daily sadhana belong to every seeker without subscription barriers or commercial pressures.

### What is Included
- High-precision Astronomy-backed Vedic Panchang (Tithi, Nakshatra, Yoga, Karana, Vara)
- Accurate Muhurta calculation (Brahma Muhurta, Abhijit, Rahu Kaal, Yamaganda)
- 82+ Council-ratified Multi-tradition Festivals & Vrats with Parana timings
- Full Bhakti Scripture Library (Stotrams, Kathas, Mantras with audio transliteration)
- Pathshala Guided Scripture Learning (Bhagavad Gita, Guru Granth Sahib, Dhammapada, Jain Agamas)
- 108-bead Digital Japa Mala with custom soundscapes and haptic feedback
- Daily Sadhana and Nitya Seva spiritual routine progress tracking
- Zero advertisements in sacred meditation, Japa, and prayer surfaces

No credit card required. No hidden recurring charges.
`;

const CONTACT_MD = `# Contact Shoonaya

> Support, safety, and community partnerships.

Canonical URL: https://www.shoonaya.com/contact

## Official Inquiries
- **General Support**: info@shoonaya.com (Account help, access issues, or general questions)
- **Safety & Moderation**: Dedicated escalation for user safety and content integrity.
- **Partnerships**: Temple organizers, satsang leaders, and educators can reach the foundation team directly.
- **Official Website**: https://www.shoonaya.com
- **LinkedIn**: https://www.linkedin.com/company/shoonaya
- **Instagram**: https://www.instagram.com/shoonayaapp
`;

const FEATURES_MD = `# Shoonaya Living Features & Architecture

> An integrated spiritual companion honoring sacred time, practice, learning, and lineage.

Canonical URL: https://www.shoonaya.com/features

## Core Modules
1. **Sacred Panchang Engine**: Astronomy-backed solar and lunar calculations using Lahiri ayanamsha and Ujjain reference meridian.
2. **Festival Rule Engine**: 82+ council-reviewed observance definitions covering Hindu, Sikh, Buddhist, and Jain calendars.
3. **Digital Japa Mala**: 108-bead touch counter with tactile haptics, chimes, and japa streak tracking.
4. **Bhakti Scripture Library**: Sanskrit stotrams, Gurbani baanis, Buddhist suttas, and Jain prayers with line-by-line translations.
5. **Pathshala**: Modular text study paths through Gita, Sri Guru Granth Sahib, Dhammapada, and Agamas.
6. **Kul Lineage**: Private multi-generational family space honoring Kuldevi/Kuldevata, gotra, and ancestor remembrance.
7. **Dharma Mitra AI**: In-app spiritual mentor adhering to canonical scriptural commentaries without hallucinatory dogma.
`;

const TRADITIONS_MD = `# Sacred Traditions Covered in Shoonaya

> Distinct experiences honoring the unique theology, calendar, and scripture of each tradition.

Canonical URL: https://www.shoonaya.com/traditions

## Four Paths
- **Sanatan Dharma (Hindu)**: Vaishnava, Shaiva, and Shakta lineages; Bhagavad Gita, Upanishads, Panchang, Vrats, and Japa.
- **Sikhi (Sikh Dharma)**: Gurmat theology, Guru Granth Sahib, Nitnem baanis, Gurpurabs, Simran, and Langar seva spirit.
- **Bauddha Dharma (Buddhist)**: Theravada and Mahayana paths; Dhammapada, mindfulness meditation, Uposatha lunar observances.
- **Jaina Dharma (Jain)**: Shvetambara and Digambara traditions; Tirthankara Janma Kalyanak, Ahimsa, and Agamas.
`;

const PANCHANG_MD = `# Shoonaya Astronomical Panchang Engine

> High-precision Vedic calendar calculations anchored to traditional meridians.

Canonical URL: https://www.shoonaya.com/panchang

## The Five Limbs (Pancha-Anga)
- **Tithi**: Lunar day determined by 12° increments of longitudinal elongation between Sun and Moon.
- **Nakshatra**: Lunar mansion (one of 27 segments of 13°20' along the sidereal zodiac with Lahiri ayanamsha).
- **Yoga**: Combined solar and lunar sidereal longitude divided into 27 segments of 13°20'.
- **Karana**: Half of a tithi (6° elongation angle); 11 recurring karanas.
- **Vara**: Solar weekday starting at local sunrise.

## Critical Muhurta Windows
- **Brahma Muhurta**: The 14th muhurta of night, beginning 2 muhurtas (96 minutes) prior to local sunrise.
- **Rahu Kaal**: Inauspicious 90-minute daylight segment governed by the planetary weekday order.
- **Abhijit Muhurta**: Midday window (around local solar noon) suitable for starting auspicious endeavours.
`;

export async function GET(req: NextRequest) {
  const targetPath = (req.nextUrl.searchParams.get("path") || "/").replace(/\/$/, "") || "/";

  const headers = {
    "Content-Type": "text/markdown; charset=utf-8",
    "Vary": "Accept",
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  };

  // 1. Core Pages
  if (targetPath === "" || targetPath === "/") {
    try {
      const llms = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");
      return new NextResponse(llms, { headers });
    } catch {
      return new NextResponse("# Shoonaya\n\n> Multi-tradition spiritual sanctuary.", { headers });
    }
  }

  if (targetPath === "/about") {
    return new NextResponse(ABOUT_MD, { headers });
  }

  if (targetPath === "/pricing") {
    return new NextResponse(PRICING_MD, { headers });
  }

  if (targetPath === "/contact") {
    return new NextResponse(CONTACT_MD, { headers });
  }

  if (targetPath === "/features") {
    return new NextResponse(FEATURES_MD, { headers });
  }

  if (targetPath === "/traditions" || targetPath.startsWith("/traditions/")) {
    return new NextResponse(TRADITIONS_MD, { headers });
  }

  if (targetPath === "/panchang" || targetPath.startsWith("/panchang/")) {
    return new NextResponse(PANCHANG_MD, { headers });
  }

  // 2. Vrat Detail Pages (/vrat/:slug)
  if (targetPath.startsWith("/vrat/")) {
    const slug = targetPath.replace("/vrat/", "").toLowerCase();
    const vrats = getCanonicalVratData();
    const matched = vrats.find((v) => v.id.toLowerCase() === slug);

    if (matched) {
      const md = [
        `# ${matched.name}`,
        "",
        `> ${matched.tagline}`,
        "",
        `Canonical URL: ${BASE_URL}/vrat/${matched.id}`,
        "",
        "## Significance",
        matched.significance,
        "",
        "## Practice Guidance",
        matched.practice,
        "",
        ...(matched.fastingType ? [`- **Fasting Type**: ${matched.fastingType}`] : []),
        ...(matched.breakFastTime ? [`- **Parana Guidance**: ${matched.breakFastTime}`] : []),
        ...(matched.mantra ? [`- **Mantra**: ${matched.mantra}`] : []),
        "",
        "### Recommended Observances (Dos)",
        ...(matched.dos?.map((d) => `- ${d}`) || ["- Maintain devotion and peaceful contemplation"]),
        "",
        "### Things to Avoid (Donts)",
        ...(matched.donts?.map((d) => `- ${d}`) || ["- Avoid heavy foods and negative emotions"]),
        "",
        "### Puja Items",
        ...(matched.pujaItems?.map((p) => `- ${p}`) || ["- Pure water, ghee lamp, and flowers"]),
      ].join("\n");

      return new NextResponse(md, { headers });
    }
  }

  // 3. Festival Detail Pages (/festival/:slug)
  if (targetPath.startsWith("/festival/")) {
    const slug = targetPath.replace("/festival/", "").toLowerCase();
    const festivals = getPublishableFestivalContent();
    const matched = festivals.find((f) => f.definitionKey.toLowerCase() === slug);

    if (matched) {
      const name = resolveFestivalText(matched.name);
      const tagline = resolveFestivalText(matched.tagline);
      const significance = resolveFestivalText(matched.significance);
      const rituals = resolveFestivalList(matched.rituals);
      const dos = resolveFestivalList(matched.dos);
      const donts = resolveFestivalList(matched.donts);
      const pujaItems = resolveFestivalList(matched.pujaItems);

      const md = [
        `# ${name}`,
        "",
        `> ${tagline}`,
        "",
        `Canonical URL: ${BASE_URL}/festival/${matched.definitionKey}`,
        "",
        "## Significance",
        significance,
        "",
        "## Rituals",
        ...(rituals.map((r) => `- ${r}`)),
        "",
        "### Recommended Observances (Dos)",
        ...(dos.map((d) => `- ${d}`)),
        "",
        "### Things to Avoid (Donts)",
        ...(donts.map((d) => `- ${d}`)),
        "",
        "### Puja Items",
        ...(pujaItems.map((p) => `- ${p}`)),
      ].join("\n");

      return new NextResponse(md, { headers });
    }
  }

  // Fallback to llms.txt
  try {
    const llms = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");
    return new NextResponse(llms, { headers });
  } catch {
    return new NextResponse("# Shoonaya\n\n> Multi-tradition spiritual sanctuary.", { headers });
  }
}

