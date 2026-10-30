import { MessageSquare, Phone, Video } from "lucide-react";
import type { ConsultationMode } from "@/components/advisory/advisory-helpers";

export const CONSULTATION_MODES: { id: ConsultationMode; label: string; hint: string; icon: typeof Video }[] = [
  { id: "video", label: "Video call", hint: "Face to face on screen", icon: Video },
  { id: "phone", label: "Phone call", hint: "A call to your mobile", icon: Phone },
  { id: "chat", label: "Secure chat", hint: "Written, at your pace", icon: MessageSquare },
];

export function modeDetails(mode: ConsultationMode) {
  return CONSULTATION_MODES.find((candidate) => candidate.id === mode) ?? CONSULTATION_MODES[0];
}
