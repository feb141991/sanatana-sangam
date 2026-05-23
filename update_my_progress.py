import re

with open('src/app/(main)/my-progress/MyProgressClient.tsx', 'r') as f:
    content = f.read()

if 'import SacredIcon' not in content:
    content = content.replace("import React,", "import React,\nimport SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';")
    if 'import SacredIcon' not in content:
        content = "import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';\n" + content

content = content.replace("icon: '🕉️'", "icon: 'sparkles' as SacredIconName")
content = content.replace("icon: '🔥'", "icon: 'flame' as SacredIconName")
content = content.replace("icon: '🙏'", "icon: 'heart' as SacredIconName")

content = content.replace(
    '<p className="text-xl mb-1">{item.icon}</p>',
    "<div className=\"mb-1\"><SacredIcon name={item.icon} size={22} strokeWidth={1.6} style={{ color: 'var(--brand-primary)' }} /></div>"
)

with open('src/app/(main)/my-progress/MyProgressClient.tsx', 'w') as f:
    f.write(content)
