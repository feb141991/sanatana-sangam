import re

with open('src/app/(main)/profile/ProfileClient.tsx', 'r') as f:
    content = f.read()

if 'import SacredIcon' not in content:
    content = content.replace("import React,", "import React,\nimport SacredIcon from '@/components/ui/SacredIcon';")
    if 'import SacredIcon' not in content:
        content = "import SacredIcon from '@/components/ui/SacredIcon';\n" + content

# Change type: icon: string -> icon: SacredIconName or similar if type is defined
# Wait, let's just replace the exact emojis as requested.
# But also need to add SacredIconName to imports if we change type.
if 'SacredIconName' not in content:
    content = content.replace("import SacredIcon from '@/components/ui/SacredIcon';", "import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';")

content = content.replace("icon: '☬'", "icon: 'sparkles' as SacredIconName")
content = content.replace("icon: '🌸'", "icon: 'flower' as SacredIconName")
content = content.replace("icon: '☸️'", "icon: 'compass' as SacredIconName")
content = content.replace("icon: '🪷'", "icon: 'flower' as SacredIconName")
content = content.replace("icon: '🤲'", "icon: 'heart' as SacredIconName")
content = content.replace("icon: '🌿'", "icon: 'tree' as SacredIconName")

content = content.replace(
    '<span className="text-sm">{meta.icon}</span>',
    '<SacredIcon name={meta.icon} size={16} strokeWidth={1.7} />'
)

content = content.replace(
    '<div className="text-xl mb-2">{opt.icon}</div>',
    '<div className="mb-2"><SacredIcon name={opt.icon} size={22} strokeWidth={1.6} /></div>'
)

with open('src/app/(main)/profile/ProfileClient.tsx', 'w') as f:
    f.write(content)
