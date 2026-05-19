export type PramanaCorpusId =
  | 'pathshala_gita'
  | 'pathshala_upanishads'
  | 'bhakti_katha'
  | 'bhakti_panchatantra'
  | 'sikh_gurbani'
  | 'tamil_tirukkural'
  | 'tamil_prabandham'
  | 'tamil_tiruvachakam'
  | 'mahabharata_shanti'
  | 'sant_kabir'
  | 'sikh_dasam_granth'
  | 'mahayana_bodhicharyavatara'
  | 'jain_tattvartha_sutra'
  | 'shaiva_kashmir'
  | 'jain_kalpa_sutra';

export interface PramanaCorpusMetadata {
  readonly id: PramanaCorpusId;
  readonly name: string;
  readonly type: 'scripture' | 'narrative';
  readonly tradition: string;
  readonly primaryLanguage: string;
  readonly description?: string;
}

export const PRAMANA_CORPUS_REGISTRY: Record<PramanaCorpusId, PramanaCorpusMetadata> = {
  pathshala_gita: {
    id: 'pathshala_gita',
    name: 'Bhagavad Gita',
    type: 'scripture',
    tradition: 'Sanatana Dharma',
    primaryLanguage: 'sa',
    description: 'The sacred conversation between Lord Krishna and Arjuna on duty and devotion.'
  },
  pathshala_upanishads: {
    id: 'pathshala_upanishads',
    name: 'Upanishads',
    type: 'scripture',
    tradition: 'Sanatana Dharma',
    primaryLanguage: 'sa',
    description: 'Philosophical texts exploring the nature of ultimate reality (Brahman) and the self (Atman).'
  },
  bhakti_katha: {
    id: 'bhakti_katha',
    name: 'Puranic Devotional Stories (Katha)',
    type: 'narrative',
    tradition: 'Bhakti',
    primaryLanguage: 'sa',
    description: 'Stories of deep devotion, divine plays, and holy saints.'
  },
  bhakti_panchatantra: {
    id: 'bhakti_panchatantra',
    name: 'Panchatantra Moral Fables',
    type: 'narrative',
    tradition: 'Moral',
    primaryLanguage: 'sa',
    description: 'Ancient animal fables demonstrating wise conduct and moral principles.'
  },
  sikh_gurbani: {
    id: 'sikh_gurbani',
    name: 'Gurbani Scriptures',
    type: 'scripture',
    tradition: 'Sikhi',
    primaryLanguage: 'pa',
    description: 'Holy scriptures of Gurbani, including Sri Guru Granth Sahib Ji, Nitnem, and other canonical texts.'
  },
  tamil_tirukkural: {
    id: 'tamil_tirukkural',
    name: 'Tirukkural',
    type: 'scripture',
    tradition: 'Tamil Sangam',
    primaryLanguage: 'ta',
    description: 'Classic Tamil text containing ethical and moral aphorisms.'
  },
  tamil_prabandham: {
    id: 'tamil_prabandham',
    name: 'Naalayira Divya Prabandham',
    type: 'scripture',
    tradition: 'Sri Vaishnavism',
    primaryLanguage: 'ta',
    description: 'Collection of 4,000 Tamil verses composed by the Alvars.'
  },
  tamil_tiruvachakam: {
    id: 'tamil_tiruvachakam',
    name: 'Tiruvachakam',
    type: 'scripture',
    tradition: 'Shaiva Siddhanta',
    primaryLanguage: 'ta',
    description: 'Devotional Tamil poetry dedicated to Lord Shiva.'
  },
  mahabharata_shanti: {
    id: 'mahabharata_shanti',
    name: 'Mahabharata - Shanti Parva',
    type: 'scripture',
    tradition: 'Itihasa',
    primaryLanguage: 'sa',
    description: 'The Book of Peace, containing discourse on dharma and statecraft.'
  },
  sant_kabir: {
    id: 'sant_kabir',
    name: 'Kabir Dohe',
    type: 'scripture',
    tradition: 'Sant Mat / Bhakti',
    primaryLanguage: 'hi',
    description: 'Couplets of Sant Kabir containing deep spiritual and social insights.'
  },
  sikh_dasam_granth: {
    id: 'sikh_dasam_granth',
    name: 'Dasam Granth',
    type: 'scripture',
    tradition: 'Sikhism',
    primaryLanguage: 'pa',
    description: 'Scriptures composed by the 10th Sikh Guru, Guru Gobind Singh Ji.'
  },
  mahayana_bodhicharyavatara: {
    id: 'mahayana_bodhicharyavatara',
    name: 'Bodhicharyavatara',
    type: 'scripture',
    tradition: 'Mahayana Buddhism',
    primaryLanguage: 'sa',
    description: 'Mahayana Buddhist text on the Bodhisattva path by Shantideva.'
  },
  jain_tattvartha_sutra: {
    id: 'jain_tattvartha_sutra',
    name: 'Tattvartha Sutra',
    type: 'scripture',
    tradition: 'Jainism',
    primaryLanguage: 'sa',
    description: 'Foundational text of Jainism summarizing its core philosophy and epistemology.'
  },
  shaiva_kashmir: {
    id: 'shaiva_kashmir',
    name: 'Kashmir Shaiva Texts',
    type: 'scripture',
    tradition: 'Kashmir Shaivism',
    primaryLanguage: 'sa',
    description: 'Key texts of Kashmir Shaivism such as the Shiva Sutras and Vijnana Bhairava.'
  },
  jain_kalpa_sutra: {
    id: 'jain_kalpa_sutra',
    name: 'Kalpa Sutra & Agamas',
    type: 'scripture',
    tradition: 'Jainism (Shvetambara)',
    primaryLanguage: 'prakrit',
    description: 'Jain texts including biographies of the Tirthankaras.'
  }
};

export type PramanaResponseMode =
  | 'scripture_verse_explain'
  | 'scripture_passage_explain'
  | 'devotional_story_explain'
  | 'moral_story_explain'
  | 'gurbani_shabad_explain';

export interface PramanaCorpusSelector {
  selectCorpus(queryText: string, filters?: Record<string, unknown>): PramanaCorpusId;
}

export class SimpleCorpusSelector implements PramanaCorpusSelector {
  selectCorpus(queryText: string, filters?: Record<string, unknown>): PramanaCorpusId {
    const text = (queryText || '').toLowerCase();
    const source = String(filters?.source || '').toLowerCase();
    const corpusFilter = String(filters?.corpus || '').toLowerCase();

    // 1. Explicit corpus selection
    if (corpusFilter === 'sikh_gurbani') return 'sikh_gurbani';
    if (corpusFilter === 'bhakti_panchatantra') return 'bhakti_panchatantra';
    if (corpusFilter === 'bhakti_katha') return 'bhakti_katha';
    if (corpusFilter === 'pathshala_upanishads') return 'pathshala_upanishads';
    if (corpusFilter === 'pathshala_gita') return 'pathshala_gita';

    // 2. Fallback routing rules for approved active live corpora (Gita and Bhakti Katha only)
    if (
      source.includes('katha') ||
      source.includes('story') ||
      source.includes('purana') ||
      source.includes('bhagavatam') ||
      text.includes('katha') ||
      text.includes('prahlada') ||
      text.includes('dhruva') ||
      text.includes('sudama') ||
      text.includes('gajendra')
    ) {
      return 'bhakti_katha';
    }

    return 'pathshala_gita';
  }
}

