import re

with open('src/lib/ashrama.ts', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import type { SacredIconName } from '@/components/ui/SacredIcon';\n"
content = import_stmt + content

# Change interface
content = content.replace("icon:        string;", "icon:        SacredIconName;")
content = content.replace("icon:      string;", "icon:      SacredIconName;") # AshramaMeta

# Replace STAGE_ICONS
content = re.sub(
    r"const STAGE_ICONS: Record<LifeStage, string> = \{[^\}]+\};",
    "const STAGE_ICONS: Record<LifeStage, SacredIconName> = {\n  brahmacharya: 'star',\n  grihastha:    'kul',\n  vanaprastha:  'tree',\n  sannyasa:     'wind',\n};",
    content
)

# AshramaDuty IDs mapped to icons
id_mapping = {
    'study': 'book',
    'body': 'activity',
    'guru_seva': 'heart',
    'meditation': 'moon',
    'discipline': 'shield',
    'skill': 'scroll',
    'brahmacharya': 'water',
    'elder_respect': 'flower',
    'artha': 'compass',
    'family': 'kul',
    'excellence': 'sparkles',
    'finance': 'scroll',
    'health': 'flower',
    'balance': 'compass',
    'community': 'mandali',
    'future': 'sunrise',
    'handover': 'tree',
    'mentoring': 'tree',
    'shastra': 'scroll',
    'simplify': 'wind',
    'deep_practice': 'star',
    'pilgrimage': 'landmark',
    'nature': 'mountain',
    'disciples': 'sparkles',
    'withdrawal': 'wind',
    'intensive': 'star',
    'minimal': 'tree',
    'contemplation': 'scroll',
    'universal': 'heart',
    'teach': 'sun',
    'detach': 'wind',
    'moksha_prep': 'sparkles',
    'gurbani_study': 'book',
}

# General emoji mapping for any remaining
emoji_mapping = {
    '🌅': 'sunrise',
    '🌄': 'mountain',
    '🧘': 'moon',
    '🌿': 'tree',
    '🍃': 'tree',
}

def replace_duty_icon(match):
    prefix = match.group(1)
    duty_id = match.group(2)
    icon_val = match.group(3)
    suffix = match.group(4)

    # First check ID mapping
    if duty_id in id_mapping:
        new_icon = id_mapping[duty_id]
        return f"{prefix}id: '{duty_id}',          icon: '{new_icon}'{suffix}"
    
    # If not in ID mapping, check emoji mapping
    for em, ic in emoji_mapping.items():
        if em in icon_val:
            return f"{prefix}id: '{duty_id}',          icon: '{ic}'{suffix}"

    # Default fallback for any remaining emoji if not specified
    # Actually, the user mapped everything pretty thoroughly, let's see if we need a catchall.
    # We will just print if we miss any
    return match.group(0)

# We use regex to find: { id: '...', icon: '...', ... }
# The format varies with spacing.
pattern = re.compile(r"(\{.*?id:\s*'([^']+)',\s*icon:\s*'([^']+)')(.*?\})", re.DOTALL)

# Let's replace line by line to preserve formatting and be safer
lines = content.split('\n')
for i, line in enumerate(lines):
    if "icon:" in line and "id:" in line and "{" in line and "}" in line:
        m = re.search(r"id:\s*'([^']+)'", line)
        icon_m = re.search(r"icon:\s*'([^']+)'", line)
        if m and icon_m:
            duty_id = m.group(1)
            icon_val = icon_m.group(1)
            new_icon = None
            if duty_id in id_mapping:
                new_icon = id_mapping[duty_id]
            else:
                for em, ic in emoji_mapping.items():
                    if em in icon_val:
                        new_icon = ic
                        break
                
            if new_icon:
                lines[i] = re.sub(r"icon:\s*'[^']+'", f"icon: '{new_icon}'", line)
            else:
                # If there's an emoji left, we might want to catch it.
                # E.g. '🛕', '🍂'
                # Let's use a heuristic for some common ones.
                # "Any remaining" was only for a few emojis in the prompt.
                # If there are others, we should map them. Wait, let me just run it and see what's left.
                pass

content = '\n'.join(lines)

with open('src/lib/ashrama.ts', 'w') as f:
    f.write(content)

