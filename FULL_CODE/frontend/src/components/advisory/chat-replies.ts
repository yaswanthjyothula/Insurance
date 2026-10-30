import type { SavedPlan } from "@/lib/my-plan";

const FALLBACK_REPLY =
  "This is a demo chat with pre-written answers, so I can't answer that one. In a real session your advisor would. Try asking about riders, tax or claims.";

function riderReply(plan: SavedPlan | null): string {
  const riders = plan ? [...new Set(plan.items.flatMap((item) => item.rider_names))] : [];
  const offered = riders.length ? ` You've added: ${riders.slice(0, 3).join(", ")}.` : "";
  return `A critical illness rider pays a lump sum on diagnosis of a listed illness, separate from hospital bills.${offered} Whether it's worth the extra premium depends on your health cover and savings. In a real session we'd look at both.`;
}

const TAX_REPLY =
  "Term premiums may qualify for a deduction under Section 80C, and a death benefit is generally tax-free under Section 10(10D), subject to conditions and current law. Please confirm the details with a tax professional.";

const CLAIMS_REPLY =
  "Claims are usually settled when the policy is in force and your disclosures were accurate. Under Section 45 of the Insurance Act, after three years an insurer generally can't reject a claim for a non-fraudulent misstatement. Full, honest disclosure at purchase is the best protection.";

function premiumReply(plan: SavedPlan | null, formatMoney: (value: number) => string): string {
  if (!plan || plan.items.length === 0)
    return "Once you choose a plan we can talk through the premium. Exact prices always come from the insurer's quote.";
  return `Your plans add up to about ${formatMoney(plan.total_monthly)} a month for ${formatMoney(plan.total_cover)} of cover. That is an estimate, and the insurer's own quote will be the exact price.`;
}

/** Keyword-matched canned answers: the chat is a demo and never pretends otherwise. */
export function demoReply(question: string, plan: SavedPlan | null, formatMoney: (value: number) => string): string {
  const text = question.toLowerCase();
  if (/rider|critical|illness|accident/.test(text)) return riderReply(plan);
  if (/tax|80c|10\(10d\)|deduct/.test(text)) return TAX_REPLY;
  if (/claim|reject|repud/.test(text)) return CLAIMS_REPLY;
  if (/premium|price|cost|afford/.test(text)) return premiumReply(plan, formatMoney);
  if (/smok|tobacco/.test(text))
    return "Smokers pay higher premiums, and answering that question accurately matters for claims. Some insurers re-rate you after you've been tobacco-free for a period.";
  return FALLBACK_REPLY;
}
