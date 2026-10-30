"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, ClipboardCheck, Plus, RefreshCw, Trash2 } from "lucide-react";
import { m } from "motion/react";
import { EmptyState, Skeleton } from "@/components/advisor/dashboard/parts";
import { FollowUpForm } from "@/components/advisor/followups/FollowUpForm";
import { PRIORITY_LABEL, dueLabel } from "@/components/advisor/followups/followup-helpers";
import { useFollowUps, type FollowUpScope } from "@/components/advisor/followups/useFollowUps";
import { rise, stagger } from "@/components/advisor/motion";
import { fetchFromAPI } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { FollowUp } from "@/types/advisor";

const TABS: { scope: FollowUpScope; label: string }[] = [
  { scope: "open", label: "Open" },
  { scope: "overdue", label: "Overdue" },
  { scope: "done", label: "Done" },
];

const EMPTY: Record<FollowUpScope, { title: string; hint: string }> = {
  open: { title: "Nothing to follow up", hint: "Add a task so you remember who to call back and what to send." },
  overdue: { title: "Nothing overdue", hint: "You are on top of your follow-ups." },
  done: { title: "No completed follow-ups yet", hint: "Tasks you finish are kept here." },
};

const PRIORITY_TONE = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

function Row({ item, onChange, onError }: { item: FollowUp; onChange: () => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    try {
      await action();
      onChange();
    } catch (error) {
      onError(errorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };
  const done = item.status === "done";
  const id = encodeURIComponent(item.follow_up_id);
  return (
    <m.li
      variants={rise}
      className="flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-[#E8E5F0] hover:bg-[#FBFAFE]"
    >
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(
            () => fetchFromAPI(`/advisor/follow-ups/${id}`, { method: "PUT", body: JSON.stringify({ status: done ? "open" : "done" }) }),
            "We couldn't update that follow-up.",
          )
        }
        aria-label={done ? `Reopen: ${item.title}` : `Mark done: ${item.title}`}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#C4BFD3] text-transparent hover:border-[#7957FF] hover:text-[#7957FF]"}`}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`m-0 text-sm font-bold ${done ? "text-[#8A849A] line-through" : "text-[#24212B]"}`}>{item.title}</p>
        {item.note && <p className="m-0 mt-0.5 text-xs text-[#6F6A7C]">{item.note}</p>}
        <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={`font-semibold ${item.overdue ? "text-rose-700" : "text-[#6F6A7C]"}`}>{dueLabel(item)}</span>
          <span className="text-[#8A849A]">{item.due_date}</span>
          {item.customer_name && item.profile_id && (
            <Link
              href={`/advisor/customers/${encodeURIComponent(item.profile_id)}`}
              className="font-semibold text-[#6240E6] hover:underline"
            >
              {item.customer_name}
            </Link>
          )}
        </p>
      </div>
      <span
        className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRIORITY_TONE[item.priority]}`}
      >
        {PRIORITY_LABEL[item.priority]}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          window.confirm("Delete this follow-up?") &&
          run(() => fetchFromAPI(`/advisor/follow-ups/${id}`, { method: "DELETE" }), "We couldn't delete that follow-up.")
        }
        aria-label={`Delete: ${item.title}`}
        className="mt-0.5 rounded-lg p-1.5 text-[#A59FB5] transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </m.li>
  );
}

export function FollowUpsPage() {
  const customer = useSearchParams().get("customer") ?? undefined;
  const [scope, setScope] = useState<FollowUpScope>("open");
  const [adding, setAdding] = useState(Boolean(customer));
  const [actionError, setActionError] = useState<string | null>(null);
  const { items, error, reload } = useFollowUps(scope);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">Follow-ups</h1>
          <p className="m-0 text-sm text-[#6F6A7C]">Your own to-do list for customers: who to call back, what to send and by when.</p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#232857]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New follow-up
          </button>
        )}
      </header>

      {adding && (
        <FollowUpForm
          presetCustomer={customer}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setScope("open");
            reload();
          }}
        />
      )}

      <div role="tablist" aria-label="Follow-up status" className="inline-flex rounded-2xl border border-[#E8E5F0] bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.scope}
            type="button"
            role="tab"
            aria-selected={scope === tab.scope}
            onClick={() => setScope(tab.scope)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-colors ${scope === tab.scope ? "bg-[#171B3D] text-white" : "text-[#6F6A7C] hover:text-[#24212B]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800">
          {actionError}
        </p>
      )}

      {error ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-500" aria-hidden="true" />
          <p className="m-0 text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
        </div>
      ) : !items ? (
        <div role="status" aria-label="Loading follow-ups" className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={EMPTY[scope].title} hint={EMPTY[scope].hint} />
      ) : (
        <section aria-label="Follow-ups" className="rounded-2xl border border-[#E8E5F0] bg-white p-2 sm:p-3">
          <m.ul key={scope} variants={stagger} initial="hidden" animate="show" className="m-0 list-none space-y-1 p-0">
            {items.map((item) => (
              <Row
                key={item.follow_up_id}
                item={item}
                onChange={() => {
                  setActionError(null);
                  reload();
                }}
                onError={setActionError}
              />
            ))}
          </m.ul>
        </section>
      )}
    </div>
  );
}
