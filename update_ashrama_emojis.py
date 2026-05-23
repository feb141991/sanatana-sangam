import re

with open('src/lib/ashrama.ts', 'r') as f:
    content = f.read()

emoji_to_sacred = {
    '🌅': 'sunrise',
    '🌄': 'mountain',
    '🧘': 'moon',
    '🌿': 'tree',
    '🍃': 'tree',
    '🌊': 'water',
    '☬': 'sparkles',
    '💼': 'scroll',
    '📊': 'scroll',
    '🤝': 'mandali',
    '📜': 'scroll',
    '📿': 'music',
    '🙏': 'heart',
    '📚': 'book',
    '🙇': 'heart',
    '🎯': 'shield',
    '☸️': 'compass',
    '🪔': 'flame',
    '💛': 'heart',
    '🌙': 'moon',
    '👶': 'kul',
    '⚖️': 'compass',
    '🍂': 'tree',
    '🌸': 'flower',
    '🌺': 'flower',
    '🎶': 'music',
    '🕊️': 'wind',
    '∞': 'star',
    '🌾': 'tree',
    '🌍': 'compass',
    '🌞': 'sun',
    '🛕': 'landmark',
    '💖': 'heart',
    '🤸': 'activity',
    '🛠️': 'scroll',
    '🏡': 'kul',
    '⚡': 'sparkles',
    '🌳': 'tree',
    '🌱': 'flower',
    '🦚': 'flower',
    '🏹': 'compass',
    '🔱': 'flame',
    '🧿': 'water',
    '🐚': 'star',
    '🚩': 'shield',
    '🐘': 'water',
    '🔔': 'music',
    '🩺': 'activity',
    '🩺': 'flower',
    '🩸': 'water',
}

def replace_emoji(match):
    icon_val = match.group(0)
    for em, ic in emoji_to_sacred.items():
        if em in icon_val:
            return f"icon: '{ic}'"
    return icon_val

content = re.sub(r"icon:\s*'[^a-z0-9]+'", replace_emoji, content)

# Check if any left
leftovers = re.findall(r"icon:\s*'[^a-z]+'", content)
if leftovers:
    print("Leftovers:", leftovers)

with open('src/lib/ashrama.ts', 'w') as f:
    f.write(content)
