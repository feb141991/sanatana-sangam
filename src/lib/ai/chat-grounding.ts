import {
  dharamVeerRetriever,
  festivalRulesRetriever,
  retrievePathshalaContext,
  type RetrievalChunk,
} from '@/lib/ai/retrieval';
import { hasPendingSourceContent } from '@sangam/pramana-serve';

// Common English function words filtered out when extracting topical tokens
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'this', 'that', 'these', 'those', 'it', 'its', 'of', 'in', 'on', 'at',
  'to', 'for', 'and', 'or', 'but', 'not', 'no', 'do', 'does', 'did',
  'what', 'why', 'how', 'when', 'where', 'who', 'which', 'with', 'by',
  'from', 'as', 'if', 'so', 'than', 'then', 'there', 'here', 'i', 'you',
  'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their',
  'about', 'into', 'over', 'under', 'again', 'further', 'can', 'will',
  'just', 'should', 'now', 'have', 'has', 'had', 'me', 'us', 'them',
  'tell', 'explain', 'give', 'know', 'mean', 'meaning', 'want', 'please',
  'hello', 'hi', 'hey', 'say', 'says', 'said',
]);

const FIGURE_ALIASES: Record<string, string> = {
  'shivaji': 'chhatrapati-shivaji',
  'chhatrapati shivaji': 'chhatrapati-shivaji',
  'chhatrapati': 'chhatrapati-shivaji',
  'rani lakshmibai': 'rani-lakshmibai',
  'rani laxmibai': 'rani-lakshmibai',
  'lakshmibai': 'rani-lakshmibai',
  'laxmibai': 'rani-lakshmibai',
  'jhansi': 'rani-lakshmibai',
  'guru gobind singh': 'guru-gobind-singh',
  'guru nanak': 'guru-nanak-dev',
  'guru tegh bahadur': 'guru-tegh-bahadur',
  'guru arjan dev': 'guru-arjan-dev',
  'bhishma': 'bhishma',
  'chanakya': 'chanakya',
  'kautilya': 'chanakya',
  'ashoka': 'emperor-ashoka',
  'emperor ashoka': 'emperor-ashoka',
  'lord mahavira': 'lord-mahavira',
  'mahavira': 'lord-mahavira',
  'mahavir': 'lord-mahavira',
  'siddhartha gautama': 'siddhartha-gautama',
  'gautama buddha': 'siddhartha-gautama',
  'swami vivekananda': 'swami-vivekananda',
  'vivekananda': 'swami-vivekananda',
  'ramakrishna': 'ramakrishna',
  'sri ramakrishna': 'ramakrishna',
  'tulsidas': 'tulsidas',
  'goswami tulsidas': 'tulsidas',
  'sant kabir': 'kabir',
  'kabir': 'kabir',
  'tukaram': 'tukaram',
  'sant tukaram': 'tukaram',
  'ramanujacharya': 'ramanujacharya',
  'ramanuja': 'ramanujacharya',
  'maharana pratap': 'maharana-pratap',
  'harishchandra': 'harishchandra',
  'raja harishchandra': 'harishchandra',
  'prahlad': 'prahlad',
  'bhakta prahlad': 'prahlad',
  'prahlada': 'prahlad',
  'dhruv': 'dhruv',
  'dhruva': 'dhruv',
  'bhakta dhruva': 'dhruv',
  'hanuman': 'hanuman',
  'bodhidharma': 'bodhidharma',
  'parshvanatha': 'parshvanatha',
  'rishabhanatha': 'rishabhanatha',
  'sanghamitra': 'sanghamitra',
  'sariputta': 'sariputta',
  'moggallana': 'moggallana',
  'milinda': 'milinda',
  'xuanzang': 'xuanzang',
  'shabari': 'shabari',
};

const FESTIVAL_TERMS = [
  'ekadashi', 'diwali', 'deepavali', 'holi', 'navratri', 'karva chauth',
  'shivratri', 'mahashivratri', 'amavasya', 'purnima', 'janmashtami',
  'raksha bandhan', 'dussehra', 'vijayadashami', 'chhath', 'chath',
  'vrat', 'fasting rule', 'tithi', 'muhurta', 'parana', 'sankranti',
  'makar sankranti', 'guru purnima', 'hanuman jayanti', 'ram navami',
];

