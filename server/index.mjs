import http from 'http';
import { readFile, access } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { resolve, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadState, saveState, appendStudyFromPlan } from './store.mjs';
import { generateLearningPlan } from './plan.mjs';
import { createId } from './util.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_ROOT = resolve(__dirname, '../dist');
const PUBLIC_ROOT = resolve(__dirname, '../public');
const INDEX_FILE = resolve(__dirname, '../index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

let state = await loadState();

function respondJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  if (!chunks.length) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    return {};
  }
}

function sanitizeProfileInput(input) {
  const base = {
    name: (input.name || '').trim(),
    email: (input.email || '').trim(),
    password: (input.password || '').trim(),
    studyHabits: (input.studyHabits || '').trim(),
    difficulties: (input.difficulties || '').trim(),
    biography: (input.biography || '').trim(),
    languagePreference: (input.languagePreference || '').trim() || 'English',
  };
  if (!base.name || !base.email || !base.password) {
    return null;
  }
  return base;
}

function ensureAuthenticated(res) {
  if (!state.authenticated) {
    respondJSON(res, 401, { error: 'Not signed in' });
    return false;
  }
  return true;
}

async function handleApi(req, res, url) {
  const segments = url.pathname.split('/').filter(Boolean);
  const method = req.method || 'GET';

  if (segments[1] === 'state' && method === 'GET') {
    respondJSON(res, 200, state);
    return true;
  }

  if (segments[1] === 'profile' && method === 'POST' && segments[2] === 'register') {
    const body = await readRequestBody(req);
    const profile = sanitizeProfileInput(body);
    if (!profile) {
      respondJSON(res, 400, { error: 'Missing required profile fields' });
      return true;
    }
    state = {
      ...state,
      profile,
      authenticated: true,
      started: false,
    };
    await saveState(state);
    respondJSON(res, 201, state);
    return true;
  }

  if (segments[1] === 'profile' && method === 'POST' && segments[2] === 'sign-in') {
    const body = await readRequestBody(req);
    if (!state.profile) {
      respondJSON(res, 404, { error: 'No profile registered' });
      return true;
    }
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const storedEmail = state.profile.email.trim().toLowerCase();
    if (email === storedEmail && password === state.profile.password) {
      state = { ...state, authenticated: true };
      await saveState(state);
      respondJSON(res, 200, { success: true });
      return true;
    }
    respondJSON(res, 401, { error: 'Invalid credentials' });
    return true;
  }

  if (segments[1] === 'profile' && method === 'POST' && segments[2] === 'sign-out') {
    state = { ...state, authenticated: false };
    await saveState(state);
    respondJSON(res, 200, { success: true });
    return true;
  }

  if (segments[1] === 'profile' && method === 'PATCH') {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    if (!state.profile) {
      respondJSON(res, 404, { error: 'No profile registered' });
      return true;
    }
    const body = await readRequestBody(req);
    const updates = sanitizeProfileInput({ ...state.profile, ...body });
    if (!updates) {
      respondJSON(res, 400, { error: 'Invalid profile updates' });
      return true;
    }
    state = {
      ...state,
      profile: { ...state.profile, ...updates },
    };
    await saveState(state);
    respondJSON(res, 200, state.profile);
    return true;
  }

  if (segments[1] === 'started' && method === 'POST') {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    state = { ...state, started: true };
    await saveState(state);
    respondJSON(res, 200, { started: true });
    return true;
  }

  if (segments[1] === 'tasks' && method === 'POST' && segments.length === 2) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const body = await readRequestBody(req);
    if (!body.label) {
      respondJSON(res, 400, { error: 'Task label is required' });
      return true;
    }
    const task = {
      id: createId(),
      label: String(body.label),
      dueDate: String(body.dueDate || ''),
      done: Boolean(body.done),
    };
    state = {
      ...state,
      tasks: [...state.tasks, task],
    };
    await saveState(state);
    respondJSON(res, 201, task);
    return true;
  }

  if (segments[1] === 'tasks' && method === 'POST' && segments[2] === 'toggle' && segments[3]) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const id = segments[3];
    const nextTasks = state.tasks.map((task) =>
      task.id === id ? { ...task, done: !task.done } : task
    );
    state = { ...state, tasks: nextTasks };
    await saveState(state);
    respondJSON(res, 200, nextTasks.find((task) => task.id === id));
    return true;
  }

  if (segments[1] === 'plan' && method === 'POST' && segments.length === 2) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const body = await readRequestBody(req);
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.map((item) => ({
          name: String(item.name || 'Untitled resource'),
          kind: String(item.kind || 'note'),
        }))
      : [];
    const plan = generateLearningPlan({
      topic: body.topic,
      language: body.language,
      target: body.target,
      attachments,
      outcomeDetail: body.outcomeDetail,
    });
    let nextState = {
      ...state,
      started: true,
      activePlan: plan,
    };
    nextState = appendStudyFromPlan(nextState, plan);
    state = nextState;
    await saveState(state);
    respondJSON(res, 201, plan);
    return true;
  }

  if (segments[1] === 'plan' && method === 'POST' && segments[2] === 'steps' && segments[3]) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    if (!state.activePlan) {
      respondJSON(res, 404, { error: 'No active plan' });
      return true;
    }
    const id = segments[3];
    const completed = new Set(state.activePlan.completedSteps);
    if (completed.has(id)) {
      completed.delete(id);
    } else {
      completed.add(id);
    }
    state = {
      ...state,
      activePlan: {
        ...state.activePlan,
        completedSteps: Array.from(completed),
      },
    };
    await saveState(state);
    respondJSON(res, 200, state.activePlan);
    return true;
  }

  if (segments[1] === 'plan' && method === 'POST' && segments[2] === 'quizzes' && segments[3]) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    if (!state.activePlan) {
      respondJSON(res, 404, { error: 'No active plan' });
      return true;
    }
    const id = segments[3];
    const completed = new Set(state.activePlan.completedQuizzes);
    if (completed.has(id)) {
      completed.delete(id);
    } else {
      completed.add(id);
    }
    state = {
      ...state,
      activePlan: {
        ...state.activePlan,
        completedQuizzes: Array.from(completed),
      },
    };
    await saveState(state);
    respondJSON(res, 200, state.activePlan);
    return true;
  }

  return false;
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

async function serveStatic(res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const potentialPaths = [
    resolve(DIST_ROOT, `.${safePath}`),
    resolve(PUBLIC_ROOT, `.${safePath}`),
  ];

  for (const candidate of potentialPaths) {
    if (await fileExists(candidate)) {
      const ext = extname(candidate);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = await readFile(candidate);
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
      return true;
    }
  }

  const indexContent = await readFile(INDEX_FILE);
  res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
  res.end(indexContent);
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(req, res, url);
      if (!handled) {
        respondJSON(res, 404, { error: 'Route not found' });
      }
      return;
    }

    await serveStatic(res, url.pathname);
  } catch (error) {
    console.error('Server error', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

const PORT = Number(process.env.PORT || 3000);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default server;
