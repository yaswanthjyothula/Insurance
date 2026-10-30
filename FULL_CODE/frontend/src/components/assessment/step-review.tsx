import { CheckCircle2, FileCheck2 } from "lucide-react";
import { countDependents, MONTHS_PER_YEAR, type FormState } from "@/lib/assessment-form";
import { amountHint, StepHeader } from "./fields";

type Row = [label: string, value: string];
interface Section {
  title: string;
  step: number;
  rows: Row[];
}

const PRIORITY_LABEL: Record<string, string> = {
  balanced: "Balanced",
  lowest_cost: "Lowest cost",
  goal_savings: "Savings for goals",
  growth: "Long-term growth",
};
const capitalise = (word: string): string => (word ? word[0].toUpperCase() + word.slice(1) : "");
const amount = (text: string, fallback = "None"): string => amountHint(text) ?? fallback;
const total = (...texts: string[]): string => String(texts.reduce((sum, text) => sum + Number(text || 0), 0));

function profileSection(form: FormState): Section {
  const yearly = form.monthlyExpenses ? String(Number(form.monthlyExpenses) * MONTHS_PER_YEAR) : "";
  return {
    title: "Profile",
    step: 0,
    rows: [
      ["Age", form.age ? `${form.age} years` : "—"],
      ["Gender", capitalise(form.gender) || "—"],
      ["Residency", form.residency === "nri" ? "NRI" : form.residency ? "Resident Indian" : "—"],
      ["Annual income", amount(form.income, "—")],
      ["Monthly expenses", amountHint(form.monthlyExpenses, ` (${amountHint(yearly)} a year)`) ?? "—"],
      ["Retirement age", form.retire ? `${form.retire} years` : "Standard (assumed)"],
      ["Tobacco", form.smoker === "yes" ? "Tobacco user" : form.smoker === "no" ? "Non-smoker" : "—"],
    ],
  };
}

function familySection(form: FormState): Section {
  const spouse =
    form.hasSpouse === "yes"
      ? `Age ${form.spouseAge || "?"}, ${form.spouseWorks === "yes" ? `earns ${amount(form.spouseIncome, "?")}` : "not earning"}`
      : form.hasSpouse === "no"
        ? "None"
        : "—";
  return {
    title: "Family",
    step: 1,
    rows: [
      ["Spouse", spouse],
      ["Children", form.childAges.length ? form.childAges.map((age) => `${age || "?"}y`).join(", ") : "None"],
      ["Dependent parents", form.parentAges.length ? form.parentAges.map((age) => `${age || "?"}y`).join(", ") : "None"],
      ["Total dependents", String(countDependents(form))],
    ],
  };
}

function financesSection(form: FormState): Section {
  return {
    title: "Debts, cover & savings",
    step: 2,
    rows: [
      ["Loans", amount(total(form.homeLoan, form.otherLoans))],
      ["Existing life cover (individual + group)", amount(total(form.individualCover, form.groupCover))],
      ["Savings & investments", amount(total(form.liquidSavings, form.marketInvestments))],
      ["Emergency buffer", form.bufferMonths ? `${form.bufferMonths} months` : "Standard (assumed)"],
    ],
  };
}

function goalsSection(form: FormState): Section {
  const goalRows: Row[] = form.goals.map((goal) => [`${goal.name || "Unnamed"} (${goal.years || "?"}y)`, amount(goal.cost, "—")]);
  return {
    title: "Goals & preferences",
    step: 3,
    rows: [
      ...(goalRows.length ? goalRows : [["Goals", "None added"] as Row]),
      ["Risk appetite", capitalise(form.risk) || "—"],
      ["Priority", PRIORITY_LABEL[form.priority] ?? "Balanced"],
      ["Monthly budget", amountHint(form.monthlyBudget, "/month") ?? "No limit"],
      ["Policy term", form.preferredTerm ? `${form.preferredTerm} years` : "No preference"],
    ],
  };
}

export function StepReview({ form, onEdit }: { form: FormState; onEdit: (step: number) => void }) {
  const sections = [profileSection(form), familySection(form), financesSection(form), goalsSection(form)];
  return (
    <>
      <StepHeader
        icon={FileCheck2}
        step={5}
        title="Review your answers"
        description="Check everything below. Use Edit to change a section, then calculate your coverage."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {sections.map((section) => (
          <div key={section.title} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D9D3E8]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-[#7957FF]">{section.title}</span>
              <button
                type="button"
                onClick={() => onEdit(section.step)}
                aria-label={`Edit ${section.title}`}
                className="text-sm text-[#7957FF] font-bold hover:underline"
              >
                Edit
              </button>
            </div>
            <dl className="m-0 text-[15px]">
              {section.rows.map(([label, value], index) => (
                <div key={`${label}-${index}`} className="flex justify-between gap-4 py-2 border-b border-[#D9D3E8] last:border-0">
                  <dt className="text-[#5A5566]">{label}</dt>
                  <dd className="m-0 font-bold text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] text-[15px] flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#7957FF] shrink-0 mt-0.5" />
        <span>
          We calculate both <strong>Net Needs</strong> and <strong>Human Life Value</strong> using the insurer&apos;s reference inflation
          and return assumptions, which are listed with your results.
        </span>
      </div>
    </>
  );
}
