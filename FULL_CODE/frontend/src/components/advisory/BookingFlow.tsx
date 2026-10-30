"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, RefreshCw, Users } from "lucide-react";
import { ApiError, postJSON } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/i18n/I18nProvider";
import { useTagLabels } from "@/components/advisory/useTagLabels";
import type { SavedPlan } from "@/lib/my-plan";
import type { AdvisorOut, Booking } from "@/types/api";
import {
  NO_FILTERS,
  filterAdvisors,
  isValidMobile,
  offeredModes,
  resolveMode,
  sortedUnique,
  validateBookingForm,
  type BookingField,
  type ConsultationMode,
} from "@/components/advisory/advisory-helpers";
import { AdvisorFilters } from "@/components/advisory/AdvisorFilters";
import { AdvisorList } from "@/components/advisory/AdvisorList";
import { DetailsFields, type DetailsValues } from "@/components/advisory/DetailsFields";
import { FieldError } from "@/components/advisory/FieldError";
import { ModePicker } from "@/components/advisory/ModePicker";
import { PlanSummary, SummaryRows } from "@/components/advisory/PlanSummary";
import { SimulationNote } from "@/components/advisory/SimulationNote";
import { SlotPicker } from "@/components/advisory/SlotPicker";
import { StepCard } from "@/components/advisory/StepCard";
import { modeDetails } from "@/components/advisory/consultation-modes";
import { CARD_CLASS, LABEL_CLASS, SUMMARY_HEADING_CLASS } from "@/components/advisory/styles";
import { useAdvisorAvailability } from "@/components/advisory/useAdvisorAvailability";

interface BookingFlowProps {
  customerName: string;
  assessmentId: string | undefined;
  plan: SavedPlan | null;
  onBooked: (booking: Booking) => void;
  /** Saved in the customer's Settings and Profile: what a new booking starts with. */
  defaults?: { phone: string; mode: ConsultationMode | ""; shareSummary: boolean; myAdvisorId?: string };
}

type FormErrors = Partial<Record<BookingField, string>>;

const SCROLL_TARGETS: Record<BookingField, string> = { advisorId: "step-advisor", slotId: "step-time", name: "name", phone: "phone" };

