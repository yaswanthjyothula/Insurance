import { User } from "lucide-react";
import { MONTHS_PER_YEAR, type Employment } from "@/lib/assessment-form";
import { amountHint, ChoiceGroup, Field, FIELD_GRID, SelectInput, StepHeader, TextInput, type StepProps } from "./fields";

const EMPLOYMENT_OPTIONS: { value: Employment; label: string }[] = [
  { value: "salaried", label: "Salaried (Corporate / Govt)" },
  { value: "self_employed", label: "Self-employed / Professional" },
  { value: "business", label: "Business owner / Entrepreneur" },
  { value: "other", label: "Other / Freelance" },
];

export function StepProfile({ form, errorFor, onChange }: StepProps) {
  const yearlyExpenses = form.monthlyExpenses ? String(Number(form.monthlyExpenses) * MONTHS_PER_YEAR) : "";
  return (
    <>
      <StepHeader
        icon={User}
        step={1}
        title="Personal & employment"
        description="Your age, gender and earning horizon set how long your family would need income support and what premiums cost."
      />
      <div className={FIELD_GRID}>
        <Field id="age" label="Current age" error={errorFor("age")} hint="Between 18 and 75">
          <TextInput
            id="age"
            value={form.age}
            onChange={(age) => onChange({ age })}
            placeholder="e.g. 32"
            suffix="years"
            error={errorFor("age")}
            maxDigits={2}
          />
        </Field>
        <Field id="gender" label="Gender" group error={errorFor("gender")} hint="Premium rates differ by gender">
          <ChoiceGroup
            id="gender"
            value={form.gender}
            onChange={(gender) => onChange({ gender })}
            error={errorFor("gender")}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </Field>
        <Field id="residency" label="Residency" group error={errorFor("residency")} hint="NRIs have different eligibility on some plans">
          <ChoiceGroup
            id="residency"
            value={form.residency}
            onChange={(residency) => onChange({ residency })}
            error={errorFor("residency")}
            options={[
              { value: "resident", label: "Resident Indian" },
              { value: "nri", label: "NRI" },
            ]}
          />
        </Field>
        <Field id="employment" label="Employment type" error={errorFor("employment")}>
          <SelectInput
            id="employment"
            value={form.employment}
            onChange={(employment) => onChange({ employment })}
            placeholder="Select employment type"
            options={EMPLOYMENT_OPTIONS}
            error={errorFor("employment")}
          />
        </Field>
        <Field
          id="income"
          label="Annual gross income"
          error={errorFor("income")}
          hint={amountHint(form.income, " per year") ?? "Total yearly income before tax (0 if you have none)"}
        >
          <TextInput
            id="income"
            money
            prefix="₹"
            value={form.income}
            onChange={(income) => onChange({ income })}
            placeholder="e.g. 18,00,000"
            error={errorFor("income")}
          />
        </Field>
        <Field
          id="monthlyExpenses"
          label="Monthly household expenses"
          error={errorFor("monthlyExpenses")}
          hint={amountHint(yearlyExpenses, " per year (monthly × 12)") ?? "What the household spends in a month, excluding EMIs"}
        >
          <TextInput
            id="monthlyExpenses"
            money
            prefix="₹"
            value={form.monthlyExpenses}
            onChange={(monthlyExpenses) => onChange({ monthlyExpenses })}
            placeholder="e.g. 60,000"
            error={errorFor("monthlyExpenses")}
          />
        </Field>
        <Field
          id="retire"
          label="Planned retirement age"
          optional
          error={errorFor("retire")}
          hint="We use a standard retirement age if left blank"
        >
          <TextInput
            id="retire"
            value={form.retire}
            onChange={(retire) => onChange({ retire })}
            placeholder="e.g. 60"
            suffix="years"
            error={errorFor("retire")}
            maxDigits={2}
          />
        </Field>
        <Field
          id="smoker"
          label="Tobacco / nicotine use"
          group
          error={errorFor("smoker")}
          hint="Any use in the last 3 years raises term premiums"
        >
          <ChoiceGroup
            id="smoker"
            value={form.smoker}
            onChange={(smoker) => onChange({ smoker })}
            error={errorFor("smoker")}
            options={[
              { value: "no", label: "No / Non-smoker" },
              { value: "yes", label: "Yes / Tobacco user" },
            ]}
          />
        </Field>
      </div>
    </>
  );
}
