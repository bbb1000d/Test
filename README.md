# Study Assistant Prototype

This repository contains a prototype architecture for a GPT-powered study
assistant that personalizes learning based on uploaded documents, learner
questionnaires, and assessment history. The goal is to provide long-form notes,
detect weaknesses, create chapter-sized quizzes, and design capstone
assessments aligned with instructor styles while relying solely on trusted
materials.

## Features

- **Document ingestion** with trust filtering to avoid unverified sources.
- **Learner profiling** capturing goals, study modalities, and questionnaire
  responses.
- **Adaptive orchestration** that generates study notes, weakness diagnostics,
  micro assessments, capstone assessments, applied practice activities, and
  multi-phase study plans.
- **Interactive conversations** that always ground responses in the provided
  materials.

## Running the CLI

```bash
python -m study_assistant.main "Cell Biology" "Focus on mitosis" ./examples/mitosis_notes.txt \
  --goal "Ace final exam" --modalities visual practice \
  --questionnaire "Study session length?=45 minutes" \
  --weakness "Cytokinesis=Confused about plant vs animal cells"
```

The CLI now renders a polished dashboard that summarizes the session, trusted
materials, and the GPT prompt preview. Disable color output with
`--no-color` or resize the layout with `--width=<columns>`. To integrate with
OpenAI's API replace the `GPTClient.complete` method with a real API call.

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      📚 Study Assistant                                     ║
║                              Cell Biology • Personalized Notes                              ║
║                                       2025-11-06 11:07                                      ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Session Overview                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Mode: Personalized Notes                                                                    │
│ Topic: Cell Biology                                                                         │
│ Focus: Focus on mitosis                                                                     │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Subsequent panels list the trusted documents, learner profile, and a formatted
preview of the prompt that will be sent to the model.

## Integrating Real Models

1. Install the OpenAI Python SDK.
2. Update `GPTClient.complete` to call the `chat.completions` endpoint.
3. Inject your API key via environment variables or a secrets manager.
4. Consider caching completions to reduce latency and cost.

## Trusted Source Strategy

The `DocumentStore` currently accepts any file path but prioritizes documents
with trusted indicators such as `.pdf` extensions, syllabus mentions, or
explicit `user:` prefixes. Extend `_is_trusted_source` with institution-specific
logic or integrate with a content moderation pipeline.

## Extending the System

- Connect to a vector store (e.g., FAISS) for semantic retrieval.
- Add evaluation loops capturing learner quiz performance.
- Build a frontend using React or Flutter that invokes the orchestration API.
- Persist learner profiles and documents in a database for multi-device access.
