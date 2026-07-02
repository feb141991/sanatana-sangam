import fs from 'fs';
import path from 'path';

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9\u0900-\u097f]+(?:\.[a-z0-9\u0900-\u097f]+)*/g) || []);
}

function main() {
  const manifestsDir = path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests');
  const files = fs.readdirSync(manifestsDir).filter(f => f.startsWith('ramayana_') && f.endsWith('.json'));

  const docs: Array<{ id: string, doc_id: string, ref: string, text: string }> = [];
  
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(manifestsDir, f), 'utf-8'));
    for (const item of data.content) {
      const fullText = [
        item.sanskrit || '',
        item.transliteration || '',
        item.text || ''
      ].join(' ');
      
      docs.push({
        id: `${data.doc_id}_${item.ref}`,
        doc_id: data.doc_id,
        ref: item.ref,
        text: fullText
      });
    }
  }

  // Build Document Vectors
  const numDocs = docs.length;
  const df: Record<string, number> = {};
  
  const tokenizedDocs = docs.map(doc => {
    const tokens = tokenize(doc.text);
    const tf: Record<string, number> = {};
    for (const t of tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }
    for (const t in tf) {
      df[t] = (df[t] || 0) + 1;
    }
    return { doc, tf };
  });

  const idf: Record<string, number> = {};
  for (const t in df) {
    idf[t] = Math.log(numDocs / (df[t] + 1)) + 1;
  }

  const documents = tokenizedDocs.map(({ doc, tf }) => {
    const vector: Record<string, number> = {};
    let sumSq = 0;
    for (const t in tf) {
      const w = tf[t] * idf[t];
      vector[t] = w;
      sumSq += w * w;
    }
    
    const norm = Math.sqrt(sumSq) || 1;
    const unitVector: Record<string, number> = {};
    for (const t in vector) {
      unitVector[t] = vector[t] / norm;
    }

    return {
      id: doc.id,
      doc_id: doc.doc_id,
      ref: doc.ref,
      vector: unitVector
    };
  });

  const index = { idf, documents };
  const outPath = path.join(process.cwd(), 'python/ai_pipeline/corpus/ramayana_index.json');
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Generated TF-IDF index at ${outPath} with ${documents.length} chunks.`);
}

main();
