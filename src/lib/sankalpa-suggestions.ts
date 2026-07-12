// Static, always-available bank of Sankalpa suggestions. This is the
// deterministic fallback for GET /api/sankalpa/suggest — it must work with
// zero network/AI dependency so the create-Sankalpa flow never blocks or
// breaks if the AI provider is slow, unavailable, or rate-limited. Same
// philosophy as this codebase's other AI-augmented-not-AI-dependent
// features (see festival-verify.ts): the deterministic path is the
// contract, AI personalization is strictly an enhancement on top of it.
//
// Tagged by `related_practice` using the same vocabulary the Sankalpa
// table/UI already use elsewhere (SetSankalpSheet.tsx's PRACTICES array:
// Japa, Nitya, Pathshala, All — lowercased here to match what's actually
// stored in `sankalpas.related_practice`).

export type SankalpaSuggestionPractice = 'japa' | 'nitya' | 'pathshala' | 'quiz' | 'all';

export interface SankalpaSuggestion {
  text: string;
  practice: SankalpaSuggestionPractice;
}

export const SANKALPA_SUGGESTIONS: SankalpaSuggestion[] = [
  // japa
  { text: 'I will complete my daily japa mala without missing a single day.', practice: 'japa' },
  { text: 'I will chant with full attention, not rushing through my mala.', practice: 'japa' },
  { text: 'I will begin each day with japa before I touch my phone.', practice: 'japa' },

  // nitya
  { text: 'I will complete my full nitya karma every morning.', practice: 'nitya' },
  { text: 'I will not skip my evening sandhya, no matter how tired I am.', practice: 'nitya' },
  { text: 'I will hold my nitya practice steady through days that test my resolve.', practice: 'nitya' },

  // pathshala
  { text: 'I will finish one Pathshala lesson every day without exception.', practice: 'pathshala' },
  { text: 'I will read and reflect on scripture daily, even if just for ten minutes.', practice: 'pathshala' },
  { text: 'I will complete the path I started instead of leaving it half-walked.', practice: 'pathshala' },

  // quiz
  { text: "I will take the daily quiz to test what I've actually understood, not just read.", practice: 'quiz' },

  // all / general
  { text: 'I will show up for my practice every single day, even the difficult ones.', practice: 'all' },
  { text: 'I will protect ten quiet minutes each morning as non-negotiable.', practice: 'all' },
  { text: 'I will let go of one habit that pulls me away from my sadhana.', practice: 'all' },
  { text: 'I will offer gratitude before I sleep, each night, without fail.', practice: 'all' },
  { text: 'I will speak only what is true and necessary for the length of this vow.', practice: 'all' },
  { text: 'I will observe one full day of silence each week for the duration of this Sankalpa.', practice: 'all' },
];

/**
 * Picks up to `count` fallback suggestions, biased toward `topPractice`
 * (the user's most-active practice, if known) with `all`-tagged entries
 * filling any remaining slots. Always returns `count` items as long as the
 * bank has enough entries — the caller never has to special-case "not
 * enough suggestions."
 */
export function pickFallbackSuggestions(topPractice: SankalpaSuggestionPractice | null, count = 4): string[] {
  const preferred = topPractice
    ? SANKALPA_SUGGESTIONS.filter((s) => s.practice === topPractice)
    : [];
  const rest = SANKALPA_SUGGESTIONS.filter((s) => !preferred.includes(s));

  const picked = [...preferred, ...rest].slice(0, count).map((s) => s.text);
  return picked;
}
