"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import { validatePasswordChange, type PasswordDraft } from "@/lib/password";

const FIELD = "w-full rounded-xl border border-[#D9D3E8] bg-white px-3 py-2.5 text-sm text-[#24212B]";

/** Changes the signed-in person's password. The server checks the current one again, and the route is rate-limited. */
export function PasswordForm({ endpoint, supported, unsupportedHint }: { endpoint: string; supported: boolean; unsupportedHint: string }) {
  const { t, tx } = useI18n();
  const [draft, setDraft] = useState<PasswordDraft>({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordDraft, string>>>({});
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supported) return <p className="m-0 rounded-xl bg-[#F8F7FC] px-4 py-3 text-sm text-[#6F6A7C]">{tx(unsupportedHint)}</p>;

  const fields: { key: keyof PasswordDraft; labelKey: MessageKey; autoComplete: string }[] = [
    { key: "current", labelKey: "account.password.current", autoComplete: "current-password" },
    { key: "next", labelKey: "account.password.new", autoComplete: "new-password" },
    { key: "confirm", labelKey: "account.password.confirm", autoComplete: "new-password" },
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validatePasswordChange(draft);
    setErrors(found);
    setStatus(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await postJSON(endpoint, { current_password: draft.current, new_password: draft.next });
      setDraft({ current: "", next: "", confirm: "" });
      setStatus({ ok: true, text: t("account.password.changed") });
    } catch (failure) {
      setStatus({ ok: false, text: tx(errorMessage(failure, t("account.password.failed"))) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {fields.map(({ key, labelKey, autoComplete }) => (
        <div key={key}>
          <label htmlFor={`pw-${key}`} className="mb-1 block text-xs font-bold text-[#6F6A7C]">
            {t(labelKey)}
          </label>
          <input
            id={`pw-${key}`}
            type="password"
            autoComplete={autoComplete}
            value={draft[key]}
            onChange={(event) => setDraft((d) => ({ ...d, [key]: event.target.value }))}
            aria-invalid={Boolean(errors[key])}
            className={FIELD}
          />
          {errors[key] && <p className="m-0 mt-1 text-xs font-semibold text-rose-700">{tx(errors[key] ?? "")}</p>}
        </div>
      ))}
      {status && (
        <p
          role={status.ok ? "status" : "alert"}
          className={`m-0 text-sm font-semibold ${status.ok ? "text-emerald-700" : "text-rose-700"}`}
        >
          {status.text}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-[#171B3D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#232857] disabled:opacity-50"
      >
        {busy ? t("account.password.changing") : t("account.password.change")}
      </button>
    </form>
  );
}
