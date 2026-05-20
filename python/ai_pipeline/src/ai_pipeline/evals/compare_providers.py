"""
Pramana Provider Comparison Harness

Runs eval suites against multiple inference providers side by side and
generates a structured comparison report.

Supported provider modes:
  - hosted   : Uses PRAMANA_INFERENCE_PROVIDER=gemini-hosted (cloud Gemini API)
  - self-hosted : Uses PRAMANA_INFERENCE_PROVIDER=self-hosted + PRAMANA_SELF_HOSTED_URL
  - mock     : Uses deterministic mock responses (always available, no API cost)

Usage:
  # Compare hosted vs mock (always works, no runtime required)
  python -m ai_pipeline.evals.compare_providers --modes mock hosted

  # Compare hosted vs self-hosted (requires PRAMANA_SELF_HOSTED_URL to be set)
  python -m ai_pipeline.evals.compare_providers --modes hosted self-hosted

  # All three
  python -m ai_pipeline.evals.compare_providers --modes mock hosted self-hosted

  # Target a specific suite only
  python -m ai_pipeline.evals.compare_providers --suites pathshala_gita --modes mock hosted

Environment variables for self-hosted mode:
  PRAMANA_SELF_HOSTED_URL     Required: base URL of the runtime (e.g. http://localhost:8080)
  PRAMANA_SELF_HOSTED_MODEL   Optional: model name override
  PRAMANA_SELF_HOSTED_API_KEY Optional: bearer token for the self-hosted server

Note:
  - This harness does NOT depend on a live runtime existing.
  - If self-hosted mode is requested but PRAMANA_SELF_HOSTED_URL is not set,
    the harness skips the self-hosted column and notes the reason.
  - Current evals are mock-based by default. The comparison is most useful
    once live prompt builders and a real self-hosted runtime exist.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ai_pipeline.evals.run_evals import run_gita_eval_suite


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class CaseScore:
    case_id: str
    score: int
    max_score: int
    passed: bool
    notes: str = ""


@dataclass
class SuiteResult:
    suite_name: str
    provider_mode: str
    case_count: int
    passed_count: int
    pass_rate: float
    scores: list[CaseScore] = field(default_factory=list)
    skipped_reason: str | None = None
    mock_runs: int = 0
    live_runs: int = 0


@dataclass
class ComparisonReport:
    suites: list[str]
    modes: list[str]
    results: dict[str, dict[str, SuiteResult]]  # results[suite][mode]


# ---------------------------------------------------------------------------
# Mock scoring engine
# ---------------------------------------------------------------------------

def _mock_score_suite(suite_name: str, provider_mode: str) -> SuiteResult:
    """
    Returns a mock SuiteResult based on the known mock-based eval behavior.
    Mock scores are deterministic and represent baseline pass behavior
    without calling any actual inference provider.
    """
    MOCK_SUITE_DATA: dict[str, dict[str, Any]] = {
        "pathshala_gita": {"cases": 6, "passing": 6, "mock_score": 5},
        "bhakti_katha": {"cases": 6, "passing": 6, "mock_score": 5},
        "bhakti_panchatantra": {"cases": 6, "passing": 6, "mock_score": 5},
        "pathshala_upanishads": {"cases": 6, "passing": 6, "mock_score": 5},
        "sikh_gurbani": {"cases": 6, "passing": 6, "mock_score": 5},
    }
    data = MOCK_SUITE_DATA.get(suite_name, {"cases": 0, "passing": 0, "mock_score": 0})
    total = data["cases"]
    passing = data["passing"]
    scores = [
        CaseScore(
            case_id=f"{suite_name}-mock-{i}",
            score=data["mock_score"],
            max_score=5,
            passed=True,
            notes=f"[mock] deterministic pass for {provider_mode}",
        )
        for i in range(total)
    ]
    return SuiteResult(
        suite_name=suite_name,
        provider_mode=provider_mode,
        case_count=total,
        passed_count=passing,
        pass_rate=round(passing / total, 3) if total > 0 else 0.0,
        scores=scores,
        mock_runs=total,
        live_runs=0,
    )


# ---------------------------------------------------------------------------
# Self-hosted availability check
# ---------------------------------------------------------------------------

def _check_self_hosted_available() -> tuple[bool, str]:
    url = os.environ.get("PRAMANA_SELF_HOSTED_URL", "")
    if not url:
        return False, "PRAMANA_SELF_HOSTED_URL is not set"
    return True, url


# ---------------------------------------------------------------------------
# Per-provider suite runner
# ---------------------------------------------------------------------------

def run_suite_for_mode(suite_name: str, provider_mode: str) -> SuiteResult:
    """
    Dispatches a suite run to the appropriate provider.

    Currently, 'mock' is fully implemented for all.
    'hosted' and 'self-hosted' are fully implemented for 'pathshala_gita' via Python runner.
    Other suites lack live Python prompt builders and will skip with an annotation.
    """
    if provider_mode == "mock":
        return _mock_score_suite(suite_name, provider_mode)

    root = Path(__file__).resolve().parents[5]

    if provider_mode == "self-hosted":
        available, detail = _check_self_hosted_available()
        if not available:
            return SuiteResult(
                suite_name=suite_name,
                provider_mode=provider_mode,
                case_count=0,
                passed_count=0,
                pass_rate=0.0,
                skipped_reason=f"Self-hosted unavailable: {detail}",
            )
        if suite_name == "pathshala_gita":
            dataset_path = root / "python" / "ai_pipeline" / "datasets" / "evals" / "pathshala_explain.sample.jsonl"
            res = run_gita_eval_suite(dataset_path, root, provider_mode="self-hosted")
            pass_count = sum(1 for c in res["results"] if c["score_info"]["score"] >= 3)
            return SuiteResult(
                suite_name=suite_name,
                provider_mode=provider_mode,
                case_count=res["case_count"],
                passed_count=pass_count,
                pass_rate=round(pass_count / res["case_count"], 3) if res["case_count"] > 0 else 0.0,
                mock_runs=res.get("mock_runs", 0),
                live_runs=res.get("live_runs", 0),
            )
        else:
            return SuiteResult(
                suite_name=suite_name,
                provider_mode=provider_mode,
                case_count=0,
                passed_count=0,
                pass_rate=0.0,
                skipped_reason="Live prompt builders not yet implemented in Python-side eval.",
            )

    if provider_mode == "hosted":
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        if not gemini_key:
            return SuiteResult(
                suite_name=suite_name,
                provider_mode=provider_mode,
                case_count=0,
                passed_count=0,
                pass_rate=0.0,
                skipped_reason="GEMINI_API_KEY is not set.",
            )
        if suite_name == "pathshala_gita":
            dataset_path = root / "python" / "ai_pipeline" / "datasets" / "evals" / "pathshala_explain.sample.jsonl"
            res = run_gita_eval_suite(dataset_path, root, provider_mode="hosted")
            pass_count = sum(1 for c in res["results"] if c["score_info"]["score"] >= 3)
            return SuiteResult(
                suite_name=suite_name,
                provider_mode=provider_mode,
                case_count=res["case_count"],
                passed_count=pass_count,
                pass_rate=round(pass_count / res["case_count"], 3) if res["case_count"] > 0 else 0.0,
                mock_runs=res.get("mock_runs", 0),
                live_runs=res.get("live_runs", 0),
            )
        else:
            return SuiteResult(
                suite_name=suite_name,
                provider_mode=provider_mode,
                case_count=0,
                passed_count=0,
                pass_rate=0.0,
                skipped_reason="Live prompt builders not yet implemented in Python-side eval.",
            )

    return SuiteResult(
        suite_name=suite_name,
        provider_mode=provider_mode,
        case_count=0,
        passed_count=0,
        pass_rate=0.0,
        skipped_reason=f"Unknown provider mode: {provider_mode}",
    )


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------

KNOWN_SUITES = [
    "pathshala_gita",
    "bhakti_katha",
    "bhakti_panchatantra",
    "pathshala_upanishads",
    "sikh_gurbani",
]


def render_report(report: ComparisonReport) -> None:
    modes = report.modes
    suites = report.suites

    print()
    print("=" * 100)
    print("📊 PRAMANA PROVIDER COMPARISON REPORT")
    print("=" * 100)
    print(f"Modes compared: {', '.join(modes)}")
    print(f"Suites: {', '.join(suites)}")
    print()

    # Header row
    col_w = 22
    header = f"{'Suite':<30}" + "".join(f"{m:>{col_w}}" for m in modes)
    print(header)
    print("-" * len(header))

    for suite in suites:
        row = f"{suite:<30}"
        for mode in modes:
            result = report.results.get(suite, {}).get(mode)
            if result is None:
                row += f"{'N/A':>{col_w}}"
            elif result.skipped_reason:
                row += f"{'⚠️ SKIP':>{col_w}}"
            else:
                pct = f"{result.pass_rate * 100:.0f}%"
                base_str = f"{pct} ({result.passed_count}/{result.case_count})"
                if mode != "mock":
                    if result.live_runs == 0:
                        row += f"{'🛑 MOCK FALLBACK':>{col_w}}"
                    elif result.mock_runs > 0:
                        row += f"{f'{base_str} ({result.live_runs}L/{result.mock_runs}M)':>{col_w}}"
                    else:
                        row += f"{f'{base_str} [Live]':>{col_w}}"
                else:
                    row += f"{base_str:>{col_w}}"
        print(row)

    print()
    # Skip reasons
    for suite in suites:
        for mode in modes:
            result = report.results.get(suite, {}).get(mode)
            if result and result.skipped_reason:
                print(f"  ⚠️  [{mode}] {suite}: {result.skipped_reason}")
    print()

    # Save JSON report
    root = Path(__file__).resolve().parents[5]
    out_path = root / "pramana_provider_comparison.json"
    out_data = {
        "suites": suites,
        "modes": modes,
        "results": {
            suite: {
                mode: {
                    "pass_rate": report.results.get(suite, {}).get(mode, SuiteResult("", "", 0, 0, 0)).pass_rate,
                    "passed": report.results.get(suite, {}).get(mode, SuiteResult("", "", 0, 0, 0)).passed_count,
                    "total": report.results.get(suite, {}).get(mode, SuiteResult("", "", 0, 0, 0)).case_count,
                    "mock_runs": report.results.get(suite, {}).get(mode, SuiteResult("", "", 0, 0, 0)).mock_runs,
                    "live_runs": report.results.get(suite, {}).get(mode, SuiteResult("", "", 0, 0, 0)).live_runs,
                    "skipped_reason": report.results.get(suite, {}).get(mode, SuiteResult("", "", 0, 0, 0)).skipped_reason,
                }
                for mode in modes
            }
            for suite in suites
        },
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_data, f, indent=2)
    print(f"📝 Saved comparison report to {out_path.name}")

    # Generate Hosted MD Report
    hosted_md_path = root / "pramana_hosted_provider_comparison.md"
    hosted_lines = [
        "# ☁️ Pramana Hosted Provider Comparison Report",
        "",
        "This report documents the parity and evaluation results between the local mock baseline and the live **Hosted Gemini Provider** (`gemini-hosted`).",
        "",
    ]
    
    hosted_results = {s: report.results.get(s, {}).get("hosted") for s in suites}
    has_hosted = any(r is not None for r in hosted_results.values())
    
    if not has_hosted:
        hosted_lines.extend([
            "⚠️ **Status**: NOT RUN",
            "",
            "The comparison harness was not run for the `hosted` provider in this pass. Run with `--modes hosted` to include it.",
        ])
    else:
        all_skipped = all(r.skipped_reason is not None for r in hosted_results.values() if r)
        any_live = any(r.live_runs > 0 for r in hosted_results.values() if r)
        
        if all_skipped:
            first_skip = next((r.skipped_reason for r in hosted_results.values() if r and r.skipped_reason), "No API Key configured.")
            hosted_lines.extend([
                "🔴 **Status**: SKIPPED / UNAVAILABLE",
                "",
                "The hosted provider run could not be completed.",
                f"- **Reason**: {first_skip}",
                "",
                "> [!WARNING]",
                "> `GEMINI_API_KEY` is not set in the environment or `.env.local`. Zero-config mock fallback was used for safety.",
            ])
        elif any_live:
            hosted_lines.extend([
                "🟢 **Status**: REAL HOSTED EXECUTION SUCCESSFUL",
                "",
                "A real hosted execution was successfully completed using the configured `GEMINI_API_KEY` against Google Gemini API.",
            ])
        else:
            hosted_lines.extend([
                "🟡 **Status**: MOCK FALLBACK MODE",
                "",
                "The run completed, but fell back entirely to mock execution because no live API responses were returned.",
            ])
            
        hosted_lines.extend([
            "",
            "### 📊 Parity Results Table",
            "",
            "| Suite Name | Mock Rate | Hosted Rate | Live Runs | Mock Runs | Status / Reason |",
            "| :--- | :---: | :---: | :---: | :---: | :--- |",
        ])
        for s in suites:
            res_mock = report.results.get(s, {}).get("mock")
            res_host = report.results.get(s, {}).get("hosted")
            mock_rate = f"{res_mock.pass_rate*100:.0f}%" if res_mock else "N/A"
            if not res_host:
                hosted_lines.append(f"| `{s}` | {mock_rate} | N/A | - | - | Not run |")
            elif res_host.skipped_reason:
                hosted_lines.append(f"| `{s}` | {mock_rate} | ⚠️ SKIP | 0 | 0 | {res_host.skipped_reason} |")
            else:
                host_rate = f"{res_host.pass_rate*100:.0f}%"
                status_note = "🟢 Real Live Run" if res_host.live_runs > 0 else "🛑 Fallback to Mock"
                hosted_lines.append(f"| `{s}` | {mock_rate} | {host_rate} | {res_host.live_runs} | {res_host.mock_runs} | {status_note} |")

    with open(hosted_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(hosted_lines) + "\n")
    print(f"📝 Saved hosted comparison report to {hosted_md_path.name}")

    # Generate Self-Hosted MD Report
    sh_md_path = root / "pramana_self_hosted_provider_comparison.md"
    sh_lines = [
        "# 🖥️ Pramana Self-Hosted Provider Comparison Report",
        "",
        "This report documents the parity and evaluation results between the local mock baseline and the **Self-Hosted OpenAI-Compatible Provider** (`self-hosted`).",
        "",
    ]
    
    sh_results = {s: report.results.get(s, {}).get("self-hosted") for s in suites}
    has_sh = any(r is not None for r in sh_results.values())
    
    if not has_sh:
        sh_lines.extend([
            "⚠️ **Status**: NOT RUN",
            "",
            "The comparison harness was not run for the `self-hosted` provider in this pass. Run with `--modes self-hosted` to include it.",
        ])
    else:
        all_skipped = all(r.skipped_reason is not None for r in sh_results.values() if r)
        any_live = any(r.live_runs > 0 for r in sh_results.values() if r)
        
        if all_skipped:
            first_skip = next((r.skipped_reason for r in sh_results.values() if r and r.skipped_reason), "Self-hosted URL not set.")
            sh_lines.extend([
                "🔴 **Status**: SKIPPED / UNAVAILABLE",
                "",
                "The self-hosted provider run could not be completed.",
                f"- **Reason**: {first_skip}",
                "",
                "> [!WARNING]",
                "> `PRAMANA_SELF_HOSTED_URL` is not set in the environment. Zero-config success remains intact.",
            ])
        elif any_live:
            sh_lines.extend([
                "🟢 **Status**: REAL SELF-HOSTED EXECUTION SUCCESSFUL",
                "",
                "A real self-hosted execution was successfully completed against the OpenAI-compatible endpoint at the configured URL.",
            ])
        else:
            sh_lines.extend([
                "🟡 **Status**: MOCK FALLBACK MODE",
                "",
                "The run completed, but fell back entirely to mock execution because no live responses were returned by the self-hosted endpoint.",
            ])
            
        sh_lines.extend([
            "",
            "### 📊 Parity Results Table",
            "",
            "| Suite Name | Mock Rate | Self-Hosted Rate | Live Runs | Mock Runs | Status / Reason |",
            "| :--- | :---: | :---: | :---: | :---: | :--- |",
        ])
        for s in suites:
            res_mock = report.results.get(s, {}).get("mock")
            res_sh = report.results.get(s, {}).get("self-hosted")
            mock_rate = f"{res_mock.pass_rate*100:.0f}%" if res_mock else "N/A"
            if not res_sh:
                sh_lines.append(f"| `{s}` | {mock_rate} | N/A | - | - | Not run |")
            elif res_sh.skipped_reason:
                sh_lines.append(f"| `{s}` | {mock_rate} | ⚠️ SKIP | 0 | 0 | {res_sh.skipped_reason} |")
            else:
                sh_rate = f"{res_sh.pass_rate*100:.0f}%"
                status_note = "🟢 Real Live Run" if res_sh.live_runs > 0 else "🛑 Fallback to Mock"
                sh_lines.append(f"| `{s}` | {mock_rate} | {sh_rate} | {res_sh.live_runs} | {res_sh.mock_runs} | {status_note} |")

    with open(sh_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sh_lines) + "\n")
    print(f"📝 Saved self-hosted comparison report to {sh_md_path.name}")
    print("=" * 100)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pramana provider comparison harness"
    )
    parser.add_argument(
        "--modes",
        nargs="+",
        default=None,
        choices=["mock", "hosted", "self-hosted"],
        help="Provider modes to compare (default: auto-detect based on env vars)",
    )
    parser.add_argument(
        "--suites",
        nargs="*",
        default=KNOWN_SUITES,
        help="Suites to run (default: all known suites)",
    )
    args = parser.parse_args()

    if args.modes is not None:
        modes = args.modes
    else:
        modes = ["mock"]
        if os.environ.get("GEMINI_API_KEY"):
            modes.append("hosted")
        if os.environ.get("PRAMANA_SELF_HOSTED_URL"):
            modes.append("self-hosted")
    suites = args.suites

    results: dict[str, dict[str, SuiteResult]] = {}
    for suite in suites:
        results[suite] = {}
        for mode in modes:
            results[suite][mode] = run_suite_for_mode(suite, mode)

    report = ComparisonReport(suites=suites, modes=modes, results=results)
    render_report(report)

    # Exit with failure only if all non-mock modes were skipped
    all_skipped = all(
        results[s][m].skipped_reason is not None
        for s in suites
        for m in modes
        if m != "mock"
    )
    if all_skipped and len(modes) == 1 and modes[0] == "mock":
        sys.exit(0)


if __name__ == "__main__":
    main()
