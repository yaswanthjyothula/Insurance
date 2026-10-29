"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Panel, ToolShell, Verdict } from "@/components/tools/kit";

const FLAGS = [
  { id: "irdai", title: "The caller says they are from IRDAI or an ombudsman", desc: "IRDAI is the regulator. It does not call people to sell policies, release bonuses or collect money." },
  { id: "bonus", title: "They offer an unclaimed bonus or refund if you buy a new policy", desc: "Money owed on an old policy is never tied to buying a new one." },
  { id: "loan", title: "They promise a loan or free gift with the policy", desc: "Offers tied to buying a policy are a common sign of mis-selling or fraud." },
  { id: "personal", title: "They ask you to pay to a personal account, UPI ID or wallet", desc: "Premiums go to the insurer through its official website, app or branch, never to a person." },
  { id: "otp", title: "They ask for an OTP, PIN or full card or bank details", desc: "A genuine insurer does not need your OTP or PIN to sell or service a policy." },
  { id: "urgent", title: "They pressure you to act today or say the offer will expire", desc: "Pressure is meant to stop you checking. You have a free-look period after buying anyway." },
  { id: "link", title: "They send a link or app to install or a form to fill in on a strange site", desc: "Check the address yourself on the insurer's official website. Never install apps on a stranger's request." },
  { id: "switch", title: "They tell you to surrender or stop your current policy and buy theirs", desc: "Switching often costs you. Compare in writing before you change anything." },
];

export default function ScamShieldPage() {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const n = sel.length;
  const level = n === 0 ? "none" : n === 1 ? "watch" : "high";
  return (
    <ToolShell slug="scam-shield">
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        <div className="lg:col-span-3 space-y-3">
          <p className="text-sm font-semibold text-[#24212B]">Tick everything that happened</p>
          {FLAGS.map((f) => {
            const on = sel.includes(f.id);
            return (
              <button key={f.id} type="button" onClick={() => toggle(f.id)} aria-pressed={on}
                className={`ls-spot w-full text-left rounded-2xl border p-4 transition-colors ${on ? "border-[#C0364B] bg-[#FDECEF]" : "border-[#D9D3E8] bg-white hover:border-[#7957FF]"}`}>
                <span className="flex gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${on ? "border-[#C0364B] bg-[#C0364B] text-white" : "border-[#D9D3E8] bg-white text-transparent"}`}>✓</span>
                  <span><span className="block text-[15px] font-bold text-[#24212B]">{f.title}</span><span className="mt-0.5 block text-sm leading-6 text-[#4A4658]">{f.desc}</span></span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">
          <Verdict tone={level === "none" ? "info" : level === "watch" ? "warn" : "bad"}>
            {level === "none" && "Nothing ticked yet. Tick what happened to see how risky it looks."}
            {level === "watch" && "One warning sign. Do not pay or share anything. Hang up and check the insurer using the number on its official website."}
            {level === "high" && `${n} warning signs together. Treat this as a likely fraud. Stop talking, do not pay or share OTPs, and report it.`}
          </Verdict>
          <Panel title="What to do">
            <ul className="space-y-2 text-[15px] leading-6 text-[#24212B]">
              <li>• Hang up. Call your insurer on the number from its official website or your policy.</li>
              <li>• Never share OTPs, PINs or card details.</li>
              <li>• If you lost money, report quickly on the national cybercrime portal or call 1930.</li>
              <li>• Complain about mis-selling through your insurer, then IRDAI's Bima Bharosa.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-[#7957FF] px-3.5 py-2 text-sm font-bold text-white" data-magnetic>Cybercrime portal <ExternalLink className="w-3.5 h-3.5" /></a>
              <a href="https://bimabharosa.irdai.gov.in/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-[#D9D3E8] bg-white px-3.5 py-2 text-sm font-bold text-[#24212B]" data-magnetic>Bima Bharosa <ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          </Panel>
          <p className="text-sm text-[#6F6A7C]">A clean result does not prove a call is genuine. When unsure, verify with the insurer yourself.</p>
        </div>
      </div>
    </ToolShell>
  );
}
