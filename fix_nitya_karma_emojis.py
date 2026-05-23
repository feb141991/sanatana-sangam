import re

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'r') as f:
    content = f.read()

emoji_to_sacred = {
    '🌙': 'moon',
    '🌊': 'water',
    '☬': 'sparkles',
    '📖': 'book',
    '🙏': 'heart',
    '📿': 'music',
    '📜': 'scroll',
    '☸️': 'compass',
    '💛': 'heart',
    '🪔': 'flame',
    '🧘': 'moon',
    '🤲': 'heart',
}

def replace_emoji(match):
    icon_val = match.group(0)
    for em, ic in emoji_to_sacred.items():
        if em in icon_val:
            return f"icon: '{ic}' as SacredIconName"
    return icon_val

content = re.sub(r"icon:\s*'[^a-zA-Z0-9]+'", replace_emoji, content)

# Fix NityaCustom type mapping. If there is a place where we map strings, we can cast it.
content = re.sub(r"icon: (['\"])\1", r"icon: 'star' as SacredIconName", content) # Fallback for empty strings if any
# We already changed `icon: string;` to `icon: SacredIconName;`
# But there might be `{ id: string; label: string; icon: string; minutes: number; }`
content = content.replace("icon: string;", "icon: SacredIconName;")
content = content.replace("icon: string,", "icon: SacredIconName,")

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'w') as f:
    f.write(content)

