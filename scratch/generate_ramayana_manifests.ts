import fs from 'fs';
import path from 'path';
import { RAMAYANA_COMPLETE_ENTRIES } from '../src/lib/data/ramayana-complete';

function main() {
  const manifestsDir = path.join(process.cwd(), 'python/ai_pipeline/corpus/manifests');
  if (!fs.existsSync(manifestsDir)) {
    fs.mkdirSync(manifestsDir, { recursive: true });
  }

  // Group by section prefix: e.g., 'ram-bal-1' -> 'bal'
  const grouped = new Map<string, any[]>();
  
  for (const entry of RAMAYANA_COMPLETE_ENTRIES) {
    const parts = entry.id.split('-');
    if (parts.length >= 3) {
      const section = parts[1]; // bal, ayodhya, aranya, etc.
      const contentItem = {
        ref: parts.slice(2).join('-'), // "1", "2", etc.
        sanskrit: entry.original || "",
        transliteration: entry.transliteration || "",
        text: entry.meaning || ""
      };
      
      if (!grouped.has(section)) {
        grouped.set(section, []);
      }
      grouped.get(section)!.push(contentItem);
    }
  }
  
  for (const [section, contents] of grouped.entries()) {
    const titleCap = section.charAt(0).toUpperCase() + section.slice(1);
    
    const manifest = {
      doc_id: `pathshala_ramayana_${section}`,
      title: `Valmiki Ramayana — ${titleCap} Kanda`,
      tradition: "Sanatana Dharma",
      corpus: "ramayana",
      section_id: section,
      source_name: "Valmiki Ramayana",
      source_class: "itihasa",
      rights_status: "public_domain",
      language: "en",
      translation_basis: "Shoonaya Curated / Public Domain",
      is_live_in_app: true,
      content: contents
    };
    
    const outPath = path.join(manifestsDir, `ramayana_${section}.json`);
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`Generated ${outPath} with ${contents.length} entries.`);
  }
}

main();
