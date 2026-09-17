import fs from 'fs';
import path from 'path';
import {
  PramanaRetrieverSelector,
  SimpleCorpusSelector,
  hasPendingSourceContent,
  type PramanaRetrievalDocument,
  type PramanaRetriever,
  type PramanaRetrievalQuery,
  type PramanaRetrievalResult,
} from '@sangam/pramana-serve';
import { emitEvent } from '@/lib/monitoring/events';

export type RetrievalChunkMetadata = {
  chunkId: string;
  docId: string;
  tradition?: string | null;
  sourceName?: string | null;
  sourceClass?: string | null;
  rightsStatus?: string | null;
};

export type RetrievalChunk = PramanaRetrievalDocument<RetrievalChunkMetadata>;

type SparseVector = Record<string, number>;

type DharamVeerIndexDocument = {
  id: string;
  doc_id: string;
  ref: string;
  text: string;
  vector: SparseVector;
  tradition?: string;
  source_name?: string;
  source_class?: string;
  rights_status?: string;
};

type DharamVeerIndexData = {
  idf: Record<string, number>;
  documents: DharamVeerIndexDocument[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSparseVector(value: unknown): value is SparseVector {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'number');
}

function isDharamVeerIndexDocument(value: unknown): value is DharamVeerIndexDocument {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.doc_id === 'string' &&
    typeof value.ref === 'string' &&
    typeof value.text === 'string' &&
    isSparseVector(value.vector)
  );
}

function isDharamVeerIndexData(value: unknown): value is DharamVeerIndexData {
  if (!isRecord(value)) return false;
  return (
    isRecord(value.idf) &&
    Object.values(value.idf).every((entry) => typeof entry === 'number') &&
    Array.isArray(value.documents) &&
    value.documents.every(isDharamVeerIndexDocument)
  );
}

export interface PramanaManifestRetrieverOptions {
  prefix: string;
  manifestsDir?: string;
  sourceName?: string;
  sourceClass?: string;
  tradition?: string;
  maxChapters?: number;
  fileNames?: string[];
}

