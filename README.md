# Pathfinder Study Companion

A polished, browser-based workspace that pairs GPT-powered study support with a premium user interface. Pathfinder helps learners curate trusted materials, capture learning preferences, and generate interactive study plans without relying on a Python CLI.

## Features

- **Onboarding survey:** Capture a learner&apos;s name, goals, study interests, and preferred focus mode through an animated progress tracker.
- **Trusted material vault:** Upload and manage class documents while keeping the AI grounded in vetted sources.
- **Adaptive study flow:** Configure topics and prompts, then review roadmap cards and a session blueprint mirroring instructor-style practice.
- **Insight sidebar:** Surface personalized guidance, upcoming milestones, and a quality pledge to reinforce academic integrity.
- **Modern design:** Built with React, Material UI, and glassmorphism-inspired panels for a warm, premium feel.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The app runs on [http://localhost:5173](http://localhost:5173).

3. Build for production:

   ```bash
   npm run build
   ```

## Architecture

```
src/
├── App.tsx              # Theme provider and high-level layout
├── components/          # UI building blocks (hero, survey, workspace, insights)
├── hooks/               # Zustand-powered session store and upload helper
├── styles/              # Global CSS variables and base styles
└── utils/               # Mock AI generation logic and helpers
```

- **State management:** [`zustand`](https://github.com/pmndrs/zustand) keeps the interface responsive without boilerplate.
- **Data fetching stubs:** React Query is wired for future GPT integrations while current content is generated locally for demos.
- **Design system:** Material UI supplies responsive primitives, while custom gradients and cards create a polished experience.

## Roadmap

- Connect the study flow to real GPT endpoints with streaming responses.
- Persist uploaded materials and learner profiles to a secure backend.
- Add instructor dashboards with cohort analytics and content curation tools.
- Support collaborative study rooms and shared quiz banks.
