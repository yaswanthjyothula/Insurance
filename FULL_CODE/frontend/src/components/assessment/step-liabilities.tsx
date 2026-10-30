import { Landmark } from "lucide-react";
import type { AmountKey } from "@/lib/assessment-form";
import { amountHint, Field, FIELD_GRID, StepHeader, TextInput, type StepProps } from "./fields";

const AMOUNT_FIELDS: { key: AmountKey; label: string; placeholder: string; hint: string }[] = [
  { key: "homeLoan", label: "Outstanding home loan", placeholder: "e.g. 35,00,000", hint: "Principal balance on your mortgage" },
  { key: "otherLoans", label: "Personal / vehicle / education loans", placeholder: "e.g. 5,00,000", hint: "Other outstanding debts" },
  {
    key: "individualCover",
    label: "Existing individual life cover",
    placeholder: "e.g. 50,00,000",
    hint: "Sum assured on policies you bought yourself",
  },
  {
    key: "groupCover",
    label: "Employer group life cover",
    placeholder: "e.g. 20,00,000",
    hint: "Cover your employer provides; we count it too",
  },
  { key: "liquidSavings", label: "Liquid savings", placeholder: "e.g. 7,00,000", hint: "Bank balances and fixed deposits" },
  {
    key: "marketInvestments",
    label: "Market investments",
    placeholder: "e.g. 6,00,000",
    hint: "Mutual funds and shares (exclude your home)",
  },
];

export function StepLiabilities({ form, errorFor, onChange }: StepProps) {
  return (
    <>
      <StepHeader
        icon={Landmark}
        step={3}
        title="Debts, cover & savings"
        description="Loans must be cleared for your family, while existing cover and savings reduce the gap."
      />
      <div className={FIELD_GRID}>
        {AMOUNT_FIELDS.map(({ key, label, placeholder, hint }) => (
          <Field key={key} id={key} label={label} optional error={errorFor(key)} hint={amountHint(form[key]) ?? hint}>
            <TextInput
              id={key}
              money
              prefix="₹"
              value={form[key]}
              onChange={(value) => onChange({ [key]: value })}
              placeholder={placeholder}
              error={errorFor(key)}
            />
          </Field>
        ))}
        <Field
          id="bufferMonths"
          label="Emergency cash buffer"
          optional
          error={errorFor("bufferMonths")}
          hint="Months of expenses to keep ready; we assume a standard buffer if blank"
        >
          <TextInput
            id="bufferMonths"
            value={form.bufferMonths}
            onChange={(bufferMonths) => onChange({ bufferMonths })}
            placeholder="e.g. 6"
            suffix="months"
            error={errorFor("bufferMonths")}
            maxDigits={2}
          />
        </Field>
      </div>
    </>
  );
}
