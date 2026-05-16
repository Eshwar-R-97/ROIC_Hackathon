"use client";

import { useCallback, useEffect, useState } from "react";
import { SessionState } from "./types";

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getStorageKey(sessionId: string) {
  return `hackathon-idea-os-${sessionId}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("hackathon-idea-os-session-id");
  if (!id) {
    id = generateSessionId();
    sessionStorage.setItem("hackathon-idea-os-session-id", id);
  }
  return id;
}

const defaultState = (sessionId: string): SessionState => ({
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
});

export function useSession() {
  const [sessionId] = useState<string>(() =>
    typeof window !== "undefined" ? getOrCreateSessionId() : "ssr"
  );

  const [state, setState] = useState<SessionState>(() => {
    if (typeof window === "undefined") return defaultState("ssr");
    const id = getOrCreateSessionId();
    const raw = localStorage.getItem(getStorageKey(id));
    if (raw) {
      try {
        return JSON.parse(raw) as SessionState;
      } catch {
        // ignore corrupt state
      }
    }
    return defaultState(id);
  });

  useEffect(() => {
    if (sessionId === "ssr") return;
    localStorage.setItem(getStorageKey(sessionId), JSON.stringify(state));
  }, [state, sessionId]);

  const update = useCallback((patch: Partial<SessionState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    const id = getOrCreateSessionId();
    const fresh = defaultState(id);
    setState(fresh);
    localStorage.setItem(getStorageKey(id), JSON.stringify(fresh));
  }, []);

  return { state, update, reset };
}
