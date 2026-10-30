"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FormAlert } from "@/components/auth/FormAlert";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/i18n/I18nProvider";

interface DemoAdvisor {
  advisor_id: string;
  advisor_name: string;
}

/** Lets a reviewer open the advisor workspace as one of the pack's sample advisors. Renders nothing when the server has demo sign-in off. */
export function DemoAdvisorButton({ onSuccess }: { onSuccess: () => void }) {
  const { signInDemoAdvisor } = useAuth();
  const { t } = useI18n();
  const [advisors, setAdvisors] = useState<DemoAdvisor[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFromAPI<DemoAdvisor[]>("/auth/demo/advisors")
      .then((list) => {
        if (cancelled) return;
        setAdvisors(list);
        setSelected(list[0]?.advisor_id ?? "");
      })
      .catch(() => undefined); // the customer demo above still works, so a failure here just hides this option
    return () => {
      cancelled = true;
    };
  }, []);

  if (advisors.length === 0) return null;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInDemoAdvisor(selected);
      onSuccess();
    } catch (failure) {
      setError(errorMessage(failure, t("auth.demo.advisorFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-[#D9D3E8]/70">
      <label htmlFor="demo-advisor" className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A7C]">
        {t("auth.demo.advisorLabel")}
      </label>
      <div className="flex gap-2">
        <select
          id="demo-advisor"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="flex-1 min-w-0 rounded-2xl border border-[#D9D3E8] bg-white px-3 py-2.5 text-sm text-[#24212B]"
        >
          {advisors.map((advisor) => (
            <option key={advisor.advisor_id} value={advisor.advisor_id}>
              {advisor.advisor_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={start}
          disabled={busy || !selected}
          className="shrink-0 py-2.5 px-4 text-sm font-bold text-white bg-[#171B3D] hover:bg-[#232857] disabled:opacity-60 rounded-2xl transition-colors"
        >
          {busy ? t("auth.demo.advisorOpening") : t("auth.demo.advisorButton")}
        </button>
      </div>
      <FormAlert message={error} />
    </div>
  );
}
