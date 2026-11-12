/**
 * Public Panchatantra story pages (/stories/panchatantra).
 *
 * One source of truth: the same canonical content the Native app is generated from.
 * Title and moral come from katha-library.ts; the six-paragraph English and Hindi text
 * comes from packages/dharma-rules/src/stories/panchatantra-expanded.json. Nothing is
 * copied or rewritten here.
 *
 * Only stories listed in PUBLIC_PANCHATANTRA_IDS are public. The library holds 98; the
 * expanded text is a Shoonaya retelling whose review status is
 * "structure_verified_names_pending_review" (84 of 98 entries add classical names that were
 * never checked against a source). A story may be listed only if it adds none:
 * panchatantra-public.test.ts fails if an id is listed that scripts/panchatantra-new-name-flags.json
 * flags, so widening the list is a deliberate, reviewed change.
 *
 * Pages state that the text is a retelling, never a translation (docs/PANCHATANTRA_CANONICAL_SOURCE_PLAN.md,
 * section 3).
 *
 * Artwork: the Native storybook illustrations (assets/panchatantra, one scene per paragraph) are served
 * for the stories that have a full set, copied byte for byte into public/images/panchatantra/<slug>/.
 * The founder stated on 2026-11-03 that they were generated with Google's image models and may be used;
 * that statement is the whole rights record, there is no licence document (PANCHATANTRA_CANONICAL_SOURCE_PLAN.md,
 * section 7). A story with no illustration set shows none: scenes are never borrowed from another story,
 * and a set whose size does not match the paragraphs is dropped rather than shown out of step.
 */

import expandedDoc from '../../packages/dharma-rules/src/stories/panchatantra-expanded.json';
import { ALL_KATHAS } from '@/lib/katha-library';

export const PANCHATANTRA_HUB_PATH = '/stories/panchatantra';
export const SITE_ORIGIN = 'https://www.shoonaya.com';

/** Listed on the founder's instruction of 2026-11-03: the first three name-clean stories. */
export const PUBLIC_PANCHATANTRA_IDS = [
  'panchatantra-crane-and-crab',
  'panchatantra-dharmabuddhi-papabuddhi',
  'panchatantra-self-sacrificing-dove',
  'panchatantra-lion-and-the-ram',
] as const;

export type PanchatantraLang = 'en' | 'hi';

export interface PanchatantraScene {
  src: string;
  width: number;
  height: number;
  alt: string;
  altHi: string;
}

export interface PublicPanchatantraStory {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  moral: string;
  moralHi: string;
  portrait: string;
  durationMin: number;
  body: string[];
  bodyHi: string[];
  /** One scene per paragraph, in reading order; empty when the story has no illustration set. */
  scenes: PanchatantraScene[];
}

interface ExpandedEntry {
  id: string;
  portrait: string;
  durationMin: number;
  body: string[];
  bodyHi: string[];
}

export const RETELLING_NOTICE: Record<PanchatantraLang, string> = {
  en: 'A Shoonaya retelling of a classic Panchatantra fable. It is not a translation of any single edition.',
  hi: 'यह पंचतंत्र की एक प्रसिद्ध कथा का Shoonaya द्वारा किया गया पुनर्कथन है, किसी एक संस्करण का अनुवाद नहीं।',
};

interface ArtworkSet {
  /** Folder under public/images/panchatantra/, files 1.webp .. N.webp. */
  dir: string;
  width: number;
  height: number;
  alt: string[];
  altHi: string[];
}

/**
 * Scene descriptions for the illustration sets. Each list is in paragraph order. The Dharmabuddhi
 * descriptions follow docs/artwork/panchatantra-storybook/dharmabuddhi-papabuddhi.md in the Native
 * repository; the Crane and Crab ones were written from looking at the six images.
 * panchatantra-self-sacrificing-dove has no set in the Native app, so it has no entry.
 * panchatantra-lion-and-the-ram: six handcrafted 3D clay-animation scenes generated 2026-11-12.
 */
