import React from "react";
import { CategoryPageTemplate } from "@/components/insurance/CategoryPageTemplate";

export const metadata = {
  title: "Term Insurance Guide & Comparison | LifeSure AI",
  description: "Comprehensive guide to pure term life insurance in India. Purpose, exclusions, CSR benchmarks, and verified products."
};

export default function TermInsurancePage() {
  const products = [
    {
      id: "term-hdfc-click2protect",
      name: "Click 2 Protect Super",
      insurer: "HDFC Life Insurance",
      category: "term",
      tagline: "Comprehensive pure protection with accelerated terminal illness payout",
      min_entry_age: 18,
      max_entry_age: 65,
      min_annual_income: 300000,
      min_sum_assured: 5000000,
      max_sum_assured: 200000000,
      claim_settlement_ratio: 99.3,
      solvency_ratio: 2.03,
      base_rate_per_lakh: 115,
      key_features: [
        "Pure protection term life cover",
        "Accelerated terminal illness 100% death payout",
        "Waiver of premium on accidental total permanent disability"
      ],
      riders_available: ["Critical Illness Plus", "Accidental Death Rider"],
      exclusions: ["Suicide within first 12 months from inception", "Participation in criminal acts"],
      source_provenance: "IRDAI Public Disclosures FY 2023-24",
      is_synthetic_demonstration: false
    },
    {
      id: "term-icici-iprotectsmart",
      name: "iProtect Smart Term Plan",
      insurer: "ICICI Prudential Life Insurance",
      category: "term",
      tagline: "Special discounted non-smoker rates with 34 critical illness rider coverage",
      min_entry_age: 18,
      max_entry_age: 65,
      min_annual_income: 350000,
      min_sum_assured: 5000000,
      max_sum_assured: 250000000,
      claim_settlement_ratio: 99.2,
      solvency_ratio: 2.15,
      base_rate_per_lakh: 110,
      key_features: [
        "Special discounted rates for salaried non-smokers",
        "Lump-sum or staggered monthly income payout modes",
        "Whole-life cover options up to 99 years of age"
      ],
      riders_available: ["Accidental Death Benefit", "Comprehensive Critical Illness"],
      exclusions: ["Suicide within 12 months", "Hazardous sports without disclosure"],
      source_provenance: "IRDAI Public Disclosures FY 2023-24",
      is_synthetic_demonstration: false
    }
  ];

  return (
    <CategoryPageTemplate
      categoryKey="term"
      categoryTitle="Term Insurance"
      tagline="Pure, high-coverage life insurance designed to replace your economic earning power and clear long-term family liabilities."
      purpose="Term insurance pays a guaranteed tax-free lump sum to your nominated beneficiaries if you pass away during the policy tenure. It has zero investment or maturity returns, making it the most cost-effective way to secure high coverage (₹1 Crore+) at an affordable annual premium."
      whoShouldConsider={[
        "Primary income earners with financial dependents (spouse, children, elderly parents)",
        "Borrowers with outstanding home loans, personal debt, or education loans",
        "Young professionals seeking to lock in low non-smoker rates early in life",
        "Self-employed individuals needing to guarantee family operating runway"
      ]}
      keyBenefits={[
        "Highest coverage-to-premium ratio in the insurance industry",
        "Tax-free death benefit proceeds under Section 10(10D) of Income Tax Act 1961",
        "Protection under Section 45 of Insurance Act: Incontestable after 3 continuous years",
        "Optional riders for Critical Illness (accelerated lump sum) and Accidental Disability"
      ]}
      exclusions={[
        "Suicide within the first 12 months from policy inception or revival (80% premiums refunded)",
        "Non-disclosure of pre-existing chronic medical conditions or tobacco consumption",
        "Death resulting from active participation in warfare, civil riot, or aviation hobbies without endorsement"
      ]}
      pricingFactors={[
        "Entry Age: Each year of delay increases annual premium by ~4.5% to 6%",
        "Tobacco/Nicotine Consumption: Smokers pay approximately 50-70% higher premiums",
        "Sum Assured Band: Rates per Lakh drop at higher coverage tiers (₹1 Cr, ₹2 Cr+)",
        "Policy Tenure: Longer protection terms (e.g. up to age 65 vs age 85) alter actuarial mortality cost"
      ]}
      questionsToAsk={[
        "Is the premium fixed for the entire policy term, or does it step up?",
        "Does this plan offer a life-stage step-up option upon marriage or child birth?",
        "What is the insurer's latest 3-year average Claim Settlement Ratio (CSR) and repudiation rate?",
        "Are critical illness rider payouts deducted from the death benefit (accelerated) or additional?"
      ]}
      products={products}
    />
  );
}
