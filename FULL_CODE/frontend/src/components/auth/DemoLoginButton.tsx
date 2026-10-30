"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { FormAlert } from "@/components/auth/FormAlert";
import { useI18n } from "@/i18n/I18nProvider";

/** One click into a synthetic customer, so a reviewer can try the whole journey without registering. */
export function DemoLoginButton({ onSuccess }: { onSuccess: () => void }) {
  const { signInDemo } = useAuth();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offered, setOffered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFromAPI<{ demo_login: boolean }>("/auth/options")
      .then((options) => !cancelled && setOffered(options.demo_login))
      .catch(() => undefined); // if the server can't be asked, the demo is simply not offered
    return () => {
      cancelled = true;
    };
  }, []);

  if (!offered) return null;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInDemo();
      onSuccess();
    } catch (failure) {
      setError(errorMessage(failure, t("auth.demo.customerFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="w-full py-3 px-5 text-sm font-bold text-[#7957FF] bg-[#F7F5FF] hover:bg-[#EFEAFF] disabled:opacity-60 border border-[#7957FF]/40 rounded-2xl transition-colors"
      >
        {busy ? t("auth.demo.opening") : t("auth.demo.customerButton")}
      </button>
      <p className="m-0 text-[11px] text-[#6F6A7C] text-center">{t("auth.demo.customerNote")}</p>
      <FormAlert message={error} />
    </div>
  );
}
