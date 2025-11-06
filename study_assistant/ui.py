"""Utilities for rendering a polished command-line experience."""
from __future__ import annotations

import shutil
import sys
import textwrap
from datetime import datetime
from typing import Iterable, List, Optional, Sequence, Tuple, Union

from .document_store import Document, DocumentStore
from .personalization import LearnerProfile


class StyledConsole:
    """Render structured, colorful sections for CLI interactions."""

    RESET = "\033[0m"

    def __init__(
        self,
        *,
        width: Optional[int] = None,
        enable_color: bool = True,
        stream = None,
    ) -> None:
        terminal_width = shutil.get_terminal_size((100, 20)).columns
        computed_width = width or terminal_width
        self.width = max(60, min(computed_width, 120))
        self.enable_color = enable_color
        self.stream = stream or sys.stdout
        self.palette = {
            "accent": "\033[95m",
            "highlight": "\033[96m",
            "muted": "\033[90m",
            "text": "\033[97m",
        }

    # ------------------------------------------------------------------
    # Generic formatting helpers
    # ------------------------------------------------------------------
    def _colorize(self, text: str, color: Optional[str]) -> str:
        if not self.enable_color or not color:
            return text
        code = self.palette.get(color, color)
        return f"{code}{text}{self.RESET}"

    def _write(self, text: str = "", *, color: Optional[str] = None) -> None:
        rendered = self._colorize(text, color)
        self.stream.write(rendered + "\n")
        self.stream.flush()

    def _center_line(self, text: str) -> str:
        max_width = self.width - 2
        if len(text) > max_width:
            text = textwrap.shorten(text, width=max_width, placeholder="…")
        return text.center(max_width)

    def _truncate(self, text: str, width: int) -> str:
        if len(text) <= width:
            return text + " " * (width - len(text))
        return textwrap.shorten(text, width=width, placeholder="…").ljust(width)

    def _normalize_body(self, body: Union[str, Sequence[str]]) -> List[str]:
        if isinstance(body, str):
            return body.splitlines() or [""]
        return [str(line) for line in body] or [""]

    def _wrap_body(self, lines: Sequence[str]) -> List[str]:
        wrapped: List[str] = []
        inner_width = self.width - 4
        for line in lines:
            if not line:
                wrapped.append("")
                continue
            segments = textwrap.wrap(
                line,
                inner_width,
                break_long_words=False,
                replace_whitespace=False,
            )
            if not segments:
                wrapped.append("")
            else:
                wrapped.extend(segments)
        return wrapped

    def _panel(self, title: str, body: Union[str, Sequence[str]], *, accent: str = "accent") -> None:
        normalized = self._normalize_body(body)
        wrapped = self._wrap_body(normalized)
        top_border = "┌" + "─" * (self.width - 2) + "┐"
        divider = "├" + "─" * (self.width - 2) + "┤"
        bottom_border = "└" + "─" * (self.width - 2) + "┘"
        title_line = f"│ {self._truncate(title, self.width - 4)} │"

        self._write(top_border, color=accent)
        self._write(title_line, color="highlight")
        self._write(divider, color=accent)
        for line in wrapped:
            padded = line.ljust(self.width - 4)
            self._write(f"│ {padded} │", color="text")
        self._write(bottom_border, color=accent)

    # ------------------------------------------------------------------
    # Public rendering helpers
    # ------------------------------------------------------------------
    def print_header(self, title: str, *, subtitle: Optional[str] = None) -> None:
        border = "═" * (self.width - 2)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        self._write(f"╔{border}╗", color="accent")
        self._write(f"║{self._center_line(f'📚 {title}')}║", color="highlight")
        if subtitle:
            self._write(f"║{self._center_line(subtitle)}║", color="text")
        self._write(f"║{self._center_line(timestamp)}║", color="muted")
        self._write(f"╚{border}╝", color="accent")

    def print_overview(
        self,
        *,
        topic: str,
        focus: Optional[str],
        mode_label: str,
        extras: Optional[Iterable[Tuple[str, str]]] = None,
    ) -> None:
        lines: List[str] = [f"Mode: {mode_label}", f"Topic: {topic}"]
        if focus:
            lines.append(f"Focus: {focus}")
        if extras:
            for label, value in extras:
                lines.append(f"{label}: {value}")
        self._panel("Session Overview", lines)

    def print_documents(self, documents: Iterable[Document], *, store: Optional[DocumentStore] = None) -> None:
        docs = list(documents)
        if not docs:
            self._panel(
                "Trusted Materials",
                "No documents were supplied. Responses will rely solely on the prompts you provide.",
            )
            return

        lines: List[str] = []
        for index, document in enumerate(docs, start=1):
            trusted = store.is_trusted(document) if store else True
            badge = "✅ trusted" if trusted else "⚠️ review"
            lines.append(f"{index}. {document.title} ({badge})")
            lines.append(f"   Source: {document.source}")
            snippet_source = document.content.strip().splitlines()
            if snippet_source:
                snippet = snippet_source[0].strip()
                if len(snippet) > 68:
                    snippet = textwrap.shorten(snippet, width=68, placeholder="…")
                lines.append(f"   Preview: {snippet}")
        self._panel("Trusted Materials", lines)

    def print_profile(self, profile: LearnerProfile) -> None:
        summary_lines = profile.summarize_profile().splitlines()
        if profile.weakness_notes:
            summary_lines.append("")
            summary_lines.append("Weaknesses:")
            for topic, note in profile.weakness_notes.items():
                summary_lines.append(f"- {topic}: {note}")
        self._panel("Learner Profile", summary_lines)

    def print_result(self, title: str, body: str) -> None:
        if body.strip().startswith("[GPTClient]"):
            self._render_stub_completion(title, body)
        else:
            self._panel(title, body)

    # ------------------------------------------------------------------
    # Specialized renderers
    # ------------------------------------------------------------------
    def _render_stub_completion(self, title: str, payload: str) -> None:
        lines = payload.splitlines()
        if not lines:
            self._panel(title, "(no response)")
            return

        headline = lines[0]
        metadata: List[str] = []
        prompt_lines: List[str] = []
        for index, line in enumerate(lines[1:], start=1):
            if line.startswith("Messages:"):
                prompt_lines = lines[index + 1 :]
                break
            if line.strip():
                metadata.append(line.strip())

        formatted_meta: List[str] = []
        for entry in metadata:
            if ":" in entry:
                key, value = entry.split(":", 1)
                formatted_meta.append(f"{key.strip()}: {value.strip()}")
            else:
                formatted_meta.append(entry)

        self._panel(title, headline)
        if formatted_meta:
            self._panel("Model Settings", formatted_meta, accent="muted")
        if prompt_lines:
            preview = "\n".join(prompt_lines[:8])
            if len(prompt_lines) > 8:
                preview += "\n…"
            self._panel("Prompt Preview", preview, accent="muted")

__all__ = ["StyledConsole"]
