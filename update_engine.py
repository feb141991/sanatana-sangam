import re

with open('src/lib/mood/engine.ts', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import type { SacredIconName } from '@/components/ui/SacredIcon';\n"
content = import_stmt + content

# Change interface
content = content.replace("icon: string;", "icon: SacredIconName;")

# Map of replacements
replacements = {
    'ganesha-pancharatnam': 'flower',
    'dhyana-gratitude': 'sunrise',
    'katha-sudama': 'heart',
    'japa-om': 'sparkles',
    'pathshala-dharma': 'scroll',
    'discover-peace': 'music',
    'pathshala-wisdom': 'star',
    'katha-ramayana': 'compass',
    'dhyana-inquiry': 'sun',
    'stotram-guru': 'sparkles',
    'japa-gayatri': 'sun',
    'discover': 'compass', # id is discover (seeking)
    'hanuman-chalisa': 'shield',
    'dhyana-breath': 'wind',
    'japa-shiva': 'mountain',
    'katha-gajendra': 'water',
    'pathshala-gita': 'scroll',
    'discover-calm': 'music',
    'shiva-tandava': 'flame',
    'katha-krishna': 'flower',
    'japa-harekrishna': 'heart',
    'dhyana-metta': 'sun',
    'pathshala-bhakti': 'scroll',
    'discover-celebrate': 'music',
    'dhyana-focus': 'water',
    'vishnu-sahasranamam': 'star',
    'japa-mala': 'compass',
    'pathshala-yoga': 'mountain',
    'katha-dhruva': 'star',
    'discover-focus': 'tree',
}

# The prompt says: "Update all 30 icon: values"
# Also need to fix broken hrefs in MOOD_RECOMMENDATION_MAP? Wait, the user mentioned broken hrefs earlier, but in this request they only gave the `icon` mapping. Wait, let me check the instruction: "Step 2 — src/lib/mood/engine.ts ... Update all 30 icon: values"

for key, new_icon in replacements.items():
    # The regex looks for the block with this id, and replaces its icon
    pattern = rf"(id:\s*'{key}'.*?icon:\s*)'[^']+'"
    content = re.sub(pattern, rf"\1'{new_icon}'", content, flags=re.DOTALL)

with open('src/lib/mood/engine.ts', 'w') as f:
    f.write(content)
