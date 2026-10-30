import { Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { MAX_CHILDREN, MAX_PARENTS, resizeAgeList } from "@/lib/assessment-form";
import { AgeList } from "./age-list";
import { amountHint, ChoiceGroup, Field, FIELD_GRID, StepHeader, TextInput, type StepProps } from "./fields";

function SpouseFields({ form, errorFor, onChange }: StepProps) {
  const { t } = useI18n();
  const spouseWorks = form.spouseWorks === "yes";
  return (
    <>
      <Field id="spouseAge" label={t("assessment.family.spouseAgeLabel")} error={errorFor("spouseAge")}>
        <TextInput
          id="spouseAge"
          value={form.spouseAge}
          onChange={(spouseAge) => onChange({ spouseAge })}
          placeholder={t("assessment.family.spouseAgePlaceholder")}
          suffix={t("assessment.unit.years")}
          error={errorFor("spouseAge")}
          maxDigits={3}
        />
      </Field>
      <Field id="spouseWorks" label={t("assessment.family.spouseWorksLabel")} group error={errorFor("spouseWorks")}>
        <ChoiceGroup
          id="spouseWorks"
          value={form.spouseWorks}
          onChange={(value) => onChange({ spouseWorks: value, spouseIncome: value === "no" ? "" : form.spouseIncome })}
          error={errorFor("spouseWorks")}
          options={[
            { value: "yes", label: t("common.yes") },
            { value: "no", label: t("common.no") },
          ]}
        />
      </Field>
      {spouseWorks && (
        <Field
          id="spouseIncome"
          label={t("assessment.family.spouseIncomeLabel")}
          error={errorFor("spouseIncome")}
          hint={amountHint(form.spouseIncome, t("assessment.amount.perYear"))}
        >
          <TextInput
            id="spouseIncome"
            money
            prefix="₹"
            value={form.spouseIncome}
            onChange={(spouseIncome) => onChange({ spouseIncome })}
            placeholder={t("assessment.family.spouseIncomePlaceholder")}
            error={errorFor("spouseIncome")}
          />
        </Field>
      )}
    </>
  );
}

export function StepFamily(props: StepProps) {
  const { form, errorFor, onChange } = props;
  const { t } = useI18n();
  return (
    <>
      <StepHeader icon={Users} step={2} title={t("assessment.family.title")} description={t("assessment.family.description")} />
      <div className={FIELD_GRID}>
        <Field id="hasSpouse" label={t("assessment.family.spouseLabel")} group error={errorFor("hasSpouse")}>
          <ChoiceGroup
            id="hasSpouse"
            value={form.hasSpouse}
            onChange={(value) =>
              onChange(value === "no" ? { hasSpouse: value, spouseAge: "", spouseWorks: "", spouseIncome: "" } : { hasSpouse: value })
            }
            error={errorFor("hasSpouse")}
            options={[
              { value: "yes", label: t("assessment.family.hasSpouse") },
              { value: "no", label: t("assessment.family.noSpouse") },
            ]}
          />
        </Field>
        {form.hasSpouse === "yes" && <SpouseFields {...props} />}
      </div>
      <div className={FIELD_GRID}>
        <Field
          id="childrenCount"
          label={t("assessment.family.childrenLabel")}
          error={errorFor("childrenCount")}
          hint={t("assessment.family.childrenHint", { max: MAX_CHILDREN })}
        >
          <TextInput
            id="childrenCount"
            value={form.childrenCount}
            onChange={(childrenCount) => onChange({ childrenCount, childAges: resizeAgeList(form.childAges, childrenCount, MAX_CHILDREN) })}
            placeholder={t("assessment.family.childrenPlaceholder")}
            error={errorFor("childrenCount")}
            maxDigits={1}
          />
        </Field>
        <Field
          id="parentsCount"
          label={t("assessment.family.parentsLabel")}
          error={errorFor("parentsCount")}
          hint={t("assessment.family.parentsHint", { max: MAX_PARENTS })}
        >
          <TextInput
            id="parentsCount"
            value={form.parentsCount}
            onChange={(parentsCount) => onChange({ parentsCount, parentAges: resizeAgeList(form.parentAges, parentsCount, MAX_PARENTS) })}
            placeholder={t("assessment.family.parentsPlaceholder")}
            error={errorFor("parentsCount")}
            maxDigits={1}
          />
        </Field>
        <AgeList
          name="childAges"
          ages={form.childAges}
          noun="child"
          onChange={(childAges) => onChange({ childAges })}
          errorFor={errorFor}
        />
        <AgeList
          name="parentAges"
          ages={form.parentAges}
          noun="parent"
          onChange={(parentAges) => onChange({ parentAges })}
          errorFor={errorFor}
        />
      </div>
    </>
  );
}
