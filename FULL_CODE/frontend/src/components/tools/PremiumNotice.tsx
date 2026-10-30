import type { IndicativePremium } from "@/hooks/useIndicativePremium";
import { Verdict } from "@/components/tools/kit";

/** Says why there is no premium to show: the lookup failed, or the rate table does not offer cover at this age. */
export function PremiumNotice({ premium }: { premium: IndicativePremium }) {
  if (premium.error) return <Verdict tone="bad">{premium.error}</Verdict>;
  if (!premium.loading && premium.annualPremium === null) {
    return (
      <Verdict tone="warn">
        Saffron Life does not offer this level term cover at the age and amount chosen. Try a lower age or cover amount.
      </Verdict>
    );
  }
  return null;
}

export const PREMIUM_ASSUMPTION =
  "Premiums are indicative, read from the Saffron Life (a fictional insurer, with synthetic data) level-term rate table for a 30-year term. Real quotes from a real insurer will differ.";
