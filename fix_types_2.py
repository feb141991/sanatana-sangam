import re

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'r') as f:
    content = f.read()

content = content.replace("import SacredIcon from '@/components/ui/SacredIcon';", "import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';")
content = content.replace("icon: string;", "icon: SacredIconName;")

# Find all 'icon: string' without semicolon too:
content = re.sub(r'icon:\s*string', 'icon: SacredIconName', content)

# Some remaining `es.icon` as SacredIconName cast might be needed, but changing interface should fix it.
with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'w') as f:
    f.write(content)

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'r') as f:
    content = f.read()

# Replace the emojis
content = content.replace("icon: '🗺️'", "icon: 'location' as SacredIconName")
content = content.replace("icon: '🏆'", "icon: 'sparkles' as SacredIconName")
content = content.replace("icon: '✅'", "icon: 'star' as SacredIconName")
content = content.replace("icon: '📚'", "icon: 'book' as SacredIconName")

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'w') as f:
    f.write(content)

