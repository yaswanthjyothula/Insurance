// Per-tool guide shown on every tool page: what it is for, how it works, what it assumes, where it stops.
export type ToolGuide = {
  slug: string;
  name: string;
  eyebrow: string;
  intro: string;
  why: string;
  how: string[];
  assumes: string[];
  limits: string[];
  next: string[]; // what could be added next
};

export const TOOL_GUIDES: Record<string, ToolGuide> = {
  "life-cover-calculator": {
    slug: "life-cover-calculator", name: "Life Cover Calculator", eyebrow: "Term life",
    intro: "Work out how much life cover your family would need, and see plans that fit.",
    why: "Most people pick a round number. This sizes cover to what your family must pay for, and for how long.",
    how: ["Enter income, expenses, dependents, loans, savings and existing cover", "It adds the income your family needs, loans and future goals", "It subtracts savings and existing cover to give the gap", "It then matches real term plans to that gap"],
    assumes: ["Inflation and discount rates are inputs you can change", "Premium shown is an indicative estimate, not an insurer quote"],
    limits: ["It does not know your health, so real premiums differ", "It covers life cover only, not health or critical illness"],
    next: ["Save and compare several what-if cases", "Add a spouse's income", "Export the result as a PDF for an advisor"],
  },
  "scenario-studio": {
    slug: "scenario-studio", name: "Scenario Studio", eyebrow: "What-if",
    intro: "See how a life event changes the cover your family needs.",
    why: "Needs change when you have a child, buy a home or change jobs. Test the change before it happens.",
    how: ["Pick a life event", "The tool reruns your needs with that change", "It shows before and after, side by side"],
    assumes: ["Each event uses fixed, stated changes to your inputs"],
    limits: ["Events are preset, you cannot combine several yet"],
    next: ["Combine two events", "Custom events with your own numbers", "Share a scenario link"],
  },
  "family-survival-simulator": {
    slug: "family-survival-simulator", name: "Family Survival Simulator", eyebrow: "Cash runway",
    intro: "See how long your family's money lasts if your income stopped.",
    why: "It turns an abstract cover amount into years of runway, which is easier to judge.",
    how: ["Enter savings, existing cover, extra cover, living costs and debt", "Each year costs rise with inflation and the corpus earns a yield", "It shows when the money runs out, with and without extra cover"],
    assumes: ["Inflation and yield are constant every year", "Debt payments stop after the years you enter"],
    limits: ["No tax, no change in expenses when children grow up", "A real portfolio does not earn a smooth yield"],
    next: ["Year-by-year chart", "Spouse income starting later", "Stress test with a bad-return year"],
  },
  "policy-xray": {
    slug: "policy-xray", name: "Policy X-Ray", eyebrow: "Read your policy",
    intro: "Paste your policy text and see the key terms pulled out in plain language.",
    why: "Policy documents are long. The clauses that decide a claim are easy to miss.",
    how: ["Paste text from your policy schedule or wording", "The tool looks for amounts, terms, waiting periods and exclusions", "Anything it cannot find is marked as not found, never guessed"],
    assumes: ["The text you paste is complete and accurate"],
    limits: ["It reads text, not scanned images", "It finds what is written, it does not judge legal meaning"],
    next: ["Upload a PDF", "Flag clauses that differ from standard wording", "Compare two policies"],
  },
  "affordability-calculator": {
    slug: "affordability-calculator", name: "Premium Affordability", eyebrow: "Budget",
    intro: "Check whether a term plan fits your monthly budget.",
    why: "A policy that lapses because it was unaffordable protects no one.",
    how: ["Enter income, cover and age", "It estimates the premium from published price points", "It shows the premium as a share of your income"],
    assumes: ["Estimate calibrated to ICICI's published premiums for a non-smoker male", "The budget bands are a planning guideline, not a rule"],
    limits: ["Real premium depends on health, job and insurer"],
    next: ["Compare premium by insurer", "Add riders to the cost", "Include health insurance in the budget"],
  },
  "emi-calculator": {
    slug: "emi-calculator", name: "Loan EMI and Cover", eyebrow: "Loans",
    intro: "Work out your EMI and the cover needed so your family is not left with the loan.",
    why: "A loan is usually the largest debt a family would be left with.",
    how: ["Enter loan amount, rate and tenure", "It computes the EMI and total interest with the standard formula", "It shows what is still owed each year and the cover to match"],
    assumes: ["Fixed interest rate for the whole tenure", "Premium for the cover is an indicative estimate"],
    limits: ["Floating-rate changes and prepayments are not modelled"],
    next: ["Prepayment impact", "Step-up EMI", "Joint-loan split between two earners"],
  },
  "policy-replacement": {
    slug: "policy-replacement", name: "Policy Replacement Check", eyebrow: "Switch or keep",
    intro: "Compare keeping an old savings policy with switching to a term plan and investing the rest.",
    why: "Switching can cost you. It helps to see both sides before you decide.",
    how: ["Enter your old policy, its surrender value and your age", "It prices a term plan for the cover you want", "It projects the money you would invest at a return you choose"],
    assumes: ["The return is your assumption, not a promise"],
    limits: ["It does not model the old policy's maturity bonus or tax", "Surrender value must come from your insurer"],
    next: ["Enter the insurer's maturity figures", "Tax effects", "Paid-up option"],
  },
  "premium-shock": {
    slug: "premium-shock", name: "Cost Inflation Projector", eyebrow: "Future costs",
    intro: "See how living costs and your health premium may grow over time.",
    why: "Costs rise a little each year, and the total is larger than most people expect.",
    how: ["Enter current monthly costs and your health premium", "Set a rate of increase for each", "It projects both over the years you choose"],
    assumes: ["Rates are your inputs. Defaults are illustrative, not forecasts"],
    limits: ["Real health premium changes depend on age bands and claims"],
    next: ["Use your own past premium history", "Add income growth", "Compare against a cover increase"],
  },
  "future-costs": {
    slug: "future-costs", name: "Future Goal Cost", eyebrow: "Goals",
    intro: "Find what a goal will cost later, and what to save each month to reach it.",
    why: "A cost in today's rupees is not the cost you will pay.",
    how: ["Enter the cost today, years away and an inflation rate", "It compounds the cost forward", "It works out the monthly saving at a return you choose"],
    assumes: ["Inflation and return are constant"],
    limits: ["Education costs vary a lot by course and country"],
    next: ["Several goals together", "Link goals to cover need", "Currency change for study abroad"],
  },
  "protection-gap": {
    slug: "protection-gap", name: "Protection Gap Radar", eyebrow: "Gaps",
    intro: "See which parts of your family's protection are covered and which are not.",
    why: "One total hides where the weak spot is. Four parts make it visible.",
    how: ["Enter what each need would cost, in rupees", "Enter what you have set aside for each", "Each need shows a coverage percentage on a radar"],
    assumes: ["Your figures are honest estimates"],
    limits: ["Existing cover is shared across needs by order of priority you set"],
    next: ["Auto-fill from the cover calculator", "Track gaps over time", "Action plan per gap"],
  },
  "scam-shield": {
    slug: "scam-shield", name: "Scam Shield", eyebrow: "Stay safe",
    intro: "Check a call or message against common insurance fraud signs.",
    why: "Insurance fraud calls target people with real policies.",
    how: ["Tick what happened", "It rates the risk and says what to do", "It lists where to report"],
    assumes: ["The list covers common signs, not every scam"],
    limits: ["A clean result does not prove a call is genuine"],
    next: ["Paste a message to check", "Check an agent's licence", "Report directly from the page"],
  },
  "application-readiness": {
    slug: "application-readiness", name: "Application Readiness", eyebrow: "Before you apply",
    intro: "Get your documents and answers ready before you fill in a proposal form.",
    why: "Rushed forms lead to mistakes, and mistakes can hurt a claim later.",
    how: ["Work through the checklist", "Your ticks are saved on this device", "Come back any time"],
    assumes: ["Insurers differ in what they ask for. Yours may add to this list"],
    limits: ["It is a checklist, it does not submit anything"],
    next: ["Per-insurer document lists", "Upload and store documents securely", "Share the checklist with a family member"],
  },
};