export class PramanaManifestRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private manifestsDir: string;
  private prefix: string;
  private sourceName: string;
  private sourceClass: string;
  private tradition: string;
  private maxChapters: number;
  private fileNames?: string[];
  private manifestCache: Map<string, any> = new Map();

  constructor(options: PramanaManifestRetrieverOptions) {
    this.manifestsDir = options.manifestsDir || path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests');
    this.prefix = options.prefix;
    this.sourceName = options.sourceName || 'Scripture';
    this.sourceClass = options.sourceClass || 'scripture';
    this.tradition = options.tradition || 'Sanatana Dharma';
    this.maxChapters = options.maxChapters || 18;
    this.fileNames = options.fileNames;
  }

  private loadManifest(chapterNumOrName: number | string): any | null {
    let filePath: string;
    if (typeof chapterNumOrName === 'string') {
      filePath = path.join(this.manifestsDir, chapterNumOrName);
    } else {
      filePath = path.join(this.manifestsDir, `${this.prefix}_${chapterNumOrName}.json`);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(this.manifestsDir, `${this.prefix}.json`);
      }
    }
    if (this.manifestCache.has(filePath)) {
      return this.manifestCache.get(filePath);
    }
    if (!fs.existsSync(filePath)) return null;
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.manifestCache.set(filePath, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  private parseReferenceSegments(queryText: string): string[] | null {
    const match = queryText.match(/(?:chapter\s+|verse\s+|v)?(\d+(?:[.:]\d+)+)/i);
    if (match) {
      return match[1].replace(/:/g, '.').split('.');
    }
    return null;
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const queryText = query.text.trim();
    if (!queryText) {
      return { documents: [] };
    }

    const filters = query.filters || {};
    const reqSource = (filters.source as string || '').trim();
    const reqTitle = (filters.title as string || '').trim();
    const reqTradition = (filters.tradition as string || '').trim();

    const refSegments = this.parseReferenceSegments(queryText) || this.parseReferenceSegments(reqSource) || this.parseReferenceSegments(reqTitle);

    // Fail closed if required corpus manifests are absent; never fabricate retrieval content.
    let filesExist = false;
    if (this.fileNames && this.fileNames.length > 0) {
      for (const fn of this.fileNames) {
        if (fs.existsSync(path.join(this.manifestsDir, fn))) {
          filesExist = true;
          break;
        }
      }
    } else {
      for (let ch = 1; ch <= this.maxChapters; ch++) {
        if (fs.existsSync(path.join(this.manifestsDir, `${this.prefix}_${ch}.json`)) || fs.existsSync(path.join(this.manifestsDir, `${this.prefix}.json`))) {
          filesExist = true;
          break;
        }
      }
    }

    if (!filesExist) {
      throw new Error(`Corpus files for ${this.sourceName} (prefix: ${this.prefix}) are missing from deployment.`);
    }

    const candidates: Array<{ chunk: RetrievalChunk; baseScore: number }> = [];

    const itemsToLoad = this.fileNames ? this.fileNames : Array.from({ length: this.maxChapters }, (_, i) => i + 1);

    for (const item of itemsToLoad) {
      const manifest = this.loadManifest(item);
      if (!manifest || !manifest.content) continue;

      for (let idx = 0; idx < manifest.content.length; idx++) {
        const v = manifest.content[idx];

        let exactVerseScore = 0.0;
        if (refSegments) {
          const targetRef = refSegments.join('.');
          if (v.ref === targetRef) {
            exactVerseScore = 1.0;
          } else {
            const vSegments = v.ref.split('.');
            if (vSegments.length === refSegments.length) {
              let matchExceptLast = true;
              for (let i = 0; i < vSegments.length - 1; i++) {
                if (vSegments[i] !== refSegments[i]) {
                  matchExceptLast = false;
                  break;
                }
              }
              if (matchExceptLast) {
                const vNum = parseInt(vSegments[vSegments.length - 1], 10);
                const reqNum = parseInt(refSegments[refSegments.length - 1], 10);
                if (Math.abs(vNum - reqNum) === 1) {
                  exactVerseScore = 0.6;
                }
              }
            }
          }
        }

        let titleSourceScore = 0.0;
        const lowercaseSource = (manifest.source_name || this.sourceName).toLowerCase();
        const lowercaseDocId = (manifest.doc_id || '').toLowerCase();
        // Defensive normalization mirroring PramanaDharamVeerEmbeddingRetriever.retrieve():
        // manifest doc_id should be hyphenated to match figure_id exactly, but accept an
        // underscored doc_id too in case a manifest author deviates from that convention.
        const reqTitleLower = reqTitle.toLowerCase();
        const reqTitleLowerNormalized = reqTitleLower.replace(/-/g, '_');

        if (reqTitle && (reqTitleLower === lowercaseDocId || reqTitleLowerNormalized === lowercaseDocId)) {
          titleSourceScore += 1.0;
        } else if (reqTitle && (lowercaseDocId.includes(reqTitleLower) || reqTitleLower.includes(lowercaseDocId) || lowercaseDocId.includes(reqTitleLowerNormalized) || reqTitleLowerNormalized.includes(lowercaseDocId))) {
          titleSourceScore += 0.3;
        }

        const lowerQuery = queryText.toLowerCase();
        if (lowercaseDocId.replace('pathshala_upanishads_', '').length > 3) {
          const specName = lowercaseDocId.replace('pathshala_upanishads_', '');
          if (lowerQuery.includes(specName)) {
            titleSourceScore += 0.8;
          }
        }

        if (reqSource && (lowercaseSource.includes(reqSource.toLowerCase()) || reqSource.toLowerCase().includes(lowercaseSource))) {
          titleSourceScore += 0.15;
        }

        let keywordOverlapScore = 0.0;
        const textHaystack = [
          v.text || '',
          v.sanskrit || '',
          v.original || '',
          v.transliteration || '',
          v.curated_lesson || ''
        ].join(' ').toLowerCase();

        const terms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        if (terms.length > 0) {
          let matches = 0;
          for (const term of terms) {
            if (textHaystack.includes(term)) {
              matches++;
            }
          }
          keywordOverlapScore = (matches / terms.length) * 0.5;
        }

        let traditionScore = 0.0;
        const manifestTradition = manifest.tradition || this.tradition;
        if (reqTradition && manifestTradition && manifestTradition.toLowerCase() === reqTradition.toLowerCase()) {
          traditionScore += 0.2;
        }
        const manifestSourceClass = manifest.source_class || this.sourceClass;
        if (manifestSourceClass === 'scripture') {
          traditionScore += 0.1;
        }

        const totalScore = exactVerseScore + titleSourceScore + keywordOverlapScore + traditionScore;

        if (totalScore > 0) {
          const manifestTradition = manifest.tradition || this.tradition;
          const origLabel = manifest.source_class === 'scripture' && manifestTradition !== 'Sikhi' ? 'Sanskrit' : 'Original';
          // Per-item source metadata overrides the manifest-level default. This lets a single
          // manifest mix a verified translation excerpt (source_class: 'translation',
          // rights_status: 'public_domain') with a separately-labeled Shoonaya retelling
          // (source_class: 'curated_lesson', rights_status: 'rights_cleared') without either
          // one inheriting the other's rights claim. See PATHSHALA_SOURCE_POLICY.md.
          const itemSourceClass = v.source_class || manifestSourceClass;
          const itemRightsStatus = v.rights_status || manifest.rights_status || 'public_domain';
          const itemSourceName = v.source_name || manifest.source_name || this.sourceName;
          const textContent = [
            v.sanskrit ? `Sanskrit: ${v.sanskrit}` : v.original ? `${origLabel}: ${v.original}` : '',
            v.transliteration ? `Transliteration: ${v.transliteration}` : '',
            v.text ? `Translation (${itemSourceName}): ${v.text}` : '',
            v.curated_lesson ? `Shoonaya retelling (curated, not a translation): ${v.curated_lesson}` : ''
          ].filter(Boolean).join('\n');

          candidates.push({
            chunk: {
              id: `${manifest.doc_id}_${v.ref}`,
              content: textContent,
              score: totalScore,
              metadata: {
                chunkId: v.ref,
                docId: manifest.doc_id,
                tradition: manifestTradition,
                sourceName: itemSourceName,
                sourceClass: itemSourceClass,
                rightsStatus: itemRightsStatus,
              }
            },
            baseScore: totalScore
          });
        }
      }
    }

    candidates.sort((a, b) => {
      if (Math.abs(b.baseScore - a.baseScore) > 1e-9) {
        return b.baseScore - a.baseScore;
      }
      const refA = a.chunk.metadata!.chunkId.split('.').map(Number);
      const refB = b.chunk.metadata!.chunkId.split('.').map(Number);
      const len = Math.min(refA.length, refB.length);
      for (let i = 0; i < len; i++) {
        if (refA[i] !== refB[i]) return refA[i] - refB[i];
      }
      return refA.length - refB.length;
    });

    const exactMatchIdx = candidates.findIndex(c => c.chunk.score! >= 1.0);
    const documents: RetrievalChunk[] = [];

    if (exactMatchIdx !== -1) {
      const targetChunk = candidates[exactMatchIdx].chunk;
      const targetRef = targetChunk.metadata!.chunkId;
      const targetDocId = targetChunk.metadata!.docId;
      const tSegments = targetRef.split('.');

      const neighbors = candidates.filter(c => {
        if (c.chunk.metadata!.docId !== targetDocId) return false;
        const cSegments = c.chunk.metadata!.chunkId.split('.');
        if (cSegments.length !== tSegments.length) return false;
        for (let i = 0; i < cSegments.length - 1; i++) {
          if (cSegments[i] !== tSegments[i]) return false;
        }
        const cV = parseInt(cSegments[cSegments.length - 1], 10);
        const tV = parseInt(tSegments[tSegments.length - 1], 10);
        return Math.abs(cV - tV) <= 1;
      });

      neighbors.sort((a, b) => {
        const aV = parseInt(a.chunk.metadata!.chunkId.split('.').pop() || '0', 10);
        const bV = parseInt(b.chunk.metadata!.chunkId.split('.').pop() || '0', 10);
        return aV - bV;
      });
      documents.push(...neighbors.map(n => n.chunk));
    } else {
      documents.push(...candidates.slice(0, 5).map(c => c.chunk));
    }

    return { documents };
  }
}

export class PathshalaManifestRetriever extends PramanaManifestRetriever {
  constructor() {
    super({
      prefix: 'gita_chapter',
      sourceName: 'Bhagavad Gita',
      sourceClass: 'scripture',
      tradition: 'Sanatana Dharma',
      maxChapters: 18
    });
  }
}

const gitaManifestRetriever = new PramanaManifestRetriever({
  prefix: 'gita_chapter',
  sourceName: 'Bhagavad Gita',
  sourceClass: 'scripture',
  tradition: 'Sanatana Dharma',
  maxChapters: 18
});

