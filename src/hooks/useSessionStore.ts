import { create } from 'zustand';
import { nanoid } from '../utils/nanoid';

export type Persona = {
  name: string;
  goal: string;
  interests: string[];
  focusMode: string;
};

export type TrustedSource = {
  id: string;
  title: string;
  status: 'uploaded' | 'processing' | 'verified';
};

export type SessionState = {
  persona: Persona;
  surveyComplete: boolean;
  trustedSources: TrustedSource[];
  currentPrompt: string;
  updatePersona: (updates: Partial<Persona>) => void;
  addTrustedSource: (title: string) => void;
  updateTrustedSourceStatus: (
    id: string,
    status: TrustedSource['status']
  ) => void;
  updateCurrentPrompt: (prompt: string) => void;
  completeSurvey: () => void;
};

const useSessionStore = create<SessionState>((set) => ({
  persona: {
    name: '',
    goal: '',
    interests: [],
    focusMode: '',
  },
  surveyComplete: false,
  trustedSources: [],
  currentPrompt: '',
  updatePersona: (updates) =>
    set((state) => ({
      persona: {
        ...state.persona,
        ...updates,
      },
    })),
  addTrustedSource: (title) =>
    set((state) => ({
      trustedSources: [
        ...state.trustedSources,
        { id: nanoid(), title, status: 'uploaded' as const },
      ],
    })),
  updateTrustedSourceStatus: (id, status) =>
    set((state) => ({
      trustedSources: state.trustedSources.map((source) =>
        source.id === id
          ? {
              ...source,
              status,
            }
          : source
      ),
    })),
  updateCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  completeSurvey: () => set({ surveyComplete: true }),
}));

export default useSessionStore;
