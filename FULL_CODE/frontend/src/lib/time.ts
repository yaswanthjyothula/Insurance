const IST = "Asia/Kolkata";
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * "2026-10-30 20:10 IST" from an ISO timestamp. The admin console's timestamps are stored in UTC, so they are converted;
 * one with no zone (the customer app's local timestamps) is already a wall-clock time and is shown as written.
 */
export function formatIst(iso: string | null | undefined): string {
  if (!iso) return "";
  if (!HAS_ZONE.test(iso)) return `${iso.slice(0, 16).replace("T", " ")} IST`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} IST`;
}
