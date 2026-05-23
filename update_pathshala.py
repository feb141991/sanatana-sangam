import re

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'r') as f:
    content = f.read()

if 'import SacredIcon' not in content:
    content = content.replace("import React,", "import React,\nimport SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';")
    if 'import SacredIcon' not in content:
        content = "import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';\n" + content

content = content.replace("icon: string;", "icon: SacredIconName;")
content = content.replace("icon: '📖'", "icon: 'book'")
content = content.replace("icon: '📚'", "icon: 'book'")

content = content.replace(
    '<span className="text-3xl">{info.icon}</span>',
    "<SacredIcon name={info.icon} size={28} strokeWidth={1.5} style={{ color: 'var(--brand-primary)' }} />"
)

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'w') as f:
    f.write(content)
