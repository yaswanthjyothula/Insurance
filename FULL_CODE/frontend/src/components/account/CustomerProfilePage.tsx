"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Languages, Star } from "lucide-react";
import { AccountTabs } from "@/components/account/AccountTabs";
import { useMyProfile } from "@/components/account/useMyProfile";
import { CARD_CLASS, SECTION_HEADING_CLASS } from "@/components/dashboard/cards";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/i18n/I18nProvider";
import { formatINR } from "@/lib/utils";

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const FIELD = "w-full rounded-xl border border-[#D9D3E8] bg-white px-3 py-2.5 text-[15px] text-[#24212B]";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#6F6A7C]">{label}</dt>
      <dd className="m-0 mt-1 text-[16px] font-semibold text-[#24212B]">{value}</dd>
    </div>
  );
}

export function CustomerProfilePage() {
  const { data, error, reload, savePreferences } = useMyProfile();
  const { t, tx } = useI18n();
  const [phone, setPhone] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneValue = phone ?? data?.preferences.phone ?? "";
  const languageValue = language ?? data?.preferences.language ?? "";

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (phoneValue && !/^[0-9]{10}$/.test(phoneValue)) {
      setStatus({ ok: false, text: t("account.profile.mobileInvalid") });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await savePreferences({ phone: phoneValue || null, language: languageValue.trim() });
      setStatus({ ok: true, text: t("account.profile.saved") });
    } catch (failure) {
      setStatus({ ok: false, text: tx(errorMessage(failure, t("account.profile.saveFailed"))) });
    } finally {
      setBusy(false);
    }
  };

  const [noProfileBefore, noProfileAfter] = t("account.profile.noProfile", { link: "{link}" }).split("{link}");
  const p = data?.profile;
  const a = data?.advisor;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="m-0 text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#24212B]">
            {t("account.profile.title")}
          </h1>
          <p className="m-0 mt-2 text-[16px] text-[#5A5566]">{t("account.profile.intro")}</p>
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
      {!data && !error && (
        <div className={`${CARD_CLASS} text-[#5A5566]`} role="status">
          {t("account.profile.loading")}
        </div>
      )}

      {data && (
        <>
          <section className={`${CARD_CLASS} flex flex-wrap items-center gap-5`} aria-label={t("account.profile.you")}>
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-2xl font-extrabold text-white"
              aria-hidden="true"
            >
              {data.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 text-[22px] font-extrabold text-[#24212B]">{data.name}</h2>
              <p className="m-0 mt-0.5 text-[14px] text-[#5A5566]">
                {data.login_id ? t("account.profile.customerId", { id: data.login_id }) : data.email}
                {p ? ` · ${p.city}` : ""}
              </p>
            </div>
          </section>

          {a && (
            <section className={CARD_CLASS} aria-label={t("account.profile.advisor")}>
              <h2 className={SECTION_HEADING_CLASS}>{t("account.profile.advisor")}</h2>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#7957FF] text-[15px] font-extrabold text-white"
                    aria-hidden="true"
                  >
                    {a.advisor_name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 flex items-center gap-1.5 text-[18px] font-extrabold text-[#24212B]">
                      {a.advisor_name} <BadgeCheck className="h-4 w-4 text-[#7957FF]" aria-label={t("account.profile.sampleAdvisor")} />
                    </p>
                    <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#5A5566]">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#F5B301] text-[#F5B301]" aria-hidden="true" /> {a.rating}
                      </span>
                      <span>{t("account.profile.years", { count: a.years_experience })}</span>
                      <span className="inline-flex items-center gap-1">
                        <Languages className="h-3.5 w-3.5" aria-hidden="true" /> {a.languages.join(", ")}
                      </span>
                    </p>
                    <p className="m-0 mt-1 text-[14px] text-[#5A5566]">
                      {a.specialisations.map((s) => cap(s.replace(/_/g, " "))).join(" · ")}
                    </p>
                    {a.bio && <p className="m-0 mt-3 max-w-xl text-[15px] leading-relaxed text-[#24212B]">{a.bio}</p>}
                  </div>
                </div>
                <Link
                  href="/advisory"
                  className="inline-flex h-11 items-center rounded-lg bg-[#7957FF] px-5 font-bold text-white hover:bg-[#6444E6]"
                >
                  {t("account.profile.bookSession")}
                </Link>
              </div>
            </section>
          )}

          <section className={CARD_CLASS} aria-label={t("account.profile.about")}>
            <h2 className={SECTION_HEADING_CLASS}>{t("account.profile.about")}</h2>
            {p ? (
              <>
                <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <Fact label={t("account.profile.age")} value={`${p.age}, ${p.gender}`} />
                  <Fact label={t("account.profile.occupation")} value={p.occupation} />
                  <Fact label={t("account.profile.work")} value={cap(p.employment_type)} />
                  <Fact label={t("account.profile.income")} value={formatINR(p.annual_income_inr, { compact: true })} />
                  <Fact label={t("account.profile.marital")} value={cap(p.marital_status)} />
                  <Fact
                    label={t("account.profile.family")}
                    value={t("account.profile.familyValue", { dependents: p.dependents, children: p.children, parents: p.parents })}
                  />
                  <Fact label={t("account.profile.risk")} value={cap(p.risk_appetite)} />
                  <Fact
                    label={t("account.profile.tobacco")}
                    value={p.smoker ? t("account.profile.smoker") : t("account.profile.nonSmoker")}
                  />
                </dl>
                <p className="m-0 mt-5 text-[13.5px] text-[#6F6A7C]">{t("account.profile.bankNote")}</p>
              </>
            ) : (
              <p className="m-0 mt-3 text-[15px] text-[#5A5566]">
                {noProfileBefore}
                <Link href="/assessment" className="font-bold text-[#7957FF] hover:underline">
                  {t("account.profile.startNeeds")}
                </Link>
                {noProfileAfter}
              </p>
            )}
          </section>

          <form onSubmit={save} noValidate className={CARD_CLASS} aria-label={t("account.profile.contact")}>
            <h2 className={SECTION_HEADING_CLASS}>{t("account.profile.contact")}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pf-phone" className="mb-1 block text-[13px] font-bold text-[#5A5566]">
                  {t("account.profile.mobile")}
                </label>
                <input
                  id="pf-phone"
                  inputMode="numeric"
                  maxLength={10}
                  value={phoneValue}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("account.profile.mobilePlaceholder")}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="pf-lang" className="mb-1 block text-[13px] font-bold text-[#5A5566]">
                  {t("account.profile.language")}
                </label>
                <input
                  id="pf-lang"
                  maxLength={30}
                  value={languageValue}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder={t("account.profile.languagePlaceholder")}
                  className={FIELD}
                />
              </div>
            </div>
            {data.email && <p className="m-0 mt-3 text-[13.5px] text-[#6F6A7C]">{t("account.profile.email", { email: data.email })}</p>}
            {status && (
              <p
                role={status.ok ? "status" : "alert"}
                className={`m-0 mt-3 text-[14px] font-semibold ${status.ok ? "text-emerald-700" : "text-[#C23B3B]"}`}
              >
                {status.text}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 h-11 rounded-lg bg-[#7957FF] px-6 font-bold text-white hover:bg-[#6444E6] disabled:opacity-50"
            >
              {busy ? t("common.saving") : t("account.profile.save")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
