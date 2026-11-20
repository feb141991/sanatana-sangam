import json
import re
from indic_transliteration import sanscript

with open('src/lib/data/ramcharitmanas.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# If the added comment is already present, strip from that comment to the end
marker = '// ─── CANONICAL SUNDAR KAND'
if marker in content:
    content = content[:content.find(marker)].rstrip()
    if not content.endswith('];'):
        content += '\n];\n'

# Fix corrupted rch-sundara-11
content = re.sub(
    r"original:\s*'काहे री नलिनी तू कुमलानी'.*?transliteration:\s*'Transliteration of Awadhi verse.'",
    "original: 'बंदउँ गुरु पद पदुम परागा सुरुचि सुबास सरस अनुरागा',\n    transliteration: 'bandau~ guru pada paduma parāgā suruci subāsa sarasa anurāgā'",
    content
)

def repl(match):
    full_block = match.group(0)
    m_orig = re.search(r"original:\s*'([^']+)'", full_block)
    if m_orig:
        orig = m_orig.group(1)
        tl = sanscript.transliterate(orig, sanscript.DEVANAGARI, sanscript.IAST)
        tl = tl.replace("'", "\\'")
        return re.sub(r"transliteration:\s*'Transliteration of Awadhi verse.'", f"transliteration: '{tl}'", full_block)
    return full_block

pattern = re.compile(r'\{\s*id:\s*\'rch-[^\}]+\}', re.DOTALL)
updated_content = pattern.sub(repl, content)

# Load the 60 canonical entries from manifest
with open('python/ai_pipeline/corpus/manifests/tulsidas_ramcharitmanas_sundara.json', 'r', encoding='utf-8') as f:
    sundar_manifest = json.load(f)

sundar_entries_ts = []
for item in sundar_manifest['content']:
    doha_num = item['doha']
    entry_id = f'rch-sundar-canto-{doha_num}'
    title = item['title'].replace("'", "\\'")
    source = f'Ramcharitmanas 5.{doha_num}'
    orig = item['sanskrit'].replace('`', '\\`').replace('${', '\\${')
    tl = item['transliteration'].replace('`', '\\`').replace('${', '\\${')
    meaning = item['translation'].replace('`', '\\`').replace('${', '\\${')
    
    ts_entry = f'''  {{
    id: '{entry_id}',
    title: '{title}',
    source: '{source}',
    original: `{orig}`,
    transliteration: `{tl}`,
    meaning: `{meaning}`,
    tradition: 'hindu',
    category: 'ramcharitmanas',
    tags: ['ramcharitmanas', 'tulsidas', 'sundarkand', 'hanuman'],
    attribution: 'Goswami Tulsidas (Awadhi, 16th c.); Frederic Salmon Growse translation (1883)'
  }},'''
    sundar_entries_ts.append(ts_entry)

# Strip trailing ]; and ensure previous entry ends with a comma
pos_close = updated_content.rfind('];')
base_part = updated_content[:pos_close].rstrip()
if not base_part.endswith(','):
    base_part += ','

new_file_content = base_part + '\n\n  // ─── CANONICAL SUNDAR KAND (ALL 60 DOHAS — PUBLIC DOMAIN F. S. GROWSE 1883) ───\n' + '\n'.join(sundar_entries_ts) + '\n];\n'

with open('src/lib/data/ramcharitmanas.ts', 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print('Updated src/lib/data/ramcharitmanas.ts successfully with valid syntax!')
