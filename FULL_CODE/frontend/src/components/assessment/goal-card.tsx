import { Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { GOAL_TYPES, type GoalForm } from "@/lib/assessment-form";
import { amountHint, Field, SelectInput, TextInput } from "./fields";

interface GoalCardProps {
  index: number;
  goal: GoalForm;
  errorFor: (key: string) => string | undefined;
  onChange: (patch: Partial<GoalForm>) => void;
  onRemove: () => void;
}

export function GoalCard({ index, goal, errorFor, onChange, onRemove }: GoalCardProps) {
  const { t } = useI18n();
  const id = (field: string) => `goals-${index}-${field}`;
  const error = (field: string) => errorFor(`goals.${index}.${field}`);
  return (
    <div className="p-5 rounded-2xl border border-[#D9D3E8] bg-[#FAFAFE] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7957FF]">
          {t("assessment.goal.number", { number: index + 1 })}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("assessment.goal.removeAria", { number: index + 1 })}
          className="text-xs text-[#C23B3B] hover:underline font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t("assessment.goal.remove")}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-9 gap-y-6">
        <Field id={id("type")} label={t("assessment.goal.typeLabel")} error={error("type")}>
          <SelectInput
            id={id("type")}
            value={goal.type}
            onChange={(type) => onChange({ type })}
            placeholder={t("assessment.goal.typePlaceholder")}
            options={GOAL_TYPES.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
            error={error("type")}
          />
        </Field>
        <Field id={id("name")} label={t("assessment.goal.nameLabel")} error={error("name")}>
          <input
            id={id("name")}
            type="text"
            value={goal.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={t("assessment.goal.namePlaceholder")}
            aria-invalid={Boolean(error("name"))}
            aria-describedby={`${id("name")}-err`}
            className={`w-full h-[60px] rounded-[10px] border px-4 bg-[#FFFFFF] text-[18px] font-semibold text-[#24212B] placeholder:text-[#A59FB5] placeholder:font-medium focus:outline-none ${error("name") ? "border-[#C23B3B]" : "border-[#D9D3E8] focus:border-[#7957FF]"}`}
          />
        </Field>
        <Field id={id("cost")} label={t("assessment.goal.costLabel")} error={error("cost")} hint={amountHint(goal.cost)}>
          <TextInput
            id={id("cost")}
            money
            prefix="₹"
            value={goal.cost}
            onChange={(cost) => onChange({ cost })}
            placeholder={t("assessment.goal.costPlaceholder")}
            error={error("cost")}
          />
        </Field>
        <Field id={id("years")} label={t("assessment.goal.yearsLabel")} error={error("years")}>
          <TextInput
            id={id("years")}
            value={goal.years}
            onChange={(years) => onChange({ years })}
            placeholder={t("assessment.goal.yearsPlaceholder")}
            suffix={t("assessment.unit.years")}
            error={error("years")}
            maxDigits={2}
          />
        </Field>
      </div>
    </div>
  );
}
