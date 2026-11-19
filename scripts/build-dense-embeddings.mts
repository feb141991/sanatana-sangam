/**
 * Builds real dense-embedding indexes for Gita and Upanishads, alongside
 * (never replacing) the existing sparse TF-IDF gita_index.json/
 * upanishads_index.json. Uses the exact model/library validated end-to-end
 * on real Vercel serverless infrastructure this session (Xenova/all-MiniLM-L6-v2
 * via @huggingface/transformers): cold start 1.8s, warm 13-114ms, correct
 * and deterministic 384-dim output.
 *
 * Deliberately done in Node, not Python, even though the existing sparse
 * builders live in python/ai_pipeline/ -- doc-time and query-time embedding
 * MUST use the identical model/runtime, or the two vector spaces are not
 * comparable. Query-time embedding (src/lib/ai/embedding-model.ts) runs in
 * the Next.js server, so building the index with the same
 * @huggingface/transformers call guarantees that consistency for free,
 * rather than needing to verify a separate Python (sentence-transformers/
 * PyTorch) pipeline produces numerically compatible vectors.
 *
 * Embedding input is NOT the sparse builders' "boosted metadata" hack
 * (reference tokens repeated 10x, a TF-IDF-specific trick to inflate term
 * frequency) -- that has no equivalent benefit for a dense sentence
 * embedding and would just dilute the actual semantic content with
 * boilerplate. Each verse is embedded as a short, natural sentence: which
 * scripture/book plus its actual text.
 *
 * Run: npx tsx scripts/build-dense-embeddings.mts
 */
import { pipeline } from '@huggingface/transformers';
import fs from 'node:fs';
import path from 'node:path';

const MANIFESTS_DIR = path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests');
const CORPUS_DIR = path.join(process.cwd(), 'python/ai_pipeline/corpus');
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;

type DenseDoc = {
  id: string;
  ref: string;
  chapter: number;
  upanishad?: string;
  bani?: string;
  sanskrit?: string;
  original?: string;
  transliteration?: string;
  story_title?: string;
  curated_lesson?: string;
  source_name?: string;
  source_class?: string;
  rights_status?: string;
  text: string;
  vector: number[];
};

// Vectors come from a float32 model (~7 significant decimal digits of real
// precision), but JS's default number-to-string serializes full float64
// text (e.g. -0.033902376890182495) -- 2-3x more bytes than the precision
// is worth. Rounding to 6 decimals cuts file size roughly in half with no
// measurable effect on cosine similarity at this vector magnitude.
function roundVec(vec: Float32Array): number[] {
  return Array.from(vec, (v) => Math.round(v * 1e6) / 1e6);
}

async function embedAll(embedder: any, inputs: { meta: Omit<DenseDoc, 'vector'>; text: string }[]): Promise<DenseDoc[]> {
  const out: DenseDoc[] = [];
  for (const { meta, text } of inputs) {
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    out.push({ ...meta, vector: roundVec(result.data as Float32Array) });
  }
  return out;
}

/**
 * The text a verse is embedded as: its meaning only. The "Bhagavad Gita 2.47." label,
 * the trailing "(47)" verse number and the "The Blessed Lord said:" speaker preamble say
 * nothing about what a verse means, and the model has to read past all three when it
 * matches a question like "how do I stop worrying about results". Measured on the 67 Gita
 * gold queries (44 of them written before this change was tried), together with the ranking
 * changes in retrieval.ts: top-1 34 -> 40, top-3 43 -> 52, top-5 49 -> 55, MRR 0.593 -> 0.687
 * versus embedding `Bhagavad Gita {ref}. {text}`; 16 queries improved and 2 slipped within
 * the top 3. Only the embedding input changes: the stored `text`, shown and cited to users,
 * is untouched.
 */
function gitaEmbeddingInput(text: string): string {
  return text
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/^The Blessed Lord said:\s*/i, '')
    .trim();
}

