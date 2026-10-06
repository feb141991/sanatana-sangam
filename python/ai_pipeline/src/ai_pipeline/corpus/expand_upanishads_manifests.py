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

# --- Katha and Mundaka: three-level citations -------------------------------
#
# Hume numbers verses within each Valli (Katha) or Khanda (Mundaka). The
# traditional citation is three-level: Katha adhyaya.valli.verse (1.1.1-2.3.18)
# and Mundaka mundaka.khanda.verse (1.1.1-3.2.11). Sections are split on Hume's
# own headings, and verses are matched in strict sequence within a section so
# OCR footnote numbers cannot start a new verse. Section verse counts are checked
# against the canonical counts; a mismatch raises instead of guessing.

KATHA_SECTIONS = [(1, 1, 29), (1, 2, 25), (1, 3, 17), (2, 1, 15), (2, 2, 15), (2, 3, 18)]
MUNDAKA_SECTIONS = [(1, 1, 9), (1, 2, 13), (2, 1, 10), (2, 2, 11), (3, 1, 10), (3, 2, 11)]

# OCR renders some verse numbers as "i." or "x." (1), "£2." (12), "to." (10),
# "2 1 ." (21) or "18.7" (18 followed by a glued footnote marker).
_VERSE_START = re.compile(r"(?m)^[ \t]*([0-9£iIltx](?:[ ]?[0-9iIloO])?)[ ]?\.(?:\d)?\s+")
_OCR_DIGITS = str.maketrans({"£": "1", "i": "1", "I": "1", "l": "1", "t": "1", "x": "1", "o": "0", "O": "0"})
# Running heads such as "KATHA UPANISHAD [-1.29", "[-2. 2. I I", "2.I.I-]" or
# "3- a. 3-]": single-character tokens only, so footnote lines never match.
_PAGE_HEADER = re.compile(r"(KATHA|MUNDAKA)\s+UPA[NX]ISHAD|^\s*\[?-?\s*[0-9IiSs]+(?:[\.\-,\s]+[0-9IiSsa])*[\.\-,\s]*\]?\s*$")
_FOOTNOTE = re.compile(r"^\s*[0-9]{1,2}\s+\S")
_SPEAKER = re.compile(r"^\s*\[[^\]]{1,30}:\s*\]\s*$")


def _verse_number(token: str) -> int | None:
    digits = token.replace(" ", "").translate(_OCR_DIGITS)
    return int(digits) if digits.isdigit() else None


def _is_noise_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if _PAGE_HEADER.search(stripped):
        return True
    # Page numbers, printer's signatures and scan debris ("369 B b", "5-H", "A a", "J").
    words = re.findall(r"[A-Za-z]{3,}", stripped)
    return len(stripped) <= 12 and not words


_VERSE_END = re.compile(r"[\.!?;:’'\"”\)\]—,]$")


def _is_subtitle(paragraph: str) -> bool:
    """Hume's section subtitles (sometimes split across lines by the OCR) carry
    no terminal punctuation; every verse paragraph ends with punctuation."""
    return len(paragraph) < 120 and not _VERSE_END.search(paragraph)


def _clean_verse(raw: str) -> tuple[str, str | None]:
    """Strip footnotes, page furniture and the trailing section subtitle.

    Returns (verse text, trailing speaker cue for the next verse or None).
    """
    kept: list[str] = []
    in_footnotes = False
    for line in raw.split("\n"):
        if _PAGE_HEADER.search(line.strip()):
            in_footnotes = False  # a page header ends the previous page's footnote block
            continue
        if in_footnotes:
            continue
        if _FOOTNOTE.match(line):
            in_footnotes = True
            continue
        if _is_noise_line(line):
            continue
        kept.append(line.rstrip())

    text = "\n".join(kept)
    text = re.sub(r"([A-Za-z\)\],;:\.!?’'])[1-9](?=[\s,\.;:!?]|$)", r"\1", text, flags=re.M)  # glued footnote markers
    # Hume's verse text spells numbers out, so any standalone 1-2 digit token is
    # a footnote marker ("revering 5 [him]", "fig-tree ! 2", "[Atman 3]").
    text = re.sub(r"[ \t]+[1-9][0-9]?(?=[ \t]|$|[\]’”,;:.!?])", "", text, flags=re.M)
    text = re.sub(r"(?<=\[)[ \t]*[1-9][0-9]?(?=\])", "", text)

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    speaker = None
    # Hume's section subtitles and speaker cues sit between verses; they belong
    # to the next verse, not the end of this one.
    while paragraphs:
        last = paragraphs[-1]
        if _SPEAKER.match(last):
            speaker = last if speaker is None else speaker
            paragraphs.pop()
            continue
        if _is_subtitle(last):
            paragraphs.pop()
            continue
        break

    text = "\n".join(paragraphs)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip(), speaker


def _split_sections(full_text: str, heading: str) -> list[str]:
    marks = list(re.finditer(heading, full_text))
    return [full_text[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(full_text)] for i, m in enumerate(marks)]


