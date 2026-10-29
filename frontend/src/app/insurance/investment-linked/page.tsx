import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "Investment-Linked Insurance (ULIP) Guide | LifeSure AI",
  description: "Unit Linked Insurance Plans (ULIPs). Portfolio asset allocation, mortality charges, and Section 10(10D) tax considerations."
};

export default function InvestmentLinkedInsurancePage() {
  const products = [
    {
      id: "ulip-sbi-retire-smart",
      name: "SBI Life Retire Smart ULIP",
      insurer: "SBI Life Insurance",
      category: "investment_linked",
      tagline: "Market-linked equity and debt portfolio growth with built-in life cover",
      min_entry_age: 18,
      max_entry_age: 60,
      min_annual_income: 300000,
      min_sum_assured: 1000000,
      max_sum_assured: 20000000,
      claim_settlement_ratio: 97.5,
      solvency_ratio: 2.09,
      base_rate_per_lakh: 320,
      key_features: [
        "Guaranteed additions added at regular intervals to boost corpus",
        "Advantage Plan automated asset allocation between equity & debt",
        "Tax-free capital gains under Section 10(10D) subject to statutory limits"
      ],
      riders_available: ["Accidental Total Disability Benefit"],
      exclusions: ["Market investment risks borne by policyholder", "Suicide within 12 months"],
      source_provenance: "SBI Life Public Catalog",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="investment_linked"
      categoryTitle="Investment-Linked Insurance (ULIP)"
      tagline="Combining market-linked wealth generation in equity and debt funds with built-in life protection."
      purpose="Unit Linked Insurance Plans (ULIPs) allocate a portion of your premium toward life cover and invest the balance into professionally managed equity, debt, or hybrid funds. They offer fund switching flexibility, tax exemptions under Section 10(10D) (up to ₹2.5L annual premium limits), and loyalty additions."
      whoShouldConsider={[
        "Disciplined investors seeking market exposure combined with built-in life insurance protection",
        "Individuals looking for tax-free fund switching between equity and debt without capital gains liability",
        "Long-term planners with a 10-15+ year wealth horizon willing to ride out market cycles"
      ]}
      keyBenefits={[
        "Zero-tax fund switches between large-cap equity, mid-cap, and corporate bond funds",
        "Guaranteed loyalty units credited by insurers to reward policy persistence",
        "Return of Mortality Charges (ROMC) feature in modern 4th-generation ULIPs",
        "Tax-exempt maturity proceeds under Section 10(10D) (for annual premiums up to ₹2.5 Lakhs)"
      ]}
      exclusions={[
        "Mandatory 5-year lock-in period; funds cannot be withdrawn during the first 5 years",
        "Investment risk is borne by the policyholder; returns are market-linked and not guaranteed",
        "Premiums above ₹2.5 Lakhs annually are subject to long-term capital gains tax under current Finance Acts"
      ]}
      pricingFactors={[
        "Fund Management Charges (capped by IRDAI at 1.35% p.a.)",
        "Mortality Charges: Deducted monthly depending on your age and the net sum-at-risk",
        "Policy Administration and Premium Allocation Fees (zero in top-tier direct online plans)"
      ]}
      questionsToAsk={[
        "Does this plan feature full Return of Mortality Charges (ROMC) upon maturity?",
        "Are there any allocation or policy administration charges deducted from my deposits?",
        "What has been the 5-year and 10-year rolling performance of the equity growth fund benchmark?"
      ]}
      products={products}
    />
  );
}
