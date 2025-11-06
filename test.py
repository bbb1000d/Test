"""Quick demonstration of the study assistant orchestration."""
from study_assistant.document_store import DocumentStore
from study_assistant.gpt_client import GPTClient
from study_assistant.knowledge_engine import StudyOrchestrator, StudyRequest
from study_assistant.personalization import LearnerProfile
from study_assistant.ui import StyledConsole


if __name__ == "__main__":
    store = DocumentStore()
    store.add_document(
        document_id="lecture-1",
        title="Biology Lecture",
        content="Detailed lecture notes on mitosis with diagrams and lab results.",
        source="user:uploaded/biology_lecture.txt",
    )

    profile = LearnerProfile(learner_id="demo-student")
    profile.register_goal("Master mitosis before the exam")
    profile.add_modalities("visual", "practice")
    profile.answer_questionnaire("Study session length?", "45 minutes")
    profile.register_weakness("Telophase", "Struggle to differentiate plant vs animal cells")

    client = GPTClient()
    orchestrator = StudyOrchestrator(client, store)

    request = StudyRequest(learner_id="demo-student", topic="Mitosis", focus="Anaphase mechanics")
    notes = orchestrator.generate_notes(request, profile)
    quiz = orchestrator.build_micro_assessment(topic="Mitosis", scope="Chromosome separation", question_count=3)

    console = StyledConsole()
    console.print_header("Study Assistant Demo", subtitle="Mitosis • Notes & Quiz")
    console.print_overview(
        topic=request.topic,
        focus=request.focus,
        mode_label="Demonstration",
        extras=[("Assessments", "Personalized notes and a 3-question quiz")],
    )
    console.print_documents(store.list_documents(), store=store)
    console.print_profile(profile)
    console.print_result("Personalized Notes", notes)
    console.print_result("Micro Assessment", quiz)
