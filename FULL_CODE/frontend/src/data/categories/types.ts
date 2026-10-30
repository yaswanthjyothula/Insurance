export type CategoryKey = "term" | "life" | "health" | "general" | "investment-linked" | "business" | "other";

/** A real plan, copied from the insurer's own documents. Every fact has a source. */
export interface CategoryPlan {
  id: string;
  name: string;
  insurer: string;
  uin?: string | null;
  summary: string;
  status: "sourced" | "partially_sourced";
  facts: { label: string; value: string }[];
  stats?: { label: string; value: string; note?: string; source_url?: string | null }[];
  highlights: string[];
  limits: string[];
  plan_url?: string | null;
  brochure_url?: string | null;
  sources: string[];
  unconfirmed?: string[];
}

export interface SourcedNote {
  text: string;
  source_url?: string;
  as_of?: string;
}

export interface CategoryGuide {
  key: CategoryKey;
  href: string;
  title: string;
  shortTitle: string;
  tag: string;
  tagline: string;
  /** one-line answer to "is this for me?" used on the directory */
  forYou: string;
  purpose: string;
  whoFor: string[];
  benefits: string[];
  limits: string[];
  howToChoose: string[];
  pricingFactors: string[];
  questions: string[];
  mistakes: string[];
  /** rules and tax points, each with an official source where we have one */
  rules: SourcedNote[];
  cta: { title: string; body: string; label: string; href: string };
  plansIntro: string;
  plans: CategoryPlan[];
  asOf?: string;
}
