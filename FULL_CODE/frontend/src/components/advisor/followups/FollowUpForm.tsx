"use client";

import { useEffect, useState } from "react";
import { fetchFromAPI, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { dateInDays, validateDraft, type FollowUpDraft } from "@/components/advisor/followups/followup-helpers";
import type { AdvisorSettings, CustomerPage, FollowUp, Priority } from "@/types/advisor";

const FIELD = "w-full rounded-xl border border-[#E8E5F0] bg-white px-3 py-2 text-sm text-[#24212B]";
const LABEL = "mb-1 block text-xs font-bold text-[#6F6A7C]";

/** Adds a follow-up. The due date starts from the advisor's own default (Settings), and a customer can be attached from their book. */
export function FollowUpForm({
  presetCustomer,
  onCreated,
  onCancel,
}: {
  presetCustomer?: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<FollowUpDraft>({
    title: "",
    note: "",
    due_date: dateInDays(3),
    priority: "medium",
    profile_id: presetCustomer ?? "",
  });
  const [customers, setCustomers] = useState<CustomerPage["items"]>([]);
  const [errors, setErrors] = useState<Partial<Record<"title" | "due_date", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFromAPI<AdvisorSettings>("/advisor/settings")
      .then((s) => !cancelled && setDraft((d) => ({ ...d, due_date: dateInDays(s.follow_up_default_days) })))
      .catch(() => undefined); // the built-in default stays
    fetchFromAPI<CustomerPage>("/advisor/customers?page_size=50&sort=name")
      .then((page) => !cancelled && setCustomers(page.items))
      .catch(() => undefined); // the follow-up can still be saved without a customer
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FollowUpDraft>(key: K, value: FollowUpDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await postJSON<FollowUp>("/advisor/follow-ups", { ...draft, profile_id: draft.profile_id || null });
      onCreated();
    } catch (failure) {
      setFormError(errorMessage(failure, "We couldn't save the follow-up."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4 rounded-2xl border border-[#E8E5F0] bg-white p-5 shadow-[0_1px_2px_rgba(23,27,61,0.04)]"
    >
      <h2 className="m-0 text-base font-bold text-[#24212B]">New follow-up</h2>
      <div>
        <label htmlFor="fu-title" className={LABEL}>
          What needs doing?
        </label>
        <input
          id="fu-title"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={120}
          className={FIELD}
          placeholder="Send rider options after the call"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="m-0 mt-1 text-xs font-semibold text-rose-700">{errors.title}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="fu-due" className={LABEL}>
            Due date
          </label>
          <input
            id="fu-due"
            type="date"
            value={draft.due_date}
            onChange={(e) => set("due_date", e.target.value)}
            className={FIELD}
            aria-invalid={Boolean(errors.due_date)}
          />
          {errors.due_date && <p className="m-0 mt-1 text-xs font-semibold text-rose-700">{errors.due_date}</p>}
        </div>
        <div>
          <label htmlFor="fu-priority" className={LABEL}>
            Priority
          </label>
          <select id="fu-priority" value={draft.priority} onChange={(e) => set("priority", e.target.value as Priority)} className={FIELD}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label htmlFor="fu-customer" className={LABEL}>
            Customer (optional)
          </label>
          <select id="fu-customer" value={draft.profile_id} onChange={(e) => set("profile_id", e.target.value)} className={FIELD}>
            <option value="">No customer</option>
            {customers.map((c) => (
              <option key={c.profile_id} value={c.profile_id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="fu-note" className={LABEL}>
          Notes (optional)
        </label>
        <textarea
          id="fu-note"
          value={draft.note}
          onChange={(e) => set("note", e.target.value)}
          maxLength={1000}
          rows={3}
          className={`${FIELD} resize-y`}
        />
      </div>
      {formError && (
        <p role="alert" className="m-0 text-xs font-semibold text-rose-700">
          {formError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add follow-up"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#6F6A7C] hover:text-[#24212B]">
          Cancel
        </button>
      </div>
    </form>
  );
}
