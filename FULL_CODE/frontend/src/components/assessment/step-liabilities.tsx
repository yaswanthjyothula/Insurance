import { Landmark } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import type { AmountKey } from "@/lib/assessment-form";
import { amountHint, Field, FIELD_GRID, StepHeader, TextInput, type StepProps } from "./fields";

const AMOUNT_FIELDS: { key: AmountKey; label: MessageKey; placeholder: MessageKey; hint: MessageKey }[] = [
  {
    key: "homeLoan",
    label: "assessment.liabilities.homeLoanLabel",
    placeholder: "assessment.liabilities.homeLoanPlaceholder",
    hint: "assessment.liabilities.homeLoanHint",
  },
  {
    key: "otherLoans",
    label: "assessment.liabilities.otherLoansLabel",
    placeholder: "assessment.liabilities.otherLoansPlaceholder",
    hint: "assessment.liabilities.otherLoansHint",
  },
  {
    key: "individualCover",
    label: "assessment.liabilities.individualCoverLabel",
    placeholder: "assessment.liabilities.individualCoverPlaceholder",
    hint: "assessment.liabilities.individualCoverHint",
  },
  {
    key: "groupCover",
    label: "assessment.liabilities.groupCoverLabel",
    placeholder: "assessment.liabilities.groupCoverPlaceholder",
    hint: "assessment.liabilities.groupCoverHint",
  },
  {
    key: "liquidSavings",
    label: "assessment.liabilities.savingsLabel",
    placeholder: "assessment.liabilities.savingsPlaceholder",
    hint: "assessment.liabilities.savingsHint",
  },
  {
    key: "marketInvestments",
    label: "assessment.liabilities.investmentsLabel",
    placeholder: "assessment.liabilities.investmentsPlaceholder",
    hint: "assessment.liabilities.investmentsHint",
  },
];

export function StepLiabilities({ form, errorFor, onChange }: StepProps) {
  const { t } = useI18n();
  return (
    <>
      <StepHeader
        icon={Landmark}
        step={3}
        title={t("assessment.liabilities.title")}
        description={t("assessment.liabilities.description")}
      />
      <div className={FIELD_GRID}>
        {AMOUNT_FIELDS.map(({ key, label, placeholder, hint }) => (
          <Field key={key} id={key} label={t(label)} optional error={errorFor(key)} hint={amountHint(form[key]) ?? t(hint)}>
            <TextInput
              id={key}
              money
              prefix="₹"
              value={form[key]}
              onChange={(value) => onChange({ [key]: value })}
              placeholder={t(placeholder)}
              error={errorFor(key)}
            />
          </Field>
        ))}
        <Field
          id="bufferMonths"
          label={t("assessment.liabilities.bufferLabel")}
          optional
          error={errorFor("bufferMonths")}
          hint={t("assessment.liabilities.bufferHint")}
        >
          <TextInput
            id="bufferMonths"
            value={form.bufferMonths}
            onChange={(bufferMonths) => onChange({ bufferMonths })}
            placeholder={t("assessment.liabilities.bufferPlaceholder")}
            suffix={t("assessment.unit.months")}
            error={errorFor("bufferMonths")}
            maxDigits={2}
          />
        </Field>
      </div>
    </>
  );
}
