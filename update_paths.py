import re

with open('src/lib/seeking-paths.ts', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import type { SacredIconName } from '@/components/ui/SacredIcon';\n"
content = import_stmt + content

# Change interface
content = content.replace("icon: string;", "icon: SacredIconName;")

# Find all action objects and replace icon based on href
mapping = {
    "'/mandali'": "'mandali'",
    "'/tirtha-map'": "'landmark'",
    "'/pathshala'": "'book'",
    "'/vichaar-sabha'": "'mandali'",
    "'/panchang'": "'calendar'",
    "'/kul'": "'heart'",
    "'/kul/sanskara'": "'flower'",
    "'/home?focus=shloka'": "'flower'",
    "'/bhakti/mala'": "'music'"
}

def replace_icon(match):
    href = match.group(1)
    if href in mapping:
        new_icon = mapping[href]
        return f"href: {href}, icon: {new_icon}"
    return match.group(0)

# The pattern looks for href: '/...', icon: '...'
content = re.sub(r"href:\s*('[^']+'),\s*icon:\s*'[^']+'", replace_icon, content)

with open('src/lib/seeking-paths.ts', 'w') as f:
    f.write(content)
