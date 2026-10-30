import { useI18n } from "@/i18n/I18nProvider";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { STEPS } from "./step-tabs";

interface StepNavigationProps {
  step: number;
  canClear: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onClear: () => void;
  onSubmit: () => void;
}

const backClass =
  "inline-flex items-center gap-2 h-14 px-6 rounded-lg border border-[#D9D3E8] text-base font-semibold bg-[#FFFFFF] shadow-[0_4px_0_#D9D3E8] hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_1px_0_#D9D3E8] transition-all";
const forwardClass =
  "inline-flex items-center gap-2 h-14 px-8 rounded-lg bg-[#7957FF] text-[#FFFFFF] text-base font-bold ms-auto disabled:opacity-60";

export function StepNavigation({ step, canClear, isSubmitting, onBack, onNext, onClear, onSubmit }: StepNavigationProps) {
  const { t } = useI18n();
  const isLastStep = step === STEPS.length - 1;
  return (
    <div className="pt-7 border-t border-[#D9D3E8] flex items-center justify-between gap-4 flex-wrap">
      {step > 0 ? (
        <button type="button" onClick={onBack} className={backClass}>
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </button>
      ) : canClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6F6A7C] hover:text-[#24212B]"
        >
          <RotateCcw className="w-4 h-4" />
          {t("assessment.nav.clear")}
        </button>
      ) : (
        <span />
      )}

      {isLastStep ? (
        <button type="button" onClick={onSubmit} disabled={isSubmitting} className={forwardClass}>
          {isSubmitting ? (
            t("assessment.nav.calculating")
          ) : (
            <>
              {t("assessment.nav.calculate")}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      ) : (
        <button type="button" onClick={onNext} className={forwardClass}>
          {t("assessment.nav.continueTo", { step: t(STEPS[step + 1].labelKey) })}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
