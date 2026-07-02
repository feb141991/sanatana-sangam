import { getLanguageInstruction, normalizeContentLanguage } from '@/lib/language-runtime';
import type { AIPromptSpec, MeaningGenerateInput, PathshalaExplainInput } from '@/lib/ai/contracts';
import { serializePramanaContext } from '@sangam/pramana-serve';
import type { SafeUserSummaryContext } from '@sangam/pramana-core';

function getUserSummaryContextNote(ctx?: SafeUserSummaryContext): string {
  if (!ctx) return '';
  return `\n\n[Practitioner Personalization Context (Subtly tailor response style)]
- Preferred Tradition: ${ctx.preferredTradition}
- Learning Pace: ${ctx.sessionPreference === 'short' ? 'Brief, concise highlights preferred.' : 'Comprehensive, deep commentary preferred.'}
- Devotional focus: ${ctx.leaningType === 'bhakti' ? 'Emphasize devotion (bhakti), surrender, and personal relationship with the Divine.' : ctx.leaningType === 'study' ? 'Emphasize philosophical study (jnana), self-inquiry, and intellectual insights.' : 'Balanced devotion and study approach.'}`;
}

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
  const origText = input.originalText || input.sanskrit || '';

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved context passages to ground your explanation. Focus on these sources where relevant to explain the verse accurately and provide authentic teachings.'
      })
    : '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a scripture verse to a sincere practitioner.

SOURCE: ${input.source ?? ''} — ${input.title ?? ''}
ORIGINAL (Sanskrit/text): ${origText}
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

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
    },
  };
}

export function buildDevotionalStoryExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const commentary = getCommentary(input.tradition || 'Bhakti');
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved context passages to ground your explanation. Focus on these sources where relevant to explain the story accurately and provide authentic teachings.'
      })
    : '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a devotional story (Katha) to a sincere seeker.

STORY TITLE: ${input.title ?? ''}
SOURCE: ${input.source ?? ''}
STORY NARRATIVE: ${input.story ?? ''}
${passagesText}

Your lens: ${commentary.lens}
Teach as ${commentary.name} would. Focus on bhakti (devotion), surrender (sharanagati), and divine grace.

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Sanskrit/original terms from the story or associated mantras and their meanings, 1-2 sentences>",
  "meaning": "<Synopsis and spiritual message of the devotional story in 2-3 sentences>",
  "commentary": "<Deep commentary on the devotion, lessons, and divine attributes shown in this story, written in the spirit of ${commentary.name} in 3-4 sentences>",
  "daily_application": "<How the practitioner can cultivate similar devotion and qualities in daily life, 2-3 sentences>",
  "contemplation": "<A single reflective question or thought on devotion to sit with>",
  "related_text": "<Name one other scripture or teacher that echoes the theme of this story>"
}

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
    },
  };
}

