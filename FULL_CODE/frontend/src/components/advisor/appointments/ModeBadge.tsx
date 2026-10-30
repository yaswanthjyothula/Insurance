import { MessageSquare, Phone, Video } from "lucide-react";
import { MODE_LABEL } from "@/components/advisor/appointments/appointment-time";
import type { ConsultationMode } from "@/types/advisor";

const ICON = { video: Video, phone: Phone, chat: MessageSquare };

export function ModeBadge({ mode }: { mode: ConsultationMode }) {
  const Icon = ICON[mode] ?? MessageSquare;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F4F0FF] px-2.5 py-0.5 text-[11px] font-bold text-[#6240E6]">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {MODE_LABEL[mode] ?? mode}
    </span>
  );
}
