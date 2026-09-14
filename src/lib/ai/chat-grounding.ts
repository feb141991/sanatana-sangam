import {
  dharamVeerRetriever,
  festivalRulesRetriever,
  retrievePathshalaContext,
  type RetrievalChunk,
} from '@/lib/ai/retrieval';

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
  return words.filter((w) => !STOPWORDS.has(w) && w.length > 2);
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
  const lower = text.toLowerCase();
  return (
    lower.includes("katha") ||
    lower.includes("vrat katha") ||
    lower.includes("satyanarayan") ||
    lower.includes("purana") ||
    lower.includes("puranic") ||
    lower.includes("prahlada") ||
    lower.includes("dhruva") ||
    lower.includes("gajendra") ||
    lower.includes("sudama") ||
    lower.includes("veervati") ||
    lower.includes("mahishasura mardini")
  );
}

export function isFestivalRuleQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return FESTIVAL_TERMS.some((term) => lower.includes(term));
}

/**
 * Checks if a query contains Dharmic/philosophical inquiry intent
 */
export function hasDharmicIntent(text: string, meaningfulTokens: string[]): boolean {
  const lower = text.toLowerCase();
  if (/\b\d+(?:[.:]\d+)+\b/.test(text)) return true; // verse reference e.g. 2.47
  if (/\bchapter\s+\d+/i.test(text)) return true;
  if (isFestivalRuleQuery(text) || isKathaQuery(text)) return true;
  return meaningfulTokens.some((t) => DHARMIC_CONCEPTS.has(t)) ||
         Array.from(DHARMIC_CONCEPTS).some((c) => lower.includes(c));
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
  const lower = message.toLowerCase();
  const hasVersePattern = /\b\d+(?:[.:]\d+)+\b/.test(message);

  // 1. Check for Dharm Veer historical hero mention
  const matchedHero = matchDharmVeerFigure(message);
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

  // 4. Tradition & Scripture Corpus Selection
  let targetCorpus = 'pathshala_gita';

  if (
    input.tradition === 'sikh' ||
    lower.includes('gurbani') ||
    lower.includes('sikh') ||
    lower.includes('guru granth') ||
    lower.includes('japji') ||
    lower.includes('rehras') ||
    lower.includes('waheguru') ||
    lower.includes('shabad')
  ) {
    targetCorpus = 'sikh_gurbani';
  } else if (
    input.tradition === 'buddhist' ||
    lower.includes('buddha') ||
    lower.includes('buddhism') ||
    lower.includes('dhamma') ||
    lower.includes('dhammapada') ||
    lower.includes('eightfold') ||
    lower.includes('nirvana')
  ) {
    targetCorpus = 'buddhist_dhamma';
  } else if (
    input.tradition === 'jain' ||
    lower.includes('jain') ||
    lower.includes('jainism') ||
    lower.includes('tirthankara') ||
    lower.includes('tattvartha') ||
    lower.includes('saman suttam') ||
    lower.includes('ahimsa') ||
    lower.includes('anekantavada') ||
    lower.includes('navkar') ||
    lower.includes('namokar')
  ) {
    targetCorpus = 'jain_dharma';
  } else if (
    lower.includes('upanishad') ||
    lower.includes('upanishads') ||
    lower.includes('vedanta') ||
    lower.includes('mandukya') ||
    lower.includes('katha upanishad') ||
    lower.includes('nachiketa') ||
    lower.includes('isha upanishad') ||
    lower.includes('ishavasya') ||
    lower.includes('kena upanishad') ||
    lower.includes('mundaka') ||
    lower.includes('prashna upanishad') ||
    lower.includes('chandogya') ||
    lower.includes('brihadaranyaka') ||
    lower.includes('atman') ||
    lower.includes('brahman')
  ) {
    targetCorpus = 'pathshala_upanishads';
  } else if (
    lower.includes('ramayana') ||
    lower.includes('valmiki') ||
    lower.includes('sundara kanda') ||
    lower.includes('bala kanda') ||
    lower.includes('ayodhya kanda') ||
    lower.includes('yuddha kanda')
  ) {
    targetCorpus = 'valmiki_ramayana';
  } else if (kathaRequested) {
    targetCorpus = 'bhakti_katha';
  }

  try {
    // For vector retrieval, use meaningful keywords to prevent stopword dilution,
    // while retaining verse numbering if present.
    const queryForSearch = hasVersePattern
      ? message
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
    // Relevance check: verse pattern requires 0.15+, topical text query requires 0.05+
    const isRelevant = hasVersePattern ? topScore >= 0.15 : topScore >= 0.04;

    if (!isRelevant) {
      return { isGrounded: false, corpus: targetCorpus, documents: [], groundingPromptText: null };
    }

    const topDocs = docs.slice(0, 3);
    const passages = topDocs
      .map((doc) => {
        const ref = doc.metadata?.chunkId ? ` (${doc.metadata.chunkId})` : '';
        const sourceName = doc.metadata?.sourceName || 'Scripture';
        return `- [${sourceName}${ref}]:\n${doc.content}`;
      })
      .join('\n\n');

    const promptText = [
      '=== AUTHENTIC SCRIPTURAL PASSAGES (PRAMANA GROUNDING) ===',
      `The following verified passages from authorized scriptures (${targetCorpus}) directly address this topic:`,
      passages,
      '=== INSTRUCTIONS FOR DHARMA MITRA ===',
      'Naturally ground your answer in these authentic passages. Cite the scripture and verse reference (e.g. "[Bhagavad Gita 6.26]" or "[Isha Upanishad 1]") where helpful. Do NOT invent quotations outside these verified passages.',
    ].join('\n');

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
