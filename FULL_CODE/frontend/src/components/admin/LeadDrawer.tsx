"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/admin/AdminUi";
import { Skeleton } from "@/components/advisor/dashboard/parts";
import { SOURCE_LABEL, STAGES } from "@/lib/crm";
import { inrShort } from "@/lib/admin-form";
import { ApiError, fetchFromAPI, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { formatIst } from "@/lib/time";
import type { CrmLead, Pipeline, Stage } from "@/types/admin";

const FIELD = "w-full rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-sm text-[#0E1330]";
const stamp = formatIst;
const INPUT_LABEL: Record<string, string> = {
  age: "Age",
  annual_income: "Annual income",
  dependents_count: "Dependents",
  outstanding_liabilities: "Loans",
  existing_cover: "Existing cover",
  eligible_assets: "Savings",
};

interface Props {
  leadId: string | null;
  advisors: Pipeline["advisors"];
  onClose: () => void;
  /** Called after any change, so the board refreshes. */
  onChanged: () => void;
  /** Open with the "why was it lost?" question already showing, as when a card is dropped on Lost. */
  startWithLost?: boolean;
}

/** One lead in full: stage and owner, the answers they gave, notes, and everything that has happened to it. */
export function LeadDrawer({ leadId, advisors, onClose, onChanged, startWithLost = false }: Props) {
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [askLost, setAskLost] = useState(startWithLost);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;
    fetchFromAPI<CrmLead>(`/admin/crm/leads/${encodeURIComponent(leadId)}`)
      .then((l) => {
        if (cancelled) return;
        setLead(l);
        setError(null);
      })
      .catch((f: unknown) => !cancelled && setError(errorMessage(f, "We couldn't load this lead.")));
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const close = () => {
    setLead(null);
    setNote("");
    setAskLost(false);
    setLostReason("");
    setMessage(null);
    setError(null);
    onClose();
  };

  const change = async (body: Record<string, unknown>, ok: string) => {
    if (!lead) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await fetchFromAPI<CrmLead>(`/admin/crm/leads/${encodeURIComponent(lead.lead_id)}`, {
        method: "PUT",
        body: JSON.stringify({ ...body, expected_version: lead.version }),
      });
      setLead(next);
      setAskLost(false);
      setLostReason("");
      setMessage({ ok: true, text: ok });
      onChanged();
    } catch (failure) {
      setMessage({ ok: false, text: errorMessage(failure, "That change didn't save.") });
      if (failure instanceof ApiError && failure.status === 409) {
        fetchFromAPI<CrmLead>(`/admin/crm/leads/${encodeURIComponent(lead.lead_id)}`)
          .then(setLead)
          .catch(() => undefined);
      }
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lead || !note.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      setLead(await postJSON<CrmLead>(`/admin/crm/leads/${encodeURIComponent(lead.lead_id)}/notes`, { text: note }));
      setNote("");
      onChanged();
    } catch (failure) {
      setMessage({ ok: false, text: errorMessage(failure, "The note didn't save.") });
    } finally {
      setBusy(false);
    }
  };

  const pickStage = (stage: Stage) => {
    if (!lead || stage === lead.stage) return;
    if (stage === "lost") return setAskLost(true);
    void change({ stage }, `Moved to ${STAGES.find((s) => s.key === stage)?.label}.`);
  };

  return (
    <Drawer open={leadId !== null} title={lead ? lead.name : "Lead"} onClose={close} wide>
      {error ? (
        <p role="alert" className="m-0 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : !lead ? (
        <div role="status" aria-label="Loading lead" className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="m-0 text-sm text-[#6F6A7C]">
              {lead.customer_id || lead.contact || "No contact on file"} · {SOURCE_LABEL[lead.source]} · created {stamp(lead.created_at)}
            </p>
            <p className="m-0 mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                Cover needed <strong className="tabular-nums">{inrShort(lead.cover_needed)}</strong>
              </span>
              <span>
                Chosen plan, yearly <strong className="tabular-nums">{inrShort(lead.annual_premium)}</strong>
              </span>
            </p>
          </div>

          <section aria-label="Stage and owner" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lead-stage" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
                Stage
              </label>
              <select
                id="lead-stage"
                value={lead.stage}
                disabled={busy}
                onChange={(e) => pickStage(e.target.value as Stage)}
                className={FIELD}
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-owner" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
                Owner
              </label>
              <select
                id="lead-owner"
                value={lead.owner_advisor_id ?? ""}
                disabled={busy}
                onChange={(e) =>
                  change(
                    e.target.value ? { owner_advisor_id: e.target.value } : { clear_owner: true },
                    e.target.value ? "Owner assigned." : "Owner removed.",
                  )
                }
                className={FIELD}
              >
                <option value="">Unassigned</option>
                {advisors.map((a) => (
                  <option key={a.advisor_id} value={a.advisor_id}>
                    {a.advisor_name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {askLost && (
            <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <label htmlFor="lead-lost" className="block text-sm font-bold text-rose-900">
                Why was this lead lost?
              </label>
              <input
                id="lead-lost"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                maxLength={200}
                placeholder="Chose a competitor, too expensive, no response…"
                className={FIELD}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || lostReason.trim().length < 3}
                  onClick={() => change({ stage: "lost", lost_reason: lostReason }, "Marked as lost.")}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Mark as lost
                </button>
                <button
                  type="button"
                  onClick={() => setAskLost(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-[#6F6A7C]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {lead.stage === "lost" && lead.lost_reason && (
            <p className="m-0 rounded-xl bg-[#FDECEC] px-4 py-2.5 text-sm text-[#B42318]">
              <strong>Lost:</strong> {lead.lost_reason}
            </p>
          )}
          {message && (
            <p
              role={message.ok ? "status" : "alert"}
              className={`m-0 text-sm font-semibold ${message.ok ? "text-emerald-700" : "text-rose-700"}`}
            >
              {message.text}
            </p>
          )}

          {Object.values(lead.inputs).some((v) => v !== null && v !== undefined) && (
            <section aria-label="Their answers">
              <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-[#8A849A]">What they told us</h3>
              <dl className="m-0 grid grid-cols-2 gap-3 rounded-2xl bg-[#F8F7FC] p-4 sm:grid-cols-3">
                {Object.entries(lead.inputs).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold text-[#8A849A]">{INPUT_LABEL[k] ?? k}</dt>
                    <dd className="m-0 mt-0.5 text-sm font-bold tabular-nums text-[#0E1330]">
                      {k === "age" || k === "dependents_count" ? (v ?? "—") : inrShort(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section aria-label="Notes">
            <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-[#8A849A]">Notes</h3>
            <form onSubmit={addNote} className="flex gap-2">
              <label htmlFor="lead-note" className="sr-only">
                Add a note
              </label>
              <input
                id="lead-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                placeholder="Add a note…"
                className={FIELD}
              />
              <button
                type="submit"
                disabled={busy || !note.trim()}
                className="shrink-0 rounded-xl bg-[#3D55E0] px-4 py-2 text-sm font-bold text-white hover:bg-[#2F44C4] disabled:opacity-40"
              >
                Add
              </button>
            </form>
            <ul className="m-0 mt-3 list-none space-y-2 p-0">
              {[...lead.notes].reverse().map((n, i) => (
                <li key={`${n.at}-${i}`} className="rounded-xl border border-[#E8E5F0] p-3">
                  <p className="m-0 whitespace-pre-wrap break-words text-sm text-[#0E1330]">{n.text}</p>
                  <p className="m-0 mt-1 text-xs text-[#8A849A]">
                    {n.by.split("@")[0]} · {stamp(n.at)}
                  </p>
                </li>
              ))}
              {lead.notes.length === 0 && <li className="text-sm text-[#8A849A]">No notes yet.</li>}
            </ul>
          </section>

          <section aria-label="History">
            <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-[#8A849A]">History</h3>
            <ol className="m-0 list-none space-y-3 border-l border-[#E8E5F0] p-0 pl-5">
              {[...lead.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="relative">
                  <span
                    className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#3D55E0] ring-4 ring-white"
                    aria-hidden="true"
                  />
                  <p className="m-0 text-sm text-[#0E1330]">
                    {h.from_stage ? (
                      <>
                        Moved from <strong>{h.from_stage}</strong> to <strong>{h.to_stage}</strong>
                      </>
                    ) : (
                      <>
                        Created as <strong>{h.to_stage}</strong>
                      </>
                    )}
                    {h.note ? ` · ${h.note}` : ""}
                  </p>
                  <p className="m-0 text-xs text-[#8A849A]">
                    {h.by === "system" ? "Platform" : h.by.split("@")[0]} · {stamp(h.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}
