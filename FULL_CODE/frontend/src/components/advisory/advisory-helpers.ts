import type { AdvisorOut, Booking, Slot } from "@/types/api";

export type ConsultationMode = Booking["consultation_mode"];

/** Empty string means "any" so the value can sit directly in a <select>. */
export interface AdvisorFilters {
  mode: ConsultationMode | "";
  language: string;
  specialisation: string;
}

export const NO_FILTERS: AdvisorFilters = { mode: "", language: "", specialisation: "" };

export const PHONE_LENGTH = 10;

export function isConsultationMode(value: string): value is ConsultationMode {
  return value === "video" || value === "phone" || value === "chat";
}

export function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function offeredModes(advisor: AdvisorOut): ConsultationMode[] {
  return advisor.consultation_modes.filter(isConsultationMode);
}

export function filterAdvisors(advisors: AdvisorOut[], filters: AdvisorFilters): AdvisorOut[] {
  return advisors.filter(
    (advisor) =>
      (!filters.mode || advisor.consultation_modes.includes(filters.mode)) &&
      (!filters.language || advisor.languages.includes(filters.language)) &&
      (!filters.specialisation || advisor.specialisations.includes(filters.specialisation)),
  );
}

/** The mode the customer picked if this advisor offers it, otherwise the filter, otherwise the advisor's first mode. */
export function resolveMode(
  advisor: AdvisorOut,
  picked: ConsultationMode | "",
  filterMode: ConsultationMode | "",
): ConsultationMode | null {
  const offered = offeredModes(advisor);
  return [picked, filterMode].find((mode): mode is ConsultationMode => mode !== "" && offered.includes(mode)) ?? offered[0] ?? null;
}

export interface DaySlots {
  dayKey: string;
  dayLabel: string;
  slots: { slot: Slot; time: string }[];
}

/**
 * Groups slots by calendar day. Slot starts are local, zone-less timestamps ("2026-10-30T14:00:00"),
 * so the day is read from the text instead of going through Date, which would shift it by time zone.
 * The server's label ("Fri 30 Oct, 2:00 PM") supplies the readable day and time.
 */
export function groupSlotsByDay(slots: Slot[]): DaySlots[] {
  const days = new Map<string, DaySlots>();
  for (const slot of [...slots].sort((a, b) => a.start.localeCompare(b.start))) {
    const dayKey = slot.start.slice(0, 10);
    const [dayLabel, time = slot.label] = slot.label.split(", ");
    const day = days.get(dayKey) ?? { dayKey, dayLabel: dayLabel ?? dayKey, slots: [] };
    day.slots.push({ slot, time });
    days.set(dayKey, day);
  }
  return [...days.values()];
}

export function isValidMobile(phone: string): boolean {
  return new RegExp(`^\\d{${PHONE_LENGTH}}$`).test(phone);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

export interface BookingFormValues {
  advisorId: string;
  slotId: string;
  name: string;
  phone: string;
}

export type BookingField = keyof BookingFormValues;

export function validateBookingForm(values: BookingFormValues): Partial<Record<BookingField, string>> {
  const errors: Partial<Record<BookingField, string>> = {};
  if (!values.advisorId) errors.advisorId = "Choose an advisor.";
  else if (!values.slotId) errors.slotId = "Pick a time.";
  if (values.name.trim().length < 2) errors.name = "Enter your name.";
  if (!isValidMobile(values.phone)) errors.phone = `Enter a ${PHONE_LENGTH}-digit mobile number.`;
  return errors;
}

export function initialsOf(advisorName: string): string {
  return advisorName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
