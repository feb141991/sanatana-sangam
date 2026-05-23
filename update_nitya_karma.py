import re

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'r') as f:
    content = f.read()

if 'import SacredIcon' not in content:
    content = content.replace("import React,", "import React,\nimport SacredIcon from '@/components/ui/SacredIcon';")
    # if the above didn't hit, do it generally:
    if 'import SacredIcon' not in content:
        content = "import SacredIcon from '@/components/ui/SacredIcon';\n" + content

# Replace <span>{some.icon}</span> varieties
# We can find all pattern <span[^>]*>\{([\w\.]+icon)\}</span>
def replace_span(match):
    var_name = match.group(1)
    # The prompt: <SacredIcon name={var_name} size={20} strokeWidth={1.7} style={{ color: 'var(--brand-primary)' }} />
    return f"<SacredIcon name={{{var_name}}} size={{20}} strokeWidth={{1.7}} style={{={{ color: 'var(--brand-primary)' }}}} />"

content = re.sub(r'<span[^>]*>\{([\w\.]+\.icon)\}</span>', replace_span, content)

# 1536 inline stage icon replace:
# {isPro && _stageMeta ? _stageMeta.icon : '🏡'}
content = content.replace(
    "{isPro && _stageMeta ? _stageMeta.icon : '🏡'}",
    """{isPro && _stageMeta
  ? <SacredIcon name={_stageMeta.icon} size={20} strokeWidth={1.7} />
  : <SacredIcon name="kul" size={20} strokeWidth={1.7} />}"""
)

# 1777 inline stage icon replace:
# {_stageMeta.icon} -> <SacredIcon name={_stageMeta.icon} size={20} strokeWidth={1.7} />
# It might be wrapped in span or alone. 
# Let's replace just {_stageMeta.icon} if it's not already inside the SacredIcon we just added.
# First, let's just do a specific replace for the exact one at 1777.
# Actually, the user says "For {_stageMeta.icon} at line 1777:"
# Let's just find and replace all {_stageMeta.icon} that are outside of <SacredIcon name={_stageMeta.icon} ... />
# Better yet, since we might have wrapped it above, let's find the specific text:
# <span className="mr-2 text-2xl">{_stageMeta.icon}</span> -> <div className="mr-2"><SacredIcon name={_stageMeta.icon} size={20} strokeWidth={1.7} /></div>
# Let's check the context for _stageMeta.icon first.

with open('src/app/(main)/nitya-karma/NityaKarmaClient.tsx', 'w') as f:
    f.write(content)
