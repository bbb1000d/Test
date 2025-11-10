import http from 'http';
import { readFile, access } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { resolve, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, StoreError } from './store.mjs';
import { generateLearningPlan } from './plan.mjs';

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

function handleStoreError(res, error) {
  if (error instanceof StoreError || typeof error.statusCode === 'number') {
    respondJSON(res, error.statusCode, { error: error.message });
    return;
  }
  console.error('Store error', error);
  respondJSON(res, 500, { error: 'Internal server error' });
}

function ensureAuthenticated(res) {
  const { authenticated } = db.getState();
  if (!authenticated) {
    respondJSON(res, 401, { error: 'Not signed in' });
    return false;
  }
  return true;
}

async function handleApi(req, res, url) {
  const segments = url.pathname.split('/').filter(Boolean);
  const method = req.method || 'GET';

  if (segments[1] === 'state' && method === 'GET') {
    respondJSON(res, 200, db.getState());
    return true;
  }

  if (segments[1] === 'profile' && method === 'POST' && segments[2] === 'register') {
    const body = await readRequestBody(req);
    try {
      const nextState = await db.registerProfile(body);
      respondJSON(res, 201, nextState);
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'profile' && method === 'POST' && segments[2] === 'sign-in') {
    const body = await readRequestBody(req);
    try {
      await db.signIn(body.email, body.password);
      respondJSON(res, 200, { success: true });
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'profile' && method === 'POST' && segments[2] === 'sign-out') {
    try {
      await db.signOut();
      respondJSON(res, 200, { success: true });
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'profile' && method === 'PATCH') {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const body = await readRequestBody(req);
    try {
      const nextState = await db.updateProfile(body);
      respondJSON(res, 200, nextState.profile);
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'started' && method === 'POST') {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    try {
      await db.markStarted();
      respondJSON(res, 200, { started: true });
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'tasks' && method === 'POST' && segments.length === 2) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const body = await readRequestBody(req);
    try {
      const task = await db.addTask(body);
      respondJSON(res, 201, task);
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'tasks' && method === 'POST' && segments[2] === 'toggle' && segments[3]) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const id = segments[3];
    try {
      const task = await db.toggleTask(id);
      respondJSON(res, 200, task);
    } catch (error) {
      handleStoreError(res, error);
    }
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
    try {
      await db.activatePlan(plan);
      respondJSON(res, 201, plan);
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'plan' && method === 'POST' && segments[2] === 'steps' && segments[3]) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const id = segments[3];
    try {
      const plan = await db.togglePlanStep(id);
      respondJSON(res, 200, plan);
    } catch (error) {
      handleStoreError(res, error);
    }
    return true;
  }

  if (segments[1] === 'plan' && method === 'POST' && segments[2] === 'quizzes' && segments[3]) {
    if (!ensureAuthenticated(res)) {
      return true;
    }
    const id = segments[3];
    try {
      const plan = await db.togglePlanQuiz(id);
      respondJSON(res, 200, plan);
    } catch (error) {
      handleStoreError(res, error);
    }
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
