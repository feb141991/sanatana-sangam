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
    }
  ]
});

