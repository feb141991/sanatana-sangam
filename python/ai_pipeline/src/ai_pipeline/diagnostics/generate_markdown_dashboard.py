import json
from pathlib import Path
from datetime import datetime, timezone

def main():
    root = Path(__file__).resolve().parents[5]
    diag_json_path = root / "pramana_diagnostics.json"
    
    if not diag_json_path.exists():
        print(f"Error: diagnostics file not found at {diag_json_path}")
        return

    with open(diag_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    generated_at = data.get("generated_at", datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    summary = data.get("summary", {})
    corpus_lanes = data.get("corpus_lanes", [])
    providers = data.get("providers", [])

    md = f"""# 🔎 Pramana Rollout Readiness Dashboard

This dashboard provides a weekly status snapshot of all Pramana study lanes, corpus sizes, retrieval integration levels, evaluation coverage, and provider connectivity to guide rollout decisions.

**Generated at**: `{generated_at}` (UTC)  
**Status**: {"⚠️ WARNINGS FOUND" if any(not l["index_exists"] or l["eval_case_count"] == 0 for l in corpus_lanes if l["prompt_builder_wired"]) else "✅ ALL SYSTEM STABLE"}

---

## 📊 Executive Rollout Summary

| Metric | Status / Count | Description |
| :--- | :---: | :--- |
| **Total Registered Lanes** | **{summary.get("total_lanes")}** | Registered in core schemas |
| **Prompt Builders Wired** | **{summary.get("wired_lanes")} / {summary.get("total_lanes")}** | Active in runtime router |
| **Retrieval Indexes Built** | **{summary.get("indexed_lanes")} / {summary.get("total_lanes")}** | TF-IDF token vectors compiled |
| **Eval Coverage** | **{summary.get("eval_covered_lanes")} / {summary.get("total_lanes")}** | Covered by sample datasets |
| **Production-Scale Lanes** | **{summary.get("production_scale_lanes")}** | Full-scale verse ingestion ready |
| **Total Indexed Documents** | **{summary.get("total_indexed_documents")}** | Total verses / paragraphs indexed |
| **Total Eval Test Cases** | **{summary.get("total_eval_cases")}** | System-wide validation checks |

---

## 📚 Study Lane Registry & Rollout Matrix

The matrix below shows the status of each tradition's study lane.

| Corpus ID | Tradition | Index Status | Docs | Eval Cases | Wired | Exec Mode | Routing Policy | Response Mode |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
"""

    for l in corpus_lanes:
        idx_status = "✅ Built" if l["index_exists"] else "❌ Missing"
        scale = l["scale_readiness"].replace("-scale", "")
        if scale == "Production":
            scale_icon = "🟢"
        elif scale == "Sample":
            scale_icon = "🟡"
        else:
            scale_icon = "⚪"

        wired_icon = "✅" if l["prompt_builder_wired"] else "❌"
        
        md += f"| **`{l['corpus_id']}`** | {l['tradition']} | {idx_status} ({scale_icon} {scale}) | {l['document_count']} | {l['eval_case_count']} | {wired_icon} | `{l['exec_mode']}` | {l['routing']} | `{l['response_mode'] or '—'}` |\n"

    md += """
---

## ⚡ Provider Connectivity & Readiness

Status of inference backends for hosted cloud models and local self-hosted deployments.

| Provider | Status | Environment Checks | Configured Role / Detail |
| :--- | :--- | :--- | :--- |
"""

    for p in providers:
        status_str = "🟢 AVAILABLE" if p["available"] else "🔴 UNAVAILABLE"
        active_str = "Active" if p["configured"] else "Inactive"
        md += f"| **`{p['provider_id']}`** | {status_str} | `{active_str}` | {p['detail']} |\n"

    md += """
---

## 🚨 Active Rollout Blockers & Action Items

### 1. Corpus Scale Limitations
* The following lanes are currently running on **Sample-scale** data (low document counts) and are **blocked** from Production auto-routing:
"""

    for l in corpus_lanes:
        if l["prompt_builder_wired"] and l["scale_readiness"] == "Sample-scale":
            md += f"  - **`{l['corpus_id']}`** ({l['tradition']}): currently has only **{l['document_count']}** documents.\n"

    md += """
### 2. Missing Indexes
* The following wired lanes do not have a built TF-IDF index file. Retrieval queries will fall back to basic manifest scanning:
"""

    for l in corpus_lanes:
        if l["prompt_builder_wired"] and not l["index_exists"]:
            md += f"  - **`{l['corpus_id']}`** ({l['tradition']})\n"

    md += """
### 3. Eval Gaps
* The following registered lanes completely lack eval case coverage:
"""
    for l in corpus_lanes:
        if l["eval_case_count"] == 0:
            md += f"  - **`{l['corpus_id']}`** ({l['tradition']})\n"

    # Save to file
    out_md_path = root / "pramana_rollout_dashboard.md"
    with open(out_md_path, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"📝 Markdown dashboard written to {out_md_path.name}")

if __name__ == "__main__":
    main()
