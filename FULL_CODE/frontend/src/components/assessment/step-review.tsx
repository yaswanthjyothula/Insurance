import { CheckCircle2, FileCheck2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/en";
import type { Params } from "@/i18n/translate";
import { countDependents, MONTHS_PER_YEAR, type FormState } from "@/lib/assessment-form";
import { amountHint, StepHeader } from "./fields";
import { PRIORITY_OPTIONS } from "./preferences";

type Translate = (key: MessageKey, params?: Params) => string;
type Row = [label: string, value: string];
interface Section {
  title: string;
  step: number;
  rows: Row[];
}

const GENDER_KEYS: Record<string, MessageKey> = { male: "assessment.profile.male", female: "assessment.profile.female" };
const RISK_KEYS: Record<string, MessageKey> = {
  low: "assessment.preferences.riskLow",
  medium: "assessment.preferences.riskMedium",
  high: "assessment.preferences.riskHigh",
};
const total = (...texts: string[]): string => String(texts.reduce((sum, text) => sum + Number(text || 0), 0));

function profileSection(form: FormState, t: Translate): Section {
  const dash = "—";
  const amount = (text: string, fallback = dash): string => amountHint(text) ?? fallback;
  const yearly = form.monthlyExpenses ? String(Number(form.monthlyExpenses) * MONTHS_PER_YEAR) : "";
  const monthly = amountHint(form.monthlyExpenses);
  return {
    title: t("assessment.steps.profile"),
    step: 0,
    rows: [
      [t("assessment.review.age"), form.age ? t("assessment.review.yearsValue", { count: form.age }) : dash],
      [t("assessment.review.gender"), GENDER_KEYS[form.gender] ? t(GENDER_KEYS[form.gender]) : dash],
      [
        t("assessment.review.residency"),
        form.residency === "nri" ? t("assessment.profile.nri") : form.residency ? t("assessment.profile.residentIndian") : dash,
      ],
      [t("assessment.review.income"), amount(form.income)],
      [
        t("assessment.review.expenses"),
        monthly ? t("assessment.review.expensesValue", { amount: monthly, yearly: amountHint(yearly) ?? "" }) : dash,
      ],
      [
        t("assessment.review.retire"),
        form.retire ? t("assessment.review.yearsValue", { count: form.retire }) : t("assessment.review.standardAssumed"),
      ],
      [
        t("assessment.review.tobacco"),
        form.smoker === "yes" ? t("assessment.review.tobaccoUser") : form.smoker === "no" ? t("assessment.review.nonSmoker") : dash,
      ],
    ],
  };
}

function familySection(form: FormState, t: Translate): Section {
  const none = t("assessment.review.none");
  const amount = (text: string, fallback: string): string => amountHint(text) ?? fallback;
  const ages = (list: string[]): string =>
    list.length ? list.map((age) => t("assessment.review.ageShort", { age: age || "?" })).join(", ") : none;
  const spouse =
    form.hasSpouse === "yes"
      ? form.spouseWorks === "yes"
        ? t("assessment.review.spouseEarns", { age: form.spouseAge || "?", amount: amount(form.spouseIncome, "?") })
        : t("assessment.review.spouseNotEarning", { age: form.spouseAge || "?" })
      : form.hasSpouse === "no"
        ? none
        : "—";
  return {
    title: t("assessment.steps.family"),
    step: 1,
    rows: [
      [t("assessment.review.spouse"), spouse],
      [t("assessment.review.children"), ages(form.childAges)],
      [t("assessment.review.parents"), ages(form.parentAges)],
      [t("assessment.review.totalDependents"), String(countDependents(form))],
    ],
  };
}

function financesSection(form: FormState, t: Translate): Section {
  const none = t("assessment.review.none");
  return {
    title: t("assessment.review.financesTitle"),
    step: 2,
    rows: [
      [t("assessment.review.loans"), amountHint(total(form.homeLoan, form.otherLoans)) ?? none],
      [t("assessment.review.existingCover"), amountHint(total(form.individualCover, form.groupCover)) ?? none],
      [t("assessment.review.savings"), amountHint(total(form.liquidSavings, form.marketInvestments)) ?? none],
      [
        t("assessment.review.buffer"),
        form.bufferMonths ? t("assessment.review.monthsValue", { count: form.bufferMonths }) : t("assessment.review.standardAssumed"),
      ],
    ],
  };
}

function goalsSection(form: FormState, t: Translate): Section {
  const goalRows: Row[] = form.goals.map((goal) => [
    t("assessment.review.goalLabel", { name: goal.name || t("assessment.review.unnamed"), years: goal.years || "?" }),
    amountHint(goal.cost) ?? "—",
  ]);
  const priority = PRIORITY_OPTIONS.find((option) => option.value === form.priority)?.labelKey ?? "assessment.preferences.priorityBalanced";
  const budget = amountHint(form.monthlyBudget, t("assessment.amount.perMonthShort"));
  return {
    title: t("assessment.goals.title"),
    step: 3,
    rows: [
      ...(goalRows.length ? goalRows : [[t("assessment.review.goals"), t("assessment.review.noneAdded")] as Row]),
      [t("assessment.review.risk"), RISK_KEYS[form.risk] ? t(RISK_KEYS[form.risk]) : "—"],
      [t("assessment.review.priority"), t(priority)],
      [t("assessment.review.budget"), budget ?? t("assessment.review.noLimit")],
      [
        t("assessment.review.term"),
        form.preferredTerm ? t("assessment.review.yearsValue", { count: form.preferredTerm }) : t("assessment.review.noPreference"),
      ],
    ],
  };
}

export function StepReview({ form, onEdit }: { form: FormState; onEdit: (step: number) => void }) {
  const { t } = useI18n();
  const sections = [profileSection(form, t), familySection(form, t), financesSection(form, t), goalsSection(form, t)];
  return (
    <>
      <StepHeader icon={FileCheck2} step={5} title={t("assessment.review.title")} description={t("assessment.review.description")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {sections.map((section) => (
          <div key={section.step} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D9D3E8]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-[#7957FF]">{section.title}</span>
              <button
                type="button"
                onClick={() => onEdit(section.step)}
                aria-label={t("assessment.review.editAria", { section: section.title })}
                className="text-sm text-[#7957FF] font-bold hover:underline"
              >
                {t("common.edit")}
              </button>
            </div>
            <dl className="m-0 text-[15px]">
              {section.rows.map(([label, value], index) => (
                <div key={`${label}-${index}`} className="flex justify-between gap-4 py-2 border-b border-[#D9D3E8] last:border-0">
                  <dt className="text-[#5A5566]">{label}</dt>
                  <dd className="m-0 font-bold text-end">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-[#E9E4FF] border border-[#D9D3E8] text-[15px] flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#7957FF] shrink-0 mt-0.5" />
        <span>
          {t("assessment.review.method", { needs: "{needs}", hlv: "{hlv}" })
            .split(/(\{needs\}|\{hlv\})/)
            .map((part, index) =>
              part === "{needs}" ? (
                <strong key={index}>{t("assessment.review.methodNeeds")}</strong>
              ) : part === "{hlv}" ? (
                <strong key={index}>{t("assessment.review.methodHlv")}</strong>
              ) : (
                part
              ),
            )}
        </span>
      </div>
    </>
  );
}
