from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class GatewayRequest:
    feature: str
    prompt: str
    context: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


def build_gateway_payload(request: GatewayRequest) -> dict[str, Any]:
    return {
        "feature": request.feature,
        "prompt": request.prompt,
        "context": request.context,
        "metadata": request.metadata,
    }
