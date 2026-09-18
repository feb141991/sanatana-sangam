import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
MANIFESTS_DIR = ROOT / "python/ai_pipeline/corpus/manifests"
FULL_DATA_PATH = ROOT / "src/lib/upanishads-full-data.ts"
ORIGINAL_DATA_PATH = ROOT / "src/lib/upanishads-original-data.ts"

DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

def dev_to_int(s: str) -> int:
    digits = []
    for c in s:
        if c in DEVANAGARI_DIGITS:
            digits.append(str(DEVANAGARI_DIGITS.index(c)))
        elif c.isdigit():
            digits.append(c)
    return int(''.join(digits)) if digits else 0

def clean_english_verse(txt: str) -> str:
    lines = []
    for line in txt.split('\n'):
        l = line.strip()
        # Drop standalone footnotes or header banners
        if re.match(r'^[0-9]+\s+[A-Z][a-z]+', l) and len(l) < 40 and not l.endswith('.'):
            continue
        if re.match(r'^[1-9]\s+[a-z]', l):
            break
        lines.append(line)
    res = '\n'.join(lines).strip()
    # Remove OCR footnotes like 'word1', 'world2'
    res = re.sub(r'([a-zA-Z\)])[1-9](?=[\s,\.!\?]|$)', r'\1', res)
    return res

def expand_isha(full_text: str, original_text: str) -> list[dict]:
    # Normalize known OCR artifacts
    ft = full_text
    ft = re.sub(r'\nix\.\s+', '\n11. ', ft)
    ft = re.sub(r'\n1\s+7\.\s+', '\n17. ', ft)

    # Sanskrit verses
    parts = re.split(r'॥\s*([०-९]+)\s*॥', original_text)
    sk_map = {}
    for i in range(1, len(parts), 2):
        num = dev_to_int(parts[i])
        raw_shloka = parts[i-1].strip()
        if num == 1 and 'ॐ ई' in raw_shloka:
            raw_shloka = raw_shloka[raw_shloka.find('ॐ ई'):]
        sk_map[num] = raw_shloka

    en_map = {}
    for n in range(1, 19):
        m = re.search(rf'\n{n}\.\s+(.*?)(?=\n[0-9]+\.\s+|\n\d+\s+[A-Z]|\n[1-9]\s+[A-Z]|\n\n[1-9]\s+|$)', ft, re.DOTALL)
        if m:
            en_map[n] = clean_english_verse(m.group(1))

    verses = []
    for n in range(1, 19):
        en_txt = en_map.get(n, "")
        sk_txt = sk_map.get(n, "")
        if en_txt:
            verses.append({
                "ref": f"1.{n}",
                "sanskrit": sk_txt,
                "text": en_txt
            })
    return verses

def expand_mandukya(full_text: str, original_text: str) -> list[dict]:
    parts = re.split(r'॥\s*([०-९]+)\s*॥', original_text)
    sk_map = {}
    for i in range(1, len(parts), 2):
        num = dev_to_int(parts[i])
        raw = parts[i-1].strip()
        if num == 1 and 'ॐ इ' in raw:
            raw = raw[raw.find('ॐ इ'):]
        sk_map[num] = raw

    en_map = {}
    for n in range(1, 13):
        m = re.search(rf'\n{n}\.\s+(.*?)(?=\n[0-9]+\.\s+|\n\([a-z]\)|\n\n[1-9]\s+|$)', full_text, re.DOTALL)
        if m:
            en_map[n] = clean_english_verse(m.group(1))

    verses = []
    for n in range(1, 13):
        en_txt = en_map.get(n, "")
        sk_txt = sk_map.get(n, "")
        if en_txt:
            verses.append({
                "ref": f"1.{n}",
                "sanskrit": sk_txt,
                "text": en_txt
            })
    return verses

def expand_katha(full_text: str, original_text: str) -> list[dict]:
    # Katha has 2 Adhyayas, 3 Vallis each -> 6 sections.
    # Extract passages matching verse patterns
    lines = full_text.split('\n')
    verses = []
    current_num = 1
    valli = 1
    buffer = []
    
    for line in lines:
        m = re.match(r'^\s*([0-9]+)\.\s+(.*)', line)
        if m:
            num = int(m.group(1))
            if buffer:
                verses.append({
                    "ref": f"{valli}.{current_num}",
                    "text": clean_english_verse('\n'.join(buffer))
                })
                buffer = []
            if num < current_num and num == 1:
                valli += 1
            current_num = num
            buffer.append(m.group(2))
        elif buffer:
            if re.match(r'^[1-9]\s+[a-z]', line):
                continue
            buffer.append(line)
            
    if buffer:
        verses.append({
            "ref": f"{valli}.{current_num}",
            "text": clean_english_verse('\n'.join(buffer))
        })
    return [v for v in verses if len(v["text"]) > 20][:119]

