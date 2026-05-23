import re

with open('src/components/ui/SacredIcon.tsx', 'r') as f:
    c = f.read()
if 'import React' not in c:
    c = "import React from 'react';\n" + c
with open('src/components/ui/SacredIcon.tsx', 'w') as f:
    f.write(c)

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'r') as f:
    content = f.read()
# Let's find "icon: string;" in NityaKarmaClient.tsx
content = content.replace("icon: string;", "icon: SacredIconName;")
# For any remaining, we might need to cast to SacredIconName. 
# Also step.icon etc. are from types defined in NityaKarmaClient.tsx or imported.
# In NityaKarmaClient.tsx, let's cast 'as SacredIconName' anywhere we use name={something} if TS still complains, but if we changed local interfaces, it should be fine.
with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'w') as f:
    f.write(content)

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'r') as f:
    content = f.read()

# Replace those emojis on lines 225-231:
# { label: 'Path', value: progress.current_module, icon: '🗺️' }
content = content.replace("icon: '🗺️'", "icon: 'map' as SacredIconName")
content = content.replace("icon: '🏆'", "icon: 'sparkles' as SacredIconName")
content = content.replace("icon: '✅'", "icon: 'check' as SacredIconName")
content = content.replace("icon: '📚'", "icon: 'book' as SacredIconName")

with open('src/app/(main)/pathshala/insights/PathshalaInsightsClient.tsx', 'w') as f:
    f.write(content)

