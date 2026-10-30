import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";
import { toAssessmentInput, toRecommendRequest, type FormState } from "@/lib/assessment-form";
import { saveMyPlan, summariseAssessment } from "@/lib/my-plan";
import { useAssessmentStore } from "@/store/assessment-store";
import type { AssessmentResult } from "@/types/assessment";

/** Runs the needs calculation and stores both what the engine returned and what Products will need later. */
export function useSubmitAssessment() {
  const router = useRouter();
  const { setInput, setResult, setRecommend } = useAssessmentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (form: FormState) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    const assessment = toAssessmentInput(form);
    try {
      const result = await postJSON<AssessmentResult>("/assessments", assessment);
      setInput(assessment);
      setRecommend(toRecommendRequest(form, assessment));
      setResult(result);
      // Best effort: signed-out visitors keep their plan in this browser only, so a failed sync must not block the journey.
      void saveMyPlan({ assessment: summariseAssessment(result) });
      router.push("/results");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We couldn't calculate your cover. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error, clearError: () => setError(null) };
}
