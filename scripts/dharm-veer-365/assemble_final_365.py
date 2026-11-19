import json
import os

def normalize_citation(c):
    if isinstance(c, dict):
        res = {"sourceName": c.get("sourceName", "").strip()}
        if "sourceRef" in c and c["sourceRef"]:
            res["sourceRef"] = str(c["sourceRef"]).strip()
        res["tier"] = c.get("tier", 1)
        return res
    parts = c.split(",", 1)
    if len(parts) == 2:
        return {"sourceName": parts[0].strip(), "sourceRef": parts[1].strip(), "tier": 1}
    return {"sourceName": c.strip(), "tier": 1}

with open("/tmp/existing_76_heroes.json") as f:
    existing = json.load(f)
with open("scripts/dharm-veer-365/sikh_60.json") as f:
    sikh = json.load(f)
with open("scripts/dharm-veer-365/jain_55.json") as f:
    jain = json.load(f)
with open("scripts/dharm-veer-365/buddhist_55.json") as f:
    buddhist = json.load(f)
with open("scripts/dharm-veer-365/hindu_119.json") as f:
    hindu = json.load(f)

all_365 = existing + sikh + jain + buddhist + hindu
print(f"Total raw count: {len(all_365)}")

# Normalize citations
for h in all_365:
    raw_citations = h.get("sourceCitations", [])
    if isinstance(raw_citations, list):
        h["sourceCitations"] = [normalize_citation(c) for c in raw_citations]
    else:
        h["sourceCitations"] = [normalize_citation(raw_citations)]

# Invariant assertions
assert len(all_365) == 365, f"Expected 365, got {len(all_365)}"
counts = {}
for h in all_365:
    counts[h["tradition"]] = counts.get(h["tradition"], 0) + 1
assert counts["hindu"] == 150
assert counts["sikh"] == 75
assert counts["jain"] == 70
assert counts["buddhist"] == 70

ids = [h["id"] for h in all_365]
assert len(ids) == len(set(ids)), f"Duplicate IDs: {[x for x in ids if ids.count(x) > 1]}"

for h in all_365:
    assert h.get("illustrationPrompt"), f"Hero {h['id']} missing illustrationPrompt"
    assert h.get("quote") and h["quote"].get("text") and h["quote"].get("attribution"), f"Hero {h['id']} bad quote"
    assert h.get("quoteLocal") and h["quoteLocal"].get("text") and h["quoteLocal"].get("attribution"), f"Hero {h['id']} bad quoteLocal"
    assert h["quote"]["text"] != h["quoteLocal"]["text"], f"Hero {h['id']} quote equals quoteLocal"
    assert len(h["sourceCitations"]) > 0, f"Hero {h['id']} no citations"
    for c in h["sourceCitations"]:
        assert c.get("sourceName"), f"Hero {h['id']} citation missing sourceName"

# Write snapshots
mobile_path = "/Users/Business(C)/shoonaya-mobile/assets/data/dharm-veer-365-snapshot.json"
backend_path = "/Users/Business(C)/Sanatan Sangam/Shoonaya/src/lib/data/dharm-veer-365-snapshot.json"

with open(mobile_path, "w", encoding="utf-8") as f:
    json.dump(all_365, f, indent=2, ensure_ascii=False)

with open(backend_path, "w", encoding="utf-8") as f:
    json.dump(all_365, f, indent=2, ensure_ascii=False)

print(f"Successfully assembled and wrote 365 heroes to:")
print(f"  Mobile: {mobile_path} ({os.path.getsize(mobile_path):,} bytes)")
print(f"  Backend: {backend_path} ({os.path.getsize(backend_path):,} bytes)")