export class PramanaGitaEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaManifestRetriever;
  private indexPath: string;
  private indexData: any = null;

  constructor(fallbackRetriever: PramanaManifestRetriever) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/gita_index.json');
  }

  private loadIndex() {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      this.indexData = JSON.parse(data);
      return this.indexData;
    } catch {
      return null;
    }
  }

  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    if (!queryText) {
      return { documents: [] };
    }

    const tokens = this.tokenize(queryText);
    if (tokens.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    const tf: Record<string, number> = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }

    const queryVector: Record<string, number> = {};
    let sumSq = 0;
    for (const t in tf) {
      const idf = index.idf[t] || 0;
      if (idf > 0) {
        const tfidf = tf[t] * idf;
        queryVector[t] = tfidf;
        sumSq += tfidf * tfidf;
      }
    }

    const queryNorm = Math.sqrt(sumSq);
    if (queryNorm === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryUnitVector: Record<string, number> = {};
    for (const t in queryVector) {
      queryUnitVector[t] = queryVector[t] / queryNorm;
    }

    const docsWithScores: Array<{ doc: any; score: number }> = [];
    for (const doc of index.documents) {
      let score = 0;
      for (const t in queryUnitVector) {
        if (doc.vector[t]) {
          score += queryUnitVector[t] * doc.vector[t];
        }
      }

      if (score > 0) {
        docsWithScores.push({ doc, score });
      }
    }

    if (docsWithScores.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const augmentedDocs: Array<{ doc: any; score: number }> = [];

    if (docsWithScores.length > 0) {
      const topDocItem = docsWithScores[0];
      augmentedDocs.push(topDocItem);

      if (topDocItem.score >= 0.4) {
        const topDoc = topDocItem.doc;
        const refParts = topDoc.ref.split('.');
        if (refParts.length === 2) {
          const ch = parseInt(refParts[0], 10);
          const v = parseInt(refParts[1], 10);

          const prevRef = `${ch}.${v - 1}`;
          const nextRef = `${ch}.${v + 1}`;

          const prevDoc = index.documents.find((d: any) => d.ref === prevRef);
          const nextDoc = index.documents.find((d: any) => d.ref === nextRef);

          if (prevDoc) {
            augmentedDocs.push({ doc: prevDoc, score: topDocItem.score - 0.1 });
          }
          if (nextDoc) {
            augmentedDocs.push({ doc: nextDoc, score: topDocItem.score - 0.12 });
          }
        }
      }

      for (const item of docsWithScores.slice(1)) {
        if (!augmentedDocs.some(x => x.doc.id === item.doc.id)) {
          if (item.score >= 0.1) {
            augmentedDocs.push(item);
          }
        }
      }
    }

    const topDocs = augmentedDocs.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      const textContent = [
        doc.sanskrit ? `Sanskrit: ${doc.sanskrit}` : '',
        doc.transliteration ? `Transliteration: ${doc.transliteration}` : '',
        doc.text ? `Translation: ${doc.text}` : ''
      ].filter(Boolean).join('\n');

      return {
        id: doc.id,
        content: textContent,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.id.split('_').slice(0, -1).join('_'),
          tradition: 'Sanatana Dharma',
          sourceName: 'Bhagavad Gita',
          sourceClass: 'scripture',
          rightsStatus: 'public_domain'
        }
      };
    });

    return {
      documents,
      provider: 'embedding-index'
    };
  }
}

const upanishadsManifestRetriever = new PramanaManifestRetriever({
  prefix: 'upanishad',
  sourceName: 'Upanishads',
  sourceClass: 'scripture',
  tradition: 'Sanatana Dharma',
  fileNames: [
    'upanishad_isha.json',
    'upanishad_kena.json',
    'upanishad_katha.json',
    'upanishad_mundaka.json',
    'upanishad_mandukya.json',
    'upanishad_prashna.json',
    'upanishad_taittiriya.json',
    'upanishad_aitareya.json',
    'upanishad_chandogya.json',
    'upanishad_brihadaranyaka.json',
    'upanishad_shvetashvatara.json'
  ]
});

export class PramanaUpanishadsEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaManifestRetriever;
  private indexPath: string;
  private indexData: any = null;

  constructor(fallbackRetriever: PramanaManifestRetriever) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/upanishads_index.json');
  }

  private loadIndex() {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      this.indexData = JSON.parse(data);
      return this.indexData;
    } catch {
      return null;
    }
  }

  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    if (!queryText) {
      return { documents: [] };
    }

    const tokens = this.tokenize(queryText);
    if (tokens.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    const tf: Record<string, number> = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }

    const queryVector: Record<string, number> = {};
    let sumSq = 0;
    for (const t in tf) {
      const idf = index.idf[t] || 0;
      if (idf > 0) {
        const tfidf = tf[t] * idf;
        queryVector[t] = tfidf;
        sumSq += tfidf * tfidf;
      }
    }

    const queryNorm = Math.sqrt(sumSq);
    if (queryNorm === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryUnitVector: Record<string, number> = {};
    for (const t in queryVector) {
      queryUnitVector[t] = queryVector[t] / queryNorm;
    }

    const reqTitle = (query.filters?.title as string || '').toLowerCase();
    const lowerQuery = queryText.toLowerCase();
    const queryTokenSet = new Set(this.tokenize(lowerQuery));

    const docsWithScores: Array<{ doc: any; score: number }> = [];
    for (const doc of index.documents) {
      let score = 0;
      for (const t in queryUnitVector) {
        if (doc.vector[t]) {
          score += queryUnitVector[t] * doc.vector[t];
        }
      }

      // Explicit title / doc boosting
      const docId = (doc.id.split('_').slice(0, -1).join('_') || '').toLowerCase();
      if (reqTitle && reqTitle === docId) {
        score += 1.0;
      } else if (reqTitle && docId.includes(reqTitle)) {
        score += 0.3;
      }

      const specName = docId.replace('pathshala_upanishads_', '');
      if (specName.length > 3) {
        if (queryTokenSet.has(specName)) {
          score += 0.8;
        }
      }

      if (score > 0) {
        docsWithScores.push({ doc, score });
      }
    }

    if (docsWithScores.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const augmentedDocs: Array<{ doc: any; score: number }> = [];

    if (docsWithScores.length > 0) {
      const topDocItem = docsWithScores[0];
      augmentedDocs.push(topDocItem);

      if (topDocItem.score >= 0.4) {
        const topDoc = topDocItem.doc;
        const refParts = topDoc.ref.split('.');
        if (refParts.length === 2) {
          const ch = parseInt(refParts[0], 10);
          const v = parseInt(refParts[1], 10);

          const prevRef = `${ch}.${v - 1}`;
          const nextRef = `${ch}.${v + 1}`;

          const topDocId = topDoc.doc_id || topDoc.id.split('_').slice(0, -1).join('_');
          const prevDoc = index.documents.find((d: any) => d.ref === prevRef && (d.doc_id || d.id.split('_').slice(0, -1).join('_')) === topDocId);
          const nextDoc = index.documents.find((d: any) => d.ref === nextRef && (d.doc_id || d.id.split('_').slice(0, -1).join('_')) === topDocId);

          if (prevDoc) {
            augmentedDocs.push({ doc: prevDoc, score: topDocItem.score - 0.1 });
          }
          if (nextDoc) {
            augmentedDocs.push({ doc: nextDoc, score: topDocItem.score - 0.12 });
          }
        }
      }

      for (const item of docsWithScores.slice(1)) {
        if (!augmentedDocs.some(x => x.doc.id === item.doc.id)) {
          if (item.score >= 0.1) {
            augmentedDocs.push(item);
          }
        }
      }
    }

    const topDocs = augmentedDocs.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      const textContent = [
        doc.sanskrit ? `Sanskrit: ${doc.sanskrit}` : '',
        doc.transliteration ? `Transliteration: ${doc.transliteration}` : '',
        doc.text ? `Translation: ${doc.text}` : ''
      ].filter(Boolean).join('\n');

      return {
        id: doc.id,
        content: textContent,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.id.split('_').slice(0, -1).join('_'),
          tradition: 'Sanatana Dharma',
          sourceName: 'Upanishads',
          sourceClass: 'scripture',
          rightsStatus: 'public_domain'
        }
      };
    });

    return {
      documents,
      provider: 'embedding-index'
    };
  }
}

