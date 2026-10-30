import { User } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import { MONTHS_PER_YEAR, type Employment } from "@/lib/assessment-form";
import { amountHint, ChoiceGroup, Field, FIELD_GRID, SelectInput, StepHeader, TextInput, type StepProps } from "./fields";

const EMPLOYMENT_OPTIONS: { value: Employment; labelKey: MessageKey }[] = [
  { value: "salaried", labelKey: "assessment.profile.employment.salaried" },
  { value: "self_employed", labelKey: "assessment.profile.employment.selfEmployed" },
  { value: "business", labelKey: "assessment.profile.employment.business" },
  { value: "other", labelKey: "assessment.profile.employment.other" },
];

export function StepProfile({ form, errorFor, onChange }: StepProps) {
  const { t } = useI18n();
  const years = t("assessment.unit.years");
  const yearlyExpenses = form.monthlyExpenses ? String(Number(form.monthlyExpenses) * MONTHS_PER_YEAR) : "";
  return (
    <>
      <StepHeader icon={User} step={1} title={t("assessment.profile.title")} description={t("assessment.profile.description")} />
      <div className={FIELD_GRID}>
        <Field id="age" label={t("assessment.profile.ageLabel")} error={errorFor("age")} hint={t("assessment.profile.ageHint")}>
          <TextInput
            id="age"
            value={form.age}
            onChange={(age) => onChange({ age })}
            placeholder={t("assessment.profile.agePlaceholder")}
            suffix={years}
            error={errorFor("age")}
            maxDigits={2}
          />
        </Field>
        <Field
          id="gender"
          label={t("assessment.profile.genderLabel")}
          group
          error={errorFor("gender")}
          hint={t("assessment.profile.genderHint")}
        >
          <ChoiceGroup
            id="gender"
            value={form.gender}
            onChange={(gender) => onChange({ gender })}
            error={errorFor("gender")}
            options={[
              { value: "male", label: t("assessment.profile.male") },
              { value: "female", label: t("assessment.profile.female") },
            ]}
          />
        </Field>
        <Field
          id="residency"
          label={t("assessment.profile.residencyLabel")}
          group
          error={errorFor("residency")}
          hint={t("assessment.profile.residencyHint")}
        >
          <ChoiceGroup
            id="residency"
            value={form.residency}
            onChange={(residency) => onChange({ residency })}
            error={errorFor("residency")}
            options={[
              { value: "resident", label: t("assessment.profile.residentIndian") },
              { value: "nri", label: t("assessment.profile.nri") },
            ]}
          />
        </Field>
        <Field id="employment" label={t("assessment.profile.employmentLabel")} error={errorFor("employment")}>
          <SelectInput
            id="employment"
            value={form.employment}
            onChange={(employment) => onChange({ employment })}
            placeholder={t("assessment.profile.employmentPlaceholder")}
            options={EMPLOYMENT_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
            error={errorFor("employment")}
          />
        </Field>
        <Field
          id="income"
          label={t("assessment.profile.incomeLabel")}
          error={errorFor("income")}
          hint={amountHint(form.income, t("assessment.amount.perYear")) ?? t("assessment.profile.incomeHint")}
        >
          <TextInput
            id="income"
            money
            prefix="₹"
            value={form.income}
            onChange={(income) => onChange({ income })}
            placeholder={t("assessment.profile.incomePlaceholder")}
            error={errorFor("income")}
          />
        </Field>
        <Field
          id="monthlyExpenses"
          label={t("assessment.profile.expensesLabel")}
          error={errorFor("monthlyExpenses")}
          hint={amountHint(yearlyExpenses, t("assessment.amount.perYearMonthly")) ?? t("assessment.profile.expensesHint")}
        >
          <TextInput
            id="monthlyExpenses"
            money
            prefix="₹"
            value={form.monthlyExpenses}
            onChange={(monthlyExpenses) => onChange({ monthlyExpenses })}
            placeholder={t("assessment.profile.expensesPlaceholder")}
            error={errorFor("monthlyExpenses")}
          />
        </Field>
        <Field
          id="retire"
          label={t("assessment.profile.retireLabel")}
          optional
          error={errorFor("retire")}
          hint={t("assessment.profile.retireHint")}
        >
          <TextInput
            id="retire"
            value={form.retire}
            onChange={(retire) => onChange({ retire })}
            placeholder={t("assessment.profile.retirePlaceholder")}
            suffix={years}
            error={errorFor("retire")}
            maxDigits={2}
          />
        </Field>
        <Field
          id="smoker"
          label={t("assessment.profile.smokerLabel")}
          group
          error={errorFor("smoker")}
          hint={t("assessment.profile.smokerHint")}
        >
          <ChoiceGroup
            id="smoker"
            value={form.smoker}
            onChange={(smoker) => onChange({ smoker })}
            error={errorFor("smoker")}
            options={[
              { value: "no", label: t("assessment.profile.nonSmoker") },
              { value: "yes", label: t("assessment.profile.tobaccoUser") },
            ]}
          />
        </Field>
      </div>
    </>
  );
}
