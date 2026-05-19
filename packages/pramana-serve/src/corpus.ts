export type PramanaCorpusId =
  | 'pathshala_gita'
  | 'pathshala_upanishads'
  | 'bhakti_katha'
  | 'bhakti_panchatantra'
  | 'sikh_gurbani';

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

