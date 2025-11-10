import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createId, today } from './util.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = resolve(__dirname, '../data/state.json');

class StoreError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'StoreError';
    this.statusCode = statusCode;
  }
}

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function buildInitialState() {
  return {
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
}

function sanitizeProfileInput(input, { requireCredentials = false } = {}) {
  const base = {
    name: String(input.name ?? '').trim(),
    email: String(input.email ?? '').trim(),
    password: String(input.password ?? '').trim(),
    studyHabits: String(input.studyHabits ?? '').trim(),
    difficulties: String(input.difficulties ?? '').trim(),
    biography: String(input.biography ?? '').trim(),
    languagePreference: String(input.languagePreference ?? '').trim() || 'English',
  };

  if (!base.name || !base.email || (!base.password && requireCredentials)) {
    throw new StoreError('Missing required profile fields', 400);
  }

  return base;
}

function sanitizeTaskInput(input) {
  const label = String(input.label ?? '').trim();
  if (!label) {
    throw new StoreError('Task label is required', 400);
  }

  const dueDate = input.dueDate ? String(input.dueDate).trim() : '';
  const done = Boolean(input.done);

  return {
    id: createId(),
    label,
    dueDate,
    done,
  };
}

function buildStudyLogFromPlan(plan) {
  return {
    id: createId(),
    title: `AI-generated study map for ${plan.topic}`,
    date: today(),
    summary: `Plan focused on ${plan.target} with ${plan.steps.length} major activities.`,
    tags: ['ai-plan', plan.language],
  };
}

async function ensureDataDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

export class StateDatabase {
  constructor(path = DATA_PATH) {
    this.path = path;
    this.state = null;
    this.queue = Promise.resolve();
  }

  async init() {
    if (this.state) {
      return this.getState();
    }

    try {
      const raw = await readFile(this.path, 'utf8');
      this.state = JSON.parse(raw);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      await ensureDataDir(this.path);
      this.state = buildInitialState();
      await writeFile(this.path, JSON.stringify(this.state, null, 2));
    }

    return this.getState();
  }

  getState() {
    if (!this.state) {
      throw new StoreError('State has not been initialised', 500);
    }
    return clone(this.state);
  }

  async runExclusive(fn) {
    const next = this.queue.then(() => fn(), () => fn());
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async update(mutator) {
    await this.init();
    return this.runExclusive(async () => {
      const base = this.getState();
      const nextState = await mutator(base);
      if (!nextState || typeof nextState !== 'object') {
        throw new StoreError('State mutation must return an object', 500);
      }
      this.state = nextState;
      await ensureDataDir(this.path);
      await writeFile(this.path, JSON.stringify(this.state, null, 2));
      return this.getState();
    });
  }

  async registerProfile(input) {
    const profile = sanitizeProfileInput(input, { requireCredentials: true });
    return this.update((state) => ({
      ...state,
      profile,
      authenticated: true,
      started: false,
    }));
  }

  async signIn(email, password) {
    const normalisedEmail = String(email ?? '').trim().toLowerCase();
    const normalisedPassword = String(password ?? '').trim();

    return this.update((state) => {
      if (!state.profile) {
        throw new StoreError('No profile registered', 404);
      }

      const storedEmail = state.profile.email.trim().toLowerCase();
      if (storedEmail !== normalisedEmail || state.profile.password !== normalisedPassword) {
        throw new StoreError('Invalid credentials', 401);
      }

      return {
        ...state,
        authenticated: true,
      };
    });
  }

  async signOut() {
    return this.update((state) => ({
      ...state,
      authenticated: false,
    }));
  }

  async updateProfile(updates) {
    return this.update((state) => {
      if (!state.profile) {
        throw new StoreError('No profile registered', 404);
      }
      const merged = {
        ...state.profile,
        ...updates,
      };
      const nextProfile = sanitizeProfileInput(merged, { requireCredentials: true });
      return {
        ...state,
        profile: nextProfile,
      };
    });
  }

  async markStarted() {
    return this.update((state) => ({
      ...state,
      started: true,
    }));
  }

  async addTask(input) {
    const task = sanitizeTaskInput(input);
    await this.update((state) => ({
      ...state,
      tasks: [...state.tasks, task],
    }));
    return task;
  }

  async toggleTask(id) {
    let toggledTask = null;
    await this.update((state) => {
      const tasks = state.tasks.map((task) => {
        if (task.id !== id) {
          return task;
        }
        toggledTask = { ...task, done: !task.done };
        return toggledTask;
      });

      if (!toggledTask) {
        throw new StoreError('Task not found', 404);
      }

      return {
        ...state,
        tasks,
      };
    });
    return toggledTask;
  }

  async activatePlan(plan) {
    const storedPlan = clone(plan);
    await this.update((state) => {
      const studyLog = buildStudyLogFromPlan(storedPlan);
      return {
        ...state,
        started: true,
        activePlan: storedPlan,
        pastStudies: [studyLog, ...state.pastStudies],
      };
    });
    return storedPlan;
  }

  async togglePlanStep(id) {
    let updatedPlan = null;
    await this.update((state) => {
      if (!state.activePlan) {
        throw new StoreError('No active plan', 404);
      }

      const completed = new Set(state.activePlan.completedSteps);
      if (completed.has(id)) {
        completed.delete(id);
      } else {
        completed.add(id);
      }

      updatedPlan = {
        ...state.activePlan,
        completedSteps: Array.from(completed),
      };

      return {
        ...state,
        activePlan: updatedPlan,
      };
    });
    return updatedPlan;
  }

  async togglePlanQuiz(id) {
    let updatedPlan = null;
    await this.update((state) => {
      if (!state.activePlan) {
        throw new StoreError('No active plan', 404);
      }

      const completed = new Set(state.activePlan.completedQuizzes);
      if (completed.has(id)) {
        completed.delete(id);
      } else {
        completed.add(id);
      }

      updatedPlan = {
        ...state.activePlan,
        completedQuizzes: Array.from(completed),
      };

      return {
        ...state,
        activePlan: updatedPlan,
      };
    });
    return updatedPlan;
  }
}

export const db = new StateDatabase();
await db.init();
export { StoreError };
