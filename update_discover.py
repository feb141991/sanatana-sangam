import re

with open('src/app/(main)/discover/DiscoverClient.tsx', 'r') as f:
    content = f.read()

# Add import
if 'import SacredIcon' not in content:
    content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport SacredIcon from '@/components/ui/SacredIcon';")

# Replace span
content = content.replace(
    '<span className="text-2xl" aria-hidden="true">{rec.icon}</span>',
    '<SacredIcon name={rec.icon} size={26} strokeWidth={1.6} style={{ color: accentColour }} />'
)

with open('src/app/(main)/discover/DiscoverClient.tsx', 'w') as f:
    f.write(content)
