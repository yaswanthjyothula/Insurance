"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, Info, Send } from "lucide-react";
import { fetchFromAPI, postJSON } from "@/lib/api";
import { lastMessageId, layoutThread, mergeMessages, type ChatMessage } from "@/lib/chat";
import { errorMessage } from "@/lib/error-message";
import { formatDate, formatTime } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";

const POLL_MS = 4000;
const MAX_LENGTH = 1000;
const NEAR_BOTTOM_PX = 80;

interface ChatPanelProps {
  /** The messages endpoint for one booking: the same thread whichever side opens it. */
  endpoint: string;
  /** Whose side this is, so own messages sit on the right. */
  viewer: "advisor" | "customer";
  /** The other person's full name. */
  otherName: string;
  /** A line under the name, such as "Your advisor" or "Video call · Sat 31 Oct, 4:00 PM". */
  subtitle?: string;
  /** One-tap openers shown while the thread is empty. */
  starters?: string[];
  /** A cancelled appointment keeps its history but accepts no new messages. */
  closed?: boolean;
  className?: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** A chat that both sides read from the same server thread. New messages arrive by polling while the tab is visible. */
export function ChatPanel({ endpoint, viewer, otherName, subtitle, starters = [], closed = false, className = "" }: ChatPanelProps) {
  const { t, tx, lang } = useI18n();
  const clock = (iso: string) => formatTime(lang, iso).replace(/\s?(am|pm)/i, (m) => m.toUpperCase());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(false);
  const lastId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const pinned = useRef(true);
  const lastCount = useRef(0);

  const fetchNew = useCallback(
    async (signal?: AbortSignal) => {
      const fresh = await fetchFromAPI<ChatMessage[]>(`${endpoint}?after=${lastId.current}`, { signal });
      setMessages((current) => {
        const merged = mergeMessages(current, fresh);
        lastId.current = lastMessageId(merged);
        return merged;
      });
    },
    [endpoint],
  );

  useEffect(() => {
    const controller = new AbortController();
    lastId.current = 0;
    fetchNew(controller.signal)
      .then(() => setError(null))
      .catch((failure: unknown) => !controller.signal.aborted && setError(errorMessage(failure, "We couldn't load the chat.")))
      .finally(() => !controller.signal.aborted && setLoaded(true));
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchNew(controller.signal)
        .then(() => setError(null))
        .catch(() => undefined); // a missed poll is retried on the next tick
    }, POLL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [fetchNew]);

  const scrollToEnd = useCallback(() => {
    const box = scroller.current;
    if (box) box.scrollTop = box.scrollHeight;
    pinned.current = true;
    setUnseen(false);
  }, []);

  // Follow new messages only while the reader is at the bottom, so reading older ones is never interrupted
  useEffect(() => {
    if (messages.length === lastCount.current) return;
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    if (pinned.current) scrollToEnd();
    else if (grew && messages[messages.length - 1]?.sender_role !== viewer) setUnseen(true);
  }, [messages, viewer, scrollToEnd]);

  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    pinned.current = box.scrollHeight - box.scrollTop - box.clientHeight < NEAR_BOTTOM_PX;
    if (pinned.current) setUnseen(false);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const sent = await postJSON<ChatMessage>(endpoint, { text });
      pinned.current = true;
      setMessages((current) => {
        const merged = mergeMessages(current, [sent]);
        lastId.current = lastMessageId(merged);
        return merged;
      });
      setDraft("");
      setError(null);
    } catch (failure) {
      setError(errorMessage(failure, "Your message wasn't sent. Please try again."));
    } finally {
      setSending(false);
      composer.current?.focus();
    }
  };

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const rows = layoutThread(messages);
  return (
    <section
      aria-label={t("chat.with", { name: otherName })}
      className={`flex flex-col overflow-hidden rounded-3xl border border-[#D9D3E8] bg-white shadow-[0_8px_30px_-12px_rgba(121,87,255,0.18)] ${className}`}
      data-no-reveal
    >
      <header className="flex items-center gap-3 border-b border-[#EDE9F7] bg-white px-4 py-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#7957FF] to-[#9A80FF] text-sm font-extrabold text-white"
          aria-hidden="true"
        >
          {initialsOf(otherName)}
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-[15px] font-extrabold text-[#24212B]">{otherName}</p>
          {subtitle && <p className="m-0 truncate text-xs text-[#6F6A7C]">{subtitle}</p>}
        </div>
      </header>

      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-label={t("chat.messages")}
          className="flex h-[24rem] flex-col overflow-y-auto bg-[#FAF9FE] px-4 py-4"
        >
          {!loaded ? (
            <p className="m-0 my-auto text-center text-sm text-[#8A849A]">{t("chat.loadingMessages")}</p>
          ) : messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center gap-3 text-center">
              <p className="m-0 text-sm font-semibold text-[#24212B]">
                {closed ? t("chat.noneSent") : t("chat.start", { name: otherName.split(" ")[0] })}
              </p>
              {!closed && starters.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {starters.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => {
                        setDraft(tx(text));
                        composer.current?.focus();
                      }}
                      className="rounded-full border border-[#D9D3E8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#5A5566] transition-colors hover:border-[#7957FF] hover:text-[#7957FF]"
                    >
                      {tx(text)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            rows.map(({ message, dayLabel, startsGroup, endsGroup }) => (
              <div key={message.id} className={startsGroup && !dayLabel ? "mt-3 first:mt-0" : "mt-0.5"}>
                {dayLabel && (
                  <p className="m-0 mb-3 mt-1 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#A59FB5]">
                    {dayLabel === "Today" || dayLabel === "Yesterday"
                      ? t(dayLabel === "Today" ? "chat.day.today" : "chat.day.yesterday")
                      : formatDate(lang, message.at, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                )}
                {message.sender_role === "system" ? (
                  <p className="m-0 mx-auto my-2 flex max-w-[90%] items-start justify-center gap-1.5 rounded-xl bg-[#F1EDFC] px-3 py-1.5 text-center text-xs font-semibold text-[#5A5566]">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7957FF]" aria-hidden="true" />
                    {tx(message.text)}
                  </p>
                ) : (
                  <div className={`flex items-end gap-2 ${message.sender_role === viewer ? "justify-end" : "justify-start"}`}>
                    {message.sender_role !== viewer && (
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E9E4FF] text-[10px] font-extrabold text-[#6240E6] ${endsGroup ? "" : "invisible"}`}
                        aria-hidden="true"
                      >
                        {initialsOf(otherName)}
                      </span>
                    )}
                    <div className={`flex max-w-[78%] flex-col ${message.sender_role === viewer ? "items-end" : "items-start"}`}>
                      <p
                        className={`m-0 whitespace-pre-wrap break-words px-3.5 py-2 text-[14.5px] leading-snug ${
                          message.sender_role === viewer
                            ? "rounded-2xl bg-[#7957FF] text-white"
                            : "rounded-2xl bg-white text-[#24212B] ring-1 ring-[#E8E5F0]"
                        } ${message.sender_role === viewer ? (endsGroup ? "rounded-br-md" : "") : endsGroup ? "rounded-bl-md" : ""}`}
                      >
                        {message.text}
                      </p>
                      {endsGroup && <span className="mt-1 text-[11px] text-[#8A849A]">{clock(message.at)}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {unseen && (
          <button
            type="button"
            onClick={scrollToEnd}
            className="absolute bottom-3 start-1/2 inline-flex -translate-x-1/2 rtl:translate-x-1/2 items-center gap-1.5 rounded-full bg-[#171B3D] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg"
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> {t("chat.newMessage")}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="m-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
          {tx(error)}
        </p>
      )}
      {closed ? (
        <p className="m-0 border-t border-[#EDE9F7] bg-[#FAF9FE] px-4 py-3 text-center text-[13px] text-[#6F6A7C]">{t("chat.closed")}</p>
      ) : (
        <div className="border-t border-[#EDE9F7] bg-white p-3">
          <div className="flex items-end gap-2 rounded-2xl border border-[#D9D3E8] bg-white px-3 py-2 focus-within:border-[#7957FF]">
            <label htmlFor={`chat-${endpoint}`} className="sr-only">
              {t("chat.messageTo", { name: otherName })}
            </label>
            <textarea
              id={`chat-${endpoint}`}
              ref={composer}
              rows={1}
              value={draft}
              maxLength={MAX_LENGTH}
              onChange={(event) => {
                setDraft(event.target.value);
                grow(event.target);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder={t("chat.placeholder", { name: otherName.split(" ")[0] })}
              className="max-h-[120px] min-h-[24px] flex-1 resize-none border-0 bg-transparent p-0 text-[14.5px] text-[#24212B] outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              aria-label={t("chat.send")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#7957FF] text-white transition-colors hover:bg-[#6240E6] disabled:opacity-35"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="m-0 mt-1.5 px-1 text-[11px] text-[#8A849A]">
            {draft.length > 800 ? t("chat.hintLeft", { count: MAX_LENGTH - draft.length }) : t("chat.hint")}
          </p>
        </div>
      )}
    </section>
  );
}
