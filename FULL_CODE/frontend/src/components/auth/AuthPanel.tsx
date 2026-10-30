"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { DemoLoginButton } from "@/components/auth/DemoLoginButton";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignedInCard } from "@/components/auth/SignedInCard";
import { FormAlert } from "@/components/auth/FormAlert";

export type AuthMode = "signin" | "signup";

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: "signin", label: "Sign in" },
  { mode: "signup", label: "Create account" },
];

interface AuthPanelProps {
  initialMode: AuthMode;
  /** Already validated with safeNextPath. */
  next: string;
}

export function AuthPanel({ initialMode, next }: AuthPanelProps) {
  const router = useRouter();
  const { user, loading, sessionError } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const goNext = () => router.replace(next);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white border border-[#D9D3E8] rounded-3xl p-6 sm:p-10 shadow-[0_30px_90px_rgba(121,87,255,0.14)] space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-1" />
          <h1 className="m-0 text-2xl font-extrabold text-[#24212B] tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="m-0 text-xs text-[#6F6A7C]">Save your plan and see your advisor appointments.</p>
        </div>

        {loading ? (
          <p role="status" className="m-0 text-center text-sm text-[#6F6A7C]">
            Checking your session…
          </p>
        ) : user ? (
          <SignedInCard next={next} />
        ) : (
          <>
            <FormAlert message={sessionError} />
            <div
              role="tablist"
              aria-label="Sign in or create an account"
              className="p-1 rounded-2xl bg-[#F1EDFC] border border-[#D9D3E8]/70 flex"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.mode}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab.mode}
                  onClick={() => setMode(tab.mode)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${mode === tab.mode ? "bg-white text-[#7957FF] shadow-sm" : "text-[#6F6A7C] hover:text-[#24212B]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {mode === "signin" ? <SignInForm onSuccess={goNext} /> : <RegisterForm onSuccess={goNext} />}
            <div className="flex items-center gap-3 text-[11px] text-[#A59FB5]" aria-hidden="true">
              <span className="flex-1 h-px bg-[#D9D3E8]" />
              or
              <span className="flex-1 h-px bg-[#D9D3E8]" />
            </div>
            <DemoLoginButton onSuccess={goNext} />
          </>
        )}
      </div>
    </div>
  );
}
