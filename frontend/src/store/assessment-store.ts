"use client";

import { useState, useEffect } from "react";
import { AssessmentInput, AssessmentResult } from "@/types/assessment";
import { RankedRecommendation, PolicyCustomization } from "@/types/recommendation";
import { BookingConfirmation } from "@/types/advisory";
import { InsuranceProduct } from "@/types/index";

export const DEFAULT_DEMO_INPUT: AssessmentInput = {
  age: 32,
  employment_type: "salaried",
  annual_income: 1800000,
  annual_expenses: 720000,
  expected_income_growth: 0.08,
  dependents_count: 2,
  years_support_needed: 20,
  outstanding_liabilities: 3500000,
  home_loan: 3500000,
  personal_loan: 0,
  existing_cover: 5000000,
  eligible_assets: 2000000,
  emergency_fund_months: 6,
  retirement_age: 60,
  inflation_rate: 0.07,
  discount_rate: 0.08,
  edu_inflation_rate: 0.10,
  smoker_status: false,
  future_goals: [
    {
      name: "Child Higher Education",
      cost_today: 2500000,
      years_away: 14,
      category: "education"
    }
  ]
};

/** Nothing is assumed about a visitor until they submit the form. */
export const EMPTY_INPUT: AssessmentInput = {
  age: 0,
  annual_income: 0,
  annual_expenses: 0,
  dependents_count: 0,
  outstanding_liabilities: 0,
  existing_cover: 0,
  eligible_assets: 0,
  future_goals: []
};

const STORAGE_KEY = "lifesure_assessment_session";

interface AssessmentStoreState {
  input: AssessmentInput;
  result: AssessmentResult | null;
  selectedProduct: InsuranceProduct | null;
  customization: PolicyCustomization | null;
  booking: BookingConfirmation | null;
  currentStage: number; // 1: Assessment, 2: Results, 3: Products, 4: Advisory
}

const initialStoreState: AssessmentStoreState = {
  input: EMPTY_INPUT,
  result: null,
  selectedProduct: null,
  customization: null,
  booking: null,
  currentStage: 1
};

export function getStoredSession(): AssessmentStoreState {
  if (typeof window === "undefined") return initialStoreState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialStoreState;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored session", e);
    return initialStoreState;
  }
}

export function saveStoredSession(state: Partial<AssessmentStoreState>) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSession();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event so other components update synchronously
    window.dispatchEvent(new Event("lifesure_store_change"));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

export function useAssessmentStore() {
  const [state, setState] = useState<AssessmentStoreState>(initialStoreState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setState(getStoredSession());
    setIsHydrated(true);

    const handleStorageChange = () => {
      setState(getStoredSession());
    };

    window.addEventListener("lifesure_store_change", handleStorageChange);
    return () => {
      window.removeEventListener("lifesure_store_change", handleStorageChange);
    };
  }, []);

  const setInput = (input: AssessmentInput) => {
    saveStoredSession({ input });
  };

  const setResult = (result: AssessmentResult) => {
    saveStoredSession({ result, currentStage: 2 });
  };

  const setSelectedProduct = (product: InsuranceProduct) => {
    saveStoredSession({ selectedProduct: product });
  };

  const setCustomization = (customization: PolicyCustomization) => {
    saveStoredSession({ customization });
  };

  const setBooking = (booking: BookingConfirmation) => {
    saveStoredSession({ booking, currentStage: 4 });
  };

  const clearBooking = () => {
    saveStoredSession({ booking: null });
  };

  const setStage = (stage: number) => {
    saveStoredSession({ currentStage: stage });
  };

  const loadDemo = () => {
    saveStoredSession({ input: DEFAULT_DEMO_INPUT });
  };

  const resetAll = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("lifesure_store_change"));
    }
  };

  return {
    ...state,
    isHydrated,
    setInput,
    setResult,
    setSelectedProduct,
    setCustomization,
    setBooking,
    clearBooking,
    setStage,
    loadDemo,
    resetAll
  };
}
