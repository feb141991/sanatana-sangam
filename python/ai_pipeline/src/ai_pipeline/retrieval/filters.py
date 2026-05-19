from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class RetrievalFilters:
    tradition: str | None = None
    section_id: str | None = None
    scripture_family: str | None = None
    source_class: str | None = None
    rights_status: str | None = None
    language: str | None = None
    is_live_in_app: bool | None = None
    extra: dict[str, str] = field(default_factory=dict)