// Register the four multi-corpus retrievers
PramanaRetrieverSelector.register('pathshala_gita', new PramanaGitaEmbeddingRetriever(gitaManifestRetriever));
PramanaRetrieverSelector.register('pathshala_upanishads', new PramanaUpanishadsEmbeddingRetriever(upanishadsManifestRetriever));

/**
 * Real dense-embedding retriever (query-time embedQuery(), not TF-IDF),
 * built alongside -- not replacing -- the sparse retrievers above. Not yet
 * used by any live corpus key: registered under 'pathshala_gita_dense' /
 * 'pathshala_upanishads_dense' so scripts/compare_retrieval.ts and
 * scripts/compare_upanishads_retrieval.ts can prove quality improvement
 * before any cutover (plan step 3), and the score thresholds below are
 * placeholders pending step 4's empirical re-tuning against real dense-score
 * distributions, not the TF-IDF-tuned 0.4/0.1 values the sparse retrievers
 * above use -- dense cosine scores have a different distribution shape.
 */
export class PramanaDenseEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaManifestRetriever;
  private indexPath: string;
  private sourceName: string;
  private tradition: string;
  private indexData: any = null;

  constructor(fallbackRetriever: PramanaManifestRetriever, indexPath: string, sourceName: string, tradition: string) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = indexPath;
    this.sourceName = sourceName;
    this.tradition = tradition;
  }

  private loadIndex() {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      this.indexData = JSON.parse(data);
      return this.indexData;
    } catch {
      return null;
    }
  }

  private static cosine(a: number[], b: number[]): number {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot; // both vectors are already L2-normalized at embed time
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    if (!queryText) {
      return { documents: [] };
    }

    const { embedQuery } = await import('./embedding-model');
    const queryVector = await embedQuery(queryText);

    const docsWithScores: Array<{ doc: any; score: number }> = [];
    for (const doc of index.documents) {
      const score = PramanaDenseEmbeddingRetriever.cosine(queryVector, doc.vector);
      if (score > 0) {
        docsWithScores.push({ doc, score });
      }
    }

    if (docsWithScores.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const augmentedDocs: Array<{ doc: any; score: number }> = [];

    const topDocItem = docsWithScores[0];
    augmentedDocs.push(topDocItem);

    // Neighbor splice, guarded by doc id so a multi-book corpus (Upanishads)
    // never pulls in a different book's adjacent verse. Threshold re-tuned
    // (plan step 4) against real dense-score data: off-topic negative
    // controls ("capital of France", "chocolate cake recipe") topped out
    // at ~0.21 across both corpora, while confidently-correct top-1 hits on
    // real natural-language/paraphrase queries (e.g. "give up everything
    // and surrender to God" -> Gita 18.66) consistently scored >=0.54. 0.5
    // sits just below that cluster with a wide margin above the noise
    // floor, so splicing only fires when the top result is a genuine,
    // confident match worth pulling surrounding verses for -- not a
    // TF-IDF-derived guess ported over unchanged.
    if (topDocItem.score >= 0.5) {
      const topDoc = topDocItem.doc;
      const refParts = String(topDoc.ref).split('.');
      if (refParts.length >= 2) {
        const ch = parseInt(refParts[0], 10);
        const v = parseInt(refParts[1], 10);
        const prevRef = `${ch}.${v - 1}`;
        const nextRef = `${ch}.${v + 1}`;
        const sameDoc = (d: any) => (d.upanishad ?? d.chapter) === (topDoc.upanishad ?? topDoc.chapter);

        const prevDoc = index.documents.find((d: any) => d.ref === prevRef && sameDoc(d));
        const nextDoc = index.documents.find((d: any) => d.ref === nextRef && sameDoc(d));

        if (prevDoc) augmentedDocs.push({ doc: prevDoc, score: topDocItem.score - 0.1 });
        if (nextDoc) augmentedDocs.push({ doc: nextDoc, score: topDocItem.score - 0.12 });
      }
    }

    // Tail inclusion. Re-tuned (plan step 4) from a 0.3 placeholder to 0.35:
    // same real-data analysis showed the negative-control noise ceiling at
    // ~0.21, so 0.3 left only ~0.09 of margin. 0.35 keeps a full topically-
    // related cluster (e.g. multiple duty/action verses for a karma-yoga
    // paraphrase query, several scoring 0.4-0.55) while adding real headroom
    // above pure noise.
    for (const item of docsWithScores.slice(1)) {
      if (!augmentedDocs.some((x) => x.doc.id === item.doc.id) && item.score >= 0.35) {
        augmentedDocs.push(item);
      }
    }

    const topDocs = augmentedDocs.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      const textContent = [
        doc.sanskrit ? `Sanskrit: ${doc.sanskrit}` : '',
        doc.transliteration ? `Transliteration: ${doc.transliteration}` : '',
        doc.text ? `Translation: ${doc.text}` : ''
      ].filter(Boolean).join('\n');

      return {
        id: doc.id,
        content: textContent,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.id.split('_').slice(0, -1).join('_'),
          tradition: this.tradition,
          sourceName: this.sourceName,
          sourceClass: 'scripture',
          rightsStatus: 'public_domain'
        }
      };
    });

    return {
      documents,
      provider: 'dense-embedding-index'
    };
  }
}

PramanaRetrieverSelector.register('pathshala_gita_dense', new PramanaDenseEmbeddingRetriever(
  gitaManifestRetriever,
  path.join(process.cwd(), 'python/ai_pipeline/corpus/gita_index_dense.json'),
  'Bhagavad Gita',
  'Sanatana Dharma'
));
PramanaRetrieverSelector.register('pathshala_upanishads_dense', new PramanaDenseEmbeddingRetriever(
  upanishadsManifestRetriever,
  path.join(process.cwd(), 'python/ai_pipeline/corpus/upanishads_index_dense.json'),
  'Upanishads',
  'Sanatana Dharma'
));

PramanaRetrieverSelector.register('bhakti_katha', new PramanaManifestRetriever({
  prefix: 'katha_chapter',
  sourceName: 'Puranic Katha',
  sourceClass: 'narrative',
  tradition: 'Bhakti',
  maxChapters: 5
}));

PramanaRetrieverSelector.register('bhakti_panchatantra', new PramanaManifestRetriever({
  prefix: 'panchatantra_chapter',
  sourceName: 'Panchatantra',
  sourceClass: 'narrative',
  tradition: 'Moral',
  // Bumped from 5 to 10 during the full-82-story canonical coverage expansion (2026-07-23):
  // chapter_6.json (Book IV completion) pushed the corpus past the original 5-file cap.
  // Books III and I remain to be added and will likely need 2 more files each given their size.
  maxChapters: 10
}));

