import type { FollowUp, Priority } from "@/types/advisor";

export const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };

/** "Today", "Tomorrow", "In 5 days", "2 days overdue", from the server's day count. */
export function dueLabel(item: Pick<FollowUp, "days_until_due" | "status">): string {
  const d = item.days_until_due;
  if (item.status === "done") return "Done";
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d > 1) return `Due in ${d} days`;
  return `${-d} day${d === -1 ? "" : "s"} overdue`;
}

/** Today plus `days`, as the YYYY-MM-DD a date input uses, in the browser's own calendar. */
export function dateInDays(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export interface FollowUpDraft {
  title: string;
  note: string;
  due_date: string;
  priority: Priority;
  profile_id: string;
}

export function validateDraft(draft: FollowUpDraft): Partial<Record<"title" | "due_date", string>> {
  const errors: Partial<Record<"title" | "due_date", string>> = {};
  if (!draft.title.trim()) errors.title = "Say what needs doing.";
  else if (draft.title.trim().length > 120) errors.title = "Keep the title under 120 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.due_date)) errors.due_date = "Pick a due date.";
  return errors;
}
