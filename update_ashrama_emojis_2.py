import re

with open('src/lib/ashrama.ts', 'r') as f:
    content = f.read()

emoji_to_sacred = {
    '🤲': 'heart',
    '✨': 'sparkles',
    '📝': 'scroll',
    '💡': 'sun',
    '🌟': 'star',
    '🎨': 'flower',
    '💪': 'activity',
    '📖': 'book',
    '☮️': 'wind'
}

def replace_emoji(match):
    icon_val = match.group(0)
    for em, ic in emoji_to_sacred.items():
        if em in icon_val:
            return f"icon: '{ic}'"
    return icon_val

content = re.sub(r"icon:\s*'[^a-z0-9]+'", replace_emoji, content)

with open('src/lib/ashrama.ts', 'w') as f:
    f.write(content)
