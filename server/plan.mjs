import { createId } from './util.mjs';

export function generateLearningPlan({
  topic,
  language,
  target,
  attachments,
  outcomeDetail,
}) {
  const normalizedTopic = (topic || '').trim() || 'Your chosen subject';
  const sanitizedLanguage = (language || '').trim() || 'English';
  const sanitizedTarget = (target || '').trim() || 'general mastery';
  const planId = createId();

  const steps = [
    {
      id: createId(),
      title: `Primer: Why ${normalizedTopic} matters`,
      focus: `A ${sanitizedLanguage} overview that connects the topic to your personal goals.`,
      duration: '20 min',
      kind: 'lecture',
    },
    {
      id: createId(),
      title: 'Concept walk-through',
      focus: `Narrated examples tailored to your ${sanitizedTarget}.`,
      duration: '45 min',
      kind: 'lecture',
    },
    {
      id: createId(),
      title: 'Checkpoint quiz',
      focus: 'Adaptive questions that respond to your answers in real time.',
      duration: '15 min',
      kind: 'practice',
    },
    {
      id: createId(),
      title: 'Memory sketch',
      focus: 'Cornell-style notes and diagramming prompts to lock in the essentials.',
      duration: '25 min',
      kind: 'reflection',
    },
    {
      id: createId(),
      title: 'Application sprint',
      focus: `Scenario-based drills that mimic your ${sanitizedTarget.toLowerCase()}.`,
      duration: '30 min',
      kind: 'practice',
    },
    {
      id: createId(),
      title: 'Exam rehearsal',
      focus: 'Full-length mock exam with automatic scoring guidance.',
      duration: '50 min',
      kind: 'assessment',
    },
  ];

  const quizzes = [
    {
      id: createId(),
      title: 'Flash insight',
      question: `Explain ${normalizedTopic} using a 2-sentence analogy.`,
      type: 'short',
      answer:
        'Focus on clarity and link the concept to something you already understand.',
    },
    {
      id: createId(),
      title: 'Confidence check',
      question: 'Which strategy best reinforces long-term memory?',
      type: 'multiple',
      options: [
        'Highlighting and rereading',
        'Spacing sessions across the week',
        'Writing key formulas once',
        'Watching a single tutorial',
      ],
      answer: 'Spacing sessions across the week',
    },
    {
      id: createId(),
      title: 'Deep dive response',
      question: `Outline how you will demonstrate mastery during your ${sanitizedTarget.toLowerCase()}.`,
      type: 'long',
      answer: outcomeDetail || 'Focus on what the evaluator expects and how you will show it.',
    },
  ];

  const exam = {
    id: createId(),
    title: 'Culminating exam simulation',
    question: `Produce a structured response that synthesizes every major idea in ${normalizedTopic}. Include pitfalls you must avoid.`,
    type: 'long',
    answer:
      outcomeDetail ||
      'Summarize the thesis, build supporting arguments, and highlight common errors to dodge.',
  };

  return {
    id: planId,
    topic: normalizedTopic,
    language: sanitizedLanguage,
    target: sanitizedTarget,
    attachments: attachments.map((attachment) => ({
      id: createId(),
      name: attachment.name,
      kind: attachment.kind,
    })),
    createdAt: new Date().toISOString(),
    steps,
    quizzes,
    exam,
    completedSteps: [],
    completedQuizzes: [],
    notes: outcomeDetail || '',
  };
}
