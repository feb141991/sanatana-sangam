import re

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'r') as f:
    content = f.read()

# Fix NityaCustom type
content = re.sub(r'extraSteps:\s*\{\s*id:\s*string;\s*label:\s*string;\s*icon:\s*string;\s*minutes:\s*number;\s*\}\[\];',
                 r'extraSteps: { id: string; label: string; icon: SacredIconName; minutes: number; }[];', content)

# Fix NityaCustom initial state or any generic type
content = re.sub(r'extraSteps:\s*\{\s*id:\s*string,\s*label:\s*string,\s*icon:\s*string,\s*minutes:\s*number\s*\}\[\]',
                 r'extraSteps: { id: string, label: string, icon: SacredIconName, minutes: number }[]', content)

content = content.replace("icon: string", "icon: SacredIconName")

# Remaining emojis
emoji_to_sacred = {
    '🌱': "flower",
    '🏡': "kul",
    '🍃': "tree",
    '🌅': "sunrise",
}
def replace_emoji(match):
    icon_val = match.group(0)
    for em, ic in emoji_to_sacred.items():
        if em in icon_val:
            return f"icon: '{ic}' as SacredIconName"
    return icon_val
content = re.sub(r"icon:\s*'[^a-zA-Z0-9]+'", replace_emoji, content)

# Cast string to SacredIconName for step.icon, es.icon, s.icon, g.icon
content = content.replace("name={step.icon}", "name={step.icon as SacredIconName}")
content = content.replace("name={es.icon}", "name={es.icon as SacredIconName}")
content = content.replace("name={s.icon}", "name={s.icon as SacredIconName}")
content = content.replace("name={g.icon}", "name={g.icon as SacredIconName}")

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'w') as f:
    f.write(content)

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'r') as f:
    content = f.read()

content = content.replace("icon: '🗺️'", "icon: 'location' as SacredIconName")
content = content.replace("icon: '🏆'", "icon: 'sparkles' as SacredIconName")
content = content.replace("icon: '✅'", "icon: 'star' as SacredIconName")
content = content.replace("icon: '📚'", "icon: 'book' as SacredIconName")

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'w') as f:
    f.write(content)

