import { useCallback, useEffect, useState } from "react";
import { BLANK_FORM, type FormState } from "@/lib/assessment-form";

const DRAFT_KEY = "lifesure_assessment_draft_v2";

/** Why the form holds the values it does, so the page can say so. */
export type FormOrigin = { kind: "restored" } | { kind: "sample"; name: string } | null;

function readDraft(): FormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...BLANK_FORM, ...(JSON.parse(raw) as Partial<FormState>) } : null;
  } catch {
    // A draft is a convenience: if it is unreadable the visitor simply starts with a blank form.
    return null;
  }
}

function writeDraft(form: FormState): void {
  try {
    if (JSON.stringify(form) === JSON.stringify(BLANK_FORM)) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {
    // Storage can be full or blocked; the form keeps working, it just will not survive a reload.
  }
}

/** The questionnaire answers, kept as a draft in the browser so a refresh does not lose them. */
export function useAssessmentForm() {
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [origin, setOrigin] = useState<FormOrigin>(null);
  const [isReady, setIsReady] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- the draft lives in browser storage, which is only readable after mount */
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setForm(draft);
      setOrigin({ kind: "restored" });
    }
    setIsReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isReady) writeDraft(form);
  }, [form, isReady]);

  const update = useCallback((patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch })), []);

  const loadSample = useCallback((sampleForm: FormState, name: string) => {
    setForm(sampleForm);
    setOrigin({ kind: "sample", name });
  }, []);

  const clear = useCallback(() => {
    setForm(BLANK_FORM);
    setOrigin(null);
  }, []);

  const isBlank = JSON.stringify(form) === JSON.stringify(BLANK_FORM);
  return { form, origin, isBlank, update, loadSample, clear };
}
