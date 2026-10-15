/**
 * Content pillars for diaspora marketing: the angles that speak to people keeping a tradition far from where it
 * began. A pillar is an emotional truth plus the message built on it, and the product facts (claims.ts) it is
 * allowed to lean on. The insight is something to write toward; it is never to be quoted to the reader as a fact
 * or a statistic.
 *
 * Every claim a pillar names must be confirmed (claims.ts). A pillar that is about a specific occasion needs a
 * verified occurrence, so a date can never come from the writer.
 */

export interface Pillar {
  id: string;
  title: string;
  /** Who it is for. */
  audience: string;
  /** The feeling this speaks to. Written toward, never asserted as a fact. */
  insight: string;
  /** What the message says. */
  message: string;
  /** Claim ids this pillar may use. */
  claims: readonly string[];
  /** True when it only makes sense around a specific, verified observance. */
  needsOccasion: boolean;
}

export const PILLARS: readonly Pillar[] = [
  {
    id: "which_day_where_i_live",
    title: "Which day is it, where I live?",
    audience: "Adults who observe vrats and festivals and want to be sure of the day",
    insight: "The quiet worry of not being certain you are keeping the right day, away from the place you learned it.",
    message: "A calendar that follows your own city, so the question of the day has a clear answer you can check.",
    claims: ["city_aware_panchang", "festival_guides"],
    needsOccasion: false
  },
  {
    id: "festivals_for_children_abroad",
    title: "Festivals for children growing up abroad",
    audience: "Parents who want their children to know the story behind the festival, not only the sweets and the lights",
    insight: "Wanting a child to feel the meaning of a festival while school, friends and the surrounding culture pull in other directions.",
    message: "Stories and guides that make a festival something a family can understand together.",
    claims: ["festival_guides", "pathshala", "languages"],
    needsOccasion: false
  },
  {
    id: "grandparents_and_grandchildren",
    title: "Between grandparents and grandchildren",
    audience: "Families who want older and younger generations to share the same practice across a language gap",
    insight: "A grandparent speaks Hindi or Punjabi at home and a grandchild answers in English; both want the same thing.",
    message: "An app in English, Hindi and Punjabi, so each person can use the language they are most at home in.",
    claims: ["languages", "festival_guides"],
    needsOccasion: false
  },
  {
    id: "a_small_daily_anchor",
    title: "A small daily anchor",
    audience: "Busy working people who miss the rhythm of daily practice they grew up with",
    insight: "Wanting a few steady minutes in a full day, not a project.",
    message: "A japa counter and a daily shloka: small enough to keep.",
    claims: ["japa_and_shloka", "festival_reminders"],
    needsOccasion: false
  },
  {
    id: "your_tradition_not_just_hindu",
    title: "Your tradition, on its own terms",
    audience: "Sikh, Buddhist and Jain families who rarely see their own path treated as its own",
    insight: "Being offered one generic version of dharma and having to translate it into your own tradition.",
    message: "Separate experiences for Hindu, Sikh, Buddhist and Jain practice, each in its own words.",
    claims: ["four_traditions", "festival_guides"],
    needsOccasion: false
  },
  {
    id: "finding_a_temple_when_you_move",
    title: "Finding a place to go when you move",
    audience: "People who have just moved to a new city",
    insight: "Starting again, and wanting to find where your own community gathers.",
    message: "A directory of temples, gurdwaras, viharas and Jain temples in many cities, with coverage still growing.",
    claims: ["temples_directory", "four_traditions"],
    needsOccasion: false
  },
  {
    id: "festival_season_ahead",
    title: "A festival coming up, where you are",
    audience: "Anyone who observes the named festival",
    insight: "The days before a festival are when people want things clear and ready.",
    message: "The festival, its verified date, and the reminders and guides that help a household prepare.",
    claims: ["city_aware_panchang", "festival_reminders", "festival_guides"],
    needsOccasion: true
  },
  {
    id: "learning_without_embarrassment",
    title: "Learning, without feeling behind",
    audience: "Adults who never had the chance to learn the practice properly and feel shy to ask",
    insight: "Feeling you should already know, and not wanting to be seen not knowing.",
    message: "Lessons you can open privately and follow in your own time.",
    claims: ["pathshala", "languages", "festival_guides"],
    needsOccasion: false
  },
  {
    id: "private_by_default",
    title: "Your practice stays yours",
    audience: "People who are careful with personal and religious information",
    insight: "Religion is personal, and many people are wary of apps that collect it.",
    message: "Optional analytics and marketing email are off until you turn them on.",
    claims: ["optional_data_off_by_default"],
    needsOccasion: false
  }
];

export function pillarById(id: string): Pillar | undefined {
  return PILLARS.find((pillar) => pillar.id === id);
}
