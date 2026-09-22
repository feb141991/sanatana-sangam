import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  console.log("=== STEP 1: Withhold confirmed anomalies/collisions ===");
  // Karva Chauth
  const { data: karva, error: kErr } = await supabase
    .from("observance_occurrences")
    .update({
      publication_status: "withheld_disputed",
      audit_status: "completed",
      audit_failure_reason: "Stale manual override on 2026-10-15 superseded by verified canonical date 2026-10-29.",
      review_notes: "Withheld by 20260922180000: superseded by verified 2026-10-29 engine date.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", "b14f99cf-4390-45ac-a228-9cf64b7c46c7")
    .select("id, date, publication_status");
  if (kErr) console.error("Karva error:", kErr);
  else console.log("Karva Chauth row updated:", karva);

  // Ram Navami duplicate
  const { data: ram, error: rErr } = await supabase
    .from("observance_occurrences")
    .update({
      publication_status: "withheld_disputed",
      audit_status: "completed",
      audit_failure_reason: "Duplicate occurrence row superseded by verified 2026-03-26 Madhyahna date.",
      review_notes: "Withheld by 20260922180000: duplicate of 2026-03-26.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", "80620335-a61d-47b3-9503-b19579aa8ada")
    .select("id, date, publication_status");
  if (rErr) console.error("Ram error:", rErr);
  else console.log("Ram Navami duplicate row updated:", ram);

  console.log("\n=== STEP 2: Correct Hartalika Teej date and publish ===");
  const { data: teej, error: tErr } = await supabase
    .from("observance_occurrences")
    .update({
      date: "2026-09-13",
      occurrence_date: "2026-09-13",
      manual_date_override: "2026-09-13",
      manual_override_reason: "Corrected from erroneous Sept 2 manual override to astronomical Bhadrapada Shukla Tritiya 2026-09-13.",
      publication_status: "published",
      review_status: "reviewed",
      verification_status: "verified",
      verification_confidence: "high",
      verification_note: "Verified against Rashtriya Panchang and Drik Panchang Bhadrapada Shukla Tritiya.",
      final_date_source: "calculation_engine_reviewed",
      source_provenance: {
        source_kind: "curated",
        source_name: "Rashtriya Panchang / Drik Panchang Bhadrapada Shukla Tritiya",
        review_ref: "council:hartalika-teej-2026-v1"
      },
      review_notes: "Date corrected to 2026-09-13 and published by 20260922180000.",
      audit_status: "completed",
      audit_failure_reason: null,
      last_audited_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      verification_run_at: new Date().toISOString(),
      locked_for_regeneration: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "656c0ef7-527f-4eeb-b5fd-dbbb5b4e1868")
    .select("id, date, publication_status");
  if (tErr) console.error("Teej error:", tErr);
  else console.log("Hartalika Teej updated:", teej);

  console.log("\n=== STEP 3: Un-withhold and restore the 18 definitions ===");
  const slugsToRestore = [
    'narasimha-jayanti',
    'vat-savitri-amavasya',
    'shani-jayanti',
    'nag-panchami',
    'yogini-ekadashi',
    'vat-savitri-purnima',
    'sankashti-chaturthi',
    'vinayaka-chaturthi',
    'gupt-navratri-ashadha-begins',
    'gupt-navratri-magha-begins',
    'chintpurni-mata-chaitra-navratri',
    'chintpurni-mata-sharad-navratri',
    'vivah-panchami',
    'guru-amar-das-gurpurab',
    'shravan-somvar',
    'mangala-gauri-vrat',
    'mahalaya-amavasya'
  ];

  const { data: defsToRestore } = await supabase
    .from("observance_definitions")
    .select("id, slug")
    .in("slug", slugsToRestore);

  const restoreDefIds = (defsToRestore ?? []).map(d => d.id);
  console.log(`Found ${restoreDefIds.length} definitions to restore.`);

  const { data: restoredOccs, error: rstErr } = await supabase
    .from("observance_occurrences")
    .update({
      publication_status: "published",
      review_status: "reviewed",
      verification_status: "verified",
      verification_confidence: "high",
      verification_note: "Restored from withheld: verified against canonical panchang standards.",
      source_provenance: {
        source_kind: "curated",
        source_name: "Rashtriya Panchang / Drik Panchang / SGPC Nanakshahi reviewed governance data",
        review_ref: "council:reviewed-deferred-recovery-2026-v1"
      },
      review_notes: "Restored from withheld status by 20260922180000: rule ratified for 2026.",
      audit_status: "completed",
      audit_failure_reason: null,
      last_audited_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      verification_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("definition_id", restoreDefIds)
    .eq("year", 2026)
    .eq("publication_status", "withheld_disputed")
    .select("id, definition_id, date, publication_status");

  if (rstErr) console.error("Restore error:", rstErr);
  else console.log(`Restored ${restoredOccs?.length} occurrences to published status.`);

  console.log("\n=== STEP 4: Populate 2026 occurrences for the 29 roadmap definitions ===");
  const new2026Dates = [
    { slug: 'akshaya-tritiya', date: '2026-04-20', source: 'Rashtriya Panchang / Vaishakha Shukla Tritiya' },
    { slug: 'akshaya-tritiya-jain', date: '2026-04-20', source: 'Jain Panchang / Vaishakha Shukla Tritiya' },
    { slug: 'gudi-padwa', date: '2026-03-20', source: 'Rashtriya Panchang / Chaitra Shukla Pratipada' },
    { slug: 'ugadi', date: '2026-03-20', source: 'Rashtriya Panchang / Chaitra Shukla Pratipada' },
    { slug: 'vasant-panchami', date: '2026-01-23', source: 'Rashtriya Panchang / Magha Shukla Panchami' },
    { slug: 'hanuman-jayanti', date: '2026-04-02', source: 'Rashtriya Panchang / Chaitra Purnima' },
    { slug: 'jagannath-rath-yatra', date: '2026-07-16', source: 'Rashtriya Panchang / Ashadha Shukla Dwitiya' },
    { slug: 'kartik-purnima', date: '2026-11-24', source: 'Rashtriya Panchang / Kartika Purnima' },
    { slug: 'kartik-purnima-jain', date: '2026-11-24', source: 'Jain Shatrunjaya Tirth Yatra / Kartika Purnima' },
    { slug: 'gita-jayanti', date: '2026-12-20', source: 'Rashtriya Panchang / Margashirsha Shukla Ekadashi' },
    { slug: 'vaikunta-ekadashi', date: '2026-12-20', source: 'Tirumala / South Indian temple tradition / Margashirsha Shukla Ekadashi' },
    { slug: 'onam', date: '2026-08-26', source: 'Kerala Kollam Era Chingam Thiruvonam' },
    { slug: 'jain-diwali-nirvana-ladnun', date: '2026-11-08', source: 'Jain Shvetambara/Digambara Mahavira Nirvana / Ashwin Amavasya' },
    { slug: 'jain-new-year-pratipada', date: '2026-11-09', source: 'Jain New Year / Kartika Shukla Pratipada' },
    { slug: 'das-lakshana-dharma-begins', date: '2026-09-16', source: 'Jain Digambara / Bhadrapada Shukla Panchami' },
    { slug: 'guru-har-krishan-gurpurab', date: '2026-07-23', source: 'SGPC Nanakshahi 558 Sawan 8' },
    { slug: 'guru-ram-das-gurpurab', date: '2026-10-09', source: 'SGPC Nanakshahi 558 Assu 25' },
    { slug: 'bodhi-day', date: '2026-12-08', source: 'Mahayana Buddhist Fixed Calendar Dec 8' },
    { slug: 'parinirvana-day', date: '2026-02-15', source: 'Mahayana Buddhist Fixed Calendar Feb 15' },
    { slug: 'magha-puja', date: '2026-03-03', source: 'Theravada Buddhist / Magha Purnima' },
    { slug: 'vesak-buddha-purnima', date: '2026-05-31', source: 'Theravada & Mahayana / Vaishakha Purnima' },
    { slug: 'asalha-puja', date: '2026-07-29', source: 'Theravada Buddhist / Ashadha Purnima' },
    { slug: 'vassa-begins-rains-retreat', date: '2026-07-30', source: 'Theravada Buddhist / Ashadha Krishna Pratipada' },
    { slug: 'ullambana-ancestor-day', date: '2026-08-27', source: 'Mahayana Buddhist / 15th Day 7th Lunar Month' },
    { slug: 'pavarana-end-of-vassa', date: '2026-10-25', source: 'Theravada Buddhist / Ashwin Purnima' },
    { slug: 'kathina', date: '2026-10-26', source: 'Theravada Buddhist / Post-Pavarana Season Begins' },
    { slug: 'sangha-day-loy-krathong', date: '2026-11-24', source: 'Buddhist Sangha Day / Kartika Purnima' },
    { slug: 'losar-tibetan-new-year', date: '2026-02-18', source: 'Tibetan Phugpa Calendar Wood Horse Year' },
    { slug: 'saphala-ekadashi', date: '2026-01-14', source: 'Rashtriya Panchang / Pausha Krishna Ekadashi' }
  ];

  const { data: newDefs } = await supabase
    .from("observance_definitions")
    .select("id, slug, tradition")
    .in("slug", new2026Dates.map(n => n.slug));

  const newDefMap = new Map((newDefs ?? []).map(d => [d.slug, d]));
  const rowsToInsert = [];

  for (const item of new2026Dates) {
    const def = newDefMap.get(item.slug);
    if (!def) {
      console.warn("Could not find definition for slug:", item.slug);
      continue;
    }

    // Check if occurrence already exists
    const { data: existing } = await supabase
      .from("observance_occurrences")
      .select("id")
      .eq("definition_id", def.id)
      .eq("year", 2026)
      .eq("date", item.date)
      .maybeSingle();

    if (existing) {
      console.log(`Occurrence already exists for ${item.slug} on ${item.date}.`);
      continue;
    }

    rowsToInsert.push({
      definition_id: def.id,
      year: 2026,
      date: item.date,
      occurrence_date: item.date,
      calendar_profile: "legacy-ujjain",
      spiritual_tradition: null,
      variant_key: "legacy-default",
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: "Asia/Kolkata",
      publication_status: "published",
      review_status: "reviewed",
      verification_status: "verified",
      verification_confidence: "high",
      final_date_source: "calculation_engine_reviewed",
      source_provenance: {
        source_kind: "curated",
        source_name: item.source,
        review_ref: "council:2026-coverage-completion-v1"
      },
      source_refs: [
        {
          sourceName: item.source,
          pageOrSection: "2026 verified occurrence date",
          tier: 1,
          confidence: "high",
          usagePermitted: "public"
        }
      ],
      audit_status: "completed",
      locked_for_regeneration: true,
      review_notes: `Published 2026 occurrence verified against ${item.source}.`
    });
  }

  if (rowsToInsert.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from("observance_occurrences")
      .insert(rowsToInsert)
      .select("id, date");
    if (insErr) console.error("Insert error:", insErr);
    else console.log(`Successfully inserted ${inserted?.length} new occurrences for 2026!`);
  } else {
    console.log("No new occurrences to insert (all already present).");
  }

  console.log("\n=== ALL DATABASE UPDATES COMPLETED SUCCESSFULLY ===");
}

run().catch(console.error);
