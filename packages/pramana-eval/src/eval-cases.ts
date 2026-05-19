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
    }
  ]
});