const ARTWORK: Record<string, ArtworkSet> = {
  'panchatantra-crane-and-crab': {
    dir: 'crane-and-crab',
    width: 1376,
    height: 774,
    alt: [
      'An old crane with dull feathers stands at the edge of a woodland lake, looking down at the fish swimming below.',
      'The crane stands still on one leg with his beak raised, while a red crab watches from the grass and the fish gather near the bank.',
      'The crane spreads a wing and lets a tear run down his beak as he speaks sadly to the fish, with the crab beside him.',
      'The crane stretches a wing toward the fish crowded together in the water, telling them of a mountain lake far away.',
      'The crab raises a claw from a rock toward the crane, who stands over him with his wings spread.',
      'The crane flies over a rocky ridge with the crab gripping his neck, above a heap of fish bones.',
    ],
    altHi: [
      'एक बूढ़ा बगुला, जिसके पंख फीके पड़ चुके हैं, सरोवर के किनारे खड़ा पानी में तैरती मछलियों को देख रहा है।',
      'बगुला एक टांग पर चुपचाप खड़ा है और चोंच ऊपर उठाए है; घास में बैठा लाल केकड़ा देख रहा है और मछलियाँ किनारे के पास जमा हैं।',
      'बगुला पंख फैलाकर दुखी स्वर में मछलियों से बात करता है और उसकी चोंच पर आँसू बह रहा है; पास में केकड़ा है।',
      'बगुला पानी में सिमटी मछलियों की ओर पंख बढ़ाकर उन्हें दूर के पहाड़ी सरोवर के बारे में बताता है।',
      'केकड़ा चट्टान पर बैठा बगुले की ओर पंजा उठाता है, और बगुला पंख फैलाए उसके ऊपर खड़ा है।',
      'बगुला केकड़े को गर्दन से चिपकाए पथरीली पहाड़ी के ऊपर उड़ रहा है, नीचे मछलियों की हड्डियों का ढेर है।',
    ],
  },
  'panchatantra-dharmabuddhi-papabuddhi': {
    dir: 'dharmabuddhi-papabuddhi',
    width: 1376,
    height: 768,
    alt: [

      'Two merchant companions walk a dusty trade road beside an ox cart: Dharmabuddhi, smiling in a plain cream dhoti and holding a pot of gold coins, and Papabuddhi, sly in rust-maroon robes and a turban.',
      'Under the roots of a great banyan tree, Dharmabuddhi lowers the pot of gold into a pit while Papabuddhi points and persuades.',
      'At midnight under the banyan tree, Papabuddhi digs up the pit by lantern light and stuffs gold coins into a sack, glancing nervously over his shoulder.',
      'In a stone-pillared court, Papabuddhi makes dramatic accusations while Dharmabuddhi stands calmly with joined hands before the elder judges.',
      'At dusk Papabuddhi helps his frail, white-bearded father into the hollow of the banyan tree and coaches him to speak as a tree spirit.',
      'In the morning light smoke pours from the hollow of the banyan trunk beside a pile of dry brush; the coughing old father crawls out as guards take hold of a frightened man and villagers look on.',
    ],
    altHi: [
      'दो व्यापारी मित्र बैलगाड़ी के पास धूल भरे व्यापार-मार्ग पर चल रहे हैं: सादी क्रीम धोती में मुस्कुराते धर्मबुद्धि के हाथ में सोने के सिक्कों का घड़ा है, और जंग-लाल वस्त्र व पगड़ी में चालाक पापबुद्धि साथ चल रहा है।',
      'विशाल बरगद की जड़ों के नीचे धर्मबुद्धि सोने का घड़ा गड्ढे में रख रहा है, और पापबुद्धि उँगली से इशारा कर उसे मना रहा है।',
      'आधी रात को बरगद के नीचे पापबुद्धि लालटेन की रोशनी में गड्ढा खोदकर सिक्के बोरे में भर रहा है और घबराकर पीछे देख रहा है।',
      'पत्थर के खंभों वाली न्यायसभा में पापबुद्धि नाटकीय आरोप लगा रहा है, और धर्मबुद्धि हाथ जोड़े शांत खड़ा है।',
      'संध्या के समय पापबुद्धि अपने दुर्बल, श्वेत-दाढ़ी वाले पिता को बरगद के खोखले तने में बिठा रहा है और उन्हें वृक्ष-देवता की तरह बोलना सिखा रहा है।',
      'सुबह की रोशनी में बरगद के खोखले तने से धुआँ उठ रहा है और पास में सूखी झाड़ियों का ढेर है; खाँसते हुए बूढ़े पिता बाहर रेंग रहे हैं, सैनिकों ने एक घबराए आदमी को पकड़ रखा है और गाँव वाले देख रहे हैं।',
    ],
  },
  'panchatantra-lion-and-the-ram': {
    dir: 'lion-and-the-ram',
    width: 1376,
    height: 768,
    alt: [
      'A colossal shaggy domestic ram with massive curled horns stands on a ridge in a lush jungle, his thick matted fleece bristling, surveying the valley below.',
      'A formidable clay-modelled lion pauses on his forest patrol, startled and wide-eyed, staring up at the strange horned beast silhouetted on the ridge above.',
      'The lion crouches behind dense undergrowth, peering through leaves with a nervous, uncertain expression at the enormous ram who gazes calmly ahead.',
      'The lion shadows the ram through the dappled forest, hidden in the bushes, his predatory instincts warring with hesitation as he studies the massive creature.',
      'In a sun-dappled clearing, the ram kneels and peacefully nibbles meadow grass, chewing with slow bovine placidity and bleating softly in mild satisfaction.',
      'The lion leaps from the thicket with a thunderous roar, striking the ram down with one powerful paw, the jungle floor scattered with golden grass around them.',
    ],
    altHi: [
      'एक विशालकाय घुमावदार सींगों वाला मेंढा हरे-भरे जंगल में ऊंचे टीले पर खड़ा है, उसका मोटा उलझा ऊन कांटों की तरह खड़ा है और वह घाटी की ओर देख रहा है।',
      'एक बलशाली मिट्टी के मेंढे से बने सिंह अपनी वन-गश्त के दौरान रुकता है, चकित और चौड़ी आंखों से ऊपर टीले पर खड़े उस विचित्र सींग वाले प्राणी को देखता है।',
      'सिंह घने झाड़ी के पीछे छिपकर, पत्तों के बीच से घबराई और असमंजस भरी नजरों से उस विशाल मेंढे को देखता है जो शांत भाव से आगे निहारता है।',
      'सिंह झाड़ियों में छिपते हुए छाया की तरह मेंढे के पीछे-पीछे छाया-छनी हुई वन में चलता है, उसकी शिकारी प्रवृत्ति और हिचकिचाहट में द्वंद्व चल रहा है।',
      'धूप से नहाई हुई एक खुली जगह में मेंढा घुटने टेककर शांति से घास चर रहा है, धीमी गाय जैसी शांति से चबाते हुए हल्की-सी "में-में" कर रहा है।',
      'सिंह झाड़ी से जोरदार दहाड़ के साथ कूदता है और एक शक्तिशाली पंजे से मेंढे को धराशायी कर देता है, उनके आसपास जंगल की जमीन पर सुनहरी घास बिखरी हुई है।',
    ],
  },
};

