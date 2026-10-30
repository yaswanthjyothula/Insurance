import type { LeadCard, Stage } from "@/types/admin";

export const STAGES: { key: Stage; label: string; tone: string }[] = [
  { key: "new", label: "New", tone: "bg-[#EEF1FF] text-[#3D55E0]" },
  { key: "contacted", label: "Contacted", tone: "bg-[#E6F4FF] text-[#0B6BCB]" },
  { key: "qualified", label: "Qualified", tone: "bg-[#F1EBFF] text-[#6D3FE0]" },
  { key: "proposal", label: "Proposal", tone: "bg-[#FFF4E0] text-[#A15C00]" },
  { key: "won", label: "Won", tone: "bg-[#E4F8EE] text-[#0F7B4D]" },
  { key: "lost", label: "Lost", tone: "bg-[#FDECEC] text-[#B42318]" },
];

export const SOURCE_LABEL: Record<string, string> = { assessment: "Assessment", booking: "Advisor booking", manual: "Added by hand" };

/** Moves a card between columns in a copy of the board, so the screen answers a drag at once while the server catches up. */
export function moveCard<C extends { key: Stage; count: number; cover_total: number; leads: LeadCard[] }>(
  columns: C[],
  leadId: string,
  to: Stage,
): C[] {
  const card = columns.flatMap((c) => c.leads).find((l) => l.lead_id === leadId);
  if (!card || card.stage === to) return columns;
  const moved = { ...card, stage: to, days_in_stage: 0 };
  return columns.map((c) => {
    if (c.key === card.stage)
      return {
        ...c,
        count: c.count - 1,
        cover_total: c.cover_total - (card.cover_needed ?? 0),
        leads: c.leads.filter((l) => l.lead_id !== leadId),
      };
    if (c.key === to)
      return { ...c, count: c.count + 1, cover_total: c.cover_total + (card.cover_needed ?? 0), leads: [moved, ...c.leads] };
    return c;
  });
}

export function ageLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function pct(n: number | null): string {
  return n === null ? "—" : `${n}%`;
}
