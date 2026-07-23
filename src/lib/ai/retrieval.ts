import fs from 'fs';
import path from 'path';
import type { PramanaRetrievalDocument, PramanaRetriever, PramanaRetrievalQuery, PramanaRetrievalResult } from '@sangam/pramana-serve';

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

import { PramanaRetrieverSelector, SimpleCorpusSelector } from '@sangam/pramana-serve';

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
    if (!fs.existsSync(filePath)) return null;
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
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
  return res.documents as RetrievalChunk[];
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
    'dharam_veer_rani_lakshmibai.json'
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
