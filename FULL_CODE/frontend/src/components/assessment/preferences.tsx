import type { Priority, Risk } from "@/types/api";
import { amountHint, ChoiceGroup, Field, FIELD_GRID, TextInput, type StepProps } from "./fields";

const RISK_OPTIONS: { value: Risk; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "lowest_cost", label: "Lowest cost" },
  { value: "goal_savings", label: "Savings for goals" },
  { value: "growth", label: "Long-term growth" },
];

/** What the customer wants from a plan; these steer product ranking, not the cover amount. */
export function PreferenceFields({ form, errorFor, onChange }: StepProps) {
  return (
    <div className={FIELD_GRID}>
      <Field id="risk" label="Risk appetite" group error={errorFor("risk")} hint="How comfortable you are with market-linked returns">
        <ChoiceGroup id="risk" value={form.risk} onChange={(risk) => onChange({ risk })} error={errorFor("risk")} options={RISK_OPTIONS} />
      </Field>
      <Field id="priority" label="What matters most" group optional error={errorFor("priority")} hint="Leave unselected for a balanced mix">
        <ChoiceGroup
          id="priority"
          value={form.priority}
          onChange={(priority) => onChange({ priority })}
          options={PRIORITY_OPTIONS}
          columns={2}
        />
      </Field>
      <Field
        id="monthlyBudget"
        label="Monthly premium budget"
        optional
        error={errorFor("monthlyBudget")}
        hint={amountHint(form.monthlyBudget, " per month") ?? "Leave blank for no limit"}
      >
        <TextInput
          id="monthlyBudget"
          money
          prefix="₹"
          value={form.monthlyBudget}
          onChange={(monthlyBudget) => onChange({ monthlyBudget })}
          placeholder="e.g. 2,500"
          error={errorFor("monthlyBudget")}
        />
      </Field>
      <Field
        id="preferredTerm"
        label="Preferred policy term"
        optional
        error={errorFor("preferredTerm")}
        hint="5 to 60 years; blank lets us suggest one"
      >
        <TextInput
          id="preferredTerm"
          value={form.preferredTerm}
          onChange={(preferredTerm) => onChange({ preferredTerm })}
          placeholder="e.g. 25"
          suffix="years"
          error={errorFor("preferredTerm")}
          maxDigits={2}
        />
      </Field>
    </div>
  );
}