const DHARMIC_CONCEPTS = new Set([
  'gita', 'bhagavad', 'upanishad', 'upanishads', 'veda', 'vedas', 'vedanta', 'ramayana',
  'mahabharata', 'dhammapada', 'sutra', 'sutras', 'purana', 'puranas', 'shastra', 'scripture',
  'krishna', 'arjuna', 'shiva', 'vishnu', 'brahma', 'devi', 'durga', 'kali', 'lakshmi',
  'saraswati', 'ganesha', 'hanuman', 'rama', 'sita', 'radha', 'narayana', 'ishvara', 'bhagavan',
  'karma', 'dharma', 'adharma', 'moksha', 'mukti', 'atman', 'brahman', 'bhakti', 'jnana', 'gyan',
  'yoga', 'yogi', 'maya', 'samsara', 'rebirth', 'reincarnation', 'meditation', 'dhyan', 'dhyana',
  'samadhi', 'detachment', 'vairagya', 'renunciation', 'tyaga', 'duty', 'swadharma', 'soul',
  'death', 'grief', 'desire', 'kama', 'anger', 'angry', 'krodha', 'greed', 'lobha', 'ego', 'ahankara',
  'mind', 'wavering', 'restless', 'manas', 'buddhi', 'senses', 'indriyas', 'gunas', 'sattva', 'rajas', 'tamas',
  'purusha', 'prakriti', 'surrender', 'sharanagati', 'ahimsa', 'satya', 'truth', 'compassion',
  'karuna', 'peace', 'shanti', 'seva', 'simran', 'jap', 'japa', 'mantra', 'om', 'aum',
  'guru', 'shishya', 'parampara', 'sampradaya', 'advaita', 'dvaita', 'vishishtadvaita',
  'tirthankara', 'jain', 'jainism', 'sikh', 'sikhism', 'gurbani', 'buddha', 'buddhism', 'dhamma',
  'nirvana', 'eightfold', 'sangha', 'waheguru', 'hukam', 'naam', 'katha', 'vrat', 'upavas', 'puja', 'fasting', 'festival'
]);

const GITA_TERMS = ['bhagavad gita', 'bhagavad', 'gita'];
const UPANISHAD_TERMS = [
  'upanishad', 'upanishads', 'vedanta', 'mandukya', 'katha upanishad', 'nachiketa',
  'isha upanishad', 'ishavasya', 'kena upanishad', 'mundaka', 'prashna upanishad',
  'chandogya', 'brihadaranyaka', 'aitareya', 'taittiriya', 'shvetashvatara', 'svetasvatara',
];
// The kandas of the Ramayana, as the repo's own content spells them: "Bal Kanda"
// (not "Bala") is the commonest, "Kand" and joined forms ("Sunderkand") are routine
// in Hindi usage, and slugs are hyphenated.
const RAMAYANA_KANDA_STEMS = [
  'bala', 'bal', 'ayodhya', 'aranya', 'kishkindha', 'kishkinda', 'sundara', 'sundar',
  'sunder', 'yuddha', 'yudh', 'lanka', 'uttara', 'uttar',
];
const RAMAYANA_TERMS = [
  'ramayana', 'valmiki',
  ...RAMAYANA_KANDA_STEMS.flatMap((stem) =>
    ['kanda', 'kand'].flatMap((suffix) => [' ', '-', ''].map((joiner) => `${stem}${joiner}${suffix}`))
  ),
];
// Titles come from src/lib/data/sikh-nitnem-banis.ts. Bare "jaap", "chaupai" and
// "sohila" are deliberately absent: they are common words and names on their own.
const SIKH_SCRIPTURE_TERMS = [
  'gurbani', 'guru granth', 'japji', 'rehras', 'rehraas', 'rahras', 'jaap sahib',
  'tav prasad', 'tav-prasad', 'chaupai sahib', 'anand sahib', 'kirtan sohila',
  'waheguru', 'shabad',
];
const BUDDHIST_SCRIPTURE_TERMS = [
  'buddha', 'buddhism', 'dhamma', 'dhammapada', 'eightfold', 'nirvana',
];
const JAIN_SCRIPTURE_TERMS = [
  'jain', 'jainism', 'tirthankara', 'tattvartha', 'saman suttam', 'anekantavada',
  'navkar', 'namokar',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesTerm(text: string, term: string): boolean {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text);
}

