/**
 * The only things diaspora marketing copy may say about Shoonaya.
 *
 * Marketing copy must not overstate what the product does (the brand rule in the copywriter's system prompt), and
 * on a spiritual product a false promise costs trust twice. So every product claim is registered here with the
 * evidence it rests on, and only CONFIRMED claims are ever given to the writer. A claim that is not safe to make
 * today stays in the list as "needs_confirmation" with the reason, so it is visible and can be switched on by a
 * person once it is true, instead of being quietly dropped or quietly used.
 *
 * Evidence was read from the apps and the production database on 2026-10-15; re-check before relying on it.
 */

export type ClaimStatus = "confirmed" | "needs_confirmation";

export interface ProductClaim {
  id: string;
  /** What copy may say, in plain words. */
  statement: string;
  status: ClaimStatus;
  /** Where this is true (confirmed) or why it cannot be said yet (needs_confirmation). */
  evidence: string;
}

export const PRODUCT_CLAIMS: readonly ProductClaim[] = [
  {
    id: "four_traditions",
    statement: "Shoonaya has separate experiences for Hindu, Sikh, Buddhist and Jain practice.",
    status: "confirmed",
    evidence: "Onboarding asks for the tradition and every tab adapts to it; the brand statement says the four are distinct, never interchangeable."
  },
  {
    id: "city_aware_panchang",
    statement: "Panchang and festival timings follow the city you set, including sunrise-based times.",
    status: "confirmed",
    evidence: "The onboarding location step promises exactly this, and the calendar API takes the timezone; copy must stay at this level and never state a specific time."
  },
  {
    id: "festival_reminders",
    statement: "You can turn on reminders for festivals and vrats; they are off until you choose.",
    status: "confirmed",
    evidence: "Settings and onboarding have festival and vrat reminder switches (wants_festival_reminders, wants_vrat_reminders). Do not promise delivery times."
  },
  {
    id: "festival_guides",
    statement: "There are guides and stories for festivals and vrats.",
    status: "confirmed",
    evidence: "app/festival/[slug].tsx and app/vrat/[slug].tsx exist, backed by festival stories and vrat content."
  },
  {
    id: "languages",
    statement: "The app is available in English, Hindi and Punjabi.",
    status: "confirmed",
    evidence: "app_language accepts en, hi and pa (backend profile route and the app's settings)."
  },
  {
    id: "pathshala",
    statement: "Pathshala offers learning paths and lessons.",
    status: "confirmed",
    evidence: "app/(tabs)/pathshala.tsx and app/pathshala/[pathId]/[lessonId].tsx exist."
  },
  {
    id: "japa_and_shloka",
    statement: "There is a japa mala counter and a daily shloka.",
    status: "confirmed",
    evidence: "app/(tabs)/japa.tsx and app/shloka.tsx exist."
  },
  {
    id: "temples_directory",
    statement: "Tirtha lists temples and gurdwaras in many cities; coverage is still growing.",
    status: "confirmed",
    evidence: "app/(tabs)/tirtha.tsx and the curated diaspora directory (src/lib/diaspora-temples.ts): 54 places in 12 countries on 2026-10-15, Hindu and Sikh only. Buddhist and Jain places depend on map data and are not curated, so do not promise them. Always say coverage is still growing; never promise a particular city or country."
  },
  {
    id: "optional_data_off_by_default",
    statement: "In the app, optional analytics and marketing email are off until you turn them on.",
    status: "confirmed",
    evidence: "consent_product_analytics and marketing_consent default to false; onboarding's email switch starts off."
  },
  {
    id: "kul_family_space",
    statement: "Kul is a private space for your family.",
    status: "needs_confirmation",
    evidence: "app/kul.tsx exists but the Kul rollout is still in separate branches and production holds 2 families. Confirm it is released before using."
  },
  {
    id: "mandali_community",
    statement: "Mandali connects you with others in your city.",
    status: "needs_confirmation",
    evidence: "The tab exists, but production holds 0 Mandalis on 2026-10-15: promising a community that is empty would be false."
  },
  {
    id: "ad_free",
    statement: "Shoonaya is ad-free and tracks nothing.",
    status: "needs_confirmation",
    evidence: "The 'ad-free' and 'zero-tracking' wording was removed from the site on 2026-10-15, but the code can still load Google AdSense and Google Analytics once a visitor opts in. Decide whether that wiring stays before anyone says it again."
  }
];

export function confirmedClaims(): ProductClaim[] {
  return PRODUCT_CLAIMS.filter((claim) => claim.status === "confirmed");
}

export function unconfirmedClaims(): ProductClaim[] {
  return PRODUCT_CLAIMS.filter((claim) => claim.status !== "confirmed");
}

export function claimById(id: string): ProductClaim | undefined {
  return PRODUCT_CLAIMS.find((claim) => claim.id === id);
}
