// Links between journal essays and the public pages they explain: festival
// dates by city, vrat guides, Ekadashi pages, the Panchang and Kumbh 2027.
// Every target here must be a page the sitemap lists; journal-site-links.test.ts
// checks that, so a renamed or removed page fails the test instead of linking
// to a 404.

export type JournalSiteLink = { label: string; href: string };

type EssaySiteTargets = {
  /** Festival slugs with /festivals/<slug>/<city> pages. */
  festivals?: string[];
  /** Vrat ids with /vrat/<id> pages. */
  vrats?: string[];
  /** Festival slugs with /festival/<slug> pages. */
  festivalPages?: string[];
  /** Other public pages. */
  pages?: JournalSiteLink[];
};

export const FESTIVAL_LINK_CITIES = [
  { slug: "london", name: "London" },
  { slug: "new-york", name: "New York" },
  { slug: "toronto", name: "Toronto" },
  { slug: "delhi", name: "Delhi" },
] as const;

export const FESTIVAL_NAMES: Record<string, string> = {
  diwali: "Diwali",
  dhanteras: "Dhanteras",
  "maha-shivaratri": "Maha Shivaratri",
  "krishna-janmashtami": "Krishna Janmashtami",
  "ganesh-chaturthi": "Ganesh Chaturthi",
  "karva-chauth": "Karva Chauth",
  "chhath-puja": "Chhath Puja",
  "hanuman-jayanti": "Hanuman Jayanti",
  "makar-sankranti": "Makar Sankranti",
  "navratri-begins": "Sharad Navratri",
  "chaitra-navratri-begins": "Chaitra Navratri",
  "nirjala-ekadashi": "Nirjala Ekadashi",
  "vaikunta-ekadashi": "Vaikunta Ekadashi",
};

const VRAT_NAMES: Record<string, string> = {
  ekadashi: "Ekadashi vrat guide",
  pradosh: "Pradosh vrat guide",
  shivaratri: "Shivaratri vrat guide",
  chaturthi: "Chaturthi vrat guide",
  amavasya: "Amavasya guide",
  purnima: "Purnima guide",
};

const PANCHANG: JournalSiteLink = { label: "Today's Panchang", href: "/panchang/today" };

const ESSAY_SITE_TARGETS: Record<string, EssaySiteTargets> = {
  "the-complete-ekadashi-parana-guide-shastric-rules-and-timing": {
    festivals: ["nirjala-ekadashi", "vaikunta-ekadashi"],
    vrats: ["ekadashi"],
    festivalPages: ["ekadashi"],
  },
  "dietary-purity-and-the-science-of-fasting-ayurvedic-autophagy": { vrats: ["ekadashi"] },
  "tulsi-seva-shastric-rules-for-watering-and-plucking": { vrats: ["ekadashi"] },
  "karwa-chauth-moonrise-astronomy-and-global-cities": { festivals: ["karva-chauth"] },
  "makar-sankranti-astronomy-punya-kaal-and-uttarayana": { festivals: ["makar-sankranti"] },
  "maha-shivratri-nishita-kaal-and-four-pahar-puja": {
    festivals: ["maha-shivaratri"],
    vrats: ["shivaratri"],
  },
  "pradosh-vrat-twilight-window-and-shani-pradosham": { vrats: ["pradosh"] },
  "navratri-ghatasthapana-muhurta-and-nine-devi-forms": {
    festivals: ["navratri-begins", "chaitra-navratri-begins"],
  },
  "diwali-lakshmi-puja-sthira-lagna-and-dhanteras-astronomy": { festivals: ["diwali", "dhanteras"] },
  "sri-krishna-janmashtami-ashtami-vs-rohini-nakshatra": { festivals: ["krishna-janmashtami"] },
  "ganesh-chaturthi-madhyahna-sthapana-and-chandra-darshan-dosha": {
    festivals: ["ganesh-chaturthi"],
    vrats: ["chaturthi"],
  },
  "chhath-puja-austere-tapasya-and-solar-biophysics": { festivals: ["chhath-puja"] },
  "hanuman-chalisa-meaning-meter-and-astrological-protection": { festivals: ["hanuman-jayanti"] },
  "amavasya-vs-purnima-navigating-lunar-polarities-and-consciousness": {
    vrats: ["amavasya", "purnima"],
  },
  "pitru-paksha-and-mahalaya-ancestral-tarpan-science": { vrats: ["amavasya"], pages: [PANCHANG] },
  "rhythm-of-sacred-time-panchang": { pages: [PANCHANG] },
  "the-global-tithi-discrepancy-astronomy-and-timezones": { pages: [PANCHANG] },
  "rahu-kaal-and-choghadiya-astronomy-and-muhurta-science": { pages: [PANCHANG] },
  "the-sacred-science-of-brahma-muhurta-astronomy-and-awakening": { pages: [PANCHANG] },
  "sandhyavandanam-cosmic-science-of-trisandhya-and-solar-meditation": { pages: [PANCHANG] },
  "surya-arghya-the-sacred-science-of-offering-water-to-the-sun": { pages: [PANCHANG] },
  "kumbh-2027-haridwar-nashik-official-dates": {
    pages: [{ label: "Kumbh 2027 countdown and bathing days", href: "/kumbh-2027" }],
  },
};

export type JournalFestivalGroup = { festival: string; name: string; links: JournalSiteLink[] };

export type JournalSiteLinks = {
  festivalDates: JournalFestivalGroup[];
  guides: JournalSiteLink[];
};

export function getJournalSiteLinks(essaySlug: string): JournalSiteLinks {
  const targets = ESSAY_SITE_TARGETS[essaySlug] ?? {};
  const festivalDates = (targets.festivals ?? []).map((festival) => ({
    festival,
    name: FESTIVAL_NAMES[festival] ?? festival,
    links: FESTIVAL_LINK_CITIES.map((city) => ({
      label: city.name,
      href: `/festivals/${festival}/${city.slug}`,
    })),
  }));
  const guides: JournalSiteLink[] = [
    ...(targets.vrats ?? []).map((id) => ({ label: VRAT_NAMES[id] ?? id, href: `/vrat/${id}` })),
    ...(targets.festivalPages ?? []).map((slug) => ({
      label: `${FESTIVAL_NAMES[slug] ?? "Ekadashi"} dates and parana`,
      href: `/festival/${slug}`,
    })),
    ...(targets.pages ?? []),
  ];
  return { festivalDates, guides };
}

/** Essay slugs that explain a festival with /festivals/<slug>/<city> pages. */
export function getEssaySlugsForFestival(festivalSlug: string): string[] {
  return Object.entries(ESSAY_SITE_TARGETS)
    .filter(([, targets]) => targets.festivals?.includes(festivalSlug))
    .map(([slug]) => slug);
}

/** Every essay slug this file links from, for the test. */
export function linkedEssaySlugs(): string[] {
  return Object.keys(ESSAY_SITE_TARGETS);
}
