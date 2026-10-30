import { Plus, Target } from "lucide-react";
import { BLANK_GOAL, MAX_GOALS, type GoalForm } from "@/lib/assessment-form";
import { StepHeader, type StepProps } from "./fields";
import { GoalCard } from "./goal-card";
import { PreferenceFields } from "./preferences";

export function StepGoals(props: StepProps) {
  const { form, errorFor, onChange } = props;
  const updateGoal = (index: number, patch: Partial<GoalForm>) =>
    onChange({ goals: form.goals.map((goal, i) => (i === index ? { ...goal, ...patch } : goal)) });
  const removeGoal = (index: number) => onChange({ goals: form.goals.filter((_, i) => i !== index) });

  return (
    <>
      <StepHeader
        icon={Target}
        step={4}
        title="Goals & preferences"
        description="Lump sums your family would still need, plus what you want from a plan."
      />
      <div className="flex flex-col gap-6">
        {form.goals.map((goal, index) => (
          <GoalCard
            key={index}
            index={index}
            goal={goal}
            errorFor={errorFor}
            onChange={(patch) => updateGoal(index, patch)}
            onRemove={() => removeGoal(index)}
          />
        ))}
        {form.goals.length < MAX_GOALS && (
          <button
            type="button"
            onClick={() => onChange({ goals: [...form.goals, { ...BLANK_GOAL }] })}
            className="inline-flex self-start items-center gap-2 px-5 py-2.5 rounded-xl border border-[#7957FF] text-[#7957FF] text-xs font-bold hover:bg-[#F4F0FF] transition-colors"
          >
            <Plus className="w-4 h-4" /> {form.goals.length ? "Add another goal" : "Add a goal (optional)"}
          </button>
        )}
      </div>
      <PreferenceFields {...props} />
    </>
  );
}
