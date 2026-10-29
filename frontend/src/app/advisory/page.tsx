"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Video, Phone, MessageSquare, AlertCircle, Send, RefreshCw, BadgeCheck, Check, ArrowLeft, ArrowRight, Info, CalendarCheck, Printer } from "lucide-react";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { useAssessmentStore } from "@/store/assessment-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatINR, shortInsurerName } from "@/lib/utils";
import { fetchFromAPI } from "@/lib/api";
import type { Advisor, BookingConfirmation } from "@/types/advisory";

type Mode = "video" | "voice" | "chat";
type Message = { sender: "advisor" | "user"; text: string; time: string };
type FormErrors = Partial<Record<"advisor" | "slot" | "name" | "email" | "phone", string>>;

const MODES: { id: Mode; label: string; icon: typeof Video; hint: string }[] = [
  { id: "video", label: "Video call", icon: Video, hint: "Face to face on screen" },
  { id: "voice", label: "Phone call", icon: Phone, hint: "A call to your mobile" },
  { id: "chat", label: "Secure chat", icon: MessageSquare, hint: "Written, at your pace" },
];
const fmt = (n: number) => formatINR(n, { compact: true });
const nowTime = () => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const initials = (name: string) => name.replace(/,.*$/, "").split(" ").map((n) => n[0]).slice(0, 2).join("");

const label = "block text-[13px] font-bold uppercase tracking-[0.12em] mb-2.5";
const inputCls = "w-full h-[56px] rounded-[10px] border bg-[#FFFFFF] px-4 text-[17px] font-semibold text-[#24212B] placeholder:text-[#A59FB5] placeholder:font-medium focus:outline-none";
const errCls = "flex items-center gap-1.5 text-[14px] font-semibold text-[#C23B3B] mt-2";

