import re

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'r') as f:
    content = f.read()

content = content.replace("icon: '🔱'", "icon: 'flame' as SacredIconName")
content = content.replace("icon: '🌸'", "icon: 'flower' as SacredIconName")

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'w') as f:
    f.write(content)

