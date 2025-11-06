import { Persona, TrustedSource } from '../hooks/useSessionStore';

const fallbackSources = [
  'MIT OpenCourseWare',
  'Nature Education',
  'Khan Academy Scientific Library',
  'Peer-reviewed journals',
];

type RoadmapItem = {
  category: string;
  title: string;
  description: string;
};

type SessionSection = {
  title: string;
  summary: string;
  highlights: string[];
};

type SessionBlueprint = {
  sections: SessionSection[];
};

export const generateRoadmap = (
  trustedSources: TrustedSource[],
  topic: string
): RoadmapItem[] => {
  const base = trustedSources.length > 0 ? trustedSources : fallbackSources.map((title) => ({
    id: title,
    title,
    status: 'verified' as const,
  }));

  return base.slice(0, 3).map((source, index) => ({
    category: ['Foundation', 'Diagnostic', 'Mastery'][index] ?? 'Exploration',
    title: `${topic} • ${source.title}`,
    description:
      'Pathfinder will synthesize these materials, surface weak spots, and craft mastery drills tailored to your assessment style.',
  }));
};

export const generateSession = (
  trustedSources: TrustedSource[],
  topic: string,
  prompt: string,
  persona: Persona
): SessionBlueprint => {
  const baseSummary = persona.focusMode
    ? `${persona.focusMode} mode activated. `
    : '';

  return {
    sections: [
      {
        title: 'Exploration Narrative',
        summary: `${baseSummary}We will weave through ${topic} with analogies that connect to your interests (${persona.interests.join(', ') || 'curiosity-driven learning'}). ${prompt}`,
        highlights: [
          'Layered explanation: conceptual overview → detailed mechanism → applied example.',
          'Interleave checks for understanding every 7 minutes to reinforce retention.',
          'Highlight contrasts with prior lessons to build a robust mental map.',
        ],
      },
      {
        title: 'Adaptive Diagnostics',
        summary: 'Short-form questions benchmark your mastery before diving deeper.',
        highlights: [
          '5-question micro-quiz mirroring your instructor’s format.',
          'Instant rationales referencing your trusted notes and textbooks.',
          'Weakness radar that feeds the Practice Lab.',
        ],
      },
      {
        title: 'Practice Lab',
        summary: 'Scenario-driven drills to apply knowledge under gentle pressure.',
        highlights: [
          'Teacher-style practice exam covering each micro-topic.',
          'Application prompts that connect theory to real-world cases.',
          'Confidence tracker to monitor readiness for upcoming assessments.',
        ],
      },
      {
        title: 'Reflection & Next Steps',
        summary:
          'Wrap-up journal prompts and next actions to sustain momentum post-session.',
        highlights: [
          'Quick reflection capturing wins, blockers, and aha moments.',
          'Auto-generated spaced repetition cues using your uploads.',
          'Plan the next Pathfinder sprint with evolving goals.',
        ],
      },
    ],
  };
};

export const summarizePersona = (persona: Persona): string => {
  const name = persona.name || 'Your Pathfinder';
  const goal = persona.goal || 'a major academic milestone';
  const focus = persona.focusMode || 'an adaptive rhythm';
  const interests = persona.interests.length
    ? persona.interests.join(', ')
    : 'multi-modal exploration';

  return `${name} is gearing up for ${goal}. We will lean into ${focus} while blending ${interests}.`;
};