def _section_verses(section: str, expected_count: int, label: str) -> list[tuple[bool, str]]:
    """(verse 1 had no printed number, verse text) for each verse in order."""
    def scan(first: int) -> list[tuple[int, int]]:
        found: list[tuple[int, int]] = []  # (start of verse text, start of number token)
        expected = first
        for m in _VERSE_START.finditer(section):
            if _verse_number(m.group(1)) == expected:
                found.append((m.end(), m.start()))
                expected += 1
        return found

    starts = scan(1)
    implicit_first = False
    if not starts:
        # Some sections print verse 1 without its number; it is then the text
        # between the section heading/subtitle and the "2." marker.
        starts = scan(2)
        if starts:
            starts.insert(0, (0, 0))
            implicit_first = True
    if len(starts) != expected_count:
        raise ValueError(f"{label}: found {len(starts)} verses, expected {expected_count}")

    verses = []
    for i, (text_start, _) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else len(section)
        verses.append((implicit_first and i == 0, section[text_start:end]))
    return verses


def _leading_subtitle_trim(raw: str) -> str:
    """Drop a leading section subtitle when verse 1 had no printed number."""
    paragraphs = [p for p in re.split(r"\n\s*\n", raw) if p.strip()]
    while paragraphs and _is_subtitle(paragraphs[0].strip()):
        paragraphs.pop(0)
    return "\n\n".join(paragraphs)


def _expand_three_level(full_text: str, heading: str, layout: list[tuple[int, int, int]], label: str) -> list[dict]:
    sections = _split_sections(full_text, heading)
    if len(sections) != len(layout):
        raise ValueError(f"{label}: found {len(sections)} section headings, expected {len(layout)}")
    verses: list[dict] = []
    for section, (major, minor, count) in zip(sections, layout):
        carried_speaker = None
        for number, (unnumbered, raw) in enumerate(_section_verses(section, count, f"{label} {major}.{minor}"), start=1):
            if unnumbered:
                raw = _leading_subtitle_trim(raw)
            text, speaker = _clean_verse(raw)
            if carried_speaker:
                text = f"{carried_speaker}\n{text}"
            carried_speaker = speaker
            if len(text) < 20:
                raise ValueError(f"{label} {major}.{minor}.{number}: verse text too short after cleaning")
            verses.append({"ref": f"{major}.{minor}.{number}", "text": text})
    return verses


def expand_katha(full_text: str, original_text: str) -> list[dict]:
    # Katha: 2 adhyayas x 3 vallis; Hume heads each "FIRST VALLI" ... "SIXTH VALLI".
    return _expand_three_level(full_text, r"(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH) VALLI\S*", KATHA_SECTIONS, "Katha")


def expand_mundaka(full_text: str, original_text: str) -> list[dict]:
    # Mundaka: 3 mundakas x 2 khandas; OCR renders one "Khanda" heading as "Rwanda".
    return _expand_three_level(full_text, r"(?:First|Second) (?:Khanda|Rwanda)", MUNDAKA_SECTIONS, "Mundaka")


def katha_sanskrit_by_ref(original_text: str) -> dict[str, str]:
    """Sanskrit Katha shlokas keyed by adhyaya.valli.verse, using the source's
    own "॥ n॥" verse markers and "इति ... वल्ली" section colophons."""
    out: dict[str, str] = {}
    body = original_text[original_text.find("॥ अथ कठोपनिषद् ॥") + len("॥ अथ कठोपनिषद् ॥"):] if "॥ अथ कठोपनिषद् ॥" in original_text else original_text
    chunks = re.split(r"इति[^॥]*?वल्ली\s*॥", body)
    for (major, minor, count), chunk in zip(KATHA_SECTIONS, chunks):
        parts = re.split(r"॥\s*([०-९]+)\s*॥", chunk)
        for i in range(1, len(parts), 2):
            out[f"{major}.{minor}.{dev_to_int(parts[i])}"] = re.sub(r"-\s*\n\s*", "", parts[i - 1]).strip()
    return out


def replace_manifest_content(filename: str, verses: list[dict], sanskrit: dict[str, str] | None = None, keep_sanskrit_refs: set[str] | None = None) -> None:
    """Replace a manifest's content wholesale (refs changed scheme, so a ref-keyed
    merge with old entries would pair text across different verses)."""
    path = MANIFESTS_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    content = []
    for verse in verses:
        entry = {"ref": verse["ref"]}
        if sanskrit and keep_sanskrit_refs and verse["ref"] in keep_sanskrit_refs:
            entry["sanskrit"] = sanskrit[verse["ref"]]
        entry["text"] = verse["text"]
        content.append(entry)
    data["content"] = content
    data["scale_readiness"] = f"Expanded canon ({len(content)} verses)"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Replaced {filename}: {len(content)} verses")

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

    # 3. Katha (three-level refs; content replaced, not ref-merged)
    katha_original = u_orig.get("upa-katha-full", {}).get("original", "")
    katha_v = expand_katha(u_full["upa-katha-full"]["fullText"], katha_original)
    # Only the shlokas previously shown in the app are re-attached, now to the
    # verse their source markers identify (1.2.1, 1.3.14).
    replace_manifest_content("upanishad_katha.json", katha_v, katha_sanskrit_by_ref(katha_original), {"1.2.1", "1.3.14"})

    # 4. Mundaka (three-level refs; content replaced, not ref-merged)
    mundaka_v = expand_mundaka(u_full["upa-mundaka-full"]["fullText"], u_orig.get("upa-mundaka-full", {}).get("original", ""))
    replace_manifest_content("upanishad_mundaka.json", mundaka_v)

    # 5. Prashna
    prashna_v = expand_prashna(u_full["upa-prashna-full"]["fullText"], u_orig.get("upa-prashna-full", {}).get("original", ""))
    update_manifest("upanishad_prashna.json", prashna_v)

if __name__ == "__main__":
    main()