async function buildGita(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  let manifestCount = 0;

  for (let ch = 1; ch <= 18; ch++) {
    const manifestPath = path.join(MANIFESTS_DIR, `gita_chapter_${ch}.json`);
    if (!fs.existsSync(manifestPath)) continue;
    manifestCount++;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const docId = manifest.doc_id;

    for (const verse of manifest.content ?? []) {
      const ref: string = verse.ref ?? '';
      const sanskrit: string = verse.sanskrit ?? '';
      const transliteration: string = verse.transliteration ?? '';
      const text: string = verse.text ?? '';

      pending.push({
        meta: { id: `${docId}_${ref}`, ref, chapter: ch, sanskrit, transliteration, text },
        text: gitaEmbeddingInput(text),
      });
    }
  }

  console.log(`Gita: embedding ${pending.length} verses from ${manifestCount} chapters...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestCount,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildUpanishads(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR).filter((f) => f.startsWith('upanishad_') && f.endsWith('.json')).sort();

  for (const file of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');
    const sectionId = manifest.section_id ?? '';

    for (const verse of manifest.content ?? []) {
      const ref: string = verse.ref ?? '';
      const sanskrit: string = verse.sanskrit ?? '';
      const transliteration: string = verse.transliteration ?? '';
      const text: string = verse.text ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;

      pending.push({
        meta: { id: `${docId}_${ref}`, ref, chapter, upanishad: sectionId, sanskrit, transliteration, text },
        text: `${sectionId} Upanishad ${ref}. ${text}`,
      });
    }
  }

  console.log(`Upanishads: embedding ${pending.length} verses from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildGurbani(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR)
    .filter((f) => f.startsWith('sikh_gurbani_') && f.endsWith('.json'))
    .sort();

  for (const file of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');
    const sectionId = manifest.section_id ?? 'gurbani';
    const cleanTitle = (manifest.title ?? 'Gurbani').replace(/\s*\([^)]*\)/g, '').trim();

    for (const verse of manifest.content ?? []) {
      const ref: string = verse.ref ?? '';
      const original: string = verse.original ?? '';
      const transliteration: string = verse.transliteration ?? '';
      const text: string = verse.text ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;

      pending.push({
        meta: { id: `${docId}_${ref}`, ref, chapter, bani: sectionId, original, transliteration, text },
        text: `${cleanTitle} ${ref}. ${text.trim()}`,
      });
    }
  }

  console.log(`Gurbani: embedding ${pending.length} verses from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildBuddhist(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR)
    .filter((f) => f.startsWith('buddhist_') && f.endsWith('.json'))
    .sort();

  for (const file of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');

    for (const verse of manifest.content ?? []) {
      const ref: string = verse.ref ?? '';
      const sanskrit: string = verse.sanskrit ?? '';
      const transliteration: string = verse.transliteration ?? '';
      const text: string = verse.text ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;

      pending.push({
        meta: { id: `${docId}_${ref}`, ref, chapter, sanskrit, transliteration, text },
        text: `Dhammapada ${ref}. ${text.trim()}`,
      });
    }
  }

  console.log(`Buddhist Dhamma: embedding ${pending.length} verses from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildJain(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR)
    .filter((f) => f.startsWith('jain_') && f.endsWith('.json'))
    .sort();

  for (const file of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');
    const scriptureName = (manifest.title ?? (manifest.name ? 'Jain Agamas' : 'Jain Dharma')).replace(/\s*\([^)]*\)/g, '').trim();

    for (const verse of manifest.content ?? []) {
      const ref: string = verse.ref ?? '';
      const sanskrit: string = verse.sanskrit ?? verse.original ?? '';
      const original: string = verse.original ?? verse.sanskrit ?? '';
      const transliteration: string = verse.transliteration ?? '';
      const text: string = verse.text ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;

      pending.push({
        meta: { id: `${docId}_${ref}`, ref, chapter, sanskrit, original, transliteration, text },
        text: `${scriptureName} ${ref}. ${text.trim()}`,
      });
    }
  }

  console.log(`Jain Dharma: embedding ${pending.length} verses from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildKatha(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR)
    .filter((f) => f.startsWith('katha_chapter_') && f.endsWith('.json'))
    .sort();

  for (const file of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');

    for (const item of manifest.content ?? []) {
      const ref: string = item.ref ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;
      const title: string = item.story_title ?? '';
      const lesson: string = item.curated_lesson ?? '';
      const text: string = item.text ?? '';

      pending.push({
        meta: {
          id: `${docId}_${ref}`,
          ref,
          chapter,
          story_title: title,
          curated_lesson: lesson,
          source_name: item.source_name || manifest.source_name || 'Bhakti Katha',
          source_class: item.source_class || manifest.source_class || 'curated_lesson',
          rights_status: item.rights_status || manifest.rights_status || 'rights_cleared',
          text,
        },
        text: `${title}. ${lesson} ${text ? text.slice(0, 300) : ''}`.trim(),
      });
    }
  }

  console.log(`Bhakti Katha: embedding ${pending.length} stories from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildPanchatantra(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR)
    .filter((f) => f.startsWith('panchatantra_chapter_') && f.endsWith('.json'))
    .sort();

  for (const file of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');

    for (const item of manifest.content ?? []) {
      const ref: string = item.ref ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;
      const title: string = item.story_title ?? '';
      const lesson: string = item.curated_lesson ?? '';
      const text: string = item.text ?? '';
      const book: string = item.book ?? '';

      pending.push({
        meta: {
          id: `${docId}_${ref}`,
          ref,
          chapter,
          story_title: title,
          curated_lesson: lesson,
          source_name: item.source_name || manifest.source_name || 'The Panchatantra',
          source_class: item.source_class || manifest.source_class || 'translation',
          rights_status: item.rights_status || manifest.rights_status || 'public_domain',
          text,
        },
        text: `${title}. ${book ? `${book}. ` : ''}${lesson} ${text ? text.slice(0, 300) : ''}`.trim(),
      });
    }
  }

  console.log(`Panchatantra: embedding ${pending.length} stories from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function buildRamayana(embedder: any) {
  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];
  const manifestFiles = [
    'valmiki_ramayana_bala.json',
    'valmiki_ramayana_ayodhya.json',
    'valmiki_ramayana_aranya.json',
    'valmiki_ramayana_kishkindha.json',
    'valmiki_ramayana_sundara.json',
    'valmiki_ramayana_yuddha.json',
  ];

  for (const file of manifestFiles) {
    const filePath = path.join(MANIFESTS_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const docId = manifest.doc_id ?? file.replace(/\.json$/, '');
    const kandaTitle = manifest.title?.replace('Valmiki Ramayana — ', '') || file.replace('valmiki_ramayana_', '').replace('.json', '');

    for (const verse of manifest.content ?? []) {
      const ref: string = verse.ref ?? '';
      const sanskrit: string = verse.sanskrit ?? '';
      const transliteration: string = verse.transliteration ?? '';
      const text: string = verse.text ?? verse.translation ?? '';
      const chapterPart = ref.split('.')[0];
      const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;

      pending.push({
        meta: {
          id: `${docId}_${ref}`,
          ref,
          chapter,
          sanskrit,
          transliteration,
          text,
          source_name: 'Valmiki Ramayana',
          source_class: verse.source_class || 'translation',
          rights_status: verse.rights_status || 'public_domain',
        },
        text: `Valmiki Ramayana ${kandaTitle} ${ref}. ${transliteration ? `${transliteration}. ` : ''}${text.trim()}`,
      });
    }
  }

  console.log(`Valmiki Ramayana: embedding ${pending.length} verses from ${manifestFiles.length} manifests...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: manifestFiles.length,
      document_count: documents.length,
      scale_readiness: documents.length > 100 ? 'Production-scale' : 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
      source_class: 'translation',
      rights_status: 'public_domain',
      review_status: 'source_audit_approved',
      is_live_in_app: true,
    },
    documents,
  };
}

