export type EvalDomain =
  | "general"
  | "grounding"
  | "translation"
  | "regression";

export type EvalPriority = "smoke" | "standard" | "critical";

export interface EvalExpectation {
  key: string;
  description: string;
  required?: boolean;
  target?: number | string | boolean;
  tolerance?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface EvalCase<Input = unknown, Output = unknown> {
  id: string;
  title: string;
  instruction: string;
  domain: EvalDomain;
  priority: EvalPriority;
  input: Input;
  expectedOutput?: Output;
  expectations?: EvalExpectation[];
  tags?: string[];
  locale?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface EvalCaseCollection<Input = unknown, Output = unknown> {
  suiteId: string;
  version: string;
  cases: EvalCase<Input, Output>[];
}

export function defineEvalCase<Input, Output>(
  evalCase: EvalCase<Input, Output>,
): EvalCase<Input, Output> {
  return evalCase;
}

export function defineEvalCaseCollection<Input, Output>(
  collection: EvalCaseCollection<Input, Output>,
): EvalCaseCollection<Input, Output> {
  return collection;
}

export interface PathshalaExplainInput {
  sanskrit?: string;
  transliteration?: string;
  translation?: string;
  source?: string;
  title?: string;
  tradition?: string | null;
  language?: string | null;
  story?: string;
  responseMode?: string;
}

export const pathshalaExplainEvalSuite = defineEvalCaseCollection<PathshalaExplainInput, any>({
  suiteId: "pathshala_explain_grounding_suite",
  version: "1.0.0",
  cases: [
    {
      id: "pathshala-2-47",
      title: "Bhagavad Gita 2.47 - Karma Yoga Grounding",
      instruction: "Explain Bhagavad Gita 2.47, highlighting the concept of acting without attachment to results.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Bhagavad Gita 2.47",
        title: "Bhagavad Gita 2.47",
        tradition: "Sanatana Dharma",
        language: "en"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON containing required keys", required: true },
        { key: "grounding_present", description: "Response must contain matching concepts/text from Gita 2.47", required: true },
        { key: "source_metadata_present", description: "Response must cite 2.47 or Bhagavad Gita", required: true }
      ]
    },
    {
      id: "pathshala-2-20",
      title: "Bhagavad Gita 2.20 - Nature of Soul Grounding",
      instruction: "Explain Bhagavad Gita 2.20, focusing on the immortality and birthless nature of the soul.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Bhagavad Gita 2.20",
        title: "Bhagavad Gita 2.20",
        tradition: "Sanatana Dharma",
        language: "en"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on the soul's eternity", required: true }
      ]
    },
    {
      id: "pathshala-4-7",
      title: "Bhagavad Gita 4.7 - Avatara Descent Grounding",
      instruction: "Explain Bhagavad Gita 4.7, illustrating when and why the divine descends.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Bhagavad Gita 4.7",
        title: "Bhagavad Gita 4.7",
        tradition: "Sanatana Dharma",
        language: "en"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must refer to decline of righteousness (dharma)", required: true }
      ]
    },
    {
      id: "pathshala-9-22",
      title: "Bhagavad Gita 9.22 - Ananya Bhakti Protection Grounding",
      instruction: "Explain Bhagavad Gita 9.22, focusing on the promise of divine protection and yoga-kshema.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Bhagavad Gita 9.22",
        title: "Bhagavad Gita 9.22",
        tradition: "Sanatana Dharma",
        language: "en"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must reference unswerving devotion and supply of needs", required: true }
      ]
    },
    {
      id: "pathshala-18-66",
      title: "Bhagavad Gita 18.66 - Surrender & Moksha Hindi Grounding",
      instruction: "Explain Bhagavad Gita 18.66 in Hindi, emphasizing total surrender to the divine.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Bhagavad Gita 18.66",
        title: "Bhagavad Gita 18.66",
        tradition: "Sanatana Dharma",
        language: "hi"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "language_compliance", description: "Response must be in Devanagari Hindi script", required: true }
      ]
    },
    {
      id: "pathshala-18-78",
      title: "Bhagavad Gita 18.78 - Victory and Prosperity Grounding",
      instruction: "Explain Bhagavad Gita 18.78, describing Sanjaya's declaration of ultimate victory, fortune, and moral path.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Bhagavad Gita 18.78",
        title: "Bhagavad Gita 18.78",
        tradition: "Sanatana Dharma",
        language: "en"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must mention victory, fortune, and Krishna/Arjuna presence", required: true }
      ]
    },
    {
      id: "katha-prahlada",
      title: "Katha - Bhakta Prahlada Grounding",
      instruction: "Explain the story of Bhakta Prahlada and Narasimha avatar.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Srimad Bhagavatam",
        title: "Bhakta Prahlada",
        tradition: "Bhakti",
        language: "en",
        responseMode: "devotional_story_explain",
        story: "Prahlada was a supreme devotee of Lord Vishnu. Lord Vishnu emerged as Narasimha to protect Prahlada and destroy Hiranyakashipu."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON containing required keys", required: true },
        { key: "grounding_present", description: "Response must refer to Prahlada or Narasimha", required: true },
        { key: "source_metadata_present", description: "Response must cite Srimad Bhagavatam or Katha", required: true }
      ]
    },
    {
      id: "katha-dhruva",
      title: "Katha - Bhakta Dhruva Tapasya",
      instruction: "Explain the story of Bhakta Dhruva meditating to seek Lord Vishnu.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Srimad Bhagavatam",
        title: "Bhakta Dhruva",
        tradition: "Bhakti",
        language: "en",
        responseMode: "devotional_story_explain",
        story: "Dhruva set out to perform intense penance at the age of five and became the Pole Star."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on Dhruva's determination", required: true }
      ]
    },
    {
      id: "katha-sudama",
      title: "Katha - Sudama Poha Devotion",
      instruction: "Explain the story of Sudama Vipra visiting Lord Krishna with flattened rice.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Srimad Bhagavatam",
        title: "Sudama Vipra",
        tradition: "Bhakti",
        language: "en",
        responseMode: "devotional_story_explain",
        story: "Sudama offered flattened rice to Lord Krishna out of pure devotion, and Krishna showered blessings upon him."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on Sudama's humble offering", required: true }
      ]
    },
    {
      id: "katha-gajendra",
      title: "Katha - Gajendra Moksha Devotional Surrender",
      instruction: "Explain the story of Gajendra calling upon Lord Vishnu with a lotus.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Srimad Bhagavatam",
        title: "Gajendra Moksha",
        tradition: "Bhakti",
        language: "en",
        responseMode: "devotional_story_explain",
        story: "Gajendra completely surrendered to Lord Vishnu when caught by a crocodile, and Vishnu saved him."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on the surrender of the elephant", required: true }
      ]
    },
    {
      id: "katha-prahlada-hi",
      title: "Katha - Bhakta Prahlada Grounding (Hindi)",
      instruction: "Explain the story of Bhakta Prahlada in Hindi.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Srimad Bhagavatam",
        title: "Bhakta Prahlada",
        tradition: "Bhakti",
        language: "hi",
        responseMode: "devotional_story_explain",
        story: "Prahlada was a devotee of Lord Vishnu. Narasimha protected him."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "language_compliance", description: "Response must be in Devanagari Hindi script", required: true }
      ]
    },
    {
      id: "katha-sudama-hi",
      title: "Katha - Sudama Vipra Grounding (Hindi)",
      instruction: "Explain the story of Sudama Vipra in Hindi.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Srimad Bhagavatam",
        title: "Sudama Vipra",
        tradition: "Bhakti",
        language: "hi",
        responseMode: "devotional_story_explain",
        story: "Sudama was a poor friend of Krishna."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "language_compliance", description: "Response must be in Devanagari Hindi script", required: true }
      ]
    },
    {
      id: "panchatantra-monkey",
      title: "Panchatantra - Monkey and Crocodile",
      instruction: "Explain the Panchatantra fable of the Monkey and the Crocodile.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Panchatantra",
        title: "Monkey and Crocodile",
        tradition: "Moral",
        language: "en",
        responseMode: "moral_story_explain",
        story: "A monkey and a crocodile were friends. The crocodile wanted to take the monkey's heart. The monkey tricked the crocodile into turning back."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON containing required keys", required: true },
        { key: "grounding_present", description: "Response must refer to the monkey or crocodile", required: true }
      ]
    },
    {
      id: "panchatantra-tortoise",
      title: "Panchatantra - Talkative Tortoise",
      instruction: "Explain the moral of the talkative tortoise.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Panchatantra",
        title: "Talkative Tortoise",
        tradition: "Moral",
        language: "en",
        responseMode: "moral_story_explain",
        story: "A talkative tortoise held onto a stick held by two geese. He opened his mouth to talk and fell to his death."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on the tortoise falling", required: true }
      ]
    },
    {
      id: "panchatantra-lion",
      title: "Panchatantra - Lion and Clever Rabbit",
      instruction: "Explain the story of the Lion and the Clever Rabbit.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Panchatantra",
        title: "Lion and Clever Rabbit",
        tradition: "Moral",
        language: "en",
        responseMode: "moral_story_explain",
        story: "A clever rabbit tricked a cruel lion into jumping into a well by showing him his own reflection."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on reflection or well", required: true }
      ]
    },
    {
      id: "panchatantra-jackal",
      title: "Panchatantra - Blue Jackal",
      instruction: "Explain the moral of the Blue Jackal fable.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Panchatantra",
        title: "Blue Jackal",
        tradition: "Moral",
        language: "en",
        responseMode: "moral_story_explain",
        story: "A jackal fell into blue dye and pretended to be king of the forest. He howled when other jackals did, revealing his true nature."
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "grounding_present", description: "Response must ground on the blue dye or howling", required: true }
      ]
    },
    {
      id: "panchatantra-monkey-hi",
      title: "Panchatantra - Monkey and Crocodile (Hindi)",
      instruction: "Explain the Monkey and Crocodile fable in Hindi.",
      domain: "grounding",
      priority: "critical",
      input: {
        source: "Panchatantra",
        title: "Monkey and Crocodile",
        tradition: "Moral",
        language: "hi",
        responseMode: "moral_story_explain",
        story: "बंदर और मगरमच्छ की कहानी।"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "language_compliance", description: "Response must be in Devanagari Hindi script", required: true }
      ]
    },
    {
      id: "panchatantra-lion-hi",
      title: "Panchatantra - Lion and Clever Rabbit (Hindi)",
      instruction: "Explain the Lion and Clever Rabbit fable in Hindi.",
      domain: "grounding",
      priority: "standard",
      input: {
        source: "Panchatantra",
        title: "Lion and Clever Rabbit",
        tradition: "Moral",
        language: "hi",
        responseMode: "moral_story_explain",
        story: "शेर और चतुर खरगोश की कहानी।"
      },
      expectations: [
        { key: "json_contract_valid", description: "Response should be valid JSON", required: true },
        { key: "language_compliance", description: "Response must be in Devanagari Hindi script", required: true }
      ]
    }
  ]
});