export function panchatantraScenesFor(id: string, paragraphCount: number): PanchatantraScene[] {
  const set = ARTWORK[id];
  // A set that does not match the paragraphs one for one is dropped, never shown out of step.
  if (!set || set.alt.length !== paragraphCount || set.altHi.length !== paragraphCount) return [];
  return set.alt.map((alt, index) => ({
    src: `/images/panchatantra/${set.dir}/${index + 1}.webp`,
    width: set.width,
    height: set.height,
    alt,
    altHi: set.altHi[index],
  }));
}

export function panchatantraSlug(id: string): string {
  return id.replace(/^panchatantra-/, '');
}

export function panchatantraStoryPath(slug: string, lang: PanchatantraLang): string {
  return lang === 'hi' ? `${PANCHATANTRA_HUB_PATH}/${slug}/hi` : `${PANCHATANTRA_HUB_PATH}/${slug}`;
}

export function panchatantraStoryUrl(slug: string, lang: PanchatantraLang): string {
  return `${SITE_ORIGIN}${panchatantraStoryPath(slug, lang)}`;
}

function buildStory(id: string): PublicPanchatantraStory | undefined {
  const katha = ALL_KATHAS.find((k) => k.id === id);
  const expanded = (expandedDoc.entries as ExpandedEntry[]).find((e) => e.id === id);
  // A story is shown only when every field a reader sees exists in both languages.
  // Nothing is synthesised: a missing title, moral or paragraph hides the story.
  if (!katha || !expanded || !katha.titleHi || !katha.phalHi) return undefined;
  if (expanded.body.length === 0 || expanded.body.length !== expanded.bodyHi.length) return undefined;
  return {
    id,
    slug: panchatantraSlug(id),
    title: katha.title,
    titleHi: katha.titleHi,
    moral: katha.phal,
    moralHi: katha.phalHi,
    portrait: expanded.portrait,
    durationMin: expanded.durationMin,
    body: expanded.body,
    bodyHi: expanded.bodyHi,
    scenes: panchatantraScenesFor(id, expanded.body.length),
  };
}

/** The first scene as an absolute image for link previews and structured data; undefined without artwork. */
export function panchatantraCoverImage(
  story: PublicPanchatantraStory,
  lang: PanchatantraLang,
): { url: string; width: number; height: number; alt: string } | undefined {
  const scene = story.scenes[0];
  if (!scene) return undefined;
  return {
    url: `${SITE_ORIGIN}${scene.src}`,
    width: scene.width,
    height: scene.height,
    alt: lang === 'hi' ? scene.altHi : scene.alt,
  };
}

export function listPublicPanchatantraStories(): PublicPanchatantraStory[] {
  return PUBLIC_PANCHATANTRA_IDS.map(buildStory).filter(
    (story): story is PublicPanchatantraStory => story !== undefined,
  );
}

export function findPublicPanchatantraStory(slug: string): PublicPanchatantraStory | undefined {
  return listPublicPanchatantraStories().find((story) => story.slug === slug);
}
