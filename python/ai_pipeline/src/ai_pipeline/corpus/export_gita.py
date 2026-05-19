import json
import os
import re

def main():
    # Read the gita-full-data.ts file
    ts_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../src/lib/gita-full-data.ts"))
    print(f"Reading Gita data from {ts_file_path}")
    
    with open(ts_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the JSON array part
    # It starts with export const GITA_FULL_DATA = [
    # and ends with ]; (possibly with trailing newlines)
    match = re.search(r"export\s+const\s+GITA_FULL_DATA\s*=\s*(\[[\s\S]*?\])\s*as\s+const\s*;?\s*$", content)
    if not match:
        raise ValueError("Could not find GITA_FULL_DATA array in the TS file")

    json_text = match.group(1)
    
    # Parse the json data
    gita_verses = json.loads(json_text)
    print(f"Successfully loaded {len(gita_verses)} verses")

    # Group verses by chapter
    chapters = {}
    for verse in gita_verses:
        # id is in form gita-C-V
        parts = verse["id"].split("-")
        chapter_num = int(parts[1])
        verse_num = int(parts[2])
        
        if chapter_num not in chapters:
            chapters[chapter_num] = []
        
        chapters[chapter_num].append((verse_num, verse))

    # Output directory
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../python/ai_pipeline/corpus/manifests"))
    os.makedirs(output_dir, exist_ok=True)

    for chapter_num, verses_list in chapters.items():
        # Sort by verse number
        verses_list.sort(key=lambda x: x[0])
        
        manifest = {
            "doc_id": f"gita_chapter_{chapter_num}",
            "title": f"Bhagavad Gita - Chapter {chapter_num}",
            "tradition": "Sanatana Dharma",
            "scripture_family": "gita",
            "section_id": f"chapter_{chapter_num}",
            "source_name": "Wikisource Annie Besant Translation",
            "source_url": "https://en.wikisource.org/wiki/The_Bhagavad_Gita",
            "source_owner": "public-domain",
            "source_class": "translation",
            "rights_status": "public_domain",
            "language": "en",
            "script": "Latn",
            "is_live_in_app": True,
            "companion_only": False,
            "audio_status": "available",
            "revision_note": "Exported from app gita-full-data.",
            "content": []
        }

        for _, verse in verses_list:
            manifest["content"].append({
                "ref": f"{chapter_num}.{_}",
                "text": verse["meaning"],
                "sanskrit": verse["original"],
                "transliteration": verse["transliteration"]
            })

        output_path = os.path.join(output_dir, f"gita_chapter_{chapter_num}.json")
        with open(output_path, "w", encoding="utf-8") as out_f:
            json.dump(manifest, out_f, indent=2, ensure_ascii=False)
        print(f"Wrote manifest for chapter {chapter_num} to {output_path}")

if __name__ == "__main__":
    main()
