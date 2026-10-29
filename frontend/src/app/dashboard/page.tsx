"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAssessmentStore } from "@/store/assessment-store";
import { fetchFromAPI } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { saveMyPlan, summariseAssessment, summarisePlan, type MyPlanData } from "@/lib/my-plan";

interface Booking {
  booking_id: string;
  advisor_name: string;
  slot: string;
  status: string;
  consultation_mode?: string;
  created_at?: string;
}

const MODE: Record<string, string> = { video: "Video call", voice: "Phone call", chat: "Chat" };
const dateLabel = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const card = "rounded-3xl bg-[#FFFFFF] border border-[#D9D3E8] p-6 sm:p-7";
const h2 = "m-0 text-[13px] font-bold uppercase tracking-[0.14em] text-[#7957FF]";

export default function MyPlanPage() {
  const { user } = useAuth();
  const store = useAssessmentStore();
  const email = user?.email;
  const [saved, setSaved] = useState<MyPlanData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!email) return;
    setError(null);
    try {
      const q = encodeURIComponent(email);
      const [mine, appts] = await Promise.all([fetchFromAPI(`/my-plan?email=${q}`), fetchFromAPI(`/advisory/bookings?email=${q}`)]);
      setSaved(mine ?? {});
      setBookings(Array.isArray(appts) ? appts : []);
    } catch {
      setError("We couldn't reach the server, so your saved plan may not be showing. Make sure the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetched after mount
    load();
  }, [load]);

  // Work done in this browser before signing in is saved to the account the first time it is empty there
  useEffect(() => {
    if (!email || !store.isHydrated || loading || error || !saved) return;
    const patch: Parameters<typeof saveMyPlan>[1] = {};
    if (!saved.assessment && store.result) patch.assessment = summariseAssessment(store.result);
    if (!saved.plan && store.selectedProduct && store.customization) patch.plan = summarisePlan(store.selectedProduct, store.customization);
    if (patch.assessment || patch.plan) {
      saveMyPlan(email, patch);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect what was just saved
      setSaved((s) => ({ ...(s ?? {}), ...patch }));
    }
  }, [email, store.isHydrated, store.result, store.selectedProduct, store.customization, loading, error, saved]);

  const removePlan = async () => {
    if (!email) return;
    await fetchFromAPI(`/my-plan/choice?email=${encodeURIComponent(email)}`, { method: "DELETE" }).catch(() => undefined);
    setSaved((s) => (s ? { ...s, plan: undefined } : s));
  };

  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      const b = await fetchFromAPI(`/advisory/bookings/${id}/cancel`, { method: "POST" });
      setBookings((list) => list.map((x) => (x.booking_id === id ? { ...x, status: b.status } : x)));
    } catch {
      setError("Could not cancel that appointment. Try again.");
    }
  };

  const name = user?.user_metadata?.full_name || email?.split("@")[0] || "there";
  const a = saved?.assessment;
  const plan = saved?.plan;
  const upcoming = bookings.filter((b) => b.status !== "cancelled");
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="m-0 text-[clamp(26px,3vw,36px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-[#24212B]">My plan</h1>
        <p className="m-0 mt-2 text-[16px] text-[#5A5566]">Hi {name}. Your cover need, the plan you chose and your advisor appointments, all in one place.</p>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[#C23B3B] text-[#C23B3B] font-semibold">
          <span>{error}</span>
          <button type="button" onClick={() => { setLoading(true); load(); }} className="inline-flex items-center gap-1.5 underline"><RefreshCw className="w-4 h-4" />Try again</button>
        </div>
      )}

      {loading ? (
        <div className={`${card} flex items-center gap-3 text-[#5A5566]`} role="status"><Loader2 className="w-5 h-5 animate-spin text-[#7957FF]" />Loading your plan…</div>
      ) : (
        <>
          <section className={card} aria-label="Cover need">
            <h2 className={h2}>1. Your cover need</h2>
            {a ? (
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[13px] text-[#6F6A7C]">Extra cover your family needs</div>
                  <div className="text-[34px] font-extrabold tracking-[-0.03em] text-[#24212B]">{formatINR(a.net_coverage_gap, { compact: true })}</div>
                  <div className="text-[13px] text-[#6F6A7C]">Worked out on {dateLabel(a.saved_at)}{a.dependents != null ? ` · ${a.dependents} dependents` : ""}</div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/results" className="h-11 px-5 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] font-semibold inline-flex items-center">See full results</Link>
                  <Link href="/assessment" className="h-11 px-5 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] font-semibold inline-flex items-center">Update my answers</Link>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <p className="m-0 text-[16px] text-[#5A5566]">You haven&apos;t worked out your cover need yet. It takes about two minutes.</p>
                <Link href="/assessment" className="h-11 px-5 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold inline-flex items-center gap-2">Start the assessment<ArrowRight className="w-4 h-4" /></Link>
              </div>
            )}
          </section>

          <section className={card} aria-label="Chosen plan">
            <h2 className={h2}>2. Your chosen plan</h2>
            {plan ? (
              <div className="mt-3 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[#24212B]">{plan.product_name}</div>
                    <div className="text-[14px] text-[#6F6A7C]">{plan.insurer} · saved {dateLabel(plan.saved_at)}</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9E4FF] px-3 py-1 text-[13px] font-bold text-[#7957FF]"><CheckCircle2 className="w-4 h-4" />Saved</span>
                </div>
                <dl className="m-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[["Cover", formatINR(plan.sum_assured, { compact: true })], ["Term", `${plan.tenure_years} years`], ["Est. per month", `≈ ${formatINR(plan.monthly_premium)}`], ["Riders", plan.riders.length ? `${plan.riders.length} added` : "None"]].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-[#FAF9F6] border border-[#E9E4FF] px-4 py-3"><dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F6A7C]">{k}</dt><dd className="m-0 mt-0.5 text-[18px] font-extrabold tabular-nums">{v}</dd></div>
                  ))}
                </dl>
                <p className="m-0 text-[13px] text-[#6F6A7C]">The monthly figure is an estimate. Only the insurer can give an exact price.</p>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/advisory" className="h-11 px-5 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold inline-flex items-center gap-2">Talk to an advisor<ArrowRight className="w-4 h-4" /></Link>
                  {(plan.quote_url || plan.product_page_url) && <a href={(plan.quote_url || plan.product_page_url) as string} target="_blank" rel="noreferrer" className="h-11 px-5 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] font-semibold inline-flex items-center gap-1.5">Get the exact price<ExternalLink className="w-4 h-4" /></a>}
                  <Link href="/products" className="h-11 px-5 rounded-lg border border-[#D9D3E8] bg-[#FFFFFF] font-semibold inline-flex items-center">Change plan</Link>
                  <button type="button" onClick={removePlan} className="h-11 px-4 rounded-lg text-[#C23B3B] font-semibold inline-flex items-center gap-1.5 hover:bg-[#FDECEF]"><Trash2 className="w-4 h-4" />Remove</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <p className="m-0 text-[16px] text-[#5A5566]">{a ? "You haven't chosen a plan yet. Compare plans matched to your cover need." : "Work out your cover need first, then compare plans."}</p>
                <Link href={a ? "/products" : "/assessment"} className="h-11 px-5 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold inline-flex items-center gap-2">{a ? "See matched plans" : "Start the assessment"}<ArrowRight className="w-4 h-4" /></Link>
              </div>
            )}
          </section>

          <section className={card} aria-label="Appointments">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={h2}>3. Your appointments</h2>
              <Link href="/advisory" className="text-[14px] font-bold text-[#7957FF] hover:underline">Book {bookings.length ? "another" : "an advisor"}</Link>
            </div>
            {bookings.length === 0 ? (
              <p className="m-0 mt-3 text-[16px] text-[#5A5566]">No appointments yet. Book a session and it will appear here.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-5">
                {([["Upcoming", upcoming], ["Cancelled", cancelled]] as [string, Booking[]][]).map(([title, list]) => list.length > 0 && (
                  <div key={title}>
                    <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6F6A7C]">{title}</div>
                    <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-2.5">
                      {list.map((b) => (
                        <li key={b.booking_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9D3E8] px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-[#E9E4FF] text-[#7957FF]"><CalendarClock className="w-5 h-5" /></span>
                            <div>
                              <div className="font-bold text-[#24212B]">{b.advisor_name}</div>
                              <div className="text-[14px] text-[#5A5566]">{b.slot} · {MODE[b.consultation_mode ?? ""] ?? "Video call"}</div>
                              <div className="text-[12.5px] text-[#6F6A7C]">Booked {dateLabel(b.created_at)} · ref {b.booking_id.slice(0, 8).toUpperCase()}</div>
                            </div>
                          </div>
                          {b.status !== "cancelled" ? <button type="button" onClick={() => cancel(b.booking_id)} className="h-10 px-4 rounded-lg border border-[#D9D3E8] text-[14px] font-semibold hover:border-[#C23B3B] hover:text-[#C23B3B]">Cancel</button> : <span className="text-[13px] font-semibold text-[#6F6A7C]">Cancelled</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <p className="m-0 mt-4 text-[12.5px] text-[#6F6A7C]">Advisor sessions are a prototype booking and are not sent to a real advisor yet.</p>
          </section>
        </>
      )}
    </div>
  );
}
