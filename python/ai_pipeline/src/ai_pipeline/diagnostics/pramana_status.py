"""
Pramana Diagnostics — Status Surface Script
============================================

Produces a structured, machine-readable and human-readable snapshot of the
current Pramana system state:

  1. Corpus lane registry (all known corpus IDs and their metadata)
  2. Index presence and scale readiness (from built index JSON files)
  3. Manifest coverage (how many manifests per corpus lane)
  4. Eval suite coverage (how many cases per JSONL dataset)
  5. Prompt-mode activation (which response modes are wired)
  6. Provider readiness (hosted Gemini / self-hosted)
  7. Mock / live-ish / real-exec status per suite

Usage:
  npm run diagnostics                    # print report + write pramana_diagnostics.json
  npm run diagnostics -- --json-only     # write JSON without printing
  npm run diagnostics -- --no-json       # print without writing file
  npm run diagnostics -- --fail-on-warn  # exit 1 if any WARN items found

Output:
  - Console: colour-coded ASCII table report
  - File:    pramana_diagnostics.json (in repo root)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# ─────────────────────────────────────────────────────────────────────────────
# Data shapes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class CorpusLaneStatus:
    corpus_id: str
    name: str
    tradition: str
    primary_language: str
    # Index status
    index_file: str | None
    index_exists: bool
    document_count: int
    manifest_count: int
    idf_token_count: int
    scale_readiness: str          # Production-scale | Sample-scale | Not-indexed
    # Eval status
    eval_dataset: str | None
    eval_case_count: int
    # Prompt mode
    response_mode: str | None     # e.g. 'gurbani_shabad_explain'
    prompt_builder_wired: bool
    # Execution mode
    exec_mode: str                # live-ish | mock-only | not-integrated
    routing: str                  # active | explicit-target-only | not-routed


@dataclass
class ProviderStatus:
    provider_id: str
    display_name: str
    available: bool
    configured: bool
    detail: str


@dataclass
class DiagnosticsReport:
    generated_at: str
    repo_root: str
    corpus_lanes: list[CorpusLaneStatus]
    providers: list[ProviderStatus]
    summary: dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# Corpus registry (mirrors packages/pramana-serve/src/corpus.ts)
# This is intentionally a Python copy for standalone diagnostics.
# Keep in sync with PramanaCorpusId and PRAMANA_CORPUS_REGISTRY.
# ─────────────────────────────────────────────────────────────────────────────

CORPUS_REGISTRY: list[dict[str, str]] = [
    {"id": "pathshala_gita",             "name": "Bhagavad Gita",                  "tradition": "Sanatana Dharma", "lang": "sa"},
    {"id": "pathshala_upanishads",       "name": "Upanishads",                     "tradition": "Sanatana Dharma", "lang": "sa"},
    {"id": "bhakti_katha",               "name": "Puranic Devotional Stories",     "tradition": "Bhakti",          "lang": "sa"},
    {"id": "bhakti_panchatantra",        "name": "Panchatantra Moral Fables",      "tradition": "Niti Shastra",    "lang": "sa"},
    {"id": "sikh_gurbani",               "name": "Gurbani Scriptures",             "tradition": "Sikhi",           "lang": "pa"},
    {"id": "buddhist_dhamma",            "name": "Buddhist Dhamma Texts",          "tradition": "Buddhism",        "lang": "pi"},
    {"id": "jain_dharma",                "name": "Jain Dharma Agamas",             "tradition": "Jainism",         "lang": "prakrit"},
    {"id": "tamil_tirukkural",           "name": "Tirukkural",                     "tradition": "Tamil Sangam",    "lang": "ta"},
    {"id": "tamil_prabandham",           "name": "Naalayira Divya Prabandham",     "tradition": "Sri Vaishnavism", "lang": "ta"},
    {"id": "tamil_tiruvachakam",         "name": "Tiruvachakam",                   "tradition": "Shaiva Siddhanta","lang": "ta"},
    {"id": "mahabharata_shanti",         "name": "Mahabharata – Shanti Parva",     "tradition": "Itihasa",         "lang": "sa"},
    {"id": "sant_kabir",                 "name": "Kabir Dohe",                     "tradition": "Sant Mat",        "lang": "hi"},
    {"id": "sikh_dasam_granth",          "name": "Dasam Granth",                   "tradition": "Sikhism",         "lang": "pa"},
    {"id": "mahayana_bodhicharyavatara", "name": "Bodhicharyavatara",              "tradition": "Mahayana",        "lang": "sa"},
    {"id": "jain_tattvartha_sutra",      "name": "Tattvartha Sutra",               "tradition": "Jainism",         "lang": "sa"},
    {"id": "shaiva_kashmir",             "name": "Kashmir Shaiva Texts",           "tradition": "Kashmir Shaivism","lang": "sa"},
    {"id": "jain_kalpa_sutra",           "name": "Kalpa Sutra & Agamas",           "tradition": "Jainism",         "lang": "prakrit"},
]

INDEX_MAP: dict[str, str] = {
    "pathshala_gita":       "gita_index.json",
    "pathshala_upanishads": "upanishads_index.json",
    "sikh_gurbani":         "gurbani_index.json",
    "buddhist_dhamma":      "buddhist_dhamma_index.json",
    "jain_dharma":          "jain_dharma_index.json",
}

# Maps corpus_id -> eval JSONL filename (relative to datasets/evals/)
EVAL_MAP: dict[str, str] = {
    "pathshala_gita":       "pathshala_explain.sample.jsonl",
    "bhakti_katha":         "bhakti_katha.sample.jsonl",
    "bhakti_panchatantra":  "bhakti_panchatantra.sample.jsonl",
    "pathshala_upanishads": "pathshala_upanishads.sample.jsonl",
    "sikh_gurbani":         "sikh_gurbani.sample.jsonl",
    "buddhist_dhamma":      "buddhist_dhamma.sample.jsonl",
    "jain_dharma":          "jain_dharma.sample.jsonl",
}

# Maps corpus_id -> responseMode string (mirrors router.ts dispatch)
RESPONSE_MODE_MAP: dict[str, str] = {
    "pathshala_gita":       "scripture_verse_explain",
    "pathshala_upanishads": "scripture_passage_explain",
    "bhakti_katha":         "devotional_story_explain",
    "bhakti_panchatantra":  "moral_story_explain",
    "sikh_gurbani":         "gurbani_shabad_explain",
    "buddhist_dhamma":      "buddhist_sutra_explain",
    "jain_dharma":          "jain_sutra_explain",
}

# Maps corpus_id -> whether prompt builder is wired in router.ts
WIRED_BUILDERS: set[str] = {
    "pathshala_gita",
    "pathshala_upanishads",
    "bhakti_katha",
    "bhakti_panchatantra",
    "sikh_gurbani",
    "buddhist_dhamma",
    "jain_dharma",
}

# Maps corpus_id -> exec mode
EXEC_MODE_MAP: dict[str, str] = {
    "pathshala_gita":       "live-ish",   # has real Gemini eval path
    "pathshala_upanishads": "mock-only",
    "bhakti_katha":         "mock-only",
    "bhakti_panchatantra":  "mock-only",
    "sikh_gurbani":         "mock-only",
    "buddhist_dhamma":      "mock-only",
    "jain_dharma":          "mock-only",
}

# Maps corpus_id -> routing classification
ROUTING_MAP: dict[str, str] = {
    "pathshala_gita":       "active (default fallback)",
    "pathshala_upanishads": "explicit-target-only",
    "bhakti_katha":         "active (source-key match)",
    "bhakti_panchatantra":  "explicit-target-only",
    "sikh_gurbani":         "explicit-target-only",
    "buddhist_dhamma":      "explicit-target-only",
    "jain_dharma":          "explicit-target-only",
}

MANIFEST_PATTERNS: dict[str, str] = {
    "pathshala_gita":       "gita_chapter_*.json",
    "pathshala_upanishads": "upanishad_*.json",
    "sikh_gurbani":         "sikh_gurbani_*.json",
    "buddhist_dhamma":      "buddhist_dhamma.json",
    "jain_dharma":          "jain_dharma.json",
    "bhakti_katha":         "katha_*.json",
    "bhakti_panchatantra":  "panchatantra_*.json",
    "tamil_tirukkural":     "tamil_tirukkural.json",
    "tamil_prabandham":     "tamil_prabandham.json",
    "tamil_tiruvachakam":   "tamil_tiruvachakam.json",
    "mahabharata_shanti":   "mahabharata_shanti.json",
    "sant_kabir":           "sant_kabir.json",
    "sikh_dasam_granth":    "sikh_dasam_granth.json",
    "mahayana_bodhicharyavatara": "mahayana_bodhicharyavatara.json",
    "jain_tattvartha_sutra": "jain_tattvartha_sutra.json",
    "shaiva_kashmir":       "shaiva_kashmir.json",
    "jain_kalpa_sutra":     "jain_kalpa_sutra.json",
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def count_jsonl(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())


def load_index_meta(index_path: Path) -> dict[str, Any]:
    if not index_path.exists():
        return {}
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "document_count": len(data.get("documents", [])),
            "idf_token_count": len(data.get("idf", {})),
            "scale_readiness": data.get("metadata", {}).get("scale_readiness", "Unknown"),
            "manifest_count": data.get("metadata", {}).get("manifest_count", 0),
        }
    except Exception:
        return {}


def count_manifests(manifests_dir: Path, pattern: str) -> int:
    return len(list(manifests_dir.glob(pattern)))


# ─────────────────────────────────────────────────────────────────────────────
# Core probe
# ─────────────────────────────────────────────────────────────────────────────

def build_corpus_lane_status(root: Path) -> list[CorpusLaneStatus]:
    corpus_dir = root / "python" / "ai_pipeline" / "corpus"
    manifests_dir = corpus_dir / "manifests"
    evals_dir = root / "python" / "ai_pipeline" / "datasets" / "evals"

    statuses = []
    for entry in CORPUS_REGISTRY:
        cid = entry["id"]

        # Index
        index_filename = INDEX_MAP.get(cid)
        index_path = corpus_dir / index_filename if index_filename else None
        index_exists = index_path.exists() if index_path else False
        meta = load_index_meta(index_path) if index_path else {}

        doc_count     = meta.get("document_count", 0)
        idf_count     = meta.get("idf_token_count", 0)
        manifest_count = meta.get("manifest_count", 0)
        scale_ready   = meta.get("scale_readiness", "Not-indexed" if not index_exists else "Unknown")

        # If not indexed, try counting manifests directly
        if not index_exists:
            pattern = MANIFEST_PATTERNS.get(cid, "")
            if pattern:
                manifest_count = count_manifests(manifests_dir, pattern)

        # Eval
        eval_filename = EVAL_MAP.get(cid)
        eval_path = evals_dir / eval_filename if eval_filename else None
        eval_case_count = count_jsonl(eval_path) if eval_path else 0

        statuses.append(CorpusLaneStatus(
            corpus_id=cid,
            name=entry["name"],
            tradition=entry["tradition"],
            primary_language=entry["lang"],
            index_file=index_filename,
            index_exists=index_exists,
            document_count=doc_count,
            manifest_count=manifest_count,
            idf_token_count=idf_count,
            scale_readiness=scale_ready,
            eval_dataset=eval_filename,
            eval_case_count=eval_case_count,
            response_mode=RESPONSE_MODE_MAP.get(cid),
            prompt_builder_wired=cid in WIRED_BUILDERS,
            exec_mode=EXEC_MODE_MAP.get(cid, "not-integrated"),
            routing=ROUTING_MAP.get(cid, "not-routed"),
        ))

    return statuses


def build_provider_status() -> list[ProviderStatus]:
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    self_hosted_url = os.environ.get("PRAMANA_SELF_HOSTED_URL", "")
    provider_env = os.environ.get("PRAMANA_INFERENCE_PROVIDER", "")

    hosted_available = bool(gemini_key)
    sh_available = bool(self_hosted_url)
    sh_configured = provider_env == "self-hosted"

    return [
        ProviderStatus(
            provider_id="gemini-hosted",
            display_name="Gemini Hosted (Google AI)",
            available=hosted_available,
            configured=provider_env in ("", "gemini-hosted"),
            detail=(
                "GEMINI_API_KEY set — live-ish eval available"
                if hosted_available else
                "GEMINI_API_KEY not set — mock fallback only"
            ),
        ),
        ProviderStatus(
            provider_id="self-hosted",
            display_name="Pramana Self-Hosted (vLLM/Ollama/TGI)",
            available=sh_available,
            configured=sh_configured,
            detail=(
                f"URL={self_hosted_url} — contract-ready, fetch-based"
                if sh_available else
                "PRAMANA_SELF_HOSTED_URL not set — scaffold only, not deployed"
            ),
        ),
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Console renderer
# ─────────────────────────────────────────────────────────────────────────────

BOLD  = "\033[1m"
RED   = "\033[91m"
YLW   = "\033[93m"
GRN   = "\033[92m"
DIM   = "\033[2m"
RESET = "\033[0m"


def _status_icon(value: bool) -> str:
    return f"{GRN}✅{RESET}" if value else f"{RED}❌{RESET}"


def _scale_icon(readiness: str) -> str:
    if "Production" in readiness:
        return f"{GRN}🟢 {readiness}{RESET}"
    if "Sample" in readiness:
        return f"{YLW}🟡 {readiness}{RESET}"
    return f"{RED}⚪ {readiness}{RESET}"


def _exec_icon(mode: str) -> str:
    if mode == "live-ish":
        return f"{GRN}live-ish{RESET}"
    if mode == "mock-only":
        return f"{YLW}mock-only{RESET}"
    return f"{DIM}not-integrated{RESET}"


def render_report(report: DiagnosticsReport, quiet: bool = False) -> None:
    if quiet:
        return

    W = 120
    print()
    print(BOLD + "=" * W + RESET)
    print(BOLD + "🔎  PRAMANA DIAGNOSTICS REPORT" + RESET)
    print(f"    Generated: {report.generated_at}")
    print(BOLD + "=" * W + RESET)

    # ── Section 1: Corpus Lanes ──────────────────────────────────────────────
    print()
    print(BOLD + "📚  CORPUS LANES" + RESET)
    print()

    # Header
    col_widths = [26, 18, 8, 8, 8, 7, 18, 26, 12, 22]
    headers = ["Corpus ID", "Tradition", "Docs", "Mnf", "Cases", "Wired", "Exec Mode", "Routing", "Scale", "Response Mode"]
    header_row = " ".join(h.ljust(w) for h, w in zip(headers, col_widths))
    print(f"  {header_row}")
    print("  " + "-" * (sum(col_widths) + len(col_widths)))

    wired_count = 0
    indexed_count = 0
    no_eval_lanes: list[str] = []
    no_index_lanes: list[str] = []

    for lane in report.corpus_lanes:
        wired = lane.prompt_builder_wired
        has_eval = lane.eval_case_count > 0
        has_index = lane.index_exists

        if wired:
            wired_count += 1
        if has_index:
            indexed_count += 1
        if not has_eval:
            no_eval_lanes.append(lane.corpus_id)
        if not has_index:
            no_index_lanes.append(lane.corpus_id)

        scale_short = lane.scale_readiness.replace("-scale", "").replace("Not-indexed", "⚪")
        wired_str = ("✅" if wired else "❌")
        exec_str  = lane.exec_mode.replace("not-integrated", "⬜")

        cols = [
            lane.corpus_id[:25],
            lane.tradition[:17],
            str(lane.document_count),
            str(lane.manifest_count),
            str(lane.eval_case_count),
            wired_str,
            exec_str,
            lane.routing[:25],
            scale_short[:11],
            (lane.response_mode or "—")[:21],
        ]
        row = " ".join(c.ljust(w) for c, w in zip(cols, col_widths))
        print(f"  {row}")

    print()

    # ── Section 2: Providers ─────────────────────────────────────────────────
    print(BOLD + "⚡  PROVIDER STATUS" + RESET)
    print()
    for p in report.providers:
        avail = f"{GRN}AVAILABLE{RESET}" if p.available else f"{RED}UNAVAILABLE{RESET}"
        conf  = f"{GRN}ACTIVE{RESET}" if p.configured else f"{DIM}inactive{RESET}"
        print(f"  {BOLD}{p.provider_id:<30}{RESET}  {avail:<20}  config={conf}")
        print(f"  {'':30}  {DIM}{p.detail}{RESET}")
        print()

    # ── Section 3: Summary ───────────────────────────────────────────────────
    s = report.summary
    print(BOLD + "📊  SUMMARY" + RESET)
    print()
    print(f"  Total corpus lanes registered  : {s['total_lanes']}")
    print(f"  Prompt builders wired          : {s['wired_lanes']} / {s['total_lanes']}")
    print(f"  Lanes with built indexes       : {s['indexed_lanes']} / {s['total_lanes']}")
    print(f"  Lanes with eval coverage       : {s['eval_covered_lanes']} / {s['total_lanes']}")
    print(f"  Production-scale indexes       : {s['production_scale_lanes']}")
    print(f"  Total indexed documents        : {s['total_indexed_documents']}")
    print(f"  Total eval cases               : {s['total_eval_cases']}")
    print()

    # ── Warnings ─────────────────────────────────────────────────────────────
    warnings: list[str] = []
    if no_eval_lanes:
        warnings.append(f"No eval coverage: {', '.join(no_eval_lanes)}")
    if no_index_lanes:
        warnings.append(f"No index built: {', '.join(no_index_lanes)}")
    if not report.providers[0].available:
        warnings.append("GEMINI_API_KEY not set — eval runs mock-only for all suites")
    if not report.providers[1].available:
        warnings.append("PRAMANA_SELF_HOSTED_URL not set — self-hosted path is scaffold-only")

    if warnings:
        print(BOLD + YLW + "⚠️  WARNINGS" + RESET)
        for w in warnings:
            print(f"  {YLW}WARN{RESET}  {w}")
        print()

    print(BOLD + "=" * W + RESET)
    print()

    return bool(warnings)


# ─────────────────────────────────────────────────────────────────────────────
# Summary builder
# ─────────────────────────────────────────────────────────────────────────────

def build_summary(lanes: list[CorpusLaneStatus]) -> dict[str, Any]:
    total_docs = sum(l.document_count for l in lanes)
    total_cases = sum(l.eval_case_count for l in lanes)
    prod_scale = sum(1 for l in lanes if "Production" in l.scale_readiness)
    return {
        "total_lanes": len(lanes),
        "wired_lanes": sum(1 for l in lanes if l.prompt_builder_wired),
        "indexed_lanes": sum(1 for l in lanes if l.index_exists),
        "eval_covered_lanes": sum(1 for l in lanes if l.eval_case_count > 0),
        "production_scale_lanes": prod_scale,
        "total_indexed_documents": total_docs,
        "total_eval_cases": total_cases,
        "lanes_by_exec_mode": {
            "live-ish": sum(1 for l in lanes if l.exec_mode == "live-ish"),
            "mock-only": sum(1 for l in lanes if l.exec_mode == "mock-only"),
            "not-integrated": sum(1 for l in lanes if l.exec_mode == "not-integrated"),
        },
        "lanes_by_routing": {
            k: sum(1 for l in lanes if k in l.routing)
            for k in ("active", "explicit-target-only", "not-routed")
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Pramana diagnostics status surface")
    parser.add_argument("--json-only",    action="store_true", help="Write JSON, skip console output")
    parser.add_argument("--no-json",      action="store_true", help="Print to console only, skip JSON file")
    parser.add_argument("--fail-on-warn", action="store_true", help="Exit 1 if any warnings are present")
    args = parser.parse_args()

    # Locate repo root (5 levels up from this file:
    # diagnostics/ -> ai_pipeline/ -> src/ -> ai_pipeline/ -> python/ -> repo-root)
    root = Path(__file__).resolve().parents[5]

    lanes    = build_corpus_lane_status(root)
    providers = build_provider_status()
    summary  = build_summary(lanes)

    report = DiagnosticsReport(
        generated_at=datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        repo_root=str(root),
        corpus_lanes=lanes,
        providers=providers,
        summary=summary,
    )

    # Console output
    has_warnings = render_report(report, quiet=args.json_only)

    # JSON output
    if not args.no_json:
        out_path = root / "pramana_diagnostics.json"
        # Convert dataclasses to dicts
        out_data = {
            "generated_at": report.generated_at,
            "repo_root": report.repo_root,
            "summary": report.summary,
            "corpus_lanes": [asdict(l) for l in report.corpus_lanes],
            "providers": [asdict(p) for p in report.providers],
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(out_data, f, indent=2, ensure_ascii=False)
        if not args.json_only:
            print(f"💾  Written to: {out_path.name}")

    if args.fail_on_warn and has_warnings:
        sys.exit(1)


if __name__ == "__main__":
    main()
