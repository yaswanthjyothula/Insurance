import { describe, expect, it } from "vitest";
import type { AdvisorOut, Slot } from "@/types/api";
import {
  NO_FILTERS,
  digitsOnly,
  filterAdvisors,
  groupSlotsByDay,
  initialsOf,
  isValidMobile,
  resolveMode,
  validateBookingForm,
} from "@/components/advisory/advisory-helpers";
import { humaniseTag } from "@/lib/text";

const slot = (id: string, start: string, label: string): Slot => ({ slot_id: id, start, end: start, label });

const advisor = (overrides: Partial<AdvisorOut>): AdvisorOut => ({
  advisor_id: "ADV-1",
  advisor_name: "Suresh Nair",
  languages: ["English", "Tamil"],
  specialisations: ["nri_clients"],
  consultation_modes: ["video", "phone"],
  years_experience: 15,
  rating: 4.7,
  review_count: 180,
  slots: [],
  has_availability: true,
  ...overrides,
});

describe("groupSlotsByDay", () => {
  it("groups slots under their calendar day in time order", () => {
    const days = groupSlotsByDay([
      slot("c", "2026-10-31T10:00:00", "Sat 31 Oct, 10:00 AM"),
      slot("b", "2026-10-30T16:00:00", "Fri 30 Oct, 4:00 PM"),
      slot("a", "2026-10-30T14:00:00", "Fri 30 Oct, 2:00 PM"),
    ]);
    expect(days.map((day) => day.dayKey)).toEqual(["2026-10-30", "2026-10-31"]);
    expect(days[0].dayLabel).toBe("Fri 30 Oct");
    expect(days[0].slots.map(({ time }) => time)).toEqual(["2:00 PM", "4:00 PM"]);
    expect(days[1].slots).toHaveLength(1);
  });

  it("returns nothing for no slots", () => {
    expect(groupSlotsByDay([])).toEqual([]);
  });

  it("does not mutate its input", () => {
    const input = [slot("b", "2026-10-31T10:00:00", "Sat 31 Oct, 10:00 AM"), slot("a", "2026-10-30T10:00:00", "Fri 30 Oct, 10:00 AM")];
    groupSlotsByDay(input);
    expect(input[0].slot_id).toBe("b");
  });
});

describe("filterAdvisors", () => {
  const advisors = [
    advisor({ advisor_id: "A", languages: ["English"], specialisations: ["term_insurance"], consultation_modes: ["chat"] }),
    advisor({ advisor_id: "B", languages: ["Hindi", "English"], specialisations: ["nri_clients"], consultation_modes: ["video", "phone"] }),
  ];

  it("returns everyone when no filter is set", () => {
    expect(filterAdvisors(advisors, NO_FILTERS)).toHaveLength(2);
  });

  it("combines mode, language and specialisation", () => {
    expect(filterAdvisors(advisors, { ...NO_FILTERS, mode: "video" }).map((a) => a.advisor_id)).toEqual(["B"]);
    expect(filterAdvisors(advisors, { ...NO_FILTERS, language: "English" })).toHaveLength(2);
    expect(
      filterAdvisors(advisors, { mode: "chat", language: "English", specialisation: "term_insurance" }).map((a) => a.advisor_id),
    ).toEqual(["A"]);
    expect(filterAdvisors(advisors, { mode: "chat", language: "Hindi", specialisation: "" })).toEqual([]);
  });
});

describe("resolveMode", () => {
  const video = advisor({ consultation_modes: ["video", "phone"] });

  it("prefers the picked mode when the advisor offers it", () => {
    expect(resolveMode(video, "phone", "video")).toBe("phone");
  });

  it("falls back to the filter, then to the advisor's first mode", () => {
    expect(resolveMode(video, "chat", "phone")).toBe("phone");
    expect(resolveMode(video, "chat", "chat")).toBe("video");
    expect(resolveMode(video, "", "")).toBe("video");
  });

  it("ignores modes the app does not know", () => {
    expect(resolveMode(advisor({ consultation_modes: ["carrier_pigeon"] }), "", "")).toBeNull();
  });
});

describe("phone and form validation", () => {
  it("accepts exactly ten digits", () => {
    expect(isValidMobile("9876543210")).toBe(true);
    expect(isValidMobile("987654321")).toBe(false);
    expect(isValidMobile("98765432101")).toBe(false);
    expect(isValidMobile("98765 43210")).toBe(false);
  });

  it("strips non-digits and caps the length", () => {
    expect(digitsOnly("+91 98765-43210 99")).toBe("9198765432");
  });

  it("asks for the advisor before the time, and reports name and phone", () => {
    expect(validateBookingForm({ advisorId: "", slotId: "", name: "A", phone: "1" })).toEqual({
      advisorId: "Choose an advisor.",
      name: "Enter your name.",
      phone: "Enter a 10-digit mobile number.",
    });
    expect(validateBookingForm({ advisorId: "ADV-1", slotId: "", name: "Asha", phone: "9876543210" })).toEqual({ slotId: "Pick a time." });
    expect(validateBookingForm({ advisorId: "ADV-1", slotId: "SLT-1", name: "Asha", phone: "9876543210" })).toEqual({});
  });
});

describe("display helpers", () => {
  it("humanises pack tags and keeps acronyms upper case", () => {
    expect(humaniseTag("nri_clients")).toBe("NRI clients");
    expect(humaniseTag("ulip_and_investments")).toBe("ULIP and investments");
  });

  it("builds initials from the first two words", () => {
    expect(initialsOf("Suresh Nair")).toBe("SN");
    expect(initialsOf("Anita Rao Menon")).toBe("AR");
  });
});
