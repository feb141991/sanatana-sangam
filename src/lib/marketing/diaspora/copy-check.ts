/**
 * Checks what the copywriter produced against the rules in the brief, before anything is saved.
 *
 * A model can ignore its instructions; this cannot. Each rule matches a kind of claim that would be false,
 * unverifiable or against the content rules (AGENTS.md section 3: no invented scripture, source, date or claim).
 * It is deliberately strict and will sometimes refuse harmless copy; that costs a regenerate, whereas a missed
 * violation costs the founder's credibility.
 */

export type CopyRule =
  | "indic_script"
  | "statistic"
  | "social_proof"
  | "attributed_quote"
  | "overclaim"
  | "outcome_promise"
  | "scripture_attribution"
  | "date_or_time"
  | "unconfirmed_feature"
  | "store_availability";

export interface Violation {
  rule: CopyRule;
  /** The text that tripped the rule, shortened. */
  excerpt: string;
  /** Plain-language reason, also given back to the writer on a retry. */
  message: string;
}

export interface CheckOptions {
  /** The verified occasion's date (YYYY-MM-DD). Its month and day may appear; no other date may. */
  occasionDate?: string | null;
  /** When Android has a public store listing, mentioning it is allowed. */
  androidPublic?: boolean;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_PATTERN = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

function monthIndex(name: string): number {
  const lower = name.toLowerCase();
  return MONTHS.findIndex((m) => m.startsWith(lower.slice(0, 3)));
}

interface PatternRule {
  rule: CopyRule;
  pattern: RegExp;
  message: string;
}

const RULES: readonly PatternRule[] = [
  { rule: "indic_script", pattern: /[ऀ-ॿ਀-੿]/, message: "Do not write any Devanagari or Gurmukhi text: scripture, mantras and prayers are never written by the copywriter." },
  { rule: "statistic", pattern: /\b\d[\d,.]*\s*(?:\+|k\b|m\b|million|thousand|lakh|crore)?\s*(?:users|families|households|members|devotees|people|downloads|temples|gurdwaras|cities|countries)\b/i, message: "Do not state any number of users, families, members, downloads, temples or places." },
  { rule: "statistic", pattern: /\b(?:thousands|millions|hundreds|lakhs|crores)\s+of\b/i, message: "Do not use \"thousands of\", \"millions of\" or similar." },
  { rule: "statistic", pattern: /\b\d+\s?%/, message: "Do not state any percentage." },
  { rule: "social_proof", pattern: /\b(?:trusted by|loved by|join (?:the )?(?:thousands|millions|community of)|number one|award|featured (?:in|on)|as seen (?:in|on)|top[- ]rated|highly rated)\b|#\s?1\b/i, message: "Do not claim popularity, awards, press or ratings." },
  { rule: "attributed_quote", pattern: /["“][^"”]{20,}["”]\s*[-—–]\s*[A-Z]/, message: "Do not include a quote attributed to a person." },
  { rule: "overclaim", pattern: /\b(?:most accurate|100\s?%|guarantee[sd]?|never miss|always accurate|perfectly accurate|flawless)\b/i, message: "Do not promise accuracy or certainty: avoid \"never miss\", \"guaranteed\" and \"most accurate\"." },
  { rule: "outcome_promise", pattern: /\b(?:heal(?:s|ing)?|cure[sd]?|salvation|moksha is guaranteed)\b|\b(?:bring|give|grant|bless)(?:es)? you (?:peace|blessings|happiness|calm)\b/i, message: "Do not promise spiritual or health outcomes." },
  { rule: "scripture_attribution", pattern: /\b(?:gita|vedas?|upanishads?|guru granth sahib|granth|dhammapada|sutras?|scriptures?)\b[^.]{0,40}\b(?:says?|teach(?:es)?|tells? us|declares?)\b|\b(?:says?|teach(?:es)?|tells? us|according to)\b[^.]{0,40}\b(?:gita|vedas?|upanishads?|guru granth sahib|dhammapada|sutras?|scriptures?)\b/i, message: "Do not say what a scripture says or teaches." },
  { rule: "unconfirmed_feature", pattern: /\b(?:kul|mandali)\b/i, message: "Do not mention Kul or Mandali: they cannot be promised yet." },
  { rule: "unconfirmed_feature", pattern: /\b(?:ad[- ]free|no ads|zero[- ]tracking|tracks nothing|never tracks?|completely free|free forever|100% free)\b/i, message: "Do not claim Shoonaya is ad-free, free, or tracks nothing." }
];

const ANDROID_PATTERN = /\b(?:google play|play store|android)\b/i;
const CLOCK_TIME = /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(?:am|pm)\b/i;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;
const NUMERIC_DATE = /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/;
const DAY_MONTH = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_PATTERN}\\b`, "gi");
const MONTH_DAY = new RegExp(`\\b${MONTH_PATTERN}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "gi");

function excerpt(text: string, index: number, length: number): string {
  return text.slice(Math.max(0, index - 10), Math.min(text.length, index + length + 10)).replace(/\s+/g, " ").trim().slice(0, 80);
}

function dateViolations(text: string, occasionDate?: string | null): Violation[] {
  const found: Violation[] = [];
  const allowed = occasionDate && /^\d{4}-\d{2}-\d{2}$/.test(occasionDate)
    ? { month: Number(occasionDate.slice(5, 7)) - 1, day: Number(occasionDate.slice(8, 10)), iso: occasionDate }
    : null;
  const message = "Do not write a date or time: only the verified occasion's own date may appear, and no clock times at all.";

  const clock = CLOCK_TIME.exec(text);
  if (clock) found.push({ rule: "date_or_time", excerpt: excerpt(text, clock.index, clock[0].length), message });

  for (const match of text.matchAll(ISO_DATE)) {
    if (!allowed || match[0] !== allowed.iso) found.push({ rule: "date_or_time", excerpt: excerpt(text, match.index ?? 0, match[0].length), message });
  }
  const numeric = NUMERIC_DATE.exec(text);
  if (numeric) found.push({ rule: "date_or_time", excerpt: excerpt(text, numeric.index, numeric[0].length), message });

  for (const match of text.matchAll(DAY_MONTH)) {
    const day = Number(match[1]);
    const month = monthIndex(match[2]);
    if (!allowed || month !== allowed.month || day !== allowed.day) found.push({ rule: "date_or_time", excerpt: excerpt(text, match.index ?? 0, match[0].length), message });
  }
  for (const match of text.matchAll(MONTH_DAY)) {
    const month = monthIndex(match[1]);
    const day = Number(match[2]);
    if (!allowed || month !== allowed.month || day !== allowed.day) found.push({ rule: "date_or_time", excerpt: excerpt(text, match.index ?? 0, match[0].length), message });
  }
  return found;
}

/** Every rule a piece of copy breaks. Empty means it passed. Each rule is reported once per kind of excerpt. */
export function checkDiasporaCopy(text: string, options: CheckOptions = {}): Violation[] {
  const violations: Violation[] = [];

  for (const { rule, pattern, message } of RULES) {
    const match = pattern.exec(text);
    if (match) violations.push({ rule, excerpt: excerpt(text, match.index, match[0].length), message });
  }
  if (!options.androidPublic) {
    const android = ANDROID_PATTERN.exec(text);
    if (android) {
      violations.push({
        rule: "store_availability",
        excerpt: excerpt(text, android.index, android[0].length),
        message: "Do not mention Google Play or Android: there is no public Android listing yet."
      });
    }
  }
  violations.push(...dateViolations(text, options.occasionDate));

  // The same text can trip a rule twice (two patterns, two dates); keep one of each excerpt.
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.rule}|${v.excerpt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function checkVariantCopy(
  fields: { subject?: string | null; body: string; cta_text?: string | null },
  options: CheckOptions = {}
): Violation[] {
  return checkDiasporaCopy([fields.subject ?? "", fields.body, fields.cta_text ?? ""].join("\n"), options);
}
