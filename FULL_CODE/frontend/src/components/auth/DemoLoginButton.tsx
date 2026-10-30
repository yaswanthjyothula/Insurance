"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { errorMessage } from "@/lib/error-message";
import { FormAlert } from "@/components/auth/FormAlert";

/** One click into a synthetic customer, so a reviewer can try the whole journey without registering. */
export function DemoLoginButton({ onSuccess }: { onSuccess: () => void }) {
  const { signInDemo } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInDemo();
      onSuccess();
    } catch (failure) {
      setError(errorMessage(failure, "The demo customer isn't available right now."));
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
        {busy ? "Opening demo…" : "Continue as demo customer (synthetic)"}
      </button>
      <p className="m-0 text-[11px] text-[#6F6A7C] text-center">No sign-up needed. The demo customer is made-up data, not a real person.</p>
      <FormAlert message={error} />
    </div>
  );
}
