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

export class PathshalaManifestRetriever implements PramanaRetriever<RetrievalChunkMetadata> {
  private manifestsDir: string;

  constructor() {
    this.manifestsDir = path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests');
  }

  private loadManifest(chapterNum: number): any | null {
    const filePath = path.join(this.manifestsDir, `gita_chapter_${chapterNum}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private parseChapterVerse(queryText: string): { chapter: number; verse: number } | null {
    // Matches patterns like "2.47", "2:47", "chapter 2 verse 47", "Gita 2, 47"
    const match = queryText.match(/(?:chapter\s+)?(\d+)[.:,\s]+(\d+)/i);
    if (match) {
      const chapter = parseInt(match[1], 10);
      const verse = parseInt(match[2], 10);
      if (chapter >= 1 && chapter <= 18 && verse >= 1) {
        return { chapter, verse };
      }
    }
    return null;
  }

  async retrieve(query: PramanaRetrievalQuery): Promise<PramanaRetrievalResult<RetrievalChunkMetadata>> {
    const queryText = query.text.trim();
    if (!queryText) {
      return { documents: [] };
    }

    const cv = this.parseChapterVerse(queryText);
    const documents: RetrievalChunk[] = [];

    if (cv) {
      // 1. Direct Verse Matching with Window Context
      const manifest = this.loadManifest(cv.chapter);
      if (manifest && manifest.content) {
        const verses = manifest.content;
        const targetRef = `${cv.chapter}.${cv.verse}`;
        const targetIdx = verses.findIndex((v: any) => v.ref === targetRef);

        if (targetIdx !== -1) {
          // Grab target verse and its neighbors (window size of 1 on each side)
          const startIdx = Math.max(0, targetIdx - 1);
          const endIdx = Math.min(verses.length - 1, targetIdx + 1);

          for (let i = startIdx; i <= endIdx; i++) {
            const v = verses[i];
            const isTarget = i === targetIdx;
            
            // Build text context containing Sanskrit, Transliteration, and translation
            const textContent = [
              v.sanskrit ? `Sanskrit: ${v.sanskrit}` : '',
              v.transliteration ? `Transliteration: ${v.transliteration}` : '',
              v.text ? `Translation: ${v.text}` : ''
            ].filter(Boolean).join('\n');

            documents.push({
              id: `${manifest.doc_id}_${v.ref}`,
              content: textContent,
              score: isTarget ? 1.0 : 0.8, // exact match has higher score
              metadata: {
                chunkId: v.ref,
                docId: manifest.doc_id,
                tradition: manifest.tradition,
                sourceName: manifest.source_name,
                sourceClass: manifest.source_class,
                rightsStatus: manifest.rights_status,
              }
            });
          }
        }
      }
    } else {
      // 2. Keyword/Fallback Fallback Search across all chapters
      const terms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      
      if (terms.length > 0) {
        const matches: Array<{ chunk: RetrievalChunk; overlap: number }> = [];

        // Check chapters 1 to 18
        for (let ch = 1; ch <= 18; ch++) {
          const manifest = this.loadManifest(ch);
          if (!manifest || !manifest.content) continue;

          for (const v of manifest.content) {
            const contentHaystack = [
              v.text || '',
              v.sanskrit || '',
              v.transliteration || ''
            ].join(' ').toLowerCase();

            let score = 0;
            for (const term of terms) {
              if (contentHaystack.includes(term)) {
                score += 1.0;
              }
            }

            if (score > 0) {
              const textContent = [
                v.sanskrit ? `Sanskrit: ${v.sanskrit}` : '',
                v.transliteration ? `Transliteration: ${v.transliteration}` : '',
                v.text ? `Translation: ${v.text}` : ''
              ].filter(Boolean).join('\n');

              matches.push({
                chunk: {
                  id: `${manifest.doc_id}_${v.ref}`,
                  content: textContent,
                  score: score / terms.length, // normalized score
                  metadata: {
                    chunkId: v.ref,
                    docId: manifest.doc_id,
                    tradition: manifest.tradition,
                    sourceName: manifest.source_name,
                    sourceClass: manifest.source_class,
                    rightsStatus: manifest.rights_status,
                  }
                },
                overlap: score
              });
            }
          }
        }

        // Sort by overlap score descending, pick top 5
        matches.sort((a, b) => b.overlap - a.overlap);
        documents.push(...matches.slice(0, 5).map(m => m.chunk));
      }
    }

    return { documents };
  }
}

export async function retrievePathshalaContext(input: {
  source?: string;
  title?: string;
  tradition?: string | null;
}): Promise<RetrievalChunk[]> {
  const retriever = new PathshalaManifestRetriever();
  const res = await retriever.retrieve({
    text: `${input.title ?? ''} ${input.source ?? ''}`.trim(),
  });
  return res.documents as RetrievalChunk[];
}
