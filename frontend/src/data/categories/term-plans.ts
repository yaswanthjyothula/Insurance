import catalogue from "@/data/term_catalogue.json";
import type { CategoryPlan } from "./types";

type Raw = (typeof catalogue)["plans"][number];
const insurers = catalogue.insurers as Record<string, { name: string; claim_settlement_ratio: { value: number | null; basis: string | null; fy?: string | null; source_url: string | null }; solvency_ratio: { value: number | null; basis: string | null; source_url: string | null } }>;

const lakh = (n: number) => (n >= 10000000 ? `₹${(n / 10000000).toFixed(2).replace(/\.00$/, "")} Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(2).replace(/\.00$/, "")} L` : `₹${n.toLocaleString("en-IN")}`);

function toPlan(p: Raw): CategoryPlan {
  const ins = insurers[p.insurer_key];
  const claim = ins.claim_settlement_ratio, solv = ins.solvency_ratio;
  const raw = p as unknown as { min_sum_assured: number | null; max_sum_assured: number | null; min_entry_age: number | null; max_entry_age: number | null; max_maturity_age: number | null; min_term_years: number | null };
  const cover = raw.min_sum_assured ? `${lakh(raw.min_sum_assured)} to ${raw.max_sum_assured ? lakh(raw.max_sum_assured) : "no upper limit"}` : "Not confirmed";
  return {
    id: p.id,
    name: p.name,
    insurer: ins.name,
    uin: p.uin,
    summary: p.tagline,
    status: p.status === "sourced" ? "sourced" : "partially_sourced",
    facts: [
      { label: "Entry age", value: raw.min_entry_age != null && raw.max_entry_age != null ? `${raw.min_entry_age} to ${raw.max_entry_age} years` : "Not confirmed" },
      { label: "Cover", value: cover },
      { label: "Cover can run to", value: raw.max_maturity_age ? `Age ${raw.max_maturity_age}` : "Not confirmed" },
      { label: "Payout options", value: p.death_benefit_options.slice(0, 2).join(", ") || "Not confirmed" },
      { label: "Riders", value: p.riders.length ? `${p.riders.length} available` : "None offered" },
    ],
    stats: [
      { label: "Claims paid", value: claim.value != null ? `${claim.value}%` : "Not confirmed", note: [claim.basis, claim.fy].filter(Boolean).join(", "), source_url: claim.source_url },
      { label: "Solvency ratio", value: solv.value != null ? `${solv.value}x` : "Not confirmed", note: solv.basis ?? undefined, source_url: solv.source_url },
    ],
    highlights: p.key_features.slice(0, 3),
    limits: [...p.exclusions.slice(0, 1), ...p.notes.slice(0, 1)],
    plan_url: p.product_page_url,
    brochure_url: p.brochure_url,
    sources: p.sources,
    unconfirmed: p.unconfirmed_fields,
  };
}

export const termPlans: CategoryPlan[] = catalogue.plans.map(toPlan);
export const termAsOf = catalogue.as_of;
