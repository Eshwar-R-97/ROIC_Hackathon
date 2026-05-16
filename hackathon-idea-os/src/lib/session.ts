"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SessionState } from "./types";

const SESSION_ID_KEY = "hackathon-idea-os-session-id";

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getStorageKey(sessionId: string) {
  return `hackathon-idea-os-${sessionId}`;
}

function defaultState(sessionId: string): SessionState {
  return {
    sessionId,
    step: 0,
    userProfile: null,
    githubSignals: null,
    selectedHackathon: null,
    lifeAnswers: {},
    adaptiveQuestions: [],
    generatedIdeas: [],
    selectedIdeaId: null,
    finalPlan: null,
  };
}

// Empty sessionId on the server signals "not hydrated yet" to consumers.
const SERVER_SNAPSHOT: SessionState = defaultState("");

type Listener = () => void;

let cachedSessionId: string | null = null;
let cachedRaw: string | null = null;
let cachedState: SessionState | null = null;
const listeners = new Set<Listener>();

function ensureSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  cachedSessionId = id;
  return id;
}

function readSnapshot(): SessionState {
  const id = ensureSessionId();
  const raw = localStorage.getItem(getStorageKey(id));
  // Return the same reference when nothing changed; useSyncExternalStore
  // requires reference stability to avoid infinite re-renders.
  if (raw === cachedRaw && cachedState) return cachedState;
  cachedRaw = raw;
  if (raw) {
    try {
      cachedState = { ...(JSON.parse(raw) as SessionState), sessionId: id };
      return cachedState;
    } catch {
      // Fall through to default state on corrupt JSON.
    }
  }
  cachedState = defaultState(id);
  return cachedState;
}

function writeSnapshot(next: SessionState) {
  cachedState = next;
  cachedRaw = JSON.stringify(next);
  localStorage.setItem(getStorageKey(next.sessionId), cachedRaw);
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (cachedSessionId && e.key === getStorageKey(cachedSessionId)) {
      cachedRaw = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): SessionState {
  return SERVER_SNAPSHOT;
}

export function useSession() {
  const state = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<SessionState>) => {
    const current = readSnapshot();
    writeSnapshot({ ...current, ...patch });
  }, []);

  const reset = useCallback(() => {
    const current = readSnapshot();
    writeSnapshot(defaultState(current.sessionId));
  }, []);

  // Non-empty sessionId means the snapshot came from the client store, not the
  // server fallback — i.e. localStorage has been read.
  const hydrated = state.sessionId !== "";

  return { state, update, reset, hydrated };
}
