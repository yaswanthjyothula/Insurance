import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import type { Priority, Risk } from "@/types/api";
import { amountHint, ChoiceGroup, Field, FIELD_GRID, TextInput, type StepProps } from "./fields";

const RISK_OPTIONS: { value: Risk; labelKey: MessageKey }[] = [
  { value: "low", labelKey: "assessment.preferences.riskLow" },
  { value: "medium", labelKey: "assessment.preferences.riskMedium" },
  { value: "high", labelKey: "assessment.preferences.riskHigh" },
];

export const PRIORITY_OPTIONS: { value: Priority; labelKey: MessageKey }[] = [
  { value: "balanced", labelKey: "assessment.preferences.priorityBalanced" },
  { value: "lowest_cost", labelKey: "assessment.preferences.priorityLowestCost" },
  { value: "goal_savings", labelKey: "assessment.preferences.priorityGoalSavings" },
  { value: "growth", labelKey: "assessment.preferences.priorityGrowth" },
];

/** What the customer wants from a plan; these steer product ranking, not the cover amount. */
export function PreferenceFields({ form, errorFor, onChange }: StepProps) {
  const { t } = useI18n();
  return (
    <div className={FIELD_GRID}>
      <Field
        id="risk"
        label={t("assessment.preferences.riskLabel")}
        group
        error={errorFor("risk")}
        hint={t("assessment.preferences.riskHint")}
      >
        <ChoiceGroup
          id="risk"
          value={form.risk}
          onChange={(risk) => onChange({ risk })}
          error={errorFor("risk")}
          options={RISK_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
        />
      </Field>
      <Field
        id="priority"
        label={t("assessment.preferences.priorityLabel")}
        group
        optional
        error={errorFor("priority")}
        hint={t("assessment.preferences.priorityHint")}
      >
        <ChoiceGroup
          id="priority"
          value={form.priority}
          onChange={(priority) => onChange({ priority })}
          options={PRIORITY_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
          columns={2}
        />
      </Field>
      <Field
        id="monthlyBudget"
        label={t("assessment.preferences.budgetLabel")}
        optional
        error={errorFor("monthlyBudget")}
        hint={amountHint(form.monthlyBudget, t("assessment.amount.perMonth")) ?? t("assessment.preferences.budgetHint")}
      >
        <TextInput
          id="monthlyBudget"
          money
          prefix="₹"
          value={form.monthlyBudget}
          onChange={(monthlyBudget) => onChange({ monthlyBudget })}
          placeholder={t("assessment.preferences.budgetPlaceholder")}
          error={errorFor("monthlyBudget")}
        />
      </Field>
      <Field
        id="preferredTerm"
        label={t("assessment.preferences.termLabel")}
        optional
        error={errorFor("preferredTerm")}
        hint={t("assessment.preferences.termHint")}
      >
        <TextInput
          id="preferredTerm"
          value={form.preferredTerm}
          onChange={(preferredTerm) => onChange({ preferredTerm })}
          placeholder={t("assessment.preferences.termPlaceholder")}
          suffix={t("assessment.unit.years")}
          error={errorFor("preferredTerm")}
          maxDigits={2}
        />
      </Field>
    </div>
  );
}
