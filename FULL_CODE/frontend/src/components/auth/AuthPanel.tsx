"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { DemoLoginButton } from "@/components/auth/DemoLoginButton";
import { DemoAdvisorButton } from "@/components/auth/DemoAdvisorButton";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignedInCard } from "@/components/auth/SignedInCard";
import { FormAlert } from "@/components/auth/FormAlert";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import { DEFAULT_NEXT_PATH, type AuthUser } from "@/components/auth/session-helpers";

export type AuthMode = "signin" | "signup";

const TABS: { mode: AuthMode; labelKey: MessageKey }[] = [
  { mode: "signin", labelKey: "common.signIn" },
  { mode: "signup", labelKey: "auth.panel.tabCreate" },
];

interface AuthPanelProps {
  initialMode: AuthMode;
  /** Already validated with safeNextPath. */
  next: string;
}

export function AuthPanel({ initialMode, next }: AuthPanelProps) {
  const router = useRouter();
  const t = useT();
  const { user, loading, sessionError } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // Advisors land in their workspace unless a specific page was asked for
  const goNext = (signedIn?: AuthUser) => router.replace(signedIn?.role === "advisor" && next === DEFAULT_NEXT_PATH ? "/advisor" : next);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white border border-[#D9D3E8] rounded-3xl p-6 sm:p-10 shadow-[0_30px_90px_rgba(121,87,255,0.14)] space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-1" />
          <h1 className="m-0 text-2xl font-extrabold text-[#24212B] tracking-tight">
            {mode === "signin" ? t("common.signIn") : t("auth.panel.createTitle")}
          </h1>
          <p className="m-0 text-xs text-[#6F6A7C]">{t("auth.panel.subtitle")}</p>
        </div>

        {loading ? (
          <p role="status" className="m-0 text-center text-sm text-[#6F6A7C]">
            {t("auth.session.checking")}
          </p>
        ) : user ? (
          <SignedInCard next={next} />
        ) : (
          <>
            <FormAlert message={sessionError} />
            <div
              role="tablist"
              aria-label={t("auth.panel.tabsLabel")}
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
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
            {mode === "signin" ? <SignInForm onSuccess={goNext} /> : <RegisterForm onSuccess={goNext} />}
            <div className="flex items-center gap-3 text-[11px] text-[#A59FB5]" aria-hidden="true">
              <span className="flex-1 h-px bg-[#D9D3E8]" />
              {t("auth.panel.or")}
              <span className="flex-1 h-px bg-[#D9D3E8]" />
            </div>
            <DemoLoginButton onSuccess={goNext} />
            <DemoAdvisorButton onSuccess={() => router.replace("/advisor")} />
            <p className="m-0 text-center text-xs text-[#6F6A7C]">
              {t("auth.panel.advisorQuestion")}{" "}
              <Link href="/advisor-sign-in" className="font-bold text-[#7957FF] hover:underline">
                {t("auth.panel.advisorLink")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
