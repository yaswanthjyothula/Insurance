"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Plus, RefreshCw, Search } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { Drawer } from "@/components/admin/AdminUi";
import { CrmReports } from "@/components/admin/CrmReports";
import { LeadDrawer } from "@/components/admin/LeadDrawer";
import { EmptyState, Skeleton } from "@/components/advisor/dashboard/parts";
import { inrShort } from "@/lib/admin-form";
import { SOURCE_LABEL, STAGES, ageLabel, moveCard } from "@/lib/crm";
import { downloadFile } from "@/lib/admin-download";
import { fetchFromAPI, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import type { CrmLead, LeadCard, Pipeline, Stage } from "@/types/admin";
import { Users } from "lucide-react";

const FIELD = "w-full rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-sm text-[#0E1330]";

function Card({
  lead,
  onOpen,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  lead: LeadCard;
  onOpen: () => void;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <m.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="list-none"
    >
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", lead.lead_id);
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onClick={onOpen}
        aria-label={`${lead.name}, ${lead.stage}. Open details`}
        className={`w-full cursor-grab rounded-xl border bg-white p-3 text-left shadow-[0_1px_2px_rgba(14,19,48,0.05)] transition hover:border-[#B9C3FF] hover:shadow-md active:cursor-grabbing ${dragging ? "border-[#3D55E0] opacity-50" : "border-[#E8E5F0]"}`}
      >
        <span className="block truncate text-sm font-bold text-[#0E1330]">{lead.name}</span>
        <span className="block truncate text-xs text-[#8A849A]">{lead.customer_id || lead.contact || SOURCE_LABEL[lead.source]}</span>
        <span className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="font-bold tabular-nums text-[#3D55E0]">{lead.cover_needed ? inrShort(lead.cover_needed) : "—"}</span>
          <span className="text-[#8A849A]">{ageLabel(lead.days_in_stage)} here</span>
        </span>
        <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#6F6A7C]">
          <span className="truncate">{lead.owner_name ?? "Unassigned"}</span>
          {lead.note_count > 0 && (
            <span>
              {lead.note_count} note{lead.note_count === 1 ? "" : "s"}
            </span>
          )}
        </span>
      </button>
    </m.li>
  );
}

function NewLeadForm({
  advisors,
  onDone,
  onCancel,
}: {
  advisors: Pipeline["advisors"];
  onDone: (lead: CrmLead) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ name: "", contact: "", cover: "", note: "", owner: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError("Enter the person's name.");
    setBusy(true);
    setError(null);
    try {
      onDone(
        await postJSON<CrmLead>("/admin/crm/leads", {
          name: form.name.trim(),
          contact: form.contact.trim(),
          cover_needed: form.cover ? Number(form.cover) : null,
          note: form.note.trim(),
          owner_advisor_id: form.owner || null,
        }),
      );
    } catch (failure) {
      setError(errorMessage(failure, "We couldn't add the lead."));
    } finally {
      setBusy(false);
    }
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="nl-name" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
          Name
        </label>
        <input id="nl-name" value={form.name} onChange={set("name")} maxLength={80} className={FIELD} />
      </div>
      <div>
        <label htmlFor="nl-contact" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
          Email or phone
        </label>
        <input id="nl-contact" value={form.contact} onChange={set("contact")} maxLength={120} className={FIELD} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nl-cover" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
            Cover needed (₹, optional)
          </label>
          <input id="nl-cover" type="number" step={100000} min={0} value={form.cover} onChange={set("cover")} className={FIELD} />
        </div>
        <div>
          <label htmlFor="nl-owner" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
            Owner
          </label>
          <select id="nl-owner" value={form.owner} onChange={set("owner")} className={FIELD}>
            <option value="">Unassigned</option>
            {advisors.map((a) => (
              <option key={a.advisor_id} value={a.advisor_id}>
                {a.advisor_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="nl-note" className="mb-1 block text-xs font-bold text-[#6F6A7C]">
          First note (optional)
        </label>
        <textarea id="nl-note" rows={3} value={form.note} onChange={set("note")} maxLength={1000} className={`${FIELD} resize-y`} />
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#3D55E0] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F44C4] disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add lead"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#6F6A7C]">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CrmTab() {
  const [view, setView] = useState<"board" | "reports">("board");
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState("");
  const [open, setOpen] = useState<{ id: string; lost: boolean } | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadCount = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    const mine = ++loadCount.current;
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (owner) params.set("owner", owner);
      if (source) params.set("source", source);
      const next = await fetchFromAPI<Pipeline>(`/admin/crm/pipeline?${params.toString()}`);
      if (mine === loadCount.current) {
        setPipeline(next);
        setError(null);
      }
    } catch (failure) {
      if (mine === loadCount.current) setError(errorMessage(failure, "We couldn't load the pipeline."));
    }
  }, [search, owner, source]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the board whenever a filter changes
    void load();
  }, [load, refreshKey]);

  const refresh = () => setRefreshKey((n) => n + 1);

  const drop = async (stage: Stage) => {
    const id = dragId;
    setDragId(null);
    setOverStage(null);
    if (!id || !pipeline) return;
    const card = pipeline.stages.flatMap((c) => c.leads).find((l) => l.lead_id === id);
    if (!card || card.stage === stage) return;
    if (stage === "lost") return setOpen({ id, lost: true }); // a reason is needed first
    const before = pipeline;
    setPipeline({ ...pipeline, stages: moveCard(pipeline.stages, id, stage) });
    try {
      await fetchFromAPI(`/admin/crm/leads/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ stage }) });
      setNotice({ ok: true, text: `${card.name} moved to ${STAGES.find((s) => s.key === stage)?.label}.` });
      refresh();
    } catch (failure) {
      setPipeline(before); // put the card back: the server did not accept the move
      setNotice({ ok: false, text: errorMessage(failure, "The move didn't save.") });
    }
  };

  const syncNow = async () => {
    setNotice(null);
    try {
      await postJSON("/admin/crm/sync", {});
      refresh();
      setNotice({ ok: true, text: "Leads are up to date with customer activity." });
    } catch (failure) {
      setNotice({ ok: false, text: errorMessage(failure, "The sync failed.") });
    }
  };

  const exportAs = async (format: "csv" | "json") => {
    try {
      await downloadFile(`/admin/crm/export?format=${format}`, `lifesure-crm.${format}`);
    } catch (failure) {
      setNotice({ ok: false, text: errorMessage(failure, "The export failed.") });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="CRM views" className="inline-flex rounded-2xl border border-[#E8E5F0] bg-white p-1">
          {(["board", "reports"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-colors ${view === v ? "bg-[#0E1330] text-white" : "text-[#6F6A7C] hover:text-[#0E1330]"}`}
            >
              {v === "board" ? "Pipeline" : "Reports"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={syncNow}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-xs font-bold text-[#0E1330] hover:border-[#3D55E0]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Sync
          </button>
          {(["csv", "json"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => exportAs(f)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-xs font-bold text-[#3D55E0] hover:border-[#3D55E0]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export {f.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D55E0] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#2F44C4]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New lead
          </button>
        </div>
      </div>

      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={`m-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
        >
          {notice.text}
        </p>
      )}

      {view === "reports" ? (
        <CrmReports refreshKey={refreshKey} />
      ) : error ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="m-0 text-sm font-semibold text-rose-800">{error}</p>
          <button type="button" onClick={refresh} className="rounded-xl bg-[#0E1330] px-4 py-2 text-sm font-bold text-white">
            Try again
          </button>
        </div>
      ) : !pipeline ? (
        <div role="status" aria-label="Loading pipeline" className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s) => (
            <Skeleton key={s.key} className="h-64" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A59FB5]" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, ID or contact"
                aria-label="Search leads"
                className="w-full rounded-xl border border-[#D9D3E8] bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              aria-label="Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-sm"
            >
              <option value="">Any owner</option>
              <option value="none">Unassigned</option>
              {pipeline.advisors.map((a) => (
                <option key={a.advisor_id} value={a.advisor_id}>
                  {a.advisor_name}
                </option>
              ))}
            </select>
            <select
              aria-label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-xl border border-[#D9D3E8] bg-white px-3 py-2 text-sm"
            >
              <option value="">Any source</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <p className="m-0 text-xs text-[#6F6A7C] sm:ml-auto">
              <strong className="text-[#0E1330]">{pipeline.open_leads}</strong> open · {inrShort(pipeline.open_cover)} of cover needed
            </p>
          </div>

          {pipeline.total_leads === 0 && !search && !owner && !source ? (
            <EmptyState
              icon={Users}
              title="No leads yet"
              hint="A lead appears when a signed-in customer completes an assessment or books an advisor. You can also add one by hand."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-label="Pipeline board">
              {pipeline.stages.map((col) => {
                const meta = STAGES.find((s) => s.key === col.key)!;
                return (
                  <section
                    key={col.key}
                    aria-label={`${col.label}, ${col.count} leads`}
                    onDragOver={(e) => {
                      if (dragId) {
                        e.preventDefault();
                        setOverStage(col.key);
                      }
                    }}
                    onDragLeave={() => setOverStage((s) => (s === col.key ? null : s))}
                    onDrop={(e) => {
                      e.preventDefault();
                      void drop(col.key);
                    }}
                    className={`flex min-h-[220px] flex-col rounded-2xl border p-2.5 transition-colors ${overStage === col.key ? "border-[#3D55E0] bg-[#EEF1FF]" : "border-[#E8E5F0] bg-[#F8F8FD]"}`}
                  >
                    <header className="mb-2 flex items-center justify-between gap-2 px-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.tone}`}>{col.label}</span>
                      <span className="text-xs tabular-nums text-[#6F6A7C]">
                        {col.count}
                        {col.cover_total > 0 && <span className="text-[#A59FB5]"> · {inrShort(col.cover_total)}</span>}
                      </span>
                    </header>
                    <ul className="m-0 flex flex-1 flex-col gap-2 p-0">
                      <AnimatePresence initial={false}>
                        {col.leads.map((lead) => (
                          <Card
                            key={lead.lead_id}
                            lead={lead}
                            dragging={dragId === lead.lead_id}
                            onDragStart={() => setDragId(lead.lead_id)}
                            onDragEnd={() => {
                              setDragId(null);
                              setOverStage(null);
                            }}
                            onOpen={() => setOpen({ id: lead.lead_id, lost: false })}
                          />
                        ))}
                      </AnimatePresence>
                      {col.leads.length === 0 && (
                        <li className="list-none px-1 py-6 text-center text-xs text-[#A59FB5]">Drop a lead here</li>
                      )}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
          <p className="m-0 text-xs text-[#8A849A]">
            Drag a card to another column, or open it to change the stage with the keyboard. The platform moves leads forward when a
            customer books an advisor or chooses a plan, never backwards.
          </p>
        </>
      )}

      <LeadDrawer
        key={open ? `${open.id}-${open.lost}` : "none"}
        leadId={open?.id ?? null}
        startWithLost={open?.lost ?? false}
        advisors={pipeline?.advisors ?? []}
        onClose={() => setOpen(null)}
        onChanged={refresh}
      />

      <Drawer open={adding} title="New lead" onClose={() => setAdding(false)}>
        {pipeline && (
          <NewLeadForm
            advisors={pipeline.advisors}
            onCancel={() => setAdding(false)}
            onDone={(lead) => {
              setAdding(false);
              refresh();
              setNotice({ ok: true, text: `${lead.name} was added to New.` });
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