export interface ScriptureRoute {
  corpus: string;
  terms: readonly string[];
  pattern: RegExp;
}

function scriptureRoute(corpus: string, terms: readonly string[]): ScriptureRoute {
  return { corpus, terms, pattern: new RegExp(`\\b(?:${terms.map(escapeRegExp).join('|')})\\b`, 'i') };
}

/**
 * The one table that says which corpus a named scripture belongs to. Both the
 * Dharmic-intent gate and the corpus choice read it, so a text the router can
 * route can never be refused by the gate (that is how "Rehras Sahib" and
 * "Bala Kanda" used to fall through to ungrounded chat). Order matters: the first
 * family named in a message wins.
 */
export const SCRIPTURE_ROUTES: readonly ScriptureRoute[] = [
  scriptureRoute('pathshala_gita', GITA_TERMS),
  scriptureRoute('pathshala_upanishads', UPANISHAD_TERMS),
  scriptureRoute('valmiki_ramayana', RAMAYANA_TERMS),
  scriptureRoute('sikh_gurbani', SIKH_SCRIPTURE_TERMS),
  scriptureRoute('buddhist_dhamma', BUDDHIST_SCRIPTURE_TERMS),
  scriptureRoute('jain_dharma', JAIN_SCRIPTURE_TERMS),
];

/**
 * Corpora recognised by name but with no source-audited passages yet. For these the
 * fail-closed "coverage unavailable" notice must be what the model receives, so no
 * other grounding path (a hero's biography, say) may answer in its place.
 */
const WITHHELD_CORPORA: ReadonlySet<string> = new Set(['valmiki_ramayana']);

/** The corpus of the first scripture family named in the text, or null if none is. */
export function findNamedScriptureCorpus(text: string): string | null {
  return SCRIPTURE_ROUTES.find((route) => route.pattern.test(text))?.corpus ?? null;
}

function includesAnyTerm(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => includesTerm(text, term));
}

/**
 * The question as the dense retriever should read it: the whole sentence, minus the
 * scripture's own name. "in the Gita" already routed the question to the Gita corpus, and no
 * verse's meaning contains it, so to an embedding of the verse alone it is pure noise
 * (it pushed 6.26 from rank 1 to 14 for "what does Krishna say about the wavering mind in the
 * Gita?"). Falls back to the original when nothing meaningful would be left.
 */
export function toDenseQuery(message: string): string {
  const stripped = message
    .replace(/\b(?:in\s+)?(?:the\s+)?(?:bhagavad\s+gita|bhagavad|gita)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([?.!,])/g, '$1')
    .trim();
  return extractMeaningfulTokens(stripped).length >= 1 ? stripped : message;
}

export interface ChatGroundingResult {
  isGrounded: boolean;
  corpus: string | null;
  documents: RetrievalChunk[];
  groundingPromptText: string | null;
}

/**
 * Extracts non-stopword tokens of length > 2
 */
