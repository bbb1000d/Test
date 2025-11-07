# Pathfinder Study Companion

Pathfinder is a self-contained study dashboard that runs without external package downloads. It combines a static frontend with a lightweight Node.js backend so you can register a profile, sign in, launch AI-generated study plans, and track your planner in one place.

## Features

- **Real profile management** – Create a learner profile with name, email, password, habits, and difficulties. Sign in/out updates are persisted on disk.
- **AI study planner** – Request a plan by topic, language, goal, and optional resources. The server generates steps, quizzes, and a final exam rehearsal while logging past studies.
- **Progress tracking** – Toggle planner tasks, mark quiz completions, and watch the progress bar update instantly.
- **Calendar and history** – Keep upcoming focus sessions and assessments visible alongside recent study notes.
- **Interactive sparks** – Rotate playful prompts that encourage reflection and memory boosts.

## Project layout

```
index.html        # Static entry point and layout shell
public/           # Frontend scripts and styling (vanilla JS)
server/           # Node backend with plan generator and JSON persistence
scripts/          # Utility scripts (build pipeline)
data/             # Generated persistence file (state.json)
```

## Getting started

1. **Prerequisites**
   - Node.js 18 or newer (includes the necessary modern `fs` APIs)

2. **Build the static assets**
   ```bash
   npm run build
   ```
   This copies `index.html` and the frontend assets into `dist/`.

3. **Start the backend**
   ```bash
   npm start
   ```
   The server listens on [http://localhost:3000](http://localhost:3000) and serves both the API and the static UI. The first run seeds demo tasks, events, studies, and tests into `data/state.json`.

4. **Develop without rebuilding**
   The backend looks for assets in both `dist/` and `public/`. During development you can edit files in `public/` and simply refresh the browser without rebuilding.

## Scripts

| Command         | Description |
|-----------------|-------------|
| `npm run build` | Copies the static assets into the `dist/` directory. |
| `npm start`     | Launches the Node.js server that powers the API and serves the UI. |

## API overview

All routes live under `/api/` and return JSON.

- `GET /api/state` – Retrieve the entire persisted state (profile, plan, tasks, history).
- `POST /api/profile/register` – Create a new profile and sign in.
- `POST /api/profile/sign-in` – Authenticate with an email + password pair.
- `POST /api/profile/sign-out` – Clear the authentication flag.
- `PATCH /api/profile` – Update profile fields.
- `POST /api/started` – Mark the workspace as started to reveal planner actions.
- `POST /api/tasks` – Append a task. Use `POST /api/tasks/toggle/:id` to switch completion.
- `POST /api/plan` – Generate a new learning plan from the provided inputs.
- `POST /api/plan/steps/:id` – Toggle a plan step.
- `POST /api/plan/quizzes/:id` – Toggle a quiz completion.

Because the project stores everything on disk, you can delete `data/state.json` to reset to the seeded defaults.

## Notes

- No external npm packages are required; everything uses the Node.js standard library and vanilla browser APIs.
- The generated plan mirrors the structure requested by the user: lectures, practice, reflection, and a culminating exam rehearsal.
- The UI is intentionally neutral and GitHub-inspired so the study focus remains on content, not chrome.
