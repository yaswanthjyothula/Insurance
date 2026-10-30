"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Send } from "lucide-react";
import type { SavedPlan } from "@/lib/my-plan";
import { formatINR } from "@/lib/utils";
import { demoReply } from "@/components/advisory/chat-replies";
import { initialsOf } from "@/components/advisory/advisory-helpers";

interface Message {
  sender: "advisor" | "user";
  text: string;
  time: string;
}

interface DemoChatProps {
  advisorName: string;
  customerName: string;
  /** Extra cover the assessment found missing; null when the customer hasn't done the assessment. */
  coverGap: number | null;
  plan: SavedPlan | null;
}

const REPLY_DELAY_MS = 700;
const SUGGESTIONS = ["Do I need a critical illness rider?", "Is the premium tax deductible?", "What if a claim is rejected?"];

const compactMoney = (value: number) => formatINR(value, { compact: true });
const currentTime = () => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const firstNameOf = (fullName: string) => fullName.split(" ")[0];

function openingMessages({ advisorName, customerName, coverGap, plan }: DemoChatProps): Message[] {
  const need =
    coverGap === null
      ? "You haven't done the needs assessment yet, so we can start from your goals."
      : coverGap > 0
        ? `Your assessment shows about ${compactMoney(coverGap)} of extra cover is needed.`
        : "Your assessment shows your current cover meets your estimated need.";
  const chosen =
    plan && plan.items.length > 0
      ? ` You're looking at ${plan.items.map((item) => item.product_name).join(" and ")}.`
      : " You haven't chosen a plan yet.";
  return [
    {
      sender: "advisor",
      time: currentTime(),
      text: `Hello ${firstNameOf(customerName)}, I'm ${firstNameOf(advisorName)}. ${need}${chosen}`,
    },
    { sender: "advisor", time: currentTime(), text: "What would you like to go through first: riders, tax treatment, or how claims work?" },
  ];
}

/** A scripted chat that makes the booked session feel real without claiming a person is on the other end. */
export function DemoChat(props: DemoChatProps) {
  const { advisorName, plan } = props;
  const [messages, setMessages] = useState<Message[]>(() => openingMessages(props));
  const [draft, setDraft] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);
  const pendingReplies = useRef<number[]>([]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timers = pendingReplies.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setDraft("");
    setMessages((current) => [...current, { sender: "user", text, time: currentTime() }]);
    const timer = window.setTimeout(
      () =>
        setMessages((current) => [
          ...current,
          { sender: "advisor", text: demoReply(text, plan, (value) => formatINR(value)), time: currentTime() },
        ]),
      REPLY_DELAY_MS,
    );
    pendingReplies.current.push(timer);
  };

  return (
    <section
      className="bg-white border border-[#D9D3E8] rounded-3xl flex flex-col h-[540px] shadow-[0_4px_0_#E9E4FF,0_5px_0_#D9D3E8]"
      aria-label="Demo chat"
      data-no-reveal
    >
      <div className="px-5 py-4 border-b border-[#D9D3E8] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-full grid place-items-center bg-[#7957FF] text-white font-extrabold text-sm">
            {initialsOf(advisorName)}
          </span>
          <div className="min-w-0">
            <div className="font-extrabold truncate flex items-center gap-1.5">
              {advisorName}
              <BadgeCheck className="w-4 h-4 text-[#7957FF]" />
            </div>
            <div className="text-[13px] text-[#6F6A7C]">Sample advisor profile</div>
          </div>
        </div>
        <span className="text-[12px] font-bold px-2.5 py-1 rounded-md bg-[#FFF4D6] text-[#8A6100] whitespace-nowrap">Demo chat</span>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5" aria-live="polite">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-normal ${message.sender === "user" ? "bg-[#7957FF] text-white rounded-br-md" : "bg-[#F1EEF8] text-[#24212B] rounded-bl-md"}`}
            >
              {message.text}
              <div className={`text-[11px] mt-1 text-right ${message.sender === "user" ? "text-[#E9E4FF]" : "text-[#6F6A7C]"}`}>
                {message.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEnd} />
      </div>
      <div className="px-4 pt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => send(question)}
            className="px-3 py-1.5 rounded-full border border-[#D9D3E8] text-[13px] font-semibold hover:border-[#7957FF] hover:text-[#7957FF]"
          >
            {question}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="p-4 flex items-center gap-2.5"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about riders, tax or claims"
          aria-label="Message"
          className="flex-1 h-12 rounded-xl border border-[#D9D3E8] bg-white px-4 text-[15px] font-medium focus:outline-none focus:border-[#7957FF]"
        />
        <button type="submit" aria-label="Send" className="h-12 w-12 rounded-xl bg-[#7957FF] text-white grid place-items-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}
