const fs = require('fs');
const path = require('path');

const manifestsDir = path.join(__dirname, '../python/ai_pipeline/corpus/manifests');
const files = fs.readdirSync(manifestsDir).filter(f => f.startsWith('ramayana_') && f.endsWith('.json'));

for (const file of files) {
  const filepath = path.join(manifestsDir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  data.source_name = 'Shoonaya Curated Ramayana Lessons';
  data.source_class = 'curated_lesson';
  data.is_pramana_grade = false;
  data.review_status = 'needs_source_audit';
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}
console.log('Reclassified manifests.');