export class PramanaGurbaniEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaManifestRetriever;
  private indexPath: string;
  private indexData: any = null;

  constructor(fallbackRetriever: PramanaManifestRetriever) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/gurbani_index.json');
  }

  private loadIndex() {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      this.indexData = JSON.parse(data);
      return this.indexData;
    } catch {
      return null;
    }
  }

  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    if (!queryText) {
      return { documents: [] };
    }

    const tokens = this.tokenize(queryText);
    if (tokens.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    const tf: Record<string, number> = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }

    const queryVector: Record<string, number> = {};
    let sumSq = 0;
    for (const t in tf) {
      const idf = index.idf[t] || 0;
      if (idf > 0) {
        const tfidf = tf[t] * idf;
        queryVector[t] = tfidf;
        sumSq += tfidf * tfidf;
      }
    }

    const queryNorm = Math.sqrt(sumSq);
    if (queryNorm === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryUnitVector: Record<string, number> = {};
    for (const t in queryVector) {
      queryUnitVector[t] = queryVector[t] / queryNorm;
    }

    const docsWithScores: Array<{ doc: any; score: number }> = [];
    for (const doc of index.documents) {
      let score = 0;
      for (const t in queryUnitVector) {
        if (doc.vector[t]) {
          score += queryUnitVector[t] * doc.vector[t];
        }
      }

      if (score > 0) {
        docsWithScores.push({ doc, score });
      }
    }

    if (docsWithScores.length === 0) {
      return this.fallbackRetriever.retrieve(query);
    }

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const augmentedDocs: Array<{ doc: any; score: number }> = [];

    if (docsWithScores.length > 0) {
      const topDocItem = docsWithScores[0];
      augmentedDocs.push(topDocItem);

      if (topDocItem.score >= 0.3) {
        const topDoc = topDocItem.doc;
        const refParts = topDoc.ref.split('.');
        if (refParts.length === 2) {
          const ch = parseInt(refParts[0], 10);
          const v = parseInt(refParts[1], 10);

          const prevRef = `${ch}.${v - 1}`;
          const nextRef = `${ch}.${v + 1}`;

          const prevDoc = index.documents.find((d: any) => d.ref === prevRef);
          const nextDoc = index.documents.find((d: any) => d.ref === nextRef);

          if (prevDoc) {
            augmentedDocs.push({ doc: prevDoc, score: topDocItem.score - 0.1 });
          }
          if (nextDoc) {
            augmentedDocs.push({ doc: nextDoc, score: topDocItem.score - 0.12 });
          }
        }
      }

      for (const item of docsWithScores.slice(1)) {
        if (!augmentedDocs.some(x => x.doc.id === item.doc.id)) {
          if (item.score >= 0.1) {
            augmentedDocs.push(item);
          }
        }
      }
    }

    const topDocs = augmentedDocs.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      const textContent = [
        doc.original ? `Original: ${doc.original}` : '',
        doc.transliteration ? `Transliteration: ${doc.transliteration}` : '',
        doc.text ? `Translation: ${doc.text}` : ''
      ].filter(Boolean).join('\n');

      return {
        id: doc.id,
        content: textContent,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.id.split('_').slice(0, -1).join('_'),
          tradition: 'Sikhi',
          sourceName: 'Sri Guru Granth Sahib Ji',
          sourceClass: 'scripture',
          rightsStatus: 'public_domain'
        }
      };
    });

    return {
      documents,
      provider: 'embedding-index'
    };
  }
}

const gurbaniManifestRetriever = new PramanaManifestRetriever({
  prefix: 'sikh_gurbani',
  sourceName: 'Sri Guru Granth Sahib Ji',
  sourceClass: 'scripture',
  tradition: 'Sikhi',
  maxChapters: 0,
  fileNames: [
    'sikh_gurbani_japji.json',
    'sikh_gurbani_anand_sahib.json',
    'sikh_gurbani_rehras_sahib.json'
  ]
});

PramanaRetrieverSelector.register('sikh_gurbani', new PramanaGurbaniEmbeddingRetriever(gurbaniManifestRetriever));

export class PramanaGenericEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaRetriever<RetrievalChunkMetadata>;
  private indexPath: string;
  private tradition: string;
  private sourceName: string;
  private indexData: any = null;

  constructor(fallbackRetriever: PramanaRetriever<RetrievalChunkMetadata>, indexPath: string, tradition: string, sourceName: string) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = indexPath;
    this.tradition = tradition;
    this.sourceName = sourceName;
  }

  private loadIndex() {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      this.indexData = JSON.parse(data);
      return this.indexData;
    } catch {
      return null;
    }
  }

  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    if (!queryText) return { documents: [] };

    const tokens = this.tokenize(queryText);
    if (tokens.length === 0) return this.fallbackRetriever.retrieve(query);

    const tf: Record<string, number> = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }

    const queryVector: Record<string, number> = {};
    let sumSq = 0;
    for (const t in tf) {
      const idf = index.idf[t] || 0;
      if (idf > 0) {
        const tfidf = tf[t] * idf;
        queryVector[t] = tfidf;
        sumSq += tfidf * tfidf;
      }
    }

    const queryNorm = Math.sqrt(sumSq);
    if (queryNorm === 0) return this.fallbackRetriever.retrieve(query);

    const queryUnitVector: Record<string, number> = {};
    for (const t in queryVector) {
      queryUnitVector[t] = queryVector[t] / queryNorm;
    }

    const docsWithScores: Array<{ doc: any; score: number }> = [];
    for (const doc of index.documents) {
      let score = 0;
      for (const t in queryUnitVector) {
        if (doc.vector[t]) score += queryUnitVector[t] * doc.vector[t];
      }
      if (score > 0) docsWithScores.push({ doc, score });
    }

    if (docsWithScores.length === 0) return this.fallbackRetriever.retrieve(query);

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const augmentedDocs: Array<{ doc: any; score: number }> = [];

    if (docsWithScores.length > 0) {
      const topDocItem = docsWithScores[0];
      augmentedDocs.push(topDocItem);

      if (topDocItem.score >= 0.3) {
        const topDoc = topDocItem.doc;
        const refParts = topDoc.ref.split('.');
        if (refParts.length >= 2) {
          const ch = parseInt(refParts[0], 10);
          const v = parseInt(refParts[1], 10);

          const prevRef = `${ch}.${v - 1}`;
          const nextRef = `${ch}.${v + 1}`;

          const prevDoc = index.documents.find((d: any) => d.ref === prevRef);
          const nextDoc = index.documents.find((d: any) => d.ref === nextRef);

          if (prevDoc) augmentedDocs.push({ doc: prevDoc, score: topDocItem.score - 0.1 });
          if (nextDoc) augmentedDocs.push({ doc: nextDoc, score: topDocItem.score - 0.12 });
        }
      }

      for (const item of docsWithScores.slice(1)) {
        if (!augmentedDocs.some(x => x.doc.id === item.doc.id)) {
          if (item.score >= 0.1) augmentedDocs.push(item);
        }
      }
    }

    const topDocs = augmentedDocs.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      const textContent = [
        doc.sanskrit ? `Sanskrit: ${doc.sanskrit}` : doc.original ? `Original: ${doc.original}` : '',
        doc.transliteration ? `Transliteration: ${doc.transliteration}` : '',
        doc.text ? `Translation: ${doc.text}` : ''
      ].filter(Boolean).join('\n');

      return {
        id: doc.id,
        content: textContent,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.id.split('_').slice(0, -1).join('_'),
          tradition: this.tradition,
          sourceName: doc.source_name || index.metadata?.source_name || this.sourceName,
          sourceClass: doc.source_class || index.metadata?.source_class || 'scripture',
          rightsStatus: doc.rights_status || index.metadata?.rights_status || 'public_domain'
        }
      };
    });

    return { documents, provider: 'embedding-index' };
  }
}

