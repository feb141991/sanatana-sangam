const fs = require('fs');
const path = require('path');

const dir = 'src/lib/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('export const ') && content.includes('LibraryEntry[]') && !content.includes('source:')) {
    // Add source: after id: ... \n title: ...
    content = content.replace(/(title:\s*[^,\n]+,)/g, "$1\n    source: 'Pathshala Data',");
    fs.writeFileSync(filePath, content);
  }
});
