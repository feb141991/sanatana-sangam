from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass(slots=True)
class ContentSegment:
    ref: str
    text: str
    sanskrit: str | None = None
    transliteration: str | None = None



@dataclass(slots=True)
class DocumentManifest:
    doc_id: str
    title: str
    tradition: str
    scripture_family: str
    section_id: str
    source_name: str
    source_url: str
    source_owner: str
    source_class: str
    rights_status: str
    language: str
    script: str
    is_live_in_app: bool
    companion_only: bool
    audio_status: str
    revision_note: str
    content: list[ContentSegment] = field(default_factory=list)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "DocumentManifest":
        segments = [
            ContentSegment(
                ref=item["ref"],
                text=item["text"],
                sanskrit=item.get("sanskrit"),
                transliteration=item.get("transliteration"),
            )
            for item in payload.get("content", [])
        ]
        return cls(
            doc_id=payload["doc_id"],
            title=payload["title"],
            tradition=payload["tradition"],
            scripture_family=payload["scripture_family"],
            section_id=payload["section_id"],
            source_name=payload["source_name"],
            source_url=payload["source_url"],
            source_owner=payload["source_owner"],
            source_class=payload["source_class"],
            rights_status=payload["rights_status"],
            language=payload["language"],
            script=payload["script"],
            is_live_in_app=payload["is_live_in_app"],
            companion_only=payload["companion_only"],
            audio_status=payload["audio_status"],
            revision_note=payload["revision_note"],
            content=segments,
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
