"""Interactive command-line workspace for the study assistant."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, List, Optional

from .document_store import DocumentStore
from .gpt_client import GPTClient
from .knowledge_engine import StudyOrchestrator, StudyRequest
from .personalization import LearnerProfile
from .ui import StyledConsole


@dataclass
class SessionState:
    """Track the high-level parameters for an interactive session."""

    learner_id: str
    topic: str
    focus: str


class StudyAssistantApp:
    """Guide learners through an interactive, menu-driven experience."""

    def __init__(
        self,
        *,
        width: Optional[int] = None,
        enable_color: bool = True,
        console: Optional[StyledConsole] = None,
    ) -> None:
        self.console = console or StyledConsole(width=width, enable_color=enable_color)
        self.store = DocumentStore()
        self.profile = LearnerProfile(learner_id="interactive-learner")
        self.client = GPTClient()
        self.orchestrator = StudyOrchestrator(self.client, self.store)
        self.state: Optional[SessionState] = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def launch(self) -> None:
        """Run the interactive workflow until the learner exits."""

        self.console.print_header("Study Assistant", subtitle="Interactive workspace")
        self.console.print_result(
            "Welcome",
            (
                "Let's build a personalized study session together. "
                "You'll be able to add trusted materials, capture learning goals, "
                "and instantly generate notes, diagnostics, and assessments."
            ),
        )
        self._gather_session_details()
        self._refresh_dashboard()
        self._interaction_loop()
        self.console.print_result(
            "Session Complete",
            "Thanks for exploring the study assistant! Come back anytime to plan your next review.",
        )

    # ------------------------------------------------------------------
    # Session setup helpers
    # ------------------------------------------------------------------
    def _gather_session_details(self) -> None:
        learner_id = self.console.prompt("Learner name or ID", default=self.profile.learner_id, allow_empty=False)
        topic = self.console.prompt("What topic are you studying?", allow_empty=False)
        focus = self.console.prompt("Is there a specific focus?", default="General mastery")

        self.profile.learner_id = learner_id
        self.state = SessionState(learner_id=learner_id, topic=topic, focus=focus or "General mastery")

        self.console.print_result(
            "Add trusted materials",
            "Provide file paths to lecture notes, study guides, or syllabus excerpts. Leave blank when you're done.",
            accent="highlight",
        )
        self._add_documents()

        self.console.print_result(
            "Personalize your experience",
            "Add goals, study modalities, questionnaire responses, and known weak spots so guidance stays on target.",
            accent="highlight",
        )
        self._collect_profile_details()

    def _add_documents(self) -> None:
        while True:
            path_input = self.console.prompt("Document path (blank to continue)")
            if not path_input:
                break
            path = Path(path_input).expanduser()
            if not path.exists() or not path.is_file():
                self.console.print_result(
                    "Document not found",
                    f"Couldn't locate '{path}'. Please double-check the path and try again.",
                    accent="muted",
                )
                continue
            try:
                self.store.add_from_path(path)
            except UnicodeDecodeError:
                self.console.print_result(
                    "Unsupported file",
                    "Only UTF-8 text files are supported in this prototype. Try exporting your notes as .txt.",
                    accent="muted",
                )
                continue
            self.console.print_result(
                "Document added",
                f"Loaded {path.name} as a trusted study resource.",
                accent="highlight",
            )

    def _collect_profile_details(self) -> None:
        self.console.print_result(
            "Learning goals",
            "List what you want to achieve. Add one goal per line and press Enter on an empty line when finished.",
        )
        while True:
            goal = self.console.prompt("Add goal (blank to continue)")
            if not goal:
                break
            self.profile.register_goal(goal)

        self.console.print_result(
            "Preferred modalities",
            "Examples include visual, practice, spaced repetition, mnemonics, or discussion.",
        )
        while True:
            modality = self.console.prompt("Add modality (blank to continue)")
            if not modality:
                break
            self.profile.add_modalities(modality)

        self.console.print_result(
            "Study questionnaire",
            "Capture any study habits or constraints you'd like the assistant to remember.",
        )
        while True:
            question = self.console.prompt("Question (blank to continue)")
            if not question:
                break
            answer = self.console.prompt("Answer")
            self.profile.answer_questionnaire(question, answer)

        self.console.print_result(
            "Known weaknesses",
            "Flag areas that need extra attention to receive focused remediation guidance.",
        )
        while True:
            topic = self.console.prompt("Weakness topic (blank to continue)")
            if not topic:
                break
            note = self.console.prompt("What makes this challenging?")
            self.profile.register_weakness(topic, note)

    # ------------------------------------------------------------------
    # Menu loop
    # ------------------------------------------------------------------
    def _interaction_loop(self) -> None:
        actions: Dict[str, Callable[[], None]] = {
            "1": self._generate_notes,
            "2": self._diagnose_weaknesses,
            "3": self._micro_assessment,
            "4": self._capstone_assessment,
            "5": self._applied_activity,
            "6": self._study_plan,
            "7": self._refresh_dashboard,
            "8": self._add_documents,
            "9": self._collect_profile_details,
        }
        labels = {
            "1": "Personalized notes",
            "2": "Find weak spots",
            "3": "Create a micro assessment",
            "4": "Draft a capstone assessment",
            "5": "Design an applied activity",
            "6": "Build an adaptive study plan",
            "7": "Review session summary",
            "8": "Add more trusted documents",
            "9": "Update learner preferences",
        }

        while True:
            menu_text = "\n".join(f"{key}. {labels[key]}" for key in labels)
            self.console.print_result("What would you like to do next?", menu_text)
            choice = self.console.prompt("Choose an option or 'q' to finish", default="7")
            if choice.lower() == "q":
                break
            action = actions.get(choice)
            if not action:
                self.console.print_result(
                    "Invalid choice",
                    "Please select one of the menu options.",
                    accent="muted",
                )
                continue
            action()

    # ------------------------------------------------------------------
    # Action handlers
    # ------------------------------------------------------------------
    def _ensure_state(self) -> SessionState:
        if not self.state:
            raise RuntimeError("Session details have not been configured.")
        return self.state

    def _refresh_dashboard(self) -> None:
        state = self._ensure_state()
        extras: List = []
        if self.profile.goals:
            extras.append(("Goals", str(len(self.profile.goals))))
        if self.profile.preferred_modalities:
            extras.append(("Modalities", ", ".join(self.profile.preferred_modalities)))
        self.console.print_overview(
            topic=state.topic,
            focus=state.focus,
            mode_label="Interactive session",
            extras=extras,
        )
        self.console.print_documents(self.store.list_documents(), store=self.store)
        self.console.print_profile(self.profile)

    def _build_request(self) -> StudyRequest:
        state = self._ensure_state()
        return StudyRequest(learner_id=state.learner_id, topic=state.topic, focus=state.focus)

    def _generate_notes(self) -> None:
        request = self._build_request()
        notes = self.orchestrator.generate_notes(request, self.profile)
        self.console.print_result("Personalized Notes", notes)

    def _diagnose_weaknesses(self) -> None:
        request = self._build_request()
        result = self.orchestrator.diagnose_weaknesses(request, self.profile)
        self.console.print_result("Weakness Diagnosis", result)

    def _micro_assessment(self) -> None:
        state = self._ensure_state()
        scope_default = f"{state.focus} checkpoint" if state.focus else state.topic
        scope = self.console.prompt("What should the quiz focus on?", default=scope_default or state.topic)
        question_count = self._prompt_int("How many questions?", default=5, minimum=1)
        quiz = self.orchestrator.build_micro_assessment(
            topic=state.topic,
            scope=scope,
            question_count=question_count,
        )
        self.console.print_result("Micro Assessment", quiz)

    def _capstone_assessment(self) -> None:
        state = self._ensure_state()
        weight = self.console.prompt("Assessment weight", default="40%")
        style = self.console.prompt("Instructor style notes", default="Matches prior instructor exams")
        assessment = self.orchestrator.build_capstone_assessment(
            topic=state.topic,
            weight=weight,
            style=style,
        )
        self.console.print_result("Capstone Assessment", assessment)

    def _applied_activity(self) -> None:
        state = self._ensure_state()
        scenario = self.console.prompt("Describe the real-world scenario", default="Real-world case study")
        activity = self.orchestrator.apply_knowledge_activity(topic=state.topic, scenario=scenario)
        self.console.print_result("Applied Activity", activity)

    def _study_plan(self) -> None:
        state = self._ensure_state()
        plan = self.orchestrator.adaptive_study_plan(profile=self.profile, target_topic=state.topic)
        self.console.print_result("Adaptive Study Plan", plan)

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------
    def _prompt_int(self, label: str, *, default: int, minimum: int = 1) -> int:
        while True:
            response = self.console.prompt(label, default=str(default))
            try:
                value = int(response)
            except ValueError:
                self.console.print_result(
                    "Invalid number",
                    "Please enter a whole number (e.g. 5).",
                    accent="muted",
                )
                continue
            if value < minimum:
                self.console.print_result(
                    "Number too small",
                    f"Enter a number greater than or equal to {minimum}.",
                    accent="muted",
                )
                continue
            return value


def main() -> None:  # pragma: no cover - manual interaction only
    app = StudyAssistantApp()
    app.launch()


if __name__ == "__main__":  # pragma: no cover
    main()