export function buildMoralStoryExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved context passages to ground your explanation. Focus on these sources where relevant to explain the moral fable accurately and provide authentic conduct advice.'
      })
    : '';

  return {
    teacher: 'Vishnu Sharma',
    school: 'Niti Shastra',
    prompt: {
      user: `You are the wise teacher Vishnu Sharma, explaining a Panchatantra moral fable to young princes to teach them wise conduct, strategy, and moral living (Niti).

FABLE TITLE: ${input.title ?? ''}
SOURCE: ${input.source ?? ''}
FABLE NARRATIVE: ${input.story ?? ''}
${passagesText}

Your lens: Practical wisdom (Niti), discerning friendship, resolving conflicts, and intelligent action.
Teach as Vishnu Sharma would. Focus on pragmatism, discernment, and moral values.

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Sanskrit/original moral maxims or terms from the fable and their translation, 1-2 sentences>",
  "meaning": "<Synopsis and moral lesson of the fable in 2-3 sentences>",
  "commentary": "<Deep commentary on the practical conduct, strategy, and wisdom demonstrated in the fable in 3-4 sentences>",
  "daily_application": "<How the reader can apply this discernment and practical wisdom to navigate relationships and challenges in daily life, 2-3 sentences>",
  "contemplation": "<A single reflective question on practical wisdom or conduct to sit with>",
  "related_text": "<Name one other source of niti or moral teaching (e.g. Hitopadesha, Chanakya Niti) that echoes this theme>"
}

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
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
    reasoningEffort: 'none',
    maxOutputTokens: 500,
  };
}

export function buildUpanishadsExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const commentary = getCommentary(input.tradition || 'Advaita');
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved context passages to ground your explanation. Focus on these sources where relevant to explain the Upanishadic passage accurately and provide authentic teachings.'
      })
    : '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a profound Upanishadic passage (Scripture Passage) to a sincere seeker.

SOURCE: ${input.source ?? ''} — ${input.title ?? ''}
PASSAGE TEXT: ${input.story || input.translation || ''}
${passagesText}

Your lens: ${commentary.lens} Focus on the nature of Brahman, Atman, self-realization, and transcendental knowledge (Jnana).
Teach as ${commentary.name} would.

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Sanskrit/original terms from the Upanishad and their meanings, 1-2 sentences>",
  "meaning": "<Core meaning and spiritual essence of the Upanishadic passage in 2-3 sentences>",
  "commentary": "<Deep ${commentary.school} commentary on the identity of Atman and Brahman and path to self-realization, written in the spirit of ${commentary.name} in 3-4 sentences>",
  "daily_application": "<How to cultivate contemplation, mindfulness, and direct inner experience of the Self in daily life, 2-3 sentences>",
  "contemplation": "<A single reflective question or mahavakya contemplation to sit with>",
  "related_text": "<Name one other Upanishad, Bhagavad Gita verse, or teacher that echoes this teaching>"
}

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
    },
  };
}

export function normalizeMeaningTargetLanguage(value?: string | null): 'en' | 'hi' | 'pa' {
  return normalizeContentLanguage(value);
}

export function buildGurbaniShabadExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const commentary = getCommentary(input.tradition || 'Sikh');
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved context passages to ground your explanation. Focus on these sources where relevant to explain the Gurbani passage accurately and provide authentic teachings.'
      })
    : '';

  const origText = input.originalText || input.sanskrit || '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a holy Gurbani Shabad passage (Scripture Passage) to a sincere seeker.

SOURCE: ${input.source ?? ''} — ${input.title ?? ''}
PASSAGE TEXT: ${origText || input.story || input.translation || ''}
${passagesText}

Your lens: ${commentary.lens} Focus on the oneness of God, remembrance of the divine name (Naam Simran), selfless service (Seva), and the ultimate goal of merging with the Divine through grace.
Teach as ${commentary.name} would.

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Gurmukhi/original terms from the Shabad and their meanings, 1-2 sentences>",
  "meaning": "<Core meaning and spiritual essence of the Gurbani Shabad in 2-3 sentences>",
  "commentary": "<Deep ${commentary.school} commentary on the oneness of Creator and path of devotion and surrender, written in the spirit of ${commentary.name} in 3-4 sentences>",
  "daily_application": "<How to practice remembrance, perform selfless service, and lead a truthful life today, 2-3 sentences>",
  "contemplation": "<A single reflective question on devotion or selfless service to sit with>",
  "related_text": "<Name one other Gurbani Shabad, text, or Guru that echoes this teaching>"
}

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
    },
  };
}

/**
 * Buddhist Dhamma Sutra Explanation Prompt
 *
 * Tradition-correct — uses Nagarjuna / Madhyamaka lens.
 * Does not apply Vedantic framing (no Brahman/Atman language).
 * Explicitly targeted: only fires when corpus = 'buddhist_dhamma'.
 */
export function buildBuddhistSutraExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const commentary = COMMENTARY.buddhist;
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved Dhamma passages to ground your explanation. Focus on these sources to explain the teaching with authentic Buddhist understanding.'
      })
    : '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a Dhamma teaching (Sutra passage) to a sincere seeker on the path of liberation.

SOURCE: ${input.source ?? ''} — ${input.title ?? ''}
PASSAGE TEXT: ${input.story || input.translation || input.sanskrit || ''}
${passagesText}

Your lens: ${commentary.lens}
Teach as ${commentary.name} would. Focus on the Dhamma, not on Vedantic or Hindu framing. Use Buddhist vocabulary (Dhamma, samsara, nibbana, dukkha, anatta, anicca, dependent origination, the Middle Way, compassion for all sentient beings).

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Pali/Sanskrit Buddhist terms and their meanings in this teaching, 1-2 sentences>",
  "meaning": "<Core Dhamma teaching and its spiritual significance in 2-3 sentences>",
  "commentary": "<${commentary.school} commentary on how this teaching illuminates the nature of reality, suffering, or liberation — written in the spirit of ${commentary.name} in 3-4 sentences>",
  "daily_application": "<How to apply this teaching through mindfulness, compassion, and non-attachment in daily life, 2-3 sentences>",
  "contemplation": "<A single reflective inquiry — for example, into impermanence, emptiness, or dependent origination — to sit with>",
  "related_text": "<Name one other Sutra, teacher, or Dhamma text that echoes this teaching>"
}

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
    },
  };
}

/**
 * Jain Dharma Sutra Explanation Prompt
 *
 * Tradition-correct — uses Kundakunda / Jain Dharma lens.
 * Does not flatten into generic Hindu framing.
 * Emphasizes ahimsa, anekantavada, self-restraint, liberation ethics.
 * Explicitly targeted: only fires when corpus = 'jain_dharma'.
 */
export function buildJainSutraExplainPrompt(input: PathshalaExplainInput): {
  prompt: AIPromptSpec;
  teacher: string;
  school: string;
} {
  const commentary = COMMENTARY.jain;
  const langNote = getLanguageInstruction(input.language);

  const passagesText = input.retrievedChunks && input.retrievedChunks.length > 0
    ? '\n' + serializePramanaContext(input.retrievedChunks, {
        suffix: '\n=========================================================\nUse the above retrieved Jain Dharma passages to ground your explanation. Focus on these sources to explain the teaching with authentic Jain understanding.'
      })
    : '';

  return {
    teacher: commentary.name,
    school: commentary.school,
    prompt: {
      user: `You are a wise ${commentary.school} teacher explaining a Jain Agama or Sutra teaching to a sincere seeker on the path of moksha.

SOURCE: ${input.source ?? ''} — ${input.title ?? ''}
PASSAGE TEXT: ${input.story || input.translation || input.sanskrit || ''}
${passagesText}

Your lens: ${commentary.lens}
Teach as ${commentary.name} would. Use Jain vocabulary (ahimsa, anekantavada, syadvada, moksha, karma, jiva, ajiva, samyak darshana, samyak jnana, samyak charitra — the Ratnatraya). Do not use Vedantic framing (no Brahman, no maya in the Hindu sense).

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Prakrit/Sanskrit Jain terms and their meanings in this teaching, 1-2 sentences>",
  "meaning": "<Core Jain teaching on liberation, non-violence, or many-sidedness of truth in 2-3 sentences>",
  "commentary": "<${commentary.school} commentary on how this teaching illuminates ahimsa, anekantavada, or the path to moksha — written in the spirit of ${commentary.name} in 3-4 sentences>",
  "daily_application": "<How to live ahimsa, practise self-restraint, and cultivate equanimity in daily life, 2-3 sentences>",
  "contemplation": "<A single reflective inquiry — for example into non-violence, non-attachment, or the many-sidedness of truth — to sit with>",
  "related_text": "<Name one other Jain Agama, Sutra, or teacher that echoes this teaching>"
}

${getUserSummaryContextNote(input.userSummaryContext)}

${langNote}`,
      temperature: 0.4,
      reasoningEffort: 'none',
      maxOutputTokens: 1200,
    },
  };
}
