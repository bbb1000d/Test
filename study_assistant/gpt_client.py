"""Utility for interacting with a GPT model.

This module wraps interactions with GPT-like models. In production you would
connect this to OpenAI's API or an on-premise deployment. For local
experimentation we only log the prompts so they can be inspected during unit
tests.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Mapping, Optional


@dataclass
class GPTMessage:
    """Represents a single conversational message."""

    role: str
    content: str


class GPTClient:
    """High-level GPT client with prompt templating helpers."""

    def __init__(self, model: str = "gpt-5-codex", temperature: float = 0.3) -> None:
        self.model = model
        self.temperature = temperature

    def complete(self, messages: Iterable[GPTMessage], *, max_tokens: int = 512) -> str:
        """Call the underlying model and return the response.

        This is a stub implementation. Replace the body with a call to the
        actual SDK (for example ``openai.ChatCompletion.create``) when wiring the
        application to a backend model.
        """

        transcript = "\n".join(f"{msg.role}: {msg.content}" for msg in messages)
        debug_output = (
            "[GPTClient] This is a stubbed response. Configure the OpenAI SDK "
            "to obtain real completions.\n"
            f"Model: {self.model}\n"
            f"Temperature: {self.temperature}\n"
            f"Max tokens: {max_tokens}\n"
            f"Messages:\n{transcript}"
        )
        return debug_output

    def complete_from_prompt(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        max_tokens: int = 512,
        extra_messages: Optional[Iterable[Mapping[str, str]]] = None,
    ) -> str:
        """Helper for building structured prompts."""

        messages: List[GPTMessage] = [
            GPTMessage(role="system", content=system_prompt),
            GPTMessage(role="user", content=user_prompt),
        ]

        if extra_messages:
            messages.extend(GPTMessage(role=m["role"], content=m["content"]) for m in extra_messages)

        return self.complete(messages, max_tokens=max_tokens)