function StepCard({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="ls-lip bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl p-4 sm:p-8 flex flex-col gap-6" aria-label={title}>
      <div className="flex items-center gap-3.5">
        <span className={`flex-none w-9 h-9 rounded-full grid place-items-center text-[15px] font-extrabold ${done ? "bg-[#7957FF] text-white" : "bg-[#E9E4FF] text-[#7957FF]"}`}>{done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}</span>
        <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function AdvisoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { result, selectedProduct, customization, booking, setBooking, clearBooking, isHydrated } = useAssessmentStore();

  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(true);
  const [advisorError, setAdvisorError] = useState<string | null>(null);

  const [advisorId, setAdvisorId] = useState("");
  const [slot, setSlot] = useState("");
  const [mode, setMode] = useState<Mode>("video");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [share, setShare] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHydrated && !result) router.replace("/assessment");
  }, [isHydrated, result, router]);

  // Use the signed-in account's own details as a starting point (never invented ones)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (prefilled || !user) return;
    setEmail((e) => e || user.email || "");
    setName((n) => n || ((user.user_metadata?.full_name as string | undefined) ?? ""));
    setPrefilled(true);
  }, [user, prefilled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [reloadKey, setReloadKey] = useState(0);
  const loadAdvisors = () => {
    setLoadingAdvisors(true);
    setAdvisorError(null);
    setReloadKey((k) => k + 1);
  };
  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;
    fetchFromAPI("/advisory/availability")
      .then((data: Advisor[]) => !cancelled && setAdvisors(data))
      .catch(() => !cancelled && setAdvisorError("We couldn't load advisor availability. Please make sure the service is running and try again."))
      .finally(() => !cancelled && setLoadingAdvisors(false));
    return () => { cancelled = true; };
  }, [isHydrated, reloadKey]);

  const advisor = advisors.find((a) => a.id === advisorId);
  const gap = result?.net_needs?.net_coverage_gap ?? 0;
  const mini = useMemo(
    () => selectedProduct && customization
      ? { plan: `${shortInsurerName(selectedProduct.insurer)} ${selectedProduct.name}`, cover: fmt(customization.sum_assured), term: `${customization.tenure_years} years`, monthly: `≈ ${formatINR(customization.estimated_monthly_premium)}/month` }
      : null,
    [selectedProduct, customization]
  );

  // Demo chat: opening messages built from the visitor's real numbers
  const advisorFirst = (booking?.advisor_name ?? "your advisor").replace(/,.*$/, "");
  useEffect(() => {
    if (!booking || messages.length) return;
    const who = booking.user_name || (user?.user_metadata?.full_name as string | undefined) || "";
    /* eslint-disable react-hooks/set-state-in-effect */
    setMessages([
      { sender: "advisor", time: nowTime(), text: `Hello${who ? ` ${who.split(" ")[0]}` : ""}, I'm ${advisorFirst}. ${gap > 0 ? `Your assessment shows about ${fmt(gap)} of extra cover is needed.` : "Your assessment shows your current cover meets your estimated need."}${mini ? ` You're looking at ${mini.plan} for ${mini.cover}.` : " You haven't chosen a plan yet, so we can start from your needs."}` },
      { sender: "advisor", time: nowTime(), text: "What would you like to go through first: riders, tax treatment, or how claims work?" },
    ]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [booking, messages.length, advisorFirst, gap, mini, user]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);

  const replyTo = (text: string) => {
    const t = text.toLowerCase();
    if (/rider|critical|illness|accident/.test(t))
      return `A critical illness rider pays a lump sum on diagnosis of a listed illness, separate from hospital bills.${selectedProduct?.riders_available?.length ? ` ${selectedProduct.name} offers: ${selectedProduct.riders_available.slice(0, 3).join(", ")}.` : ""} Whether it's worth the extra premium depends on your health cover and savings. In a real session we'd look at both.`;
    if (/tax|80c|10\(10d\)|deduct/.test(t))
      return `Term premiums may qualify for a deduction under Section 80C, and a death benefit is generally tax-free under Section 10(10D), subject to conditions and current law. Please confirm the details with a tax professional.`;
    if (/claim|reject|repud/.test(t))
      return `Claims are usually settled when the policy is in force and your disclosures were accurate. Under Section 45 of the Insurance Act, after three years an insurer generally can't reject a claim for a non-fraudulent misstatement. Full, honest disclosure at purchase is the best protection.`;
    if (/premium|price|cost|afford/.test(t))
      return mini ? `Your estimate is ${mini.monthly} for ${mini.cover} cover over ${mini.term}. That is an estimate, and the insurer's own quote will be the exact price.` : `Once you choose a plan we can talk through the premium. Exact prices always come from the insurer's quote.`;
    if (/smok|tobacco/.test(t)) return "Smokers pay higher premiums, and answering that question accurately matters for claims. Some insurers re-rate you after you've been tobacco-free for a period.";
    return "This is a demo chat with pre-written answers, so I can't answer that one. In a real session your advisor would. Try asking about riders, tax or claims.";
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setDraft("");
    setMessages((m) => [...m, { sender: "user", text, time: nowTime() }]);
    setTimeout(() => setMessages((m) => [...m, { sender: "advisor", text: replyTo(text), time: nowTime() }]), 700);
  };

  const chooseAdvisor = (a: Advisor) => {
    setAdvisorId(a.id);
    setSlot("");
    setErrors((e) => ({ ...e, advisor: undefined, slot: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!advisorId) e.advisor = "Choose an advisor";
    else if (!slot) e.slot = "Pick a time";
    if (name.trim().length < 2) e.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter a 10-digit Indian mobile number";
    return e;
  };

  const book = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (isBooking) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(first === "advisor" ? "step-advisor" : first === "slot" ? "step-time" : first)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setIsBooking(true);
    setBookingError(null);
    try {
      const c: BookingConfirmation = await fetchFromAPI("/advisory/bookings", {
        method: "POST",
        body: JSON.stringify({ advisor_id: advisorId, preferred_slot: slot, user_name: name.trim(), user_email: email.trim(), user_phone: phone, consultation_mode: mode, notes: notes.trim() || undefined, assessment_id: result?.assessment_id, share_passport: share }),
      });
      setMessages([]);
      setBooking({ ...c, consultation_mode: mode, user_name: name.trim() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/already booked/i.test(msg)) {
        setSlot("");
        loadAdvisors();
        setBookingError("That time was just taken. Please pick another one.");
      } else {
        setBookingError(/failed to fetch|load failed|networkerror/i.test(msg) || !msg ? "We couldn't reach the booking service. Please try again." : msg);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const rebook = () => {
    clearBooking();
    setMessages([]);
    setSlot("");
  };

  if (!isHydrated || !result) {
    return (
      <div className="min-h-screen flex flex-col text-[#24212B]">
        <JourneyProgress currentStage={4} />
        <div className="flex-1 flex flex-col items-center justify-center p-8" role="status">
          <RefreshCw className="w-8 h-8 text-[#7957FF] animate-spin mb-4" />
          <h2 className="text-xl font-bold">Loading…</h2>
          <p className="text-sm text-[#5A5566] mt-1">If you haven&apos;t completed the assessment yet, we&apos;ll take you back to it.</p>
        </div>
      </div>
    );
  }

  const demoNote = (
    <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-[#FAF9F6] border border-[#D9D3E8] text-[14.5px] leading-normal text-[#4A4553]" data-no-reveal>
      <Info className="w-4 h-4 mt-1 shrink-0 text-[#7957FF]" />
      <div><strong className="text-[#24212B]">Demo mode.</strong> The advisors and the consultation chat are sample profiles with pre-written replies. No real person will contact you, and your booking is only saved on this app&apos;s server.</div>
    </div>
  );

  /* ---------------- Booked ---------------- */
  if (booking) {
    const bMode = MODES.find((m) => m.id === booking.consultation_mode) ?? MODES[0];
    const ModeIcon = bMode.icon;
    return (
      <div className="min-h-screen flex flex-col text-[#24212B]">
        <JourneyProgress currentStage={4} />
        <main className="flex-1 max-w-[1000px] w-full mx-auto px-5 sm:px-8 pt-10 pb-20 flex flex-col gap-7">
          <div className="rounded-3xl p-8 sm:p-10 text-[#FFFFFF] flex flex-col gap-5 shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_8px_0_#5B3BE6,0_40px_70px_-34px_rgba(121,87,255,0.6)]" style={{ background: "linear-gradient(150deg,#8A6CFF 0%,#7957FF 55%,#6A47F5 100%)" }}>
            <span className="inline-flex items-center gap-2 self-start text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#E9E4FF]"><CalendarCheck className="w-4 h-4" />Session booked (demo)</span>
            <h1 className="m-0 text-[clamp(28px,3.4vw,42px)] leading-[1.05] font-extrabold tracking-[-0.03em]" style={{ color: "#FFFFFF" }}>You&apos;re booked with {advisorFirst}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[["When", booking.slot], ["How", bMode.label], ["Booking ID", booking.booking_id.slice(0, 8).toUpperCase()]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[rgba(255,255,255,0.14)] px-4 py-3"><div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#E9E4FF]">{k}</div><div className="text-lg font-extrabold mt-0.5 flex items-center gap-2">{k === "How" && <ModeIcon className="w-4 h-4" />}{v}</div></div>
              ))}
            </div>
          </div>

          {demoNote}

          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-7 items-start">
            <section className="bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl flex flex-col h-[540px] shadow-[0_4px_0_#E9E4FF,0_5px_0_#D9D3E8]" aria-label="Demo chat" data-no-reveal>
              <div className="px-5 py-4 border-b border-[#D9D3E8] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-full grid place-items-center bg-[#7957FF] text-white font-extrabold text-sm">{initials(booking.advisor_name)}</span>
                  <div className="min-w-0"><div className="font-extrabold truncate flex items-center gap-1.5">{booking.advisor_name}<BadgeCheck className="w-4 h-4 text-[#7957FF]" /></div><div className="text-[13px] text-[#6F6A7C]">Sample advisor profile</div></div>
                </div>
                <span className="text-[12px] font-bold px-2.5 py-1 rounded-md bg-[#FFF4D6] text-[#8A6100] whitespace-nowrap">Demo chat</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-normal ${m.sender === "user" ? "bg-[#7957FF] text-white rounded-br-md" : "bg-[#F1EEF8] text-[#24212B] rounded-bl-md"}`}>
                      {m.text}
                      <div className={`text-[11px] mt-1 text-right ${m.sender === "user" ? "text-[#E9E4FF]" : "text-[#6F6A7C]"}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>
              <div className="px-4 pt-3 flex flex-wrap gap-2">
                {["Do I need a critical illness rider?", "Is the premium tax deductible?", "What if a claim is rejected?"].map((q) => (
                  <button key={q} type="button" onClick={() => send(q)} className="px-3 py-1.5 rounded-full border border-[#D9D3E8] text-[13px] font-semibold hover:border-[#7957FF] hover:text-[#7957FF]">{q}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(draft); }} className="p-4 flex items-center gap-2.5">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about riders, tax or claims" aria-label="Message" className="flex-1 h-12 rounded-xl border border-[#D9D3E8] bg-[#FFFFFF] px-4 text-[15px] font-medium focus:outline-none focus:border-[#7957FF]" />
                <button type="submit" aria-label="Send" className="h-12 w-12 rounded-xl bg-[#7957FF] text-white grid place-items-center"><Send className="w-4 h-4" /></button>
              </form>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="ls-lip bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl p-6">
                <h3 className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[#7957FF]">Your plan</h3>
                {mini ? (
                  <dl className="m-0 text-[15px]">
                    {[["Plan", mini.plan], ["Cover", mini.cover], ["Term", mini.term], ["Estimate", mini.monthly]].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-2 border-b border-[#D9D3E8] last:border-0"><dt className="text-[#5A5566]">{k}</dt><dd className="m-0 font-bold text-right">{v}</dd></div>
                    ))}
                  </dl>
                ) : <p className="m-0 text-[14.5px] text-[#5A5566]">No plan chosen yet. <Link href="/products" className="text-[#7957FF] font-semibold hover:underline">Choose one</Link> and your advisor can review it.</p>}
              </div>
              <div className="flex flex-col gap-2.5">
                <Link href="/dashboard" className="h-12 rounded-lg bg-[#7957FF] text-white font-bold inline-flex items-center justify-center gap-2">Go to dashboard<ArrowRight className="w-4 h-4" /></Link>
                <button type="button" onClick={() => window.print()} className="h-12 rounded-lg border border-[#D9D3E8] bg-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_0_#D9D3E8]"><Printer className="w-4 h-4 text-[#7957FF]" />Print this summary</button>
                <button type="button" onClick={rebook} className="text-[14px] font-semibold text-[#7957FF] hover:underline py-1">Book a different time</button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- Booking flow ---------------- */
  const missing = !advisorId ? "Choose an advisor" : !slot ? "Pick a time" : "";
  const detailsDone = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && /^[6-9]\d{9}$/.test(phone);

  return (
    <div className="min-h-screen flex flex-col text-[#24212B]">
      <JourneyProgress currentStage={4} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 sm:px-8 pt-10 pb-20 flex flex-col gap-7">
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[12.5px] font-bold uppercase tracking-[0.14em]"><Users className="w-3.5 h-3.5" />Stage 4 of 4 · Advisory session</div>
          <h1 className="m-0 text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>Book a session with an advisor</h1>
          <p className="m-0 text-[17px] leading-[1.55] text-[#5A5566] max-w-[640px]">Three quick steps. Your advisor can review your needs and chosen plan with you.</p>
        </header>

        {demoNote}

        <form onSubmit={book} noValidate className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
          <div className="flex flex-col gap-6">
            {/* 1. Advisor */}
            <div id="step-advisor">
              <StepCard n={1} title="Choose an advisor" done={Boolean(advisorId)}>
                {loadingAdvisors ? (
                  <div className="py-6 text-center text-[#5A5566]" role="status"><RefreshCw className="w-6 h-6 text-[#7957FF] animate-spin mx-auto mb-2" />Checking calendars…</div>
                ) : advisorError ? (
                  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[#C23B3B] text-[#C23B3B] font-semibold"><span className="flex items-center gap-2"><AlertCircle className="w-5 h-5 shrink-0" />{advisorError}</span><button type="button" onClick={loadAdvisors} className="underline">Try again</button></div>
                ) : (
                  <div className="flex flex-col gap-3" role="radiogroup" aria-label="Advisors">
                    {advisors.map((a) => {
                      const on = advisorId === a.id;
                      const free = a.available_slots?.length ?? 0;
                      return (
                        <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => chooseAdvisor(a)} disabled={free === 0}
                          className={`w-full text-left p-3.5 sm:p-5 rounded-2xl border flex gap-3 sm:gap-4 items-start transition-all disabled:opacity-55 disabled:cursor-not-allowed ${on ? "border-[#7957FF] bg-[#F7F4FF] shadow-[0_3px_0_#7957FF]" : "border-[#D9D3E8] bg-[#FFFFFF] hover:border-[#7957FF]"}`}>
                          <span className={`flex-none w-12 h-12 rounded-full grid place-items-center font-extrabold ${on ? "bg-[#7957FF] text-white" : "bg-[#E9E4FF] text-[#7957FF]"}`}>{initials(a.name)}</span>
                          <span className="flex-1 min-w-0">
                            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5"><span className="font-extrabold text-[17px]">{a.name}</span><span className="text-[13px] text-[#6F6A7C]">{a.experience_years} years</span></span>
                            <span className="block text-[14px] text-[#5A5566] mt-0.5">{a.title}</span>
                            <span className="flex flex-wrap gap-1.5 mt-2.5">{a.specialties.slice(0, 3).map((s) => <span key={s} className="px-2.5 py-1 rounded-md bg-[#F1EEF8] text-[12.5px]">{s}</span>)}</span>
                          </span>
                          <span className={`flex-none text-[13px] font-bold px-2.5 py-1 rounded-md ${free ? "bg-[#E9E4FF] text-[#7957FF]" : "bg-[#F1EEF8] text-[#6F6A7C]"}`}>{free ? `${free} ${free === 1 ? "slot" : "slots"}` : "Fully booked"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.advisor && <span role="alert" className={errCls}><AlertCircle className="w-4 h-4" />{errors.advisor}</span>}
              </StepCard>
            </div>

            {/* 2. Time + mode */}
            <div id="step-time">
              <StepCard n={2} title="Pick a time and how to meet" done={Boolean(slot)}>
                <div>
                  <span className={label}>Available times{advisor ? ` with ${advisor.name.replace(/,.*$/, "")}` : ""}</span>
                  {!advisor ? <p className="m-0 text-[15px] text-[#6F6A7C]">Choose an advisor first to see their times.</p> : advisor.available_slots.length === 0 ? <p className="m-0 text-[15px] text-[#6F6A7C]">Fully booked this week. Pick another advisor.</p> : (
                    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Available times">
                      {advisor.available_slots.map((s) => (
                        <button key={s} type="button" role="radio" aria-checked={slot === s} onClick={() => { setSlot(s); setErrors((e) => ({ ...e, slot: undefined })); }}
                          className={`h-12 px-5 rounded-xl border text-[15px] font-semibold transition-all ${slot === s ? "bg-[#7957FF] text-white border-[#7957FF] shadow-[0_3px_0_#5B3BE6]" : "bg-[#FFFFFF] border-[#D9D3E8] shadow-[0_3px_0_#D9D3E8] hover:-translate-y-0.5"}`}>{s}</button>
                      ))}
                    </div>
                  )}
                  {errors.slot && <span role="alert" className={errCls}><AlertCircle className="w-4 h-4" />{errors.slot}</span>}
                </div>
                <div>
                  <span className={label}>How would you like to meet?</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Consultation mode">
                    {MODES.map((m) => {
                      const Icon = m.icon, on = mode === m.id;
                      return (
                        <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => setMode(m.id)} className={`p-4 rounded-xl border text-left flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 transition-all ${on ? "border-[#7957FF] bg-[#F7F4FF] shadow-[0_3px_0_#7957FF]" : "border-[#D9D3E8] bg-[#FFFFFF] hover:border-[#7957FF]"}`}>
                          <Icon className={`w-5 h-5 ${on ? "text-[#7957FF]" : "text-[#6F6A7C]"}`} />
                          <span><span className="block font-bold text-[15px]">{m.label}</span><span className="block text-[13px] text-[#6F6A7C]">{m.hint}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </StepCard>
            </div>

            {/* 3. Details */}
            <StepCard n={3} title="Your details" done={detailsDone}>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className={label}>Full name</label>
                  <input id="name" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }} placeholder="e.g. Your full name" aria-invalid={Boolean(errors.name)} className={`${inputCls} ${errors.name ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"}`} />
                  {errors.name && <span role="alert" className={errCls}><AlertCircle className="w-4 h-4" />{errors.name}</span>}
                </div>
                <div>
                  <label htmlFor="email" className={label}>Email</label>
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} placeholder="name@example.com" aria-invalid={Boolean(errors.email)} className={`${inputCls} ${errors.email ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"}`} />
                  {errors.email && <span role="alert" className={errCls}><AlertCircle className="w-4 h-4" />{errors.email}</span>}
                </div>
                <div>
                  <label htmlFor="phone" className={label}>Mobile number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-bold text-[#7957FF] pointer-events-none">+91</span>
                    <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setErrors((x) => ({ ...x, phone: undefined })); }} placeholder="10-digit number" aria-invalid={Boolean(errors.phone)} className={`${inputCls} pl-14 ${errors.phone ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"}`} />
                  </div>
                  {errors.phone && <span role="alert" className={errCls}><AlertCircle className="w-4 h-4" />{errors.phone}</span>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className={label}>What would you like to discuss? <span className="normal-case tracking-normal font-medium text-[#6F6A7C]">optional</span></label>
                  <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Whether I need a critical illness rider, or how to cover my home loan" className="w-full rounded-[10px] border border-[#D9D3E8] bg-[#FFFFFF] px-4 py-3 text-[16px] font-medium text-[#24212B] placeholder:text-[#A59FB5] focus:outline-none focus:border-[#7957FF]" />
                </div>
                <label className="sm:col-span-2 flex items-start gap-3 cursor-pointer text-[15px] leading-snug">
                  <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="w-5 h-5 mt-0.5 accent-[#7957FF]" />
                  <span><strong>Share my assessment summary with the advisor.</strong> <span className="text-[#5A5566]">Your cover need and chosen plan, so you don&apos;t have to explain them again. Off by default.</span></span>
                </label>
              </div>
            </StepCard>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 flex flex-col gap-4" data-no-reveal>
            <div className="ls-lip bg-[#FFFFFF] border border-[#D9D3E8] rounded-3xl p-6 flex flex-col gap-5">
              <div>
                <h3 className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[#7957FF]">Your plan</h3>
                {mini ? (
                  <dl className="m-0 text-[15px]">
                    {[["Plan", mini.plan], ["Cover", mini.cover], ["Term", mini.term], ["Estimate", mini.monthly]].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-2 border-b border-[#D9D3E8] last:border-0"><dt className="text-[#5A5566]">{k}</dt><dd className="m-0 font-bold text-right">{v}</dd></div>
                    ))}
                  </dl>
                ) : <p className="m-0 text-[14.5px] text-[#5A5566]">No plan chosen yet. You can still book, or <Link href="/products" className="text-[#7957FF] font-semibold hover:underline">choose a plan first</Link>.</p>}
              </div>
              <div>
                <h3 className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[#7957FF]">Your session</h3>
                <dl className="m-0 text-[15px]">
                  {[["Advisor", advisor?.name.replace(/,.*$/, "") ?? "Not chosen"], ["Time", slot || "Not chosen"], ["How", MODES.find((m) => m.id === mode)?.label ?? ""]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 py-2 border-b border-[#D9D3E8] last:border-0"><dt className="text-[#5A5566]">{k}</dt><dd className={`m-0 font-bold text-right ${v === "Not chosen" ? "text-[#A59FB5] font-medium" : ""}`}>{v}</dd></div>
                  ))}
                </dl>
              </div>
              {bookingError && <div role="alert" className="flex items-start gap-2 p-3 rounded-xl border border-[#C23B3B] text-[#C23B3B] text-[14px] font-semibold"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{bookingError}</div>}
              <button type="submit" disabled={isBooking} className="h-14 rounded-lg bg-[#7957FF] text-[#FFFFFF] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {isBooking ? "Booking…" : <>Confirm booking<Check className="w-4 h-4" strokeWidth={3} /></>}
              </button>
              {(missing || !detailsDone) && <p className="m-0 -mt-2 text-[13px] text-[#6F6A7C] text-center">{missing || "Fill in your details to confirm"}</p>}
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#5A5566] hover:text-[#7957FF] self-start"><ArrowLeft className="w-4 h-4" />Back to plans</Link>
          </aside>
        </form>
      </main>
    </div>
  );
}
