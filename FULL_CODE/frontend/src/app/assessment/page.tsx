"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { JourneyProgress } from "@/components/layout/journey-progress";
import { FormNotice } from "@/components/assessment/form-notice";
import { SampleCustomerPicker } from "@/components/assessment/sample-customer-picker";
import { StepFamily } from "@/components/assessment/step-family";
import { StepGoals } from "@/components/assessment/step-goals";
import { StepLiabilities } from "@/components/assessment/step-liabilities";
import { StepNavigation } from "@/components/assessment/step-navigation";
import { StepProfile } from "@/components/assessment/step-profile";
import { StepReview } from "@/components/assessment/step-review";
import { StepTabs } from "@/components/assessment/step-tabs";
import { useAssessmentForm } from "@/components/assessment/use-assessment-form";
import { useStepFlow } from "@/components/assessment/use-step-flow";
import { useSubmitAssessment } from "@/components/assessment/use-submit-assessment";
import { formFromSampleCustomer, validateAll, type FormState } from "@/lib/assessment-form";
import { postJSON } from "@/lib/api";
import { useAssessmentStore } from "@/store/assessment-store";
import type { SampleCustomerDetail } from "@/types/sample-customer";

export default function AssessmentPage() {
  const { t, tx } = useI18n();
  const { resetAll } = useAssessmentStore();

  // Lets the admin console count assessments that were started, not only the ones finished
  useEffect(() => {
    postJSON("/events", { kind: "assessment_started" }).catch(() => undefined);
  }, []);
  const { form, origin, isBlank, update, loadSample, clear } = useAssessmentForm();
  const flow = useStepFlow(form);
  const { submit, isLoading, error: submitError, clearError } = useSubmitAssessment();
  const [validationMessage, setValidationMessage] = useState(false);

  const dismissMessages = () => {
    setValidationMessage(false);
    clearError();
  };

  const handleChange = (patch: Partial<FormState>) => {
    update(patch);
    dismissMessages();
  };

  const handleSample = (detail: SampleCustomerDetail) => {
    loadSample(formFromSampleCustomer(detail), detail.profile.full_name);
    flow.reset();
    dismissMessages();
  };

  const startOver = () => {
    clear();
    flow.reset();
    dismissMessages();
    resetAll();
  };

  const handleSubmit = () => {
    const { firstInvalidStep } = validateAll(form);
    if (firstInvalidStep !== -1) {
      flow.showErrorsAt(firstInvalidStep);
      setValidationMessage(true);
      return;
    }
    void submit(form);
  };

  const stepProps = { form, errorFor: flow.errorFor, onChange: handleChange };
  const bannerMessage =
    (submitError ? tx(submitError) : null) ??
    (validationMessage ? t("assessment.page.fixAnswers") : null) ??
    (flow.visibleErrorCount > 0
      ? t(flow.visibleErrorCount === 1 ? "assessment.page.fixFieldsOne" : "assessment.page.fixFieldsMany", {
          count: flow.visibleErrorCount,
        })
      : null);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FC] text-[#24212B]">
      <JourneyProgress currentStage={1} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 sm:px-8 pt-6 pb-24 flex flex-col gap-5">
        <div className="ls-persp">
          <div
            data-scroll-tilt="5"
            className="ls-lip flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] px-6 sm:px-8 py-6 rounded-3xl border border-[#D9D3E8] [transform-origin:bottom_center]"
          >
            <div>
              <h1
                className="m-0 text-[clamp(26px,2.8vw,36px)] leading-[1.1] font-extrabold tracking-[-0.04em]"
                style={{ color: "#24212B" }}
              >
                {t("assessment.page.title")}
              </h1>
              <p className="text-[16px] leading-[1.5] text-[#5A5566] mt-2 mb-0">{t("assessment.page.subtitle")}</p>
            </div>
            <SampleCustomerPicker onSelect={handleSample} />
          </div>
        </div>

        <StepTabs step={flow.step} hasErrors={flow.stepHasErrors} isDone={flow.stepIsDone} onSelect={flow.goTo} />
        <FormNotice origin={origin} onStartOver={startOver} />

        {bannerMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C23B3B] text-[#C23B3B] flex items-center gap-3 text-[15px] font-semibold"
            data-no-reveal
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        )}

        <div className="ls-lip bg-[#FFFFFF] rounded-3xl border border-[#D9D3E8] p-6 sm:p-9 flex flex-col gap-7" data-no-reveal>
          {flow.step === 0 && <StepProfile {...stepProps} />}
          {flow.step === 1 && <StepFamily {...stepProps} />}
          {flow.step === 2 && <StepLiabilities {...stepProps} />}
          {flow.step === 3 && <StepGoals {...stepProps} />}
          {flow.step === 4 && <StepReview form={form} onEdit={flow.goTo} />}
          <StepNavigation
            step={flow.step}
            canClear={!isBlank}
            isSubmitting={isLoading}
            onBack={() => flow.goTo(flow.step - 1)}
            onNext={() => flow.goTo(flow.step + 1)}
            onClear={startOver}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}
