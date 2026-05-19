from __future__ import annotations

from pathlib import Path


def describe_training_run(config_path: str | Path) -> dict[str, str]:
    return {
        "config_path": str(config_path),
        "status": "placeholder",
        "message": "Training is intentionally not implemented until retrieval and eval baselines are stable.",
    }