export function extractMeaningfulTokens(text: string): string[] {
  const words = (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
  return words.filter((w) => !STOPWORDS.has(w) && (w.length > 2 || w === 'om'));
}

/**
 * Checks if a query is directly targeting a known Dharm Veer figure
 */
export function matchDharmVeerFigure(text: string): string | null {
  const lower = text.toLowerCase();
  const aliases = Object.keys(FIGURE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const pattern = new RegExp(`\\b${alias}\\b`, 'i');
    if (pattern.test(lower)) {
      return FIGURE_ALIASES[alias];
    }
  }
  return null;
}

/**
 * Checks if a query is asking about festival/vrat rules or calendar reasons
 */
/**
 * Checks if a query is asking for a narrative katha or puranic story
 */
export function isKathaQuery(text: string): boolean {
  return includesAnyTerm(text, [
    'katha', 'vrat katha', 'satyanarayan', 'purana', 'puranic', 'prahlada',
    'dhruva', 'gajendra', 'sudama', 'veervati', 'mahishasura mardini',
  ]);
}

export function isFestivalRuleQuery(text: string): boolean {
  return includesAnyTerm(text, FESTIVAL_TERMS);
}

/**
 * Checks if a query contains Dharmic/philosophical inquiry intent
 */
export function hasDharmicIntent(text: string, meaningfulTokens: string[]): boolean {
  if (/\b(?:verse|chapter)\s+\d+(?:[.:]\d+)*\b/i.test(text)) return true;
  if (isFestivalRuleQuery(text) || isKathaQuery(text)) return true;
  // Naming a scripture is itself scriptural intent, whatever else the message holds.
  if (findNamedScriptureCorpus(text) !== null) return true;
  return meaningfulTokens.some((token) => DHARMIC_CONCEPTS.has(token));
}

function buildCorpusGroundingPrompt(targetCorpus: string, documents: RetrievalChunk[]): string {
  const passages = documents
    .map((doc) => {
      const ref = doc.metadata?.chunkId ? ` (${doc.metadata.chunkId})` : '';
      const sourceName = doc.metadata?.sourceName || 'Source';
      return `- [${sourceName}${ref}]:\n${doc.content}`;
    })
    .join('\n\n');

  // Corpus-level fallback is deliberate defense-in-depth: even if Ramayana's
  // index metadata were ever reset, this still catches it. The metadata check
  // itself is shared with context-builder.ts's Pathshala-explain builders
  // (hasPendingSourceContent) so this governance decision can't silently
  // diverge between the chat path and the explain path again.
  const hasPendingSource = targetCorpus === 'valmiki_ramayana' || hasPendingSourceContent(documents);
  const hasCuratedMaterial = targetCorpus === 'bhakti_katha' || documents.some((doc) =>
    ['curated_lesson', 'narrative'].includes(doc.metadata?.sourceClass ?? '')
  );

  if (hasPendingSource) {
    return [
      '=== SOURCE-AUDIT-PENDING STUDY MATERIAL ===',
      `The following explicitly requested Shoonaya study material (${targetCorpus}) has not yet been approved as canonical Pramana. Its source or rights audit remains pending:`,
      passages,
      '=== INSTRUCTIONS FOR DHARMA MITRA ===',
      'Use this only as clearly labelled study context. Paraphrase with attribution to Shoonaya study notes; do not present it as a verified canonical quotation or imply source approval. State that source verification is pending. Do not invent quotations or claims beyond this material.',
    ].join('\n');
  }

  if (hasCuratedMaterial) {
    return [
      '=== CURATED DEVOTIONAL STUDY MATERIAL ===',
      `The following source-cleared Shoonaya curated material (${targetCorpus}) is a devotional retelling or study lesson, not a verbatim scripture translation:`,
      passages,
      '=== INSTRUCTIONS FOR DHARMA MITRA ===',
      'Use this as a clearly labelled Shoonaya retelling or study lesson. Do not describe its wording as a direct scripture quotation. Cite the named story or traditional reference when present, and do not invent quotations or claims beyond this material.',
    ].join('\n');
  }

  return [
    '=== SOURCE-BACKED SCRIPTURAL PASSAGES (PRAMANA GROUNDING) ===',
    `The following source-backed passages from the approved corpus (${targetCorpus}) directly address this topic:`,
    passages,
    '=== INSTRUCTIONS FOR DHARMA MITRA ===',
    'Ground your answer in these passages. Cite the scripture and verse reference (for example, "[Bhagavad Gita 6.26]" or "[Isha Upanishad 1]") where helpful. Do not invent quotations outside these passages.',
  ].join('\n');
}

/**
 * Intelligently retrieves relevant Pramana passages to ground Dharma Mitra chat
 */
export async function retrieveDharmaChatGrounding(input: {
  message: string;
  tradition: string | null;
}): Promise<ChatGroundingResult> {
  const message = input.message.trim();
  if (!message) {
    return { isGrounded: false, corpus: null, documents: [], groundingPromptText: null };
  }

  const meaningfulTokens = extractMeaningfulTokens(message);
  const hasVersePattern = /\b\d+(?:[.:]\d+)+\b/.test(message);
  const namedCorpus = findNamedScriptureCorpus(message);

  // 1. Check for Dharm Veer historical hero mention. A hero's name must not
  // answer in place of a withheld source the user named ("Hanuman" in the Sundara
  // Kanda): that would present a biography as the Ramayana and skip the notice
  // telling the model not to quote it.
  const sourceIsWithheld = namedCorpus !== null && WITHHELD_CORPORA.has(namedCorpus);
  const matchedHero = sourceIsWithheld ? null : matchDharmVeerFigure(message);
  if (matchedHero) {
    try {
      const res = await dharamVeerRetriever.retrieve({
        text: message,
        filters: { title: matchedHero },
        topK: 3,
      });

      if (res.documents && res.documents.length > 0) {
        const passages = res.documents
          .map((doc) => `- [${doc.metadata?.sourceName || 'Dharm Veer'}]: ${doc.content}`)
          .join('\n\n');

        const promptText = [
          '=== AUTHENTIC DHARMIC SOURCE PASSAGES (PRAMANA GROUNDING) ===',
          `The following verified historical/biographical records for this hero were retrieved from Shoonaya\'s Pramana repository:`,
          passages,
          '=== INSTRUCTIONS FOR DHARMA MITRA ===',
          'Ground your response in these authentic passages. Mention key facts from them naturally. Do not fabricate historical events or claims beyond approved sources.',
        ].join('\n');

        return {
          isGrounded: true,
          corpus: 'dharam_veer',
          documents: res.documents as RetrievalChunk[],
          groundingPromptText: promptText,
        };
      }
    } catch {
      // Fail closed to ungrounded standard chat
    }
  }

  // 2. Check for Festival & Vrat rule questions (when not explicitly asking for the full narrative katha)
  const kathaRequested = isKathaQuery(message);
  if (isFestivalRuleQuery(message) && !kathaRequested) {
    try {
      const res = await festivalRulesRetriever.retrieve({
        text: message,
        topK: 3,
      });

      if (res.documents && res.documents.length > 0) {
        const passages = res.documents
          .map((doc) => `- [${doc.metadata?.sourceName || 'Calendar Rules'}]: ${doc.content}`)
          .join('\n\n');

        const promptText = [
          '=== GOVERNED CALENDAR & FESTIVAL RULES (PRAMANA GROUNDING) ===',
          `The following governed rules and citations from Shoonaya\'s calendar engine apply to this question:`,
          passages,
          '=== INSTRUCTIONS FOR DHARMA MITRA ===',
          'Explain the reason or observance rule clearly using these governed passages. State the traditional citation if present. Do not guess or invent dates.',
        ].join('\n');

        return {
          isGrounded: true,
          corpus: 'calendar_festival_rules',
          documents: res.documents as RetrievalChunk[],
          groundingPromptText: promptText,
        };
      }
    } catch {
      // Fail closed to ungrounded standard chat
    }
  }

  // 3. Check for general Dharmic / scriptural intent
  // If the query is off-topic, emotional check-in, or daily life without spiritual context, do not force scripture
  if (!hasDharmicIntent(message, meaningfulTokens) || meaningfulTokens.length === 0) {
    return { isGrounded: false, corpus: null, documents: [], groundingPromptText: null };
  }

  // 4. Scripture named in the current message takes precedence over a saved
  // profile tradition. Tradition is only a fallback when the user did not
  // explicitly identify a source family in this question.
  let targetCorpus = 'pathshala_gita';

  if (namedCorpus !== null) {
    targetCorpus = namedCorpus;
  } else if (kathaRequested) {
    targetCorpus = 'bhakti_katha';
  } else if (input.tradition === 'sikh') {
    targetCorpus = 'sikh_gurbani';
  } else if (input.tradition === 'buddhist') {
    targetCorpus = 'buddhist_dhamma';
  } else if (input.tradition === 'jain') {
    targetCorpus = 'jain_dharma';
  }

  if (targetCorpus === 'valmiki_ramayana') {
    return {
      isGrounded: false,
      corpus: targetCorpus,
      documents: [],
      groundingPromptText: [
        '=== APPROVED SOURCE COVERAGE UNAVAILABLE ===',
        'The user explicitly asked about the Valmiki Ramayana, but Shoonaya does not yet have a source-audited Ramayana passage approved for Pramana grounding.',
        'Do not provide or invent a quotation, verse reference, or definitive textual claim. Say briefly that approved source coverage is still being prepared, and offer general non-quoted guidance only if it can be clearly identified as general guidance.',
      ].join('\n'),
    };
  }

  try {
    const isDenseRoutedCorpus = targetCorpus === 'pathshala_gita' || targetCorpus === 'pathshala_upanishads';
    // The sparse TF-IDF corpora match on keywords, so they get the meaningful tokens
    // (stopwords would dilute them). The dense corpora match on meaning: a sentence
    // embedding reads the whole question, and stripping it to "work worrying results"
    // costs retrieval quality (33 vs 35 of 44 gold queries found in the top 5). Verse
    // numbering is kept either way.
    const queryForSearch = hasVersePattern
      ? message
      : isDenseRoutedCorpus
        ? toDenseQuery(message)
        : (meaningfulTokens.length >= 2 ? meaningfulTokens.join(' ') : message);

    const docs = await retrievePathshalaContext({
      title: queryForSearch,
      tradition: input.tradition,
      corpus: targetCorpus,
    });

    if (!docs || docs.length === 0) {
      return { isGrounded: false, corpus: targetCorpus, documents: [], groundingPromptText: null };
    }

    const topScore = docs[0]?.score ?? 0;
    // Relevance check: verse pattern requires 0.15+, topical text query requires
    // 0.05+ for the still-sparse corpora, 0.3+ for the now dense-routed ones.
    //
    // pathshala_gita/pathshala_upanishads were cut over to PramanaDenseEmbeddingRetriever
    // (retrieval.ts, plan step 5); every other corpus (Gurbani, Buddhist, Jain, etc.)
    // still returns sparse TF-IDF scores through retrievePathshalaContext, so the
    // 0.04 floor stays correct for them and must not be raised. Dense cosine scores
    // run on a fundamentally different scale: real-data analysis (plan step 4) found
    // off-topic negative-control queries ("capital of France", "chocolate cake
    // recipe") scoring up to ~0.21 on pure noise against both dense indexes -- well
    // above the sparse-tuned 0.04 floor, which would let noise through ungated on a
    // dense-routed corpus. 0.3 sits with a deliberate lean toward false-negative/
    // ungrounded-fallback over false-positive grounding, since this gate is what
    // allows citing scripture at all. hasVersePattern queries need no branching here:
    // PramanaDenseEmbeddingRetriever itself now detects a bare chapter.verse
    // reference and routes to the manifest/heuristic retriever before ever running a
    // dense query, so hasVersePattern's topScore is a manifest-lookup score (0.6-1.0
    // range) regardless of which corpus -- the existing 0.15 floor already covers it.
    const isRelevant = hasVersePattern
      ? topScore >= 0.15
      : topScore >= (isDenseRoutedCorpus ? 0.3 : 0.04);

    if (!isRelevant) {
      return { isGrounded: false, corpus: targetCorpus, documents: [], groundingPromptText: null };
    }

    const topDocs = docs.slice(0, 3);
    const promptText = buildCorpusGroundingPrompt(targetCorpus, topDocs);

    return {
      isGrounded: true,
      corpus: targetCorpus,
      documents: topDocs,
      groundingPromptText: promptText,
    };
  } catch {
    return { isGrounded: false, corpus: targetCorpus, documents: [], groundingPromptText: null };
  }
}