async function buildSingleManifestCorpus(
  embedder: any,
  manifestFileName: string,
  corpusLabel: string
) {
  const filePath = path.join(MANIFESTS_DIR, manifestFileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Manifest file not found: ${manifestFileName}`);
  }
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const docId = manifest.doc_id ?? manifestFileName.replace(/\.json$/, '');
  const title = manifest.title ?? '';
  const sourceName = manifest.source_name ?? '';
  const tradition = manifest.tradition ?? '';

  const pending: { meta: Omit<DenseDoc, 'vector'>; text: string }[] = [];

  for (const item of manifest.content ?? []) {
    const ref: string = item.ref ?? '';
    const chapterPart = ref.split('.')[0];
    const chapter = /^\d+$/.test(chapterPart) ? parseInt(chapterPart, 10) : 1;
    const text: string = item.text ?? '';
    const original: string = item.original ?? item.sanskrit ?? '';
    const transliteration: string = item.transliteration ?? '';

    pending.push({
      meta: {
        id: `${docId}_${ref}`,
        ref,
        chapter,
        sanskrit: item.sanskrit,
        original: item.original,
        transliteration,
        text,
        source_name: item.source_name ?? sourceName,
        source_class: item.source_class ?? 'scripture',
        rights_status: item.rights_status ?? 'public_domain',
      },
      text: `${title} ${ref}. ${transliteration ? `${transliteration}. ` : ''}${text}`.trim(),
    });
  }

  console.log(`${corpusLabel}: embedding ${pending.length} verses...`);
  const documents = await embedAll(embedder, pending);

  return {
    metadata: {
      manifest_count: 1,
      document_count: documents.length,
      scale_readiness: 'Sample-scale',
      embedding_model: EMBEDDING_MODEL,
      embedding_dim: EMBEDDING_DIM,
    },
    documents,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const rebuildAll = args.includes('--all') || args.includes('--rebuild-all');
  const targetCorpora = args.filter((a) => !a.startsWith('--'));

  console.log(`Loading ${EMBEDDING_MODEL}...`);
  const start = Date.now();
  const embedder = await pipeline('feature-extraction', EMBEDDING_MODEL);
  console.log(`Model loaded in ${Date.now() - start}ms\n`);

  const shouldBuild = (name: string, file: string) => {
    if (targetCorpora.length > 0) return targetCorpora.includes(name);
    if (rebuildAll) return true;
    return !fs.existsSync(path.join(CORPUS_DIR, file));
  };

  if (shouldBuild('gita', 'gita_index_dense.json')) {
    const gitaIndex = await buildGita(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'gita_index_dense.json'), JSON.stringify(gitaIndex, null, 2), 'utf-8');
    console.log(`Wrote gita_index_dense.json (${gitaIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('upanishads', 'upanishads_index_dense.json')) {
    const upanishadsIndex = await buildUpanishads(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'upanishads_index_dense.json'), JSON.stringify(upanishadsIndex, null, 2), 'utf-8');
    console.log(`Wrote upanishads_index_dense.json (${upanishadsIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('gurbani', 'gurbani_index_dense.json')) {
    const gurbaniIndex = await buildGurbani(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'gurbani_index_dense.json'), JSON.stringify(gurbaniIndex, null, 2), 'utf-8');
    console.log(`Wrote gurbani_index_dense.json (${gurbaniIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('buddhist', 'buddhist_dhamma_index_dense.json')) {
    const buddhistIndex = await buildBuddhist(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'buddhist_dhamma_index_dense.json'), JSON.stringify(buddhistIndex, null, 2), 'utf-8');
    console.log(`Wrote buddhist_dhamma_index_dense.json (${buddhistIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('jain', 'jain_dharma_index_dense.json')) {
    const jainIndex = await buildJain(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'jain_dharma_index_dense.json'), JSON.stringify(jainIndex, null, 2), 'utf-8');
    console.log(`Wrote jain_dharma_index_dense.json (${jainIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('katha', 'katha_index_dense.json')) {
    const kathaIndex = await buildKatha(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'katha_index_dense.json'), JSON.stringify(kathaIndex, null, 2), 'utf-8');
    console.log(`Wrote katha_index_dense.json (${kathaIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('panchatantra', 'panchatantra_index_dense.json')) {
    const panchatantraIndex = await buildPanchatantra(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'panchatantra_index_dense.json'), JSON.stringify(panchatantraIndex, null, 2), 'utf-8');
    console.log(`Wrote panchatantra_index_dense.json (${panchatantraIndex.documents.length} docs)\n`);
  }

  if (shouldBuild('ramayana', 'valmiki_ramayana_index_dense.json')) {
    const ramayanaIndex = await buildRamayana(embedder);
    fs.writeFileSync(path.join(CORPUS_DIR, 'valmiki_ramayana_index_dense.json'), JSON.stringify(ramayanaIndex, null, 2), 'utf-8');
    console.log(`Wrote valmiki_ramayana_index_dense.json (${ramayanaIndex.documents.length} docs)\n`);
  }

  const regionalCorpora: [string, string, string][] = [
    ['sant_kabir', 'sant_kabir.json', 'sant_kabir_index_dense.json'],
    ['tamil_tirukkural', 'tamil_tirukkural.json', 'tamil_tirukkural_index_dense.json'],
    ['mahabharata_shanti', 'mahabharata_shanti.json', 'mahabharata_shanti_index_dense.json'],
    ['shaiva_kashmir', 'shaiva_kashmir.json', 'shaiva_kashmir_index_dense.json'],
    ['tamil_prabandham', 'tamil_prabandham.json', 'tamil_prabandham_index_dense.json'],
    ['tamil_tiruvachakam', 'tamil_tiruvachakam.json', 'tamil_tiruvachakam_index_dense.json'],
    ['sikh_dasam_granth', 'sikh_dasam_granth.json', 'sikh_dasam_granth_index_dense.json'],
    ['yoga_sutras', 'yoga_sutras.json', 'yoga_sutras_index_dense.json'],
    ['bhakti_sutras', 'bhakti_sutras.json', 'bhakti_sutras_index_dense.json'],
    ['jyotish_classics', 'jyotish_classics.json', 'jyotish_classics_index_dense.json'],
    ['vedic_suktas_stotras', 'vedic_suktas_stotras.json', 'vedic_suktas_stotras_index_dense.json'],
  ];

  for (const [key, manifestFile, indexFile] of regionalCorpora) {
    if (shouldBuild(key, indexFile)) {
      const idx = await buildSingleManifestCorpus(embedder, manifestFile, key);
      fs.writeFileSync(path.join(CORPUS_DIR, indexFile), JSON.stringify(idx, null, 2), 'utf-8');
      console.log(`Wrote ${indexFile} (${idx.documents.length} docs)\n`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
