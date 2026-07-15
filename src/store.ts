import { create } from 'zustand';
import type { SoftUser } from './lib/types';
import { getSoftUser } from './lib/storage';

type AppState = {
  user: SoftUser | null;
  hydrated: boolean;
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
  /** Raw squat camera clip for optional pride compose (session memory only). */
  lastRawVideo: Blob | null;
  setLastRawVideo: (b: Blob | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => set({ user: getSoftUser(), hydrated: true }),
  setUser: (user) => set({ user }),
  lastResult: null,
  setLastResult: (lastResult) => set({ lastResult }),
  lastRawVideo: null,
  setLastRawVideo: (lastRawVideo) => set({ lastRawVideo }),
}));