def expand_mundaka(full_text: str, original_text: str) -> list[dict]:
    lines = full_text.split('\n')
    verses = []
    current_num = 1
    khanda = 1
    buffer = []
    
    for line in lines:
        m = re.match(r'^\s*([0-9]+)\.\s+(.*)', line)
        if m:
            num = int(m.group(1))
            if buffer:
                verses.append({
                    "ref": f"{khanda}.{current_num}",
                    "text": clean_english_verse('\n'.join(buffer))
                })
                buffer = []
            if num < current_num and num == 1:
                khanda += 1
            current_num = num
            buffer.append(m.group(2))
        elif buffer:
            if re.match(r'^[1-9]\s+[a-z]', line):
                continue
            buffer.append(line)
            
    if buffer:
        verses.append({
            "ref": f"{khanda}.{current_num}",
            "text": clean_english_verse('\n'.join(buffer))
        })
    return [v for v in verses if len(v["text"]) > 20][:65]

def expand_prashna(full_text: str, original_text: str) -> list[dict]:
    lines = full_text.split('\n')
    verses = []
    current_num = 1
    prashna = 1
    buffer = []
    
    for line in lines:
        m = re.match(r'^\s*([0-9]+)\.\s+(.*)', line)
        if m:
            num = int(m.group(1))
            if buffer:
                verses.append({
                    "ref": f"{prashna}.{current_num}",
                    "text": clean_english_verse('\n'.join(buffer))
                })
                buffer = []
            if num < current_num and num == 1:
                prashna += 1
            current_num = num
            buffer.append(m.group(2))
        elif buffer:
            if re.match(r'^[1-9]\s+[a-z]', line):
                continue
            buffer.append(line)
            
    if buffer:
        verses.append({
            "ref": f"{prashna}.{current_num}",
            "text": clean_english_verse('\n'.join(buffer))
        })
    return [v for v in verses if len(v["text"]) > 20][:67]

def update_manifest(filename: str, new_verses: list[dict]) -> None:
    path = MANIFESTS_DIR / filename
    if not path.exists():
        print(f"Manifest {filename} does not exist, skipping.")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Merge: keep existing verses if they have transliteration/original, then append new
    existing_by_ref = {v["ref"]: v for v in data.get("content", [])}
    merged_content = []
    
    for v in new_verses:
        ref = v["ref"]
        if ref in existing_by_ref:
            ex = existing_by_ref[ref]
            merged_content.append({
                "ref": ref,
                "sanskrit": ex.get("sanskrit") or v.get("sanskrit", ""),
                "transliteration": ex.get("transliteration", ""),
                "text": v.get("text") or ex.get("text", "")
            })
        else:
            merged_content.append(v)
            
    data["content"] = merged_content
    data["scale_readiness"] = f"Expanded canon ({len(merged_content)} verses)"
    data["is_live_in_app"] = True
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filename}: {len(merged_content)} verses (was {len(existing_by_ref)})")

def main():
    with open(FULL_DATA_PATH, "r", encoding="utf-8") as f:
        t = f.read()
        full_data = json.loads(t[t.find('['):t.rfind(']')+1])

    with open(ORIGINAL_DATA_PATH, "r", encoding="utf-8") as f:
        t = f.read()
        orig_data = json.loads(t[t.find('['):t.rfind(']')+1])

    u_full = {u["id"]: u for u in full_data}
    u_orig = {u["id"]: u for u in orig_data}

    # 1. Isha
    isa_v = expand_isha(u_full["upa-isa-full"]["fullText"], u_orig["upa-isa-full"]["original"])
    update_manifest("upanishad_isha.json", isa_v)

    # 2. Mandukya
    man_v = expand_mandukya(u_full["upa-mandukya-full"]["fullText"], u_orig["upa-mandukya-full"]["original"])
    update_manifest("upanishad_mandukya.json", man_v)

    # 3. Katha
    katha_v = expand_katha(u_full["upa-katha-full"]["fullText"], u_orig.get("upa-katha-full", {}).get("original", ""))
    update_manifest("upanishad_katha.json", katha_v)

    # 4. Mundaka
    mundaka_v = expand_mundaka(u_full["upa-mundaka-full"]["fullText"], u_orig.get("upa-mundaka-full", {}).get("original", ""))
    update_manifest("upanishad_mundaka.json", mundaka_v)

    # 5. Prashna
    prashna_v = expand_prashna(u_full["upa-prashna-full"]["fullText"], u_orig.get("upa-prashna-full", {}).get("original", ""))
    update_manifest("upanishad_prashna.json", prashna_v)

if __name__ == "__main__":
    main()
