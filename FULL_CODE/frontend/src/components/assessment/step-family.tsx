import { Users } from "lucide-react";
import { MAX_CHILDREN, MAX_PARENTS, resizeAgeList } from "@/lib/assessment-form";
import { AgeList } from "./age-list";
import { amountHint, ChoiceGroup, Field, FIELD_GRID, StepHeader, TextInput, type StepProps } from "./fields";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

function SpouseFields({ form, errorFor, onChange }: StepProps) {
  const spouseWorks = form.spouseWorks === "yes";
  return (
    <>
      <Field id="spouseAge" label="Spouse age" error={errorFor("spouseAge")}>
        <TextInput
          id="spouseAge"
          value={form.spouseAge}
          onChange={(spouseAge) => onChange({ spouseAge })}
          placeholder="e.g. 30"
          suffix="years"
          error={errorFor("spouseAge")}
          maxDigits={3}
        />
      </Field>
      <Field id="spouseWorks" label="Does your spouse earn?" group error={errorFor("spouseWorks")}>
        <ChoiceGroup
          id="spouseWorks"
          value={form.spouseWorks}
          onChange={(value) => onChange({ spouseWorks: value, spouseIncome: value === "no" ? "" : form.spouseIncome })}
          error={errorFor("spouseWorks")}
          options={[...YES_NO]}
        />
      </Field>
      {spouseWorks && (
        <Field
          id="spouseIncome"
          label="Spouse annual income"
          error={errorFor("spouseIncome")}
          hint={amountHint(form.spouseIncome, " per year")}
        >
          <TextInput
            id="spouseIncome"
            money
            prefix="₹"
            value={form.spouseIncome}
            onChange={(spouseIncome) => onChange({ spouseIncome })}
            placeholder="e.g. 6,00,000"
            error={errorFor("spouseIncome")}
          />
        </Field>
      )}
    </>
  );
}

export function StepFamily(props: StepProps) {
  const { form, errorFor, onChange } = props;
  return (
    <>
      <StepHeader
        icon={Users}
        step={2}
        title="Family & dependents"
        description="Each dependent's age decides how long they would need support, so we ask about them one by one."
      />
      <div className={FIELD_GRID}>
        <Field id="hasSpouse" label="Spouse" group error={errorFor("hasSpouse")}>
          <ChoiceGroup
            id="hasSpouse"
            value={form.hasSpouse}
            onChange={(value) =>
              onChange(value === "no" ? { hasSpouse: value, spouseAge: "", spouseWorks: "", spouseIncome: "" } : { hasSpouse: value })
            }
            error={errorFor("hasSpouse")}
            options={[
              { value: "yes", label: "I have a spouse" },
              { value: "no", label: "No spouse" },
            ]}
          />
        </Field>
        {form.hasSpouse === "yes" && <SpouseFields {...props} />}
      </div>
      <div className={FIELD_GRID}>
        <Field
          id="childrenCount"
          label="Number of children"
          error={errorFor("childrenCount")}
          hint={`Enter 0 if none (up to ${MAX_CHILDREN})`}
        >
          <TextInput
            id="childrenCount"
            value={form.childrenCount}
            onChange={(childrenCount) => onChange({ childrenCount, childAges: resizeAgeList(form.childAges, childrenCount, MAX_CHILDREN) })}
            placeholder="e.g. 2"
            error={errorFor("childrenCount")}
            maxDigits={1}
          />
        </Field>
        <Field
          id="parentsCount"
          label="Dependent parents"
          error={errorFor("parentsCount")}
          hint={`Parents who rely on your income. Enter 0 if none (up to ${MAX_PARENTS})`}
        >
          <TextInput
            id="parentsCount"
            value={form.parentsCount}
            onChange={(parentsCount) => onChange({ parentsCount, parentAges: resizeAgeList(form.parentAges, parentsCount, MAX_PARENTS) })}
            placeholder="e.g. 1"
            error={errorFor("parentsCount")}
            maxDigits={1}
          />
        </Field>
        <AgeList
          name="childAges"
          ages={form.childAges}
          noun="Child"
          onChange={(childAges) => onChange({ childAges })}
          errorFor={errorFor}
        />
        <AgeList
          name="parentAges"
          ages={form.parentAges}
          noun="Parent"
          onChange={(parentAges) => onChange({ parentAges })}
          errorFor={errorFor}
        />
      </div>
    </>
  );
}
