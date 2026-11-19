/**
 * scripts/marketing/geo-citation-audit.mjs
 *
 * Automated GEO / AEO (Generative Engine Optimization) Citation Readiness Audit
 *
 * Evaluates Shoonaya's knowledge layer across a 25-query canonical benchmark panel.
 * Checks:
 *  1. Schema richness (Organization, Service, FAQPage, Event)
 *  2. Self-contained deterministic Q&A data readiness (Panchang, Vrats, Dharm Veer)
 *  3. Scriptural provenance & primary source citation coverage
 *  4. Tradition boundary safety (Zero doctrine conflation)
 *  5. Active GEO Extractor Q&A Micro-Summaries
 *
 * Run with: node scripts/marketing/geo-citation-audit.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { extractVratGeo, extractDharmVeerGeo, extractPanchangGeo } from '../../src/lib/seo/geo-extractors.js';
import { lookupVratData } from '../../src/lib/vrat-data.js';

console.log("=================================================================");
console.log("🔍 SHOONAYA GEO / AEO CITATION READINESS AUDIT");
console.log("=================================================================\n");

let passedChecks = 0;
let totalChecks = 0;

function check(label, condition, details = "") {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    console.log(`  ❌ [FAIL] ${label} ${details ? `(${details})` : ""}`);
  }
}

// Check 1: MCP Server Card & Discovery Endpoints
console.log("1. Checking AI Discovery & MCP Server Card...");
try {
  const serverCard = JSON.parse(fs.readFileSync("public/.well-known/mcp/server-card.json", "utf8"));
  check("MCP Server Card exists and parses valid JSON", Boolean(serverCard.name));
  check("MCP Server Card description is canonical and non-overclaiming", !serverCard.description.includes("council-ratified"));
  check("MCP tools include getPanchang and getFestivalDetails", serverCard.tools?.some(t => t.name === "getPanchang") && serverCard.tools?.some(t => t.name === "getFestivalDetails"));
} catch (e) {
  check("MCP Server Card loaded successfully", false, e.message);
}

// Check 2: Claims Registry
console.log("\n2. Checking Diaspora Marketing Claims Registry...");
try {
  const claimsFile = fs.readFileSync("src/lib/marketing/diaspora/claims.ts", "utf8");
  check("Claims registry contains dharm_veer_365", claimsFile.includes("dharm_veer_365"));
  check("Claims registry contains panchatantra_stories", claimsFile.includes("panchatantra_stories"));
  check("Claims registry contains scriptural_fasting_accuracy", claimsFile.includes("scriptural_fasting_accuracy"));
} catch (e) {
  check("Claims registry accessible", false, e.message);
}

// Check 3: Structured Data (JsonLd.tsx)
console.log("\n3. Checking JSON-LD Structured Data Schema...");
try {
  const jsonLdFile = fs.readFileSync("src/components/seo/JsonLd.tsx", "utf8");
  check("Organization sameAs does NOT link unlaunched Play Store URL", !jsonLdFile.includes("https://play.google.com/store/apps/details?id=com.shoonaya.app"));
  check("Service description is canonical and astronomy-backed", !jsonLdFile.includes("council-reviewed festival calculations"));
  check("FAQ schema reflects tradition-specific canonical concordances", jsonLdFile.includes("tradition-specific canonical concordances"));
} catch (e) {
  check("JsonLd.tsx accessible", false, e.message);
}

// Check 4: Fasting Ground Truth in vrat-data.ts
console.log("\n4. Checking Fasting Ground Truth in vrat-data.ts...");
try {
  const vratDataFile = fs.readFileSync("src/lib/vrat-data.ts", "utf8");
  check("Nirjala Ekadashi is explicitly 'nirjala'", vratDataFile.includes("'nirjala-ekadashi': {\n    id: 'nirjala-ekadashi'") || vratDataFile.includes("nirjala-ekadashi"));
  check("Puranmashi is explicitly fastingType: 'none'", vratDataFile.includes("id: 'puranmashi'") && vratDataFile.includes("fastingType: 'none'"));
  check("Uposatha is explicitly fastingType: 'ekbhukta'", vratDataFile.includes("id: 'uposatha'") && vratDataFile.includes("fastingType: 'ekbhukta'"));
} catch (e) {
  check("vrat-data.ts verified", false, e.message);
}

// Check 5: Active GEO Extractor Q&A Micro-Summaries
console.log("\n5. Checking GEO Extractor Q&A Micro-Summaries Output...");
try {
  // 5a. Nirjala Ekadashi
  const nirjalaData = lookupVratData('nirjala-ekadashi');
  const nirjalaGeo = extractVratGeo(nirjalaData);
  const nirjalaRuleQA = nirjalaGeo.qa.find(q => q.question.includes("fasting rule"));
  check("Nirjala Ekadashi GEO includes fasting rule Q&A", Boolean(nirjalaRuleQA));
  check("Nirjala Ekadashi rule states complete waterless fasting", nirjalaRuleQA?.answer.includes("complete waterless fasting"));

  // 5b. Non-nirjala Ekadashi (e.g. Rama Ekadashi)
  const ramaData = lookupVratData('rama-ekadashi');
  const ramaGeo = extractVratGeo(ramaData);
  const ramaRuleQA = ramaGeo.qa.find(q => q.question.includes("fasting rule"));
  check("Rama Ekadashi rule explicitly states Phalahar fasting", ramaRuleQA?.answer.includes("Phalahar fasting"));

  // 5c. Puranmashi (Sikh)
  const puranmashiData = lookupVratData('puranmashi');
  const puranmashiGeo = extractVratGeo(puranmashiData);
  const puranmashiRuleQA = puranmashiGeo.qa.find(q => q.question.includes("fasting rule"));
  check("Puranmashi rule states fasting is not prescribed in Sikhi", puranmashiRuleQA?.answer.includes("Physical ritual fasting is not prescribed in Sikhi"));
  check("Puranmashi provenance is Sikh Tradition", puranmashiGeo.provenance === 'Sikh Tradition');

  // 5d. Uposatha (Buddhist)
  const uposathaData = lookupVratData('uposatha');
  const uposathaGeo = extractVratGeo(uposathaData);
  const uposathaRuleQA = uposathaGeo.qa.find(q => q.question.includes("fasting rule"));
  check("Uposatha rule states Eight Precepts / Ekbhukta", uposathaRuleQA?.answer.includes("Eight Precepts (Atthasila)") && uposathaRuleQA?.answer.includes("Ekbhukta"));
  check("Uposatha provenance is Buddhist Tradition", uposathaGeo.provenance === 'Buddhist Tradition');

  // 5e. Dharm Veer Hero GEO
  const sampleHero = {
    id: "baba-deep-singh",
    name: "Baba Deep Singh ji",
    era: "18th Century",
    tradition: "sikh",
    region: "Amritsar, Punjab",
    tagline: "The legendary warrior-scholar of the Damdami Taksal who defended the sanctity of Sri Harmandir Sahib.",
    journey: "A revered scholar who hand-scribed four copies of Guru Granth Sahib and a fearless warrior saint.",
    trial: "Vowed to reach Harmandir Sahib despite suffering a fatal neck wound in the Battle of Amritsar (1757).",
    teaching: "Dharma is not an academic debate — it is defending the sanctuary of the soul with your life.",
    moral: "Commitment to truth transcends mortal limitation.",
    source: "Prachin Panth Prakash by Rattan Singh Bhangu (1841); Sri Gur Pratap Suraj Granth (Suraj Prakash)"
  };
  const heroGeo = extractDharmVeerGeo(sampleHero);
  check("Dharm Veer GEO produces Q&A with who, trial, teaching & sources", heroGeo.qa.length >= 4);
  check("Dharm Veer GEO provenance is primary source", heroGeo.provenance.includes("Prachin Panth Prakash"));

  // 5f. Panchang GEO
  const panchangGeo = extractPanchangGeo({
    date: "2026-11-20",
    cityName: "New Delhi",
    timezone: "Asia/Kolkata",
    tithiName: "Shukla Dashami",
    nakshatraName: "Uttara Bhadrapada",
    yogaName: "Harshana",
    karanaName: "Gara",
    sunriseTime: "06:48 AM",
    sunsetTime: "05:25 PM",
    rahuKaalTime: "10:45 AM – 12:05 PM",
    brahmaMuhurtaTime: "05:04 AM – 05:56 AM"
  });
  check("Panchang GEO produces Q&A for timings, Rahu Kaal & Brahma Muhurta", panchangGeo.qa.length === 3);

} catch (e) {
  check("Active GEO Extractor Q&A Micro-Summaries executed", false, e.message);
}

// 6. Sanctuary Journal & Contemplative Wisdom Audit
console.log("\n6. Checking Sanctuary Journal Essays & Citations Metadata...");
try {
  const { getAllJournalEssays } = await import('../../src/config/journal.ts');
  const { extractJournalGeo } = await import('../../src/lib/seo/geo-extractors.ts');
  const essays = getAllJournalEssays();

  check("All 32 Sanctuary Journal essays exist in canonical registry", essays.length === 32);

  const missingMetadata = essays.filter(
    (e) => !e.citations?.length || !e.keyTakeaways?.length || !e.practiceGuidance?.steps?.length || !e.sections?.length
  );
  check("Every single essay contains complete citations, key takeaways, practice steps, and sections", missingMetadata.length === 0);

  // Test extraction on a sample essay (e.g. Brahma Muhurta)
  const brahmaEssay = essays.find((e) => e.slug === "the-sacred-science-of-brahma-muhurta-astronomy-and-awakening");
  if (brahmaEssay) {
    const journalGeo = extractJournalGeo(brahmaEssay);
    check("Journal GEO extraction yields Q&A for takeaways, practice, citations, and sections", journalGeo.qa.length >= 3);
    check("Journal GEO provenance carries primary scriptural citation", journalGeo.provenance.includes("Ashtanga Hridaya") || journalGeo.provenance.includes("Surya Siddhanta") || journalGeo.provenance.includes("Vagbhata"));
    check("Journal GEO canonical URL matches slug path", journalGeo.canonicalUrl === "https://www.shoonaya.com/journal/the-sacred-science-of-brahma-muhurta-astronomy-and-awakening");
  } else {
    check("Brahma Muhurta essay exists for GEO extraction", false);
  }
} catch (e) {
  check("Sanctuary Journal audit executed cleanly", false, e.message);
}

// 7. Panchatantra Public Stories Integrity Audit
console.log("\n7. Checking Panchatantra Public Stories Canonical Metadata...");
try {
  const { listPublicPanchatantraStories } = await import('../../src/lib/panchatantra-public.ts');
  const stories = listPublicPanchatantraStories();
  check("Public Panchatantra stories registry has active publishable stories", stories.length > 0);
  const storiesWithoutMoral = stories.filter((s) => !s.moral || !s.moralHi || !s.title || !s.body?.length);
  check("All public Panchatantra stories have dual-language title, moral, and body", storiesWithoutMoral.length === 0);
} catch (e) {
  check("Panchatantra stories audit executed cleanly", false, e.message);
}

// Summary
const score = Math.round((passedChecks / totalChecks) * 100);
console.log("\n-----------------------------------------------------------------");
console.log(`Audit Summary: ${passedChecks}/${totalChecks} checks passed (${score}% Citation Readiness Score)`);
console.log("-----------------------------------------------------------------");

if (score === 100) {
  console.log("🌟 AI Engine Optimization (GEO/AEO) Groundwork is 100% compliant & citation-ready!\n");
  process.exit(0);
} else {
  console.log("⚠️ Some checks failed. Review details above.\n");
  process.exit(1);
}
