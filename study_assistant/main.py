"""Command line interface for the study assistant prototype."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import List

from .document_store import DocumentStore
from .gpt_client import GPTClient, GPTMessage
from .knowledge_engine import StudyOrchestrator, StudyRequest
from .personalization import LearnerProfile


def load_documents(store: DocumentStore, paths: List[str]) -> None:
    for raw_path in paths:
        path = Path(raw_path).expanduser().resolve()
        store.add_from_path(path)


def build_profile(args: argparse.Namespace) -> LearnerProfile:
    profile = LearnerProfile(learner_id=args.learner_id)
    for goal in args.goal:
        profile.register_goal(goal)
    if args.modalities:
        profile.add_modalities(*args.modalities)
    for qa in args.questionnaire:
        question, answer = qa.split("=", 1)
        profile.answer_questionnaire(question, answer)
    return profile


def run() -> None:
    parser = argparse.ArgumentParser(description="Personalized study assistant prototype")
    parser.add_argument("topic", help="Topic to study")
    parser.add_argument("focus", help="Specific focus within the topic")
    parser.add_argument("documents", nargs="*", help="Paths to trusted documents (txt/pdf excerpts)")
    parser.add_argument("--learner-id", default="student-001", help="Identifier for the learner")
    parser.add_argument("--goal", action="append", default=[], help="Study goals")
    parser.add_argument(
        "--modalities",
        nargs="*",
        default=[],
        help="Preferred learning modalities such as 'visual', 'practice', 'mnemonics'",
    )
    parser.add_argument(
        "--questionnaire",
        action="append",
        default=[],
        metavar="QUESTION=ANSWER",
        help="Add questionnaire responses",
    )
    parser.add_argument(
        "--weakness",
        action="append",
        default=[],
        metavar="TOPIC=NOTE",
        help="Register known weaknesses",
    )
    parser.add_argument("--mode", choices=["notes", "weaknesses", "micro", "capstone", "apply", "plan"], default="notes")
    parser.add_argument("--quiz-scope", default="Chapter 1", help="Scope for micro assessment")
    parser.add_argument("--quiz-questions", type=int, default=5, help="Number of micro assessment questions")
    parser.add_argument("--capstone-weight", default="40%", help="Weight for capstone assessment")
    parser.add_argument("--capstone-style", default="Matches prior instructor exams", help="Stylistic notes")
    parser.add_argument("--scenario", default="Real-world case study", help="Scenario for applied activity")
    parser.add_argument(
        "--history",
        action="append",
        default=[],
        metavar="ROLE:MESSAGE",
        help="Existing conversation history entries",
    )
    args = parser.parse_args()

    store = DocumentStore()
    if args.documents:
        load_documents(store, args.documents)

    profile = build_profile(args)
    for weakness in args.weakness:
        topic, note = weakness.split("=", 1)
        profile.register_weakness(topic, note)

    client = GPTClient()
    orchestrator = StudyOrchestrator(client, store)

    if args.mode == "notes":
        request = StudyRequest(learner_id=args.learner_id, topic=args.topic, focus=args.focus)
        output = orchestrator.generate_notes(request, profile)
    elif args.mode == "weaknesses":
        request = StudyRequest(learner_id=args.learner_id, topic=args.topic, focus=args.focus)
        output = orchestrator.diagnose_weaknesses(request, profile)
    elif args.mode == "micro":
        output = orchestrator.build_micro_assessment(
            topic=args.topic,
            scope=args.quiz_scope,
            question_count=args.quiz_questions,
        )
    elif args.mode == "capstone":
        output = orchestrator.build_capstone_assessment(
            topic=args.topic,
            weight=args.capstone_weight,
            style=args.capstone_style,
        )
    elif args.mode == "apply":
        output = orchestrator.apply_knowledge_activity(topic=args.topic, scenario=args.scenario)
    elif args.mode == "plan":
        output = orchestrator.adaptive_study_plan(profile=profile, target_topic=args.topic)
    else:
        request = StudyRequest(learner_id=args.learner_id, topic=args.topic, focus=args.focus)
        history: List[GPTMessage] = []
        for entry in args.history:
            role, message = entry.split(":", 1)
            history.append(GPTMessage(role=role, content=message))
        output = orchestrator.conversation(history=history, new_message=args.focus)

    print(output)


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    run()
