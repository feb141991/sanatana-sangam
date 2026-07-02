import fs from 'fs';
import path from 'path';

export interface DraftDharamVeer {
  figure_id: string;
  name: string;
  tradition: string;
  virtue: string;
  short_card_title: string;
  short_story: string;
  daily_lesson: string;
  citations: string[];
  source_class: string;
  confidence: number;
  unsupported_claims: string[];
  review_status: string;
}

const INDEX_PATH = path.join(process.cwd(), 'python/ai_pipeline/corpus/dharam_veer_index.json');
const OUTPUT_DIR = path.join(process.cwd(), 'scratch/dharam_veer_drafts');

function validateDraft(draft: DraftDharamVeer): void {
  if (!draft.citations || draft.citations.length === 0) {
    throw new Error(`Validation failed for ${draft.figure_id}: No citations attached.`);
  }
  if (draft.unsupported_claims && draft.unsupported_claims.length > 0) {
    throw new Error(`Validation failed for ${draft.figure_id}: Draft contains unsupported claims.`);
  }
  if (!draft.source_class) {
    throw new Error(`Validation failed for ${draft.figure_id}: Missing source_class.`);
  }
  if (!draft.tradition) {
    throw new Error(`Validation failed for ${draft.figure_id}: Missing tradition.`);
  }
  if (draft.review_status !== 'draft_needs_review') {
    throw new Error(`Validation failed for ${draft.figure_id}: Review status must be 'draft_needs_review'. Cannot bypass review.`);
  }
}

async function mockGenerateDraftForFigure(figureDocId: string, indexData: any): Promise<DraftDharamVeer> {
  const figureDocs = indexData.documents.filter((d: any) => d.doc_id === figureDocId);

  if (!figureDocs || figureDocs.length === 0) {
    throw new Error(`No passages found for doc_id: ${figureDocId}`);
  }

  // Use the passages to "generate" the draft (simulated RAG)
  const sourceName = figureDocs[0].source_name;
  const tradition = figureDocs[0].tradition;
  const citations = figureDocs.map((d: any) => `${sourceName} - ${d.ref}`);
  const combinedStory = figureDocs.map((d: any) => d.text).join(' ');

  const draft: DraftDharamVeer = {
    figure_id: figureDocId.replace('dharam_veer_', ''),
    name: figureDocId.replace('dharam_veer_', '').replace(/_/g, ' ').toUpperCase(),
    tradition: tradition || 'Unknown',
    virtue: 'Courage',
    short_card_title: `The Story of ${figureDocId.replace('dharam_veer_', '')}`,
    short_story: `Based on sources: ${combinedStory}`,
    daily_lesson: 'Always stand up for righteousness.',
    citations: citations,
    source_class: 'narrative',
    confidence: 0.95,
    unsupported_claims: [],
    review_status: 'draft_needs_review'
  };

  return draft;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`Index not found at ${INDEX_PATH}. Please run the embeddings builder first.`);
    process.exit(1);
  }

  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

  // Extract unique figures
  const uniqueFigures = new Set<string>();
  for (const doc of indexData.documents) {
    uniqueFigures.add(doc.doc_id);
  }

  console.log(`Found ${uniqueFigures.size} figures in the corpus index.`);

  for (const figureDocId of uniqueFigures) {
    console.log(`Generating draft for: ${figureDocId}...`);
    try {
      const draft = await mockGenerateDraftForFigure(figureDocId, indexData);

      // Strict validation
      validateDraft(draft);

      const outPath = path.join(OUTPUT_DIR, `${draft.figure_id}_draft.json`);
      fs.writeFileSync(outPath, JSON.stringify(draft, null, 2));
      console.log(`✅ Successfully generated and validated draft: ${outPath}`);
    } catch (e: any) {
      console.error(`❌ Failed to generate/validate draft for ${figureDocId}: ${e.message}`);
    }
  }
}

main().catch(console.error);
