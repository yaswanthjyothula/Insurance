"use client";

import { useEffect, useState } from "react";
import { Count, Panel, ToolShell, Verdict } from "@/components/tools/kit";

const KEY = "lifesure_readiness";
const ITEMS = [
  {
    group: "Identity",
    id: "kyc",
    title: "PAN and Aadhaar, with your mobile number linked",
    desc: "Needed for KYC. Make sure the name matches across documents.",
  },
  { group: "Identity", id: "photo", title: "Recent photo and address proof", desc: "Insurers can ask for these in addition to e-KYC." },
  {
    group: "Money",
    id: "income",
    title: "Income proof: recent salary slips or tax returns, and bank statements",
    desc: "Larger cover usually needs income proof. Thresholds differ by insurer, so ask yours.",
  },
  {
    group: "Money",
    id: "bank",
    title: "Bank account details for premium and claim payments",
    desc: "The payout goes to the nominee's account, so keep details accurate.",
  },
  {
    group: "Health",
    id: "history",
    title: "Your full health history: conditions, surgeries, medicines",
    desc: "Write down dates and doctor names so you answer exactly.",
  },
  {
    group: "Health",
    id: "family",
    title: "Family medical history the form asks for",
    desc: "Answer what is asked. Do not guess. Say you are unsure if you are.",
  },
  {
    group: "Health",
    id: "habits",
    title: "Truthful answers on smoking, alcohol and tobacco",
    desc: "A wrong answer can lead to a claim being challenged later.",
  },
  {
    group: "Health",
    id: "medical",
    title: "Medical tests, if the insurer asks for them",
    desc: "The insurer usually arranges these. Ask whether to fast and which tests to expect.",
  },
  {
    group: "Family",
    id: "nominee",
    title: "Nominee name, date of birth and relationship",
    desc: "For a minor nominee you must also name an appointee.",
  },
  { group: "Family", id: "others", title: "List of your other life and health policies", desc: "Many forms ask about existing cover." },
  {
    group: "Before you sign",
    id: "read",
    title: "Read the proposal form before signing, and keep a copy",
    desc: "You sign that the answers are true. Check each one.",
  },
  {
    group: "Before you sign",
    id: "free",
    title: "Note the free-look period and read the policy when it arrives",
    desc: "You have 30 days from receiving the policy to return it if it is not what you expected.",
  },
];

export default function ReadinessPage() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ticks are read from browser storage after mount
      if (saved) setDone(JSON.parse(saved));
    } catch {
      // Storage blocked or unreadable: the checklist simply starts empty
    }
  }, []);
  const toggle = (id: string) =>
    setDone((d) => {
      const n = d.includes(id) ? d.filter((x) => x !== id) : [...d, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        // Storage blocked: the tick still shows, it just is not remembered
      }
      return n;
    });
  const pct = Math.round((done.length / ITEMS.length) * 100);
  const groups = Array.from(new Set(ITEMS.map((i) => i.group)));

  return (
    <ToolShell slug="application-readiness">
      <Panel className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#24212B]">
            {done.length} of {ITEMS.length} ready
          </p>
          <p className="text-2xl font-extrabold text-[#7957FF]">
            <Count value={pct} format={(v) => `${Math.round(v)}%`} />
          </p>
        </div>
        <div className="mt-3 h-3 rounded-full bg-[#E9E4FF] overflow-hidden">
          <div className="h-full rounded-full bg-[#7957FF] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {pct === 100 && (
          <div className="mt-4">
            <Verdict tone="good">You are ready to apply. Take your time reading each answer before you sign.</Verdict>
          </div>
        )}
        <p className="mt-3 text-sm text-[#6F6A7C]">Your ticks are saved on this device only.</p>
      </Panel>
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#7957FF]">{g}</h2>
            <div className="space-y-2">
              {ITEMS.filter((i) => i.group === g).map((i) => {
                const on = done.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => toggle(i.id)}
                    aria-pressed={on}
                    className={`ls-spot w-full text-left rounded-2xl border p-4 transition-colors ${on ? "border-[#0E7A5F] bg-[#E7F6F0]" : "border-[#D9D3E8] bg-white hover:border-[#7957FF]"}`}
                  >
                    <span className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${on ? "border-[#0E7A5F] bg-[#0E7A5F] text-white" : "border-[#D9D3E8] bg-white text-transparent"}`}
                      >
                        ✓
                      </span>
                      <span>
                        <span className="block text-[15px] font-bold text-[#24212B]">{i.title}</span>
                        <span className="mt-0.5 block text-sm leading-6 text-[#4A4658]">{i.desc}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </ToolShell>
  );
}
