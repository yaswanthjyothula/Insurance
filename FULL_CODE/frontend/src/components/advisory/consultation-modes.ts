import { MessageSquare, Phone, Video } from "lucide-react";
import type { MessageKey } from "@/i18n/en";
import type { ConsultationMode } from "@/components/advisory/advisory-helpers";

export const CONSULTATION_MODES: {
  id: ConsultationMode;
  /** English text, kept for screens that have not moved to the keys yet. */
  label: string;
  hint: string;
  labelKey: MessageKey;
  hintKey: MessageKey;
  icon: typeof Video;
}[] = [
  {
    id: "video",
    label: "Video call",
    hint: "Face to face on screen",
    labelKey: "common.mode.video",
    hintKey: "common.mode.video.hint",
    icon: Video,
  },
  {
    id: "phone",
    label: "Phone call",
    hint: "A call to your mobile",
    labelKey: "common.mode.phone",
    hintKey: "common.mode.phone.hint",
    icon: Phone,
  },
  {
    id: "chat",
    label: "Secure chat",
    hint: "Written, at your pace",
    labelKey: "common.mode.chat",
    hintKey: "common.mode.chat.hint",
    icon: MessageSquare,
  },
];

export function modeDetails(mode: ConsultationMode) {
  return CONSULTATION_MODES.find((candidate) => candidate.id === mode) ?? CONSULTATION_MODES[0];
}
