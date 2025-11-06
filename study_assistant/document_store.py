"""In-memory document storage and retrieval utilities."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional


@dataclass
class Document:
    """Represents a learner provided document."""

    id: str
    title: str
    content: str
    source: str


@dataclass
class DocumentStore:
    """Persist and retrieve study materials."""

    documents: Dict[str, Document] = field(default_factory=dict)

    def add_document(
        self,
        *,
        document_id: str,
        title: str,
        content: str,
        source: str,
    ) -> None:
        """Register a new document."""

        self.documents[document_id] = Document(
            id=document_id,
            title=title,
            content=content,
            source=source,
        )

    def add_from_path(self, path: Path, *, document_id: Optional[str] = None) -> None:
        """Load a document from disk and add it to the store."""

        final_id = document_id or path.stem
        content = path.read_text(encoding="utf-8")
        self.add_document(document_id=final_id, title=path.name, content=content, source=str(path))

    def list_documents(self) -> List[Document]:
        """Return all stored documents."""

        return list(self.documents.values())

    def get_document(self, document_id: str) -> Optional[Document]:
        """Return a document if it exists."""

        return self.documents.get(document_id)

    def iter_trusted_documents(self) -> Iterable[Document]:
        """Yield only documents provided by the learner or trusted faculty."""

        for document in self.documents.values():
            if self._is_trusted_source(document.source):
                yield document

    def _is_trusted_source(self, source: str) -> bool:
        """Placeholder logic for filtering high quality materials."""

        trusted_keywords = (".edu", "syllabus", "notes", "lecture", "textbook")
        return source.startswith("user:") or source.endswith(".pdf") or any(k in source for k in trusted_keywords)