const buddhistManifestRetriever = new PramanaManifestRetriever({
  prefix: 'buddhist_dhamma',
  sourceName: 'Buddhist Dhamma Texts',
  sourceClass: 'scripture',
  tradition: 'Buddhism',
  maxChapters: 1
});
PramanaRetrieverSelector.register('buddhist_dhamma', new PramanaGenericEmbeddingRetriever(
  buddhistManifestRetriever,
  path.join(process.cwd(), 'python/ai_pipeline/corpus/buddhist_dhamma_index.json'),
  'Buddhism',
  'Buddhist Dhamma Texts'
));

const jainManifestRetriever = new PramanaManifestRetriever({
  prefix: 'jain_dharma',
  sourceName: 'Jain Dharma Agamas',
  sourceClass: 'scripture',
  tradition: 'Jainism',
  maxChapters: 0,
  fileNames: [
    'jain_dharma.json',
    'jain_kalpa_sutra.json',
    'jain_tattvartha_sutra.json'
  ]
});
PramanaRetrieverSelector.register('jain_dharma', new PramanaGenericEmbeddingRetriever(
  jainManifestRetriever,
  path.join(process.cwd(), 'python/ai_pipeline/corpus/jain_dharma_index.json'),
  'Jainism',
  'Jain Dharma Agamas'
));

const ramayanaManifestRetriever = new PramanaManifestRetriever({
  prefix: 'valmiki_ramayana',
  sourceName: 'Valmiki Ramayana',
  sourceClass: 'curated_lesson',
  tradition: 'Sanatana Dharma',
  maxChapters: 0,
  fileNames: [
    'valmiki_ramayana_bala.json',
    'valmiki_ramayana_ayodhya.json',
    'valmiki_ramayana_aranya.json',
    'valmiki_ramayana_kishkindha.json',
    'valmiki_ramayana_sundara.json',
    'valmiki_ramayana_yuddha.json'
  ]
});
PramanaRetrieverSelector.register('valmiki_ramayana', new PramanaGenericEmbeddingRetriever(
  ramayanaManifestRetriever,
  path.join(process.cwd(), 'python/ai_pipeline/corpus/valmiki_ramayana_index.json'),
  'Sanatana Dharma',
  'Valmiki Ramayana'
));

export async function retrievePathshalaContext(input: {
  source?: string;
  title?: string;
  tradition?: string | null;
  corpus?: string | null;
}): Promise<RetrievalChunk[]> {
  const selector = new SimpleCorpusSelector();
  const corpusId = input.corpus || selector.selectCorpus(
    `${input.title ?? ''} ${input.source ?? ''}`.trim(),
    {
      source: input.source || null,
      title: input.title || null,
      tradition: input.tradition || null,
    }
  );

  if (corpusId === 'valmiki_ramayana') {
    // Registered and explicit-only
  }

  const start = Date.now();
  const retriever = PramanaRetrieverSelector.select(corpusId);
  const res = await retriever.retrieve({
    text: `${input.title ?? ''} ${input.source ?? ''}`.trim(),
    filters: {
      source: input.source || null,
      title: input.title || null,
      tradition: input.tradition || null,
      corpus: corpusId || null,
    }
  });
  const documents = res.documents as RetrievalChunk[];

  // The one shared instrumentation point for both the chat and Pathshala-
  // explain paths (both call this function). Neither the Ramayana ranking
  // bug (near-tied top scores from a tokenizer mismatch) nor the Buddhist/
  // Jain mislabeling (missing rightsStatus) left any trace here before this
  // -- there was no way to notice either in production short of manually
  // re-deriving them, which is how both were actually found. top_score and
  // pending_source are exactly the two signals that would have surfaced them.
  emitEvent({
    severity: 'P3',
    domain: 'ai',
    route: 'ai/retrieval/pathshala_context',
    provider: res.provider,
    latency_ms: Date.now() - start,
    context: {
      corpus: corpusId,
      explicit_corpus: input.corpus != null,
      chunks_count: documents.length,
      top_score: documents[0]?.score ?? null,
      pending_source: hasPendingSourceContent(documents),
    },
  });

  return documents;
}


const dharamVeerManifestRetriever = new PramanaManifestRetriever({
  prefix: 'dharam_veer',
  manifestsDir: path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests/dharam_veer'),
  sourceName: 'Dharam Veer',
  sourceClass: 'narrative',
  tradition: 'Dharmic',
  maxChapters: 0,
  fileNames: [
    'dharam_veer_guru_gobind_singh.json',
    'dharam_veer_shivaji.json',
    'dharam_veer_bhishma.json',
    'dharam_veer_arjuna.json',
    'dharam_veer_lord_mahavira.json',
    'dharam_veer_guru_nanak_dev.json',
    'dharam_veer_guru_tegh_bahadur.json',
    'dharam_veer_siddhartha_gautama.json',
    'dharam_veer_ananda.json',
    'dharam_veer_emperor_ashoka.json',
    'dharam_veer_parshvanatha.json',
    'dharam_veer_harishchandra.json',
    'dharam_veer_chanakya.json',
    // Batch (2026-07-23): verified public-domain sources added, see
    // docs/DHARAM_VEER_COVERAGE_AUDIT.md for source/rights table.
    'dharam_veer_guru_arjan_dev.json',
    'dharam_veer_maharana_pratap.json',
    'dharam_veer_rani_lakshmibai.json',
    'dharam_veer_milinda.json',
    'dharam_veer_prahlad.json',
    'dharam_veer_dhruv.json',
    'dharam_veer_xuanzang.json',
    'dharam_veer_swami_vivekananda.json',
    'dharam_veer_sri_rama.json',
    'dharam_veer_hanuman.json',
    'dharam_veer_shabari.json',
    'dharam_veer_valmiki.json',
    'dharam_veer_sri_krishna.json',
    'dharam_veer_tulsidas.json',
    'dharam_veer_tukaram.json',
    'dharam_veer_ramakrishna.json',
    'dharam_veer_kabir.json',
    'dharam_veer_rishabhanatha.json',
    'dharam_veer_gautama_swami.json',
    'dharam_veer_mahapajapati_gotami.json',
    'dharam_veer_sariputta.json',
    'dharam_veer_moggallana.json',
    'dharam_veer_savitri.json',
    'dharam_veer_sanghamitra.json',
    'dharam_veer_bodhidharma.json',
    'dharam_veer_ramanujacharya.json'
  ]
});

export class PramanaDharamVeerEmbeddingRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private fallbackRetriever: PramanaManifestRetriever;
  private indexPath: string;
  private indexData: DharamVeerIndexData | null = null;

  constructor(fallbackRetriever: PramanaManifestRetriever) {
    this.fallbackRetriever = fallbackRetriever;
    this.indexPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/dharam_veer_index.json');
  }

  private loadIndex(): DharamVeerIndexData | null {
    if (this.indexData) return this.indexData;
    if (!fs.existsSync(this.indexPath)) return null;
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;
      if (!isDharamVeerIndexData(parsed)) return null;
      this.indexData = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  private tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const index = this.loadIndex();
    if (!index) {
      return this.fallbackRetriever.retrieve(query);
    }

    const queryText = query.text.trim();
    const reqTitle = (query.filters?.title as string || '').toLowerCase(); // expected figure_id
    // Production figure_id values (src/lib/data/dharm-veers/*.ts) are hyphenated
    // (e.g. "guru-arjan-dev"), and the established convention in this corpus's
    // manifest `doc_id` field is to mirror that exactly with hyphens (see e.g.
    // dharam_veer_guru_gobind_singh.json, whose doc_id is "dharam_veer_guru-gobind-singh"
    // despite its underscored *filename*). Manifest filenames are always
    // underscored for filesystem-friendliness and are unrelated to this match.
    // This normalization is defensive: it also accepts an underscored doc_id
    // (dharam_veer_${reqTitle_with_underscores}) so a manifest author who
    // mistakenly uses underscores in doc_id (as an earlier draft of the
    // 2026-07-23 batch's guru-arjan-dev/maharana-pratap/rani-lakshmibai
    // manifests briefly did, before being corrected to match convention) still
    // resolves correctly rather than silently falling through to the
    // "unsupported hero" fallback.
    const reqTitleNormalized = reqTitle.replace(/-/g, '_');

    const docsWithScores: Array<{ doc: DharamVeerIndexDocument; score: number }> = [];

    // For Dharam Veer, we just want to retrieve the passages specific to the requested figure (if specified)
    // or fallback to similarity search. Since it's an "ask more" feature, reqTitle is highly specific.
    for (const doc of index.documents) {
      let score = 0;

      const docId = (doc.doc_id || '').toLowerCase();
      if (reqTitle) {
          if (
            docId === reqTitle ||
            docId === `dharam_veer_${reqTitle}` ||
            docId === reqTitleNormalized ||
            docId === `dharam_veer_${reqTitleNormalized}`
          ) {
              score += 2.0; // high boost for exact figure match
          }
      }

      if (score > 0) {
        docsWithScores.push({ doc, score });
      }
    }

    // fallback to normal keyword-similarity query ONLY when no specific figure was requested.
    // If a figure_id (reqTitle) WAS requested but matched no document, we must return empty here
    // rather than silently searching across every other hero's content by keyword overlap - that
    // would leak an unrelated hero's material under a different figure's name and defeat the
    // "not enough approved source material" safe-fallback contract in src/app/api/ai/chat/route.ts.
    if (docsWithScores.length === 0 && queryText && !reqTitle) {
        const tokens = this.tokenize(queryText);
        if (tokens.length > 0) {
            const tf: Record<string, number> = {};
            for (const t of tokens) {
              tf[t] = (tf[t] || 0) + 1;
            }

            const queryVector: Record<string, number> = {};
            let sumSq = 0;
            for (const t in tf) {
              const idf = index.idf[t] || 0;
              if (idf > 0) {
                const tfidf = tf[t] * idf;
                queryVector[t] = tfidf;
                sumSq += tfidf * tfidf;
              }
            }

            const queryNorm = Math.sqrt(sumSq);
            if (queryNorm > 0) {
                const queryUnitVector: Record<string, number> = {};
                for (const t in queryVector) {
                  queryUnitVector[t] = queryVector[t] / queryNorm;
                }

                for (const doc of index.documents) {
                  let score = 0;
                  for (const t in queryUnitVector) {
                    if (doc.vector[t]) {
                      score += queryUnitVector[t] * doc.vector[t];
                    }
                  }
                  if (score > 0) {
                    docsWithScores.push({ doc, score });
                  }
                }
            }
        }
    }

    if (docsWithScores.length === 0) {
      return { documents: [] };
    }

    docsWithScores.sort((a, b) => b.score - a.score);

    const limit = query.topK || 5;
    const topDocs = docsWithScores.slice(0, limit);

    const documents: RetrievalChunk[] = topDocs.map((item) => {
      const doc = item.doc;
      return {
        id: doc.id,
        content: doc.text,
        score: item.score,
        metadata: {
          chunkId: doc.ref,
          docId: doc.doc_id,
          tradition: doc.tradition || 'Dharmic',
          sourceName: doc.source_name || 'Dharam Veer',
          sourceClass: doc.source_class || 'narrative',
          rightsStatus: doc.rights_status || 'restricted_or_pending' // do not assume public_domain unverified
        }
      };
    });

    return {
      documents,
      provider: 'embedding-index'
    };
  }
}

PramanaRetrieverSelector.register('dharam_veer_reflection', new PramanaDharamVeerEmbeddingRetriever(dharamVeerManifestRetriever));
export const dharamVeerRetriever = new PramanaDharamVeerEmbeddingRetriever(dharamVeerManifestRetriever);

// ─── Festival Rules Retriever (calendar-grounded RAG) ──────────────────────
//
// Unlike the scripture retrievers above, this indexes structured, small
// (under 100 rows) JSON directly -- packages/dharma-rules/src/festivals/
// rules.json -- plus the source manifests under docs/sources/. No offline
// embedding pipeline: the corpus is small enough to tokenize and TF-IDF
// vectorize in-memory on first use, cached for the process lifetime. This
// grounds calendar/festival "why is X on this date" questions in the same
// citations the engine itself is governed by (source-governance.md tiers),
// instead of the model guessing from training data.

interface FestivalRuleChunk {
  id: string;
  content: string;
  /** Festival name only (e.g. "Karva Chauth"), used to boost title-term
   *  weight at index time -- see TITLE_BOOST_REPEATS below. Undefined for
   *  non-rule chunks (source manifests), which have no equivalent title. */
  title?: string;
  tradition?: string;
  sourceName: string;
  sourceClass: string;
}

// A rule's `ratification_note` can run over a thousand characters of shared
// governance/methodology prose (citation tiers, profile-validation status,
// etc.) that recurs across many rules. Plain TF-IDF L2-normalizes the whole
// chunk, so a long note dilutes an otherwise exact display_name match --
// verified directly: "karva chauth" scored below two unrelated rules whose
// shorter chunks happened to share other query tokens. Standard IR fix:
// weight the title field higher than body text (how real search engines
// treat a document title vs. its body) by repeating title tokens at index
// time only -- the returned `content` stays the original, undupli­cated text.
const TITLE_BOOST_REPEATS = 4;

// Common English function words. Without filtering these, a nonsense query
// sharing only stopwords with the corpus (e.g. "what is the best X in Y")
// still produces a nonzero cosine score against nearly every chunk, since
// stopwords appear in almost all English prose -- IDF smoothing alone
// isn't enough to zero them out. Verified directly: without this filter,
// an out-of-corpus query returned 3 spurious matches instead of 0.
const RETRIEVAL_STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'this', 'that', 'these', 'those', 'it', 'its', 'of', 'in', 'on', 'at',
  'to', 'for', 'and', 'or', 'but', 'not', 'no', 'do', 'does', 'did',
  'what', 'why', 'how', 'when', 'where', 'who', 'which', 'with', 'by',
  'from', 'as', 'if', 'so', 'than', 'then', 'there', 'here', 'i', 'you',
  'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their',
  'about', 'into', 'over', 'under', 'again', 'further', 'can', 'will',
  'just', 'should', 'now', 'have', 'has', 'had', 'me', 'us', 'them',
]);

