export interface ChatMessage {
  id: number;
  sender_role: "customer" | "advisor" | "system";
  text: string;
  at: string;
}

/** Adds newly fetched messages to the thread, ignoring any already shown (a poll and a send can return the same one). */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;
  const known = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !known.has(m.id));
  return fresh.length === 0 ? current : [...current, ...fresh].sort((a, b) => a.id - b.id);
}

export function lastMessageId(messages: ChatMessage[]): number {
  return messages.length ? messages[messages.length - 1].id : 0;
}

export interface ChatRow {
  message: ChatMessage;
  /** A date heading to show above this message, when it is the first of its day. */
  dayLabel: string | null;
  /** The first of a run from one sender: shows the avatar and gets more space above. */
  startsGroup: boolean;
  /** The last of a run: shows the time. */
  endsGroup: boolean;
}

/** "Today", "Yesterday" or "Fri 30 Oct". */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Lays a thread out as rows: date headings, and runs of messages from the same sender grouped together. */
export function layoutThread(messages: ChatMessage[], now: Date = new Date()): ChatRow[] {
  const rows: ChatRow[] = [];
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const label = dayLabel(message.at, now);
    const newDay = !prev || dayLabel(prev.at, now) !== label;
    const sameRunAsPrev = Boolean(prev) && !newDay && prev.sender_role === message.sender_role && message.sender_role !== "system";
    const sameRunAsNext =
      Boolean(next) && dayLabel(next.at, now) === label && next.sender_role === message.sender_role && message.sender_role !== "system";
    rows.push({ message, dayLabel: newDay ? label : null, startsGroup: !sameRunAsPrev, endsGroup: !sameRunAsNext });
  });
  return rows;
}
