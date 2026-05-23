import json

with open('asadivar.json', 'r') as f:
    data = json.load(f)

blocks = []
current_type = None
current_gurmukhi = []
current_trans = []
current_meaning = []
current_attribution = ""

# Actually, the file has headings like "ਸਲੋਕੁ ਮਃ ੧ ॥", "ਪਉੜੀ ॥"
# We can track state.
pauri_num = 0
sloka_buffer = {'gurmukhi': [], 'trans': [], 'meaning': []}

entries = []

for item in data['bani']:
    line = item['line']
    gur = line['gurmukhi']['unicode']
    trans = line['transliteration']['english']['text']
    mean = line['translation']['english'].get('default', '') if line.get('translation') and line.get('translation').get('english') else ''
    
    # Check for markers
    if "ਪਉੜੀ ॥" in gur or "ਪਉੜੀ" in gur and len(gur) < 20:
        # Pauri starts! The sloka_buffer contains all slokas before this pauri.
        pauri_num += 1
        
        # Save sloka entry if we need it (for Pauris 1 to 6)
        if pauri_num <= 6:
            entries.append({
                'id': f'asa-di-var-sloka-{pauri_num}',
                'title': f'Asa Di Var — Slokas before Pauri {pauri_num}',
                'gurmukhi': ' '.join(sloka_buffer['gurmukhi']).strip(),
                'transliteration': ' '.join(sloka_buffer['trans']).strip(),
                'meaning': ' '.join(sloka_buffer['meaning']).strip(),
                'attribution': 'Guru Nanak Dev Ji / Guru Angad Dev Ji', # Mixed
                'type': 'sloka'
            })
        sloka_buffer = {'gurmukhi': [], 'trans': [], 'meaning': []}
        
        # Now pauri starts
        current_type = 'pauri'
        # we don't append the header "ਪਉੜੀ ॥" to the text, or maybe we do? Let's skip the header.
        continue
        
    if current_type == 'pauri':
        sloka_buffer['gurmukhi'].append(gur) # use sloka buffer to hold pauri temp
        sloka_buffer['trans'].append(trans)
        if mean: sloka_buffer['meaning'].append(mean)
        
        # Check if pauri ends
        if '॥' in gur and any(c.isdigit() for c in gur) and 'ਰਹਾਉ' not in gur:
            # Pauri ends
            entries.append({
                'id': f'asa-di-var-pauri-{pauri_num}',
                'title': f'Asa Di Var — Pauri {pauri_num}',
                'gurmukhi': ' '.join(sloka_buffer['gurmukhi']).strip(),
                'transliteration': ' '.join(sloka_buffer['trans']).strip(),
                'meaning': ' '.join(sloka_buffer['meaning']).strip(),
                'attribution': 'Guru Nanak Dev Ji',
                'type': 'pauri'
            })
            sloka_buffer = {'gurmukhi': [], 'trans': [], 'meaning': []}
            current_type = 'sloka'
            
            if pauri_num == 24:
                break
    else:
        # It's a sloka
        sloka_buffer['gurmukhi'].append(gur)
        sloka_buffer['trans'].append(trans)
        if mean: sloka_buffer['meaning'].append(mean)

for i, e in enumerate(entries):
    print(e['id'], e['title'])

print(f"Total entries: {len(entries)}")
