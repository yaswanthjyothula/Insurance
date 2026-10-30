"use client";

import { useState } from "react";
import { MessageSquare, Phone, Video } from "lucide-react";
import { AccountTabs } from "@/components/account/AccountTabs";
import { PasswordForm } from "@/components/account/PasswordForm";
import { useMyProfile } from "@/components/account/useMyProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { CARD_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import type { PreferredMode } from "@/types/account";

const MODES: { id: PreferredMode; labelKey: MessageKey; hintKey: MessageKey; icon: typeof Video }[] = [
  { id: "video", labelKey: "common.mode.video", hintKey: "common.mode.video.hint", icon: Video },
  { id: "phone", labelKey: "common.mode.phone", hintKey: "common.mode.phone.hint", icon: Phone },
  { id: "chat", labelKey: "common.mode.chat", hintKey: "common.mode.chat.hint", icon: MessageSquare },
];

export function CustomerSettingsPage() {
  const { user, signOut } = useAuth();
  const { t, tx } = useI18n();
  const { data, error, reload, savePreferences } = useMyProfile();
  const [mode, setMode] = useState<PreferredMode | null | undefined>(undefined);
  const [share, setShare] = useState<boolean | undefined>(undefined);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const modeValue = mode === undefined ? (data?.preferences.preferred_mode ?? null) : mode;
  const shareValue = share ?? data?.preferences.share_summary_default ?? false;

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await savePreferences({ preferred_mode: modeValue, share_summary_default: shareValue });
      setStatus({ ok: true, text: t("account.settings.saved") });
    } catch (failure) {
      setStatus({ ok: false, text: tx(errorMessage(failure, t("account.settings.saveFailed"))) });
    } finally {
      setBusy(false);
    }
  };

  const [signedInBefore, signedInAfter] = t(user?.demo ? "account.settings.signedInAsDemo" : "account.settings.signedInAs", {
    id: "{id}",
  }).split("{id}");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="m-0 text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#24212B]">
            {t("account.settings.title")}
          </h1>
          <p className="m-0 mt-2 text-[16px] text-[#5A5566]">{t("account.settings.intro")}</p>
        </div>
        <AccountTabs />
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C23B3B] p-4 font-semibold text-[#C23B3B]"
        >
          {tx(error)}
          <button type="button" onClick={reload} className="underline">
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {data && (
        <>
          <section className={CARD_CLASS} aria-label={t("account.settings.booking")}>
            <h2 className={SECTION_HEADING_CLASS}>{t("account.settings.booking")}</h2>
            <p className="m-0 mt-2 text-[14.5px] text-[#5A5566]">{t("account.settings.bookingIntro")}</p>
            <div role="radiogroup" aria-label={t("account.settings.preferredWay")} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MODES.map(({ id, labelKey, hintKey, icon: Icon }) => {
                const on = modeValue === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMode(on ? null : id)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-start transition-colors ${on ? "border-[#7957FF] bg-[#F4F0FF]" : "border-[#D9D3E8] bg-white hover:border-[#B9A6FF]"}`}
                  >
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${on ? "text-[#7957FF]" : "text-[#6F6A7C]"}`} aria-hidden="true" />
                    <span>
                      <span className="block text-[15px] font-bold text-[#24212B]">{t(labelKey)}</span>
                      <span className="block text-[13px] text-[#5A5566]">{t(hintKey)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={shareValue}
                onChange={(e) => setShare(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#7957FF]"
              />
              <span className="text-[15px] text-[#24212B]">
                {t("account.settings.shareDefault")}
                <span className="block text-[13px] text-[#6F6A7C]">{t("account.settings.shareNote")}</span>
              </span>
            </label>
            {status && (
              <p
                role={status.ok ? "status" : "alert"}
                className={`m-0 mt-4 text-[14px] font-semibold ${status.ok ? "text-emerald-700" : "text-[#C23B3B]"}`}
              >
                {status.text}
              </p>
            )}
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="mt-4 h-11 rounded-lg bg-[#7957FF] px-6 font-bold text-white hover:bg-[#6444E6] disabled:opacity-50"
            >
              {busy ? t("common.saving") : t("account.settings.savePrefs")}
            </button>
          </section>

          <section className={CARD_CLASS} aria-label={t("account.settings.password")}>
            <h2 className={SECTION_HEADING_CLASS}>{t("account.settings.password")}</h2>
            <div className="mt-4 max-w-sm">
              <PasswordForm
                endpoint="/me/password"
                supported={data.password_change_supported}
                unsupportedHint={t("account.settings.demoNoPassword")}
              />
            </div>
          </section>

          <section className={CARD_CLASS} aria-label={t("account.settings.account")}>
            <h2 className={SECTION_HEADING_CLASS}>{t("account.settings.account")}</h2>
            <p className="m-0 mt-3 text-[15px] text-[#24212B]">
              {signedInBefore}
              <strong>{data.login_id ?? data.email}</strong>
              {signedInAfter}
            </p>
            <button
              type="button"
              onClick={signOut}
              className="mt-4 h-11 rounded-lg border border-[#D9D3E8] px-5 font-semibold text-[#C23B3B] hover:bg-[#FFF5F5]"
            >
              {t("common.signOut")}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
