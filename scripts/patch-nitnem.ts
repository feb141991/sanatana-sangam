import * as fs from 'fs';

const stotrams = JSON.parse(fs.readFileSync('scripts/nitnem-verses.json', 'utf-8'));
let content = fs.readFileSync('src/lib/stotrams.ts', 'utf-8');

for (const [stotramId, versesBlock] of Object.entries(stotrams)) {
  // Find the stotram block and replace its verses array
  const idPattern = new RegExp(
    `(id: '${stotramId}'[\\s\\S]*?verses: \\[)[\\s\\S]*?(\\],\\n  \\})`,
    'g'
  );
  void idPattern;
  // safer: use positional replacement
  const start = content.indexOf(`id: '${stotramId}'`);
  if (start === -1) { console.warn(`${stotramId} not found`); continue; }
  const versesStart = content.indexOf('verses: [', start);
  // find matching closing bracket
  let depth = 0, i = versesStart + 9;
  for (; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') { if (depth === 0) { i++; break; } depth--; }
  }
  content = content.slice(0, versesStart) + versesBlock + content.slice(i);
  console.log(`✅ Patched ${stotramId}`);
}

fs.writeFileSync('src/lib/stotrams.ts', content);
console.log('Done. Run: npx tsc --noEmit');
