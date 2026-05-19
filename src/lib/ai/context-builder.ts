import { getLanguageInstruction, normalizeContentLanguage } from '@/lib/language-runtime';
import type { AIPromptSpec, MeaningGenerateInput, PathshalaExplainInput } from '@/lib/ai/contracts';

const COMMENTARY: Record<string, { name: string; school: string; lens: string }> = {
  vaishnava: {
    name: 'Ramanujacharya',
    school: 'Vishishtadvaita',
    lens: 'Brahman is real, world and souls are real but body of Brahman. Bhakti and prapatti are the path. Narayana is Ishvara.',
  },
  shaiva: {
    name: 'Abhinavagupta',
    school: 'Kashmir Shaivism',
    lens: 'All is Shiva-consciousness. Liberation is recognition of own nature as Shiva. Emphasise shakti and spanda.',
  },
  sant: {
    name: 'Kabir Das',
    school: 'Sant Tradition',
    lens: 'Formless divine beyond caste and ritual. Direct experience of Naam within. Plain speech that cuts through pretension.',
  },
  sikh: {
    name: 'Guru Nanak Dev Ji',
    school: 'Sikhi',
    lens: 'Ik Onkar — one formless God. Naam simran, seva, and kirat as path. Equality of all beings. Reject superstition.',
  },
  buddhist: {
    name: 'Nagarjuna',
    school: 'Madhyamaka Buddhism',
    lens: 'Sunyata (emptiness) as the nature of all phenomena. Middle way. Dependent origination. Compassion for all sentient beings.',
  },
  jain: {
    name: 'Kundakunda',
    school: 'Jain Dharma',
    lens: 'Ahimsa, anekantavada (many-sidedness of truth). Soul is distinct from karma. Liberation through right knowledge, faith, conduct.',
  },
  advaita: {
    name: 'Adi Shankaracharya',
    school: 'Advaita Vedanta',
    lens: 'Brahman alone is real, world is maya. Atman = Brahman. Liberation is recognition of this identity. Jnana marga.',
  },
};

function getCommentary(tradition: string | null | undefined) {
  if (!tradition) return COMMENTARY.advaita;
  return COMMENTARY[tradition.toLowerCase()] ?? COMMENTARY.advaita;
}

export function buildPathshalaExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const commentary = getCommentary(input.tradition);
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? `
=== RETRIEVED CONTEXT PASSAGES (GROUNDING SOURCE DATA) ===
${input.retrievedChunks.map((chunk, idx) => `
[Passage ${idx + 1}]
Source: ${chunk.metadata?.sourceName ?? 'Unknown'} (Ref: ${chunk.metadata?.chunkId ?? 'N/A'})
Content:
${chunk.content}
`).join('\n')}
=========================================================
Use the above retrieved context passages to ground your explanation. Focus on these sources where relevant to explain the verse accurately and provide authentic teachings.`
    : '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a scripture verse to a sincere practitioner.

SOURCE: ${input.source ?? ''} — ${input.title ?? ''}
ORIGINAL (Sanskrit/text): ${input.sanskrit ?? ''}
TRANSLITERATION: ${input.transliteration ?? ''}
STANDARD TRANSLATION: ${input.translation ?? ''}
${passagesText}

Your lens: ${commentary.lens}
Teach as ${commentary.name} would.

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Sanskrit/original terms and their meanings, 1-2 sentences>",
  "meaning": "<Core meaning of the verse in 2-3 sentences>",
  "commentary": "<${commentary.school} interpretation in 3-4 sentences, in the spirit of ${commentary.name}>",
  "daily_application": "<How to apply this teaching today, 2-3 sentences>",
  "contemplation": "<A single reflective question or thought to sit with>",
  "related_text": "<Name one other scripture or teacher that echoes this teaching>"
}

${langNote}`,
      temperature: 0.5,
      maxOutputTokens: 900,
    },
  };
}

export function buildMeaningGeneratePrompt(input: MeaningGenerateInput): AIPromptSpec {
  return {
    user: `Translate this sacred-text meaning for a devotional learning app.

Target language instruction: ${getLanguageInstruction(input.targetLanguage)}
Source label: ${input.sourceLabel ?? ''}
Source meaning:
${input.sourceMeaning}

Rules:
- Translate the meaning, not the original verse.
- Keep it concise, natural, and respectful.
- Preserve doctrine and names accurately.
- Do not add new commentary.
- Return ONLY valid JSON:
{ "meaning": "<translated meaning>" }`,
    temperature: 0.25,
    maxOutputTokens: 500,
  };
}

export function normalizeMeaningTargetLanguage(value?: string | null): 'en' | 'hi' | 'pa' {
  return normalizeContentLanguage(value);
}
