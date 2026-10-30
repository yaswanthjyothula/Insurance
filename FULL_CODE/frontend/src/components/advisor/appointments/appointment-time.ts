import type { AppointmentSummary, ConsultationMode } from "@/types/advisor";

export const MODE_LABEL: Record<ConsultationMode, string> = { video: "Video call", phone: "Phone call", chat: "Secure chat" };
export const JOIN_OPENS_MINUTES = 10;

/** "Thu 5 Nov, 3:00 – 3:30 PM". The slot times are IST wall-clock times, shown as written with no timezone shifting. */
export function formatSlot(start: string, end: string): string {
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return start;
  const day = s.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const clock = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).replace(/\s?(am|pm)/i, (m) => m.toUpperCase());
  const e = new Date(end);
  return Number.isNaN(e.getTime()) ? `${day}, ${clock(s)}` : `${day}, ${clock(s)} – ${clock(e)}`;
}

/** "in 2 days", "in 45 minutes", "started 10 minutes ago", counted on the same clock the server used to judge upcoming or past. */
export function relativeStart(minutes: number): string {
  const abs = Math.abs(minutes);
  const unit = abs >= 1440 ? [Math.round(abs / 1440), "day"] : abs >= 60 ? [Math.round(abs / 60), "hour"] : [Math.max(abs, 1), "minute"];
  const span = `${unit[0]} ${unit[1]}${unit[0] === 1 ? "" : "s"}`;
  return minutes >= 0 ? `in ${span}` : `started ${span} ago`;
}

/** What actually happens at the appointment time, written for whoever is reading. */
export function howItWorks(mode: ConsultationMode, viewer: "advisor" | "customer"): string {
  if (mode === "video") return `Video call. The join link opens ${JOIN_OPENS_MINUTES} minutes before the start.`;
  if (mode === "phone")
    return viewer === "advisor"
      ? "Phone call. You call the customer's number at the start time."
      : "Phone call. Your advisor calls your mobile at the start time.";
  return "Secure chat. The conversation happens in the chat here, and messages sent earlier are kept.";
}

export interface DayGroup {
  date: string;
  label: string;
  items: AppointmentSummary[];
}

/** Groups appointments by calendar day, keeping the order they came in. */
export function groupByDay(items: AppointmentSummary[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const date = item.slot_start.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(item);
    else
      groups.push({
        date,
        label: new Date(item.slot_start).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
        items: [item],
      });
  }
  return groups;
}
