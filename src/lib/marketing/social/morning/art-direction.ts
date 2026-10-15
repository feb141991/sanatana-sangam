/**
 * Art direction for AI-made or commissioned background art, one prompt per tradition.
 *
 * Nothing here generates anything: Shoonaya has no image-generation vendor (AGENTS.md section 11), and choosing
 * one, with its key and cost, is the founder's call. These prompts are ready for whichever tool is chosen, or for
 * an artist. They carry the app's own colours so the art sits on the cards, and they say what must never appear:
 *   - no text of any kind (image models cannot spell Devanagari or Gurmukhi, and scripture is set separately);
 *   - none of the figures each tradition asks not to see used as decoration.
 *
 * Whatever is produced must still pass `npm run check:assets` and have its tool, date and rights status recorded
 * before it is committed.
 */
import { BRAND_GOLD, PAPER, TRADITION_ACCENT } from "./card-theme";
import { MORNING_TRADITIONS, type MorningTradition } from "./types";

interface TraditionArt {
  /** What the art is made of: calm, symbolic, free of figures. */
  motifs: string[];
  /** What this tradition asks not to see used as decoration, in addition to the shared rules. */
  avoid: string[];
}

const ART: Record<MorningTradition, TraditionArt> = {
  hindu: {
    motifs: [
      "a single lit diya with a small steady flame",
      "an unopened lotus bud on still water",
      "first sunlight across a quiet river at dawn, as soft bands of colour",
      "faint concentric mandala geometry"
    ],
    avoid: [
      "any deity, murti or avatar, drawn or implied",
      "the Om symbol or any letterform used as ornament",
      "temple interiors"
    ]
  },
  sikh: {
    motifs: [
      "soft golden-hour light spreading over still water",
      "gentle horizontal bands of dawn light",
      "a quiet lotus floating on calm water",
      "faint concentric rings of ripples"
    ],
    avoid: [
      "any depiction of the Gurus, drawn or implied",
      "the Guru Granth Sahib, drawn or in any open or closed form",
      "the Khanda, Ik Onkar or any Gurmukhi letterform used as ornament",
      "the Golden Temple or any gurdwara as a recognisable building",
      "human figures of any kind, including turbans or hands"
    ]
  },
  buddhist: {
    motifs: [
      "a lotus resting on still water with soft ripples",
      "a single bodhi leaf lit from behind",
      "morning mist over a quiet hillside, in layered soft shapes",
      "faint concentric circles like a settled mind"
    ],
    avoid: [
      "any image of the Buddha, a statue, a face or a footprint, used as decoration",
      "monks or any human figures",
      "the dharma wheel as an ornamental pattern"
    ]
  },
  jain: {
    motifs: [
      "a lotus opening to the first light of the sun",
      "a rising sun with soft, even rays",
      "calm concentric circles in layered soft shapes",
      "a delicate leaf with morning dew"
    ],
    avoid: [
      "any depiction of a Tirthankara or other figure, drawn or implied",
      "the Jain emblem or its hand, wheel or swastika motifs used as decoration",
      "animals shown being harmed, and any food or sacrificial imagery"
    ]
  }
};

/**
 * How the prompt names the tradition. Not the product label: "Buddha Dharma" would put the word Buddha in front of
 * an image model, which is the figure the Buddhist avoid list rules out.
 */
const PROMPT_NAME: Record<MorningTradition, string> = {
  hindu: "Sanatan Dharma",
  sikh: "Sikhi",
  buddhist: "Dhamma",
  jain: "Jain"
};

const SHARED_AVOID = [
  "text, letters, numbers, captions or logos",
  "watermarks or signatures",
  "human faces and bodies",
  "photographic realism",
  "busy detail in the centre of the picture"
];

export interface BackgroundPrompt {
  tradition: MorningTradition;
  /** The prompt to give an image tool or an artist. */
  prompt: string;
  /** For tools that take a separate negative prompt. */
  negativePrompt: string;
  /** What the art will be laid under, so it can be checked against the real card. */
  size: { width: number; height: number };
}

export function buildBackgroundPrompt(tradition: MorningTradition): BackgroundPrompt {
  const art = ART[tradition];
  const accent = TRADITION_ACCENT[tradition];
  const avoid = [...SHARED_AVOID, ...art.avoid];

  const prompt = [
    `A quiet, minimal morning background illustration for the ${PROMPT_NAME[tradition]} page of a spiritual practice app.`,
    `Mood: calm, reverent, unhurried; the stillness of the hour before sunrise.`,
    `Palette: warm ivory paper ${PAPER.page} as the base, soft sand ${PAPER.cardSoft} in the shadows, gold ${BRAND_GOLD} and ${accent} only as gentle highlights, deep warm brown ${PAPER.text} for any fine linework. No other colours.`,
    `Subject, chosen from: ${art.motifs.join("; ")}. Use one, drawn simply, with flat painterly shapes and a hand-made paper texture.`,
    `Composition: portrait, 4:5. Keep the centre and the whole middle two thirds almost empty and very light, because scripture will be set over it; place any subject low in the frame or fade it to the edges at low contrast.`,
    `It must read clearly in a feed at thumbnail size and stay legible with dark brown text on top.`
  ].join(" ");

  return {
    tradition,
    prompt,
    negativePrompt: avoid.join(", "),
    size: { width: 1080, height: 1350 }
  };
}

export function allBackgroundPrompts(): BackgroundPrompt[] {
  return MORNING_TRADITIONS.map(buildBackgroundPrompt);
}
