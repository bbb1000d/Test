"""Learner profiling and personalization utilities."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .gpt_client import GPTClient


@dataclass
class QuestionnaireResponse:
    """Represents a learner's answers to study habit questions."""

    question: str
    answer: str


@dataclass
class LearnerProfile:
    """Encapsulates the state of a learner."""

    learner_id: str
    goals: List[str] = field(default_factory=list)
    preferred_modalities: List[str] = field(default_factory=list)
    questionnaire: List[QuestionnaireResponse] = field(default_factory=list)
    weakness_notes: Dict[str, str] = field(default_factory=dict)

    def register_goal(self, goal: str) -> None:
        if goal not in self.goals:
            self.goals.append(goal)

    def add_modalities(self, *modalities: str) -> None:
        for modality in modalities:
            if modality not in self.preferred_modalities:
                self.preferred_modalities.append(modality)

    def answer_questionnaire(self, question: str, answer: str) -> None:
        self.questionnaire.append(QuestionnaireResponse(question=question, answer=answer))

    def register_weakness(self, topic: str, note: str) -> None:
        self.weakness_notes[topic] = note

    def summarize_profile(self, client: Optional[GPTClient] = None) -> str:
        """Return a human friendly representation of the learner."""

        raw_summary = (
            f"Learner: {self.learner_id}\n"
            f"Goals: {', '.join(self.goals) or 'n/a'}\n"
            f"Preferred modalities: {', '.join(self.preferred_modalities) or 'n/a'}\n"
            "Questionnaire:\n"
        )
        for response in self.questionnaire:
            raw_summary += f"- {response.question}: {response.answer}\n"

        if not client:
            return raw_summary

        system_prompt = (
            "You are an educational coach summarizing a learner profile."
            " Provide concise insights focusing on study habits and motivational"
            " cues."
        )
        return client.complete_from_prompt(system_prompt, raw_summary, max_tokens=256)
