import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createId, today } from './util.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = resolve(__dirname, '../data/state.json');

const INITIAL_STATE = {
  profile: null,
  authenticated: false,
  started: false,
  pastStudies: [
    {
      id: createId(),
      title: 'Organic chemistry synthesis review',
      date: '2024-02-12',
      summary: 'Mapped reagents to mechanisms and rehearsed curved arrow logic.',
      tags: ['chemistry', 'notes', 'flashcards'],
    },
    {
      id: createId(),
      title: 'Modern European history timeline',
      date: '2024-01-28',
      summary: 'Created annotated timeline covering diplomatic crises 1900-1945.',
      tags: ['history', 'timeline'],
    },
  ],
  tests: [
    {
      id: createId(),
      title: 'Thermodynamics midterm',
      date: '2024-03-14',
      status: 'scheduled',
    },
    {
      id: createId(),
      title: 'Spanish oral presentation',
      date: '2024-03-02',
      status: 'draft',
    },
  ],
  tasks: [
    {
      id: createId(),
      label: 'Summarize chapter 5 in your own words',
      dueDate: '2024-02-29',
      done: false,
    },
    {
      id: createId(),
      label: '10-question active recall sprint',
      dueDate: '2024-02-27',
      done: true,
    },
    {
      id: createId(),
      label: 'Schedule peer review session',
      dueDate: '2024-03-01',
      done: false,
    },
  ],
  events: [
    {
      id: createId(),
      title: 'Focus block — library',
      date: '2024-02-26',
      type: 'focus',
    },
    {
      id: createId(),
      title: 'Group review lab',
      date: '2024-02-28',
      type: 'review',
    },
    {
      id: createId(),
      title: 'Practice assessment',
      date: '2024-03-03',
      type: 'assessment',
    },
  ],
  activePlan: null,
};

async function ensureDataDir() {
  const dir = dirname(DATA_PATH);
  await mkdir(dir, { recursive: true });
}

export async function loadState() {
  try {
    const raw = await readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureDataDir();
      const seeded = { ...INITIAL_STATE };
      await writeFile(DATA_PATH, JSON.stringify(seeded, null, 2));
      return seeded;
    }
    throw error;
  }
}

export async function saveState(nextState) {
  await ensureDataDir();
  const enriched = { ...nextState };
  await writeFile(DATA_PATH, JSON.stringify(enriched, null, 2));
  return enriched;
}

export function appendStudyFromPlan(state, plan) {
  const newStudy = {
    id: createId(),
    title: `AI-generated study map for ${plan.topic}`,
    date: today(),
    summary: `Plan focused on ${plan.target} with ${plan.steps.length} major activities.`,
    tags: ['ai-plan', plan.language],
  };
  return {
    ...state,
    pastStudies: [newStudy, ...state.pastStudies],
  };
}
