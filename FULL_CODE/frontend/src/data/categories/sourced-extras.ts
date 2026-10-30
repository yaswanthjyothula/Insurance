import type { CategoryKey, CategoryPlan, SourcedNote } from "./types";

/** Plans and rules for each category, filled from researched sources. */
export interface Extra {
  plans: CategoryPlan[];
  rules: SourcedNote[];
  asOf?: string;
  plansIntro: string;
}

const pending = (what: string): Extra => ({ plans: [], rules: [], plansIntro: `${what}` });

export const extra: Record<CategoryKey, Extra> = {
  term: { plans: [], rules: [], plansIntro: "" },
  life: pending("Real traditional life plans."),
  health: pending("Real health plans."),
  general: pending("Real general insurance products."),
  "investment-linked": pending("Real ULIPs."),
  business: pending("Real business covers."),
  other: pending("Real cyber and personal accident covers."),
};