export class PramanaFestivalRulesRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private chunks: FestivalRuleChunk[] | null = null;
  private idf: Record<string, number> | null = null;
  private docVectors: Map<string, SparseVector> | null = null;

  private tokenize(text: string): string[] {
    const raw = text.toLowerCase().match(/[a-z0-9]+/g) || [];
    return raw.filter((t) => !RETRIEVAL_STOPWORDS.has(t) && t.length > 1);
  }

  private loadChunks(): FestivalRuleChunk[] {
    if (this.chunks) return this.chunks;
    const chunks: FestivalRuleChunk[] = [];

    const rulesPath = path.join(process.cwd(), 'packages/dharma-rules/src/festivals/rules.json');
    try {
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      if (Array.isArray(rules)) {
        for (const rule of rules) {
          if (!isRecord(rule) || typeof rule.slug !== 'string') continue;
          const variantSuffix = typeof rule.variant_key === 'string' ? `_${rule.variant_key}`
            : typeof rule.sampradaya === 'string' ? `_${rule.sampradaya}` : '';
          const parts = [
            typeof rule.display_name === 'string' ? rule.display_name : '',
            typeof rule.description === 'string' ? rule.description : '',
            typeof rule.tradition === 'string' ? `Tradition: ${rule.tradition}` : '',
            typeof rule.citation === 'string' ? `Citation: ${rule.citation}` : '',
            typeof rule.ratification_note === 'string' ? `Ratification note: ${rule.ratification_note}` : '',
          ].filter(Boolean);
          if (parts.length === 0) continue;
          chunks.push({
            id: `rule_${rule.slug}${variantSuffix}`,
            content: parts.join('. '),
            title: typeof rule.display_name === 'string' ? rule.display_name : undefined,
            tradition: typeof rule.tradition === 'string' ? rule.tradition : undefined,
            sourceName: 'rules.json',
            sourceClass: 'calendar_rule',
          });
        }
      }
    } catch {
      // Fail closed -- no fabricated content if rules.json is unreadable.
    }

    const manifestsDir = path.join(process.cwd(), 'docs/sources');
    try {
      if (fs.existsSync(manifestsDir)) {
        for (const fn of fs.readdirSync(manifestsDir)) {
          if (!fn.endsWith('.md')) continue;
          try {
            chunks.push({
              id: `manifest_${fn}`,
              content: fs.readFileSync(path.join(manifestsDir, fn), 'utf-8'),
              sourceName: fn,
              sourceClass: 'source_manifest',
            });
          } catch {
            // skip unreadable manifest, do not fabricate
          }
        }
      }
    } catch {
      // manifests directory missing -- rules.json chunks alone still work
    }

    this.chunks = chunks;
    return chunks;
  }

  /** Tokens used for indexing/scoring -- content tokens plus title tokens
   *  repeated TITLE_BOOST_REPEATS times, so an exact festival-name match
   *  isn't drowned out by a long shared-boilerplate ratification_note. */
  private indexTokensFor(chunk: FestivalRuleChunk): string[] {
    const tokens = this.tokenize(chunk.content);
    if (chunk.title) {
      const titleTokens = this.tokenize(chunk.title);
      for (let i = 0; i < TITLE_BOOST_REPEATS; i++) tokens.push(...titleTokens);
    }
    return tokens;
  }

  private buildIndex() {
    if (this.idf && this.docVectors) return;
    const chunks = this.loadChunks();
    const df: Record<string, number> = {};
    const chunkTokens = new Map<string, string[]>();

    for (const chunk of chunks) {
      const tokens = this.indexTokensFor(chunk);
      chunkTokens.set(chunk.id, tokens);
      for (const t of new Set(tokens)) df[t] = (df[t] || 0) + 1;
    }

    const N = chunks.length || 1;
    const idf: Record<string, number> = {};
    for (const t in df) idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1;

    const docVectors = new Map<string, SparseVector>();
    for (const chunk of chunks) {
      const tokens = chunkTokens.get(chunk.id) || [];
      const tf: Record<string, number> = {};
      for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
      const vec: SparseVector = {};
      let sumSq = 0;
      for (const t in tf) {
        const w = tf[t] * (idf[t] || 0);
        vec[t] = w;
        sumSq += w * w;
      }
      const norm = Math.sqrt(sumSq) || 1;
      for (const t in vec) vec[t] = vec[t] / norm;
      docVectors.set(chunk.id, vec);
    }

    this.idf = idf;
    this.docVectors = docVectors;
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    this.buildIndex();
    const chunks = this.chunks || [];
    const idf = this.idf || {};
    const docVectors = this.docVectors || new Map<string, SparseVector>();

    const queryText = query.text.trim();
    if (!queryText || chunks.length === 0) return { documents: [] };

    const tokens = this.tokenize(queryText);
    if (tokens.length === 0) return { documents: [] };

    const tf: Record<string, number> = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;

    const queryVec: SparseVector = {};
    let sumSq = 0;
    for (const t in tf) {
      const w = tf[t] * (idf[t] || 0);
      if (w > 0) { queryVec[t] = w; sumSq += w * w; }
    }
    const qNorm = Math.sqrt(sumSq);
    if (qNorm === 0) return { documents: [] };
    for (const t in queryVec) queryVec[t] = queryVec[t] / qNorm;

    const scored: Array<{ chunk: FestivalRuleChunk; score: number }> = [];
    for (const chunk of chunks) {
      const vec = docVectors.get(chunk.id);
      if (!vec) continue;
      let score = 0;
      for (const t in queryVec) {
        if (vec[t]) score += queryVec[t] * vec[t];
      }
      if (score > 0) scored.push({ chunk, score });
    }

    // Fail closed: a nonzero-but-weak overlap is not real grounding -- see
    // route.ts's "not enough approved source material" fallback, same
    // policy already used for dharam_veer_reflection above.
    const RELEVANCE_THRESHOLD = 0.12;
    const relevant = scored.filter((s) => s.score >= RELEVANCE_THRESHOLD);
    if (relevant.length === 0) return { documents: [] };

    relevant.sort((a, b) => b.score - a.score);
    const top = relevant.slice(0, query.topK || 5);

    const documents: RetrievalChunk[] = top.map(({ chunk, score }) => ({
      id: chunk.id,
      content: chunk.content,
      score,
      metadata: {
        chunkId: chunk.id,
        docId: chunk.id,
        tradition: chunk.tradition ?? null,
        sourceName: chunk.sourceName,
        sourceClass: chunk.sourceClass,
        rightsStatus: 'internal_governed',
      },
    }));

    return { documents, provider: 'festival-rules-tfidf' };
  }
}

export const festivalRulesRetriever = new PramanaFestivalRulesRetriever();
PramanaRetrieverSelector.register('calendar_festival_rules', festivalRulesRetriever);