function scrollToFirstError(errors: FormErrors) {
  const [first] = Object.keys(errors) as BookingField[];
  document.getElementById(SCROLL_TARGETS[first])?.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function BookingFlow({ customerName, assessmentId, plan, onBooked, defaults }: BookingFlowProps) {
  const { t, tx } = useI18n();
  const { tagLabel } = useTagLabels();
  const { advisors, calendarNote, loading, error: loadError, reload } = useAdvisorAvailability();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [advisorId, setAdvisorId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [pickedMode, setPickedMode] = useState<ConsultationMode | "">(defaults?.mode ?? "");
  const [details, setDetails] = useState<DetailsValues>({
    name: customerName,
    phone: defaults?.phone ?? "",
    notes: "",
    shareSummary: defaults?.shareSummary ?? false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const languages = useMemo(() => sortedUnique(advisors.flatMap((advisor) => advisor.languages)), [advisors]);
  const specialisations = useMemo(() => sortedUnique(advisors.flatMap((advisor) => advisor.specialisations)), [advisors]);
  const visibleAdvisors = useMemo(() => filterAdvisors(advisors, filters), [advisors, filters]);

  // Derived from the lists so a refresh or a filter change can never leave a stale advisor or slot selected.
  const advisor: AdvisorOut | undefined = visibleAdvisors.find((candidate) => candidate.advisor_id === advisorId);
  const slot = advisor?.slots.find((candidate) => candidate.slot_id === slotId);
  const mode = advisor ? resolveMode(advisor, pickedMode, filters.mode) : null;
  const detailsDone = details.name.trim().length >= 2 && isValidMobile(details.phone);

  const clearError = (field: BookingField) => setErrors((current) => ({ ...current, [field]: undefined }));

  const chooseAdvisor = (chosen: AdvisorOut) => {
    setAdvisorId(chosen.advisor_id);
    setSlotId("");
    clearError("advisorId");
  };

  const changeDetails = (patch: Partial<DetailsValues>) => {
    setDetails((current) => ({ ...current, ...patch }));
    if (patch.name !== undefined) clearError("name");
    if (patch.phone !== undefined) clearError("phone");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const found = validateBookingForm({
      advisorId: advisor?.advisor_id ?? "",
      slotId: slot?.slot_id ?? "",
      name: details.name,
      phone: details.phone,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return scrollToFirstError(found);
    if (!advisor || !slot || !mode) return;

    setSubmitting(true);
    setBookingError(null);
    try {
      const booking = await postJSON<Booking>("/advisory/bookings", {
        advisor_id: advisor.advisor_id,
        slot_id: slot.slot_id,
        user_name: details.name.trim(),
        user_phone: details.phone,
        consultation_mode: mode,
        notes: details.notes.trim() || undefined,
        assessment_id: assessmentId,
        share_summary: details.shareSummary,
      });
      onBooked(booking);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) {
        // Someone else took the slot (or the advisor stopped offering the mode): show what is still open.
        setSlotId("");
        reload();
      }
      setBookingError(errorMessage(failure, "We couldn't complete the booking. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const notChosen = t("advisory.booking.notChosen");
  const missingHint = !advisor
    ? t("advisory.booking.hintAdvisor")
    : !slot
      ? t("advisory.booking.hintTime")
      : !detailsDone
        ? t("advisory.booking.hintDetails")
        : "";

  return (
    <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 sm:px-8 pt-10 pb-20 flex flex-col gap-7">
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-md bg-[#E9E4FF] text-[#7957FF] shadow-[0_3px_0_#D9D3E8] text-[12.5px] font-bold uppercase tracking-[0.14em]">
          <Users className="w-3.5 h-3.5" />
          {t("advisory.booking.stage")}
        </div>
        <h1 className="m-0 text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.04em]" style={{ color: "#24212B" }}>
          {t("advisory.booking.title")}
        </h1>
        <p className="m-0 text-[17px] leading-[1.55] text-[#5A5566] max-w-[640px]">{t("advisory.booking.intro")}</p>
      </header>

      <SimulationNote />
      {calendarNote && (
        <p className="m-0 text-[14.5px] text-[#5A5566]" data-no-reveal>
          {tx(calendarNote)}
        </p>
      )}

      <form onSubmit={submit} noValidate className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        <div className="flex flex-col gap-6">
          <div id="step-advisor">
            <StepCard number={1} title={t("advisory.booking.step1")} done={Boolean(advisor)}>
              <AdvisorFilters filters={filters} languages={languages} specialisations={specialisations} onChange={setFilters} />
              {loading ? (
                <div className="py-6 text-center text-[#5A5566]" role="status">
                  <RefreshCw className="w-6 h-6 text-[#7957FF] animate-spin mx-auto mb-2" />
                  {t("advisory.booking.checkingCalendars")}
                </div>
              ) : loadError ? (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[#C23B3B] text-[#C23B3B] font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {tx(loadError)}
                  </span>
                  <button type="button" onClick={reload} className="underline">
                    {t("common.tryAgain")}
                  </button>
                </div>
              ) : (
                <AdvisorList
                  advisors={visibleAdvisors}
                  selectedId={advisor?.advisor_id ?? ""}
                  onSelect={chooseAdvisor}
                  myAdvisorId={defaults?.myAdvisorId}
                />
              )}
              <FieldError message={errors.advisorId} />
            </StepCard>
          </div>

          <div id="step-time">
            <StepCard number={2} title={t("advisory.booking.step2")} done={Boolean(slot)}>
              <div>
                <span className={LABEL_CLASS}>
                  {advisor
                    ? t("advisory.booking.availableTimesWith", { name: advisor.advisor_name })
                    : t("advisory.booking.availableTimes")}
                </span>
                <SlotPicker
                  advisor={advisor}
                  selectedSlotId={slot?.slot_id ?? ""}
                  onSelect={(id) => {
                    setSlotId(id);
                    clearError("slotId");
                  }}
                />
                <FieldError message={errors.slotId} />
              </div>
              <div>
                <span className={LABEL_CLASS}>{t("advisory.booking.howToMeet")}</span>
                <ModePicker offered={advisor ? offeredModes(advisor) : []} selected={mode} onSelect={setPickedMode} />
              </div>
            </StepCard>
          </div>

          <StepCard number={3} title={t("advisory.booking.step3")} done={detailsDone}>
            <DetailsFields values={details} errors={errors} onChange={changeDetails} />
          </StepCard>
        </div>

        <aside className="lg:sticky lg:top-24 flex flex-col gap-4" data-no-reveal>
          <div className={`${CARD_CLASS} p-6 flex flex-col gap-5`}>
            <PlanSummary plan={plan} />
            <div>
              <h3 className={SUMMARY_HEADING_CLASS}>{t("advisory.booking.yourSession")}</h3>
              <SummaryRows
                rows={[
                  [t("advisory.label.advisor"), advisor?.advisor_name ?? notChosen],
                  [t("advisory.label.time"), slot?.label ?? notChosen],
                  [t("advisory.label.how"), mode ? t(modeDetails(mode).labelKey) : notChosen],
                  [t("advisory.label.focus"), advisor ? advisor.specialisations.slice(0, 2).map(tagLabel).join(", ") : notChosen],
                ]}
              />
            </div>
            {bookingError && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl border border-[#C23B3B] text-[#C23B3B] text-[14px] font-semibold"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {tx(bookingError)}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="h-14 rounded-lg bg-[#7957FF] text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                t("advisory.booking.submitting")
              ) : (
                <>
                  {t("advisory.booking.confirm")}
                  <Check className="w-4 h-4" strokeWidth={3} />
                </>
              )}
            </button>
            {missingHint && <p className="m-0 -mt-2 text-[13px] text-[#6F6A7C] text-center">{missingHint}</p>}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#5A5566] hover:text-[#7957FF] self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("advisory.booking.backToPlans")}
          </Link>
        </aside>
      </form>
    </main>
  );
}
