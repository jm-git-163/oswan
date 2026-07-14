import { create } from 'zustand';
import type { SoftUser } from './lib/types';
import { getSoftUser } from './lib/storage';

type AppState = {
  user: SoftUser | null;
  hydrate: () => void;
  setUser: (u: SoftUser | null) => void;
  lastResult: {
    reps: number;
    targetReps: number;
    cleared: boolean;
    durationMs: number;
    challengeId?: string;
    sessionId?: string;
  } | null;
  setLastResult: (r: AppState['lastResult']) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  hydrate: () => set({ user: getSoftUser() }),
  setUser: (user) => set({ user }),
  lastResult: null,
  setLastResult: (lastResult) => set({ lastResult }),
}));
