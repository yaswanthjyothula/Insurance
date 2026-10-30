"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssessmentInput, AssessmentResult } from "@/types/assessment";
import type { Booking, RecommendRequest, SelectedPlan } from "@/types/api";

/** Nothing is assumed about a visitor until they submit the form. */
export const EMPTY_INPUT: AssessmentInput = {
  age: 0,
  annual_income: 0,
  annual_expenses: 0,
  dependents_count: 0,
  outstanding_liabilities: 0,
  existing_cover: 0,
  eligible_assets: 0,
  future_goals: [],
};

const STORAGE_KEY = "lifesure_session_v2";
const CHANGE_EVENT = "lifesure_store_change";

export interface SessionState {
  input: AssessmentInput;
  result: AssessmentResult | null;
  /** What the questionnaire collected for the recommendation engine (applicant, budget, risk, goals). */
  recommend: RecommendRequest | null;
  /** The plans the customer has configured and kept. */
  selection: SelectedPlan[];
  booking: Booking | null;
  currentStage: number; // 1 Assessment, 2 Results, 3 Products, 4 Advisory
}

const initialState: SessionState = { input: EMPTY_INPUT, result: null, recommend: null, selection: [], booking: null, currentStage: 1 };

export function getStoredSession(): SessionState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...(JSON.parse(raw) as Partial<SessionState>) } : initialState;
  } catch {
    return initialState;
  }
}

export function saveStoredSession(patch: Partial<SessionState>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSession();
    const changed = (Object.keys(patch) as (keyof SessionState)[]).some((k) => JSON.stringify(current[k]) !== JSON.stringify(patch[k]));
    if (!changed) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage full or blocked: the journey keeps working from memory until the page reloads */
  }
}

/** Forgets everything stored for this browser's journey (used on sign-out so the next person starts clean). */
export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAssessmentStore() {
  const [state, setState] = useState<SessionState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is read from browser storage after mount
    setState(getStoredSession());
    setIsHydrated(true);
    const sync = () => {
      const next = getStoredSession();
      setState((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const setInput = useCallback((input: AssessmentInput) => saveStoredSession({ input }), []);
  const setResult = useCallback((result: AssessmentResult) => saveStoredSession({ result, currentStage: 2 }), []);
  const setRecommend = useCallback((recommend: RecommendRequest) => saveStoredSession({ recommend }), []);
  const setSelection = useCallback((selection: SelectedPlan[]) => saveStoredSession({ selection }), []);
  const setBooking = useCallback((booking: Booking) => saveStoredSession({ booking, currentStage: 4 }), []);
  const clearBooking = useCallback(() => saveStoredSession({ booking: null }), []);
  const setStage = useCallback((currentStage: number) => saveStoredSession({ currentStage }), []);
  const resetAll = useCallback(() => clearStoredSession(), []);

  return { ...state, isHydrated, setInput, setResult, setRecommend, setSelection, setBooking, clearBooking, setStage, resetAll };
}
