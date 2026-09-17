/**
 * Query-time embedding, using the exact model/library validated end-to-end
 * on real Vercel serverless infrastructure this session: Xenova/all-MiniLM-L6-v2
 * via @huggingface/transformers, in-process (no network call), no hosted
 * embedding vendor. Measured there: cold start 1.8s (597ms import + 1.1s
 * model load + 102ms embed), warm 13-114ms, deterministic 384-dim output.
 *
 * Must produce vectors in the exact same space as
 * scripts/build-dense-embeddings.mts's doc-time embeddings -- same model,
 * same pooling/normalize options. A different model or option here silently
 * makes every dense retriever's cosine similarity meaningless.
 *
 * IMPORTANT (confirmed by the Vercel spike): the model must be pre-fetched
 * at build time, never lazily downloaded at request time -- Vercel's
 * function filesystem is read-only outside /tmp, so a lazy first-request
 * download fails there (ENOENT trying to write the cache dir). Whichever
 * route ends up calling embedQuery() needs a build-time prefetch step
 * (see scripts/build-dense-embeddings.mts's own model load for the same
 * pipeline call) and a `functions.<path>.includeFiles` entry in
 * vercel.json, since the model is referenced dynamically and Vercel's
 * static file-tracer won't pick it up on its own.
 */
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIM = 384;

let embedderPromise: Promise<any> | null = null;

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = import('@huggingface/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', EMBEDDING_MODEL)
    );
  }
  return embedderPromise;
}

export async function embedQuery(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data as Float32Array);
}
