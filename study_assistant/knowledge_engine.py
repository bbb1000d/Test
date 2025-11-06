"""Core orchestration logic for the study assistant."""
from __future__ import annotations

from dataclasses import dataclass
from textwrap import dedent
from typing import Dict, Iterable, List, Sequence

from .document_store import Document, DocumentStore
from .gpt_client import GPTClient, GPTMessage
from .personalization import LearnerProfile


@dataclass
class StudyRequest:
    """Represents a learner query."""

    learner_id: str
    topic: str
    focus: str
    mode: str = "study_notes"


class StudyOrchestrator:
    """Generate targeted study guidance using provided materials."""

    def __init__(self, client: GPTClient, store: DocumentStore) -> None:
        self.client = client
        self.store = store

    def _build_context(self, documents: Iterable[Document]) -> str:
        """Serialize relevant documents for prompt injection."""

        snippets: List[str] = []
        for document in documents:
            snippets.append(
                dedent(
                    f"""
                    <document id="{document.id}" title="{document.title}" source="{document.source}">
                    {document.content.strip()[:4000]}
                    </document>
                    """
                ).strip()
            )
        return "\n\n".join(snippets)

    def _trusted_context(self) -> str:
        return self._build_context(self.store.iter_trusted_documents())

    def generate_notes(self, request: StudyRequest, profile: LearnerProfile) -> str:
        """Craft long-form study notes tailored to the learner."""

        system_prompt = dedent(
            """
            You are a meticulous study coach. Only reference the provided documents.
            Prioritize accuracy, plain language, and well-structured sections.
            Never invent facts or use unverified sources.
            """
        ).strip()
        user_prompt = dedent(
            f"""
            Learner ID: {request.learner_id}
            Topic: {request.topic}
            Focus: {request.focus}
            Preferred modalities: {', '.join(profile.preferred_modalities) or 'n/a'}
            Goals: {', '.join(profile.goals) or 'n/a'}

            Trusted materials:
            {self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=1024)

    def diagnose_weaknesses(self, request: StudyRequest, profile: LearnerProfile) -> str:
        """Highlight knowledge gaps from previous assessments."""

        weakness_report = "\n".join(f"- {topic}: {note}" for topic, note in profile.weakness_notes.items()) or "n/a"
        system_prompt = dedent(
            """
            You are an educational diagnostician. Analyze the learner's prior results
            and propose targeted remediation paths. Use only trusted documents for
            factual statements.
            """
        ).strip()
        user_prompt = dedent(
            f"""
            Learner ID: {request.learner_id}
            Topic: {request.topic}
            Known weaknesses:\n{weakness_report}

            Trusted materials:\n{self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=768)

    def build_micro_assessment(self, *, topic: str, scope: str, question_count: int = 5) -> str:
        """Generate a short formative quiz."""

        system_prompt = dedent(
            """
            You design diagnostic quizzes. Each question should target a single
            learning objective and include an answer key. Stay aligned with the
            provided curriculum excerpts.
            """
        ).strip()
        user_prompt = dedent(
            f"""
            Topic: {topic}
            Scope: {scope}
            Number of questions: {question_count}

            Trusted materials:\n{self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=512)

    def build_capstone_assessment(self, *, topic: str, weight: str, style: str) -> str:
        """Generate a comprehensive assessment mimicking instructor style."""

        system_prompt = dedent(
            """
            You are emulating an instructor's assessment style using their previous
            exams. Construct a rigorous evaluation with sectioned tasks, ranging from
            conceptual prompts to applied scenarios. Reference only the materials in
            context.
            """
        ).strip()
        user_prompt = dedent(
            f"""
            Topic: {topic}
            Assessment weight: {weight}
            Instructor style: {style}

            Trusted materials:\n{self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=1024)

    def apply_knowledge_activity(self, *, topic: str, scenario: str) -> str:
        """Create an applied learning activity to reinforce knowledge."""

        system_prompt = dedent(
            """
            You create practice scenarios that force learners to apply knowledge in
            realistic situations. Each activity should include steps, reflection
            prompts, and evaluation criteria.
            """
        ).strip()
        user_prompt = dedent(
            f"""
            Topic: {topic}
            Scenario outline: {scenario}

            Trusted materials:\n{self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=640)

    def adaptive_study_plan(self, *, profile: LearnerProfile, target_topic: str) -> str:
        """Combine notes, weaknesses, and assessments into a plan."""

        system_prompt = dedent(
            """
            You are a senior instructional designer. Build a multi-phase study plan
            that considers the learner profile, notes, weaknesses, and assessment
            cadence.
            """
        ).strip()
        user_prompt = dedent(
            f"""
            Learner profile:
            {profile.summarize_profile()}

            Target topic: {target_topic}

            Trusted materials:\n{self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=896)

    def conversation(self, *, history: Sequence[GPTMessage], new_message: str) -> str:
        """Continue an interactive tutoring dialogue."""

        context = self._trusted_context()
        messages = list(history)
        messages.append(GPTMessage(role="user", content=f"{new_message}\n\nTrusted materials:\n{context}"))
        return self.client.complete(messages, max_tokens=512)

    def review_cycle(self, checkpoints: Dict[str, str]) -> str:
        """Summarize learning progress across checkpoints."""

        system_prompt = dedent(
            """
            You analyze study checkpoints and highlight improvements, persistent
            gaps, and recommended next steps.
            """
        ).strip()
        formatted_checkpoints = "\n".join(f"- {label}: {summary}" for label, summary in checkpoints.items())
        user_prompt = dedent(
            f"""
            Checkpoints:\n{formatted_checkpoints}

            Trusted materials:\n{self._trusted_context()}
            """
        ).strip()
        return self.client.complete_from_prompt(system_prompt, user_prompt, max_tokens=512)
