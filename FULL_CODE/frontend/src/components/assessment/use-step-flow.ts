import { useCallback, useState } from "react";
import { validate, type FormState } from "@/lib/assessment-form";
import { fieldId } from "./fields";

/** Wait a frame so the step that holds the broken field has rendered before we look for it. */
function focusFirstError(errorKeys: string[]): void {
  const first = errorKeys[0];
  if (!first) return;
  requestAnimationFrame(() => {
    const id = fieldId(first);
    const target = document.getElementById(id) ?? document.querySelector<HTMLElement>(`[data-field="${id}"] button`);
    target?.focus();
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

const hasErrors = (form: FormState, step: number): boolean => Object.keys(validate(form, step)).length > 0;

/** Which tab is open, and which tabs have been tried (so errors only appear after an attempt). */
export function useStepFlow(form: FormState) {
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });

  const currentErrors = validate(form, step);
  const errorFor = (key: string): string | undefined => (attempted[step] ? currentErrors[key] : undefined);
  const visibleErrorCount = attempted[step] ? Object.keys(currentErrors).length : 0;

  const showErrorsAt = useCallback(
    (target: number) => {
      setStep(target);
      setAttempted((previous) => ({ ...previous, [target]: true }));
      focusFirstError(Object.keys(validate(form, target)));
    },
    [form],
  );

  const goTo = (target: number) => {
    const blockedAt = Array.from({ length: Math.max(target - step, 0) }, (_, offset) => step + offset).find((s) => hasErrors(form, s));
    if (blockedAt !== undefined) {
      showErrorsAt(blockedAt);
      return;
    }
    setStep(target);
    setVisited((previous) => ({ ...previous, [target]: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setStep(0);
    setAttempted({});
    setVisited({ 0: true });
  };

  return {
    step,
    errorFor,
    visibleErrorCount,
    goTo,
    showErrorsAt,
    reset,
    stepHasErrors: (s: number) => Boolean(attempted[s]) && hasErrors(form, s),
    stepIsDone: (s: number) => Boolean(visited[s]) && !hasErrors(form, s),
  };
}
